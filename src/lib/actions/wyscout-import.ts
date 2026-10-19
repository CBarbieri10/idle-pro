"use server";

import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { matchAthleteName, type CandidateAthlete } from "@/lib/services/fuzzyMatch";
import {
  Position,
  FootPreference,
  MatchVenue,
  MetricSource,
  StabilityCategory,
  Prisma,
} from "@prisma/client";
import { calculatePAdj, calculateXgPerShot } from "@/lib/math-engine";
import {
  SPORTSBASE_MATCH_MAP,
  SPORTSBASE_ATHLETE_MAP,
  normalizeSportsBaseMatchRow,
  normalizeSportsBaseAthleteRow,
  parseIsoDate,
  parseMatchString,
  parseFlexibleNumber,
} from "@/lib/normalization";

export type DetectedFileType = "ATHLETE" | "MATCH" | "TEAM";

export interface ImportDetailItem {
  rowNumber: number;
  playerName: string;
  teamName: string;
  matchedAthleteName?: string;
  athleteId?: string;
  similarityScore: number;
  action: "UPDATED" | "CREATED" | "SKIPPED";
}

export interface ImportResultSummary {
  success: boolean;
  detectedType: DetectedFileType;
  detectedTypeLabel: string;
  totalRows: number;
  matchedCount: number;
  createdCount: number;
  errorCount: number;
  details: ImportDetailItem[];
  error?: string;
}

/**
 * Normaliza posições do Wyscout/Futebol para o enum Position do Prisma
 */
function mapWyscoutPosition(rawPos?: string | null): Position {
  if (!rawPos) return Position.FORWARD;
  const p = rawPos.toUpperCase().trim();

  if (p.includes("GK") || p.includes("GOL") || p.includes("GOLEIRO")) return Position.GOALKEEPER;
  if (p.includes("RB") || p.includes("LATERAL D") || p.includes("LD") || p.includes("ALA D")) return Position.RIGHT_BACK;
  if (p.includes("LB") || p.includes("LATERAL E") || p.includes("LE") || p.includes("ALA E")) return Position.LEFT_BACK;
  if (p.includes("CB") || p.includes("ZAG") || p.includes("ZAGUEIRO")) return Position.CENTER_BACK;
  if (p.includes("DMF") || p.includes("VOL") || p.includes("VOLANTE") || p.includes("DEFENSIVE_MID")) return Position.DEFENSIVE_MID;
  if (p.includes("AMF") || p.includes("MEI") || p.includes("MEIA") || p.includes("10") || p.includes("ATTACKING_MID")) return Position.ATTACKING_MID;
  if (p.includes("CMF") || p.includes("MC") || p.includes("MÉDIO") || p.includes("CENTRAL_MID")) return Position.CENTRAL_MID;
  if (p.includes("RWF") || p.includes("RW") || p.includes("PONTA D") || p.includes("EXTREMO D")) return Position.RIGHT_WING;
  if (p.includes("LWF") || p.includes("LW") || p.includes("PONTA E") || p.includes("EXTREMO E")) return Position.LEFT_WING;
  if (p.includes("CF") || p.includes("CA") || p.includes("CENTROAVANTE") || p.includes("STRIKER")) return Position.STRIKER;
  if (p.includes("ATA") || p.includes("ATACANTE")) return Position.FORWARD;

  return Position.CENTRAL_MID;
}

/**
 * Converte valores numéricos flexíveis (ex: "64,5%", "2.4", 5) em números puros
 */
function parseNum(val: unknown): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const clean = val.replace("%", "").replace(",", ".").trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Passo 1: Auto-Detect & Roteamento Inteligente
 * Detecta o tipo do arquivo analisando nome do arquivo e cabeçalhos da planilha
 * Regras estritas:
 * - 'jogador'/'athlete'/'player' em nome ou colunas -> ATHLETE
 * - 'partida'/'match'/'jogo'/'confronto' em nome ou colunas -> MATCH
 * - 'time'/'equipe'/'team'/'clube' (sem 'jogador') -> TEAM
 */
export async function detectFileType(fileName: string, headers: string[]): Promise<DetectedFileType> {
  const lowerFileName = (fileName || "").toLowerCase();
  const lowerHeaders = (headers || []).map((h) => String(h).toLowerCase().trim());

  // 1. Identificadores de Jogador/Atleta
  const hasAthleteHeader = lowerHeaders.some(
    (h) =>
      h === "jogador" ||
      h === "player" ||
      h === "athlete" ||
      h === "atleta" ||
      h === "№" ||
      h === "no" ||
      h.includes("jogador") ||
      h.includes("player") ||
      h.includes("minutos jogados")
  );
  const hasAthleteName =
    lowerFileName.includes("jogador") ||
    lowerFileName.includes("athlete") ||
    lowerFileName.includes("player") ||
    lowerFileName.includes("atleta");

  // 2. Identificadores de Partida/Confronto
  const hasMatchHeader = lowerHeaders.some(
    (h) =>
      h === "match" ||
      h.includes("match") ||
      h.includes("partida") ||
      h.includes("jogo") ||
      h.includes("confronto") ||
      h.includes("mandante") ||
      h.includes("visitante") ||
      h.includes("tática (inicial)") ||
      h.includes("tatica (inicial)") ||
      h.includes("posse de bola")
  );
  const hasMatchName =
    lowerFileName.includes("partida") ||
    lowerFileName.includes("match") ||
    lowerFileName.includes("jogo") ||
    lowerFileName.includes("fixtures") ||
    lowerFileName.includes("resultado");

  // 3. Identificadores de Time/Equipe (sem jogador)
  const hasTeamHeader = lowerHeaders.some(
    (h) =>
      h === "time" ||
      h === "equipe" ||
      h === "team" ||
      h === "clube" ||
      h === "club"
  );
  const hasTeamName =
    (lowerFileName.includes("time") ||
      lowerFileName.includes("team") ||
      lowerFileName.includes("equipe") ||
      lowerFileName.includes("clube")) &&
    !hasAthleteName;

  // Priorização estrita
  if (hasAthleteHeader || hasAthleteName) {
    return "ATHLETE";
  }

  if (hasMatchHeader || hasMatchName) {
    return "MATCH";
  }

  if (hasTeamHeader || hasTeamName) {
    return "TEAM";
  }

  // Fallback heurístico: se tem 'Time' ou 'Equipe' e não tem 'Jogador'
  if (lowerHeaders.includes("time") && !lowerHeaders.includes("jogador")) {
    return "TEAM";
  }

  return "ATHLETE";
}

export async function getDetectedTypeLabel(type: DetectedFileType): Promise<string> {
  switch (type) {
    case "ATHLETE":
      return "Planilha de Atletas (ATHLETE)";
    case "MATCH":
      return "Planilha de Partidas / Rodadas (MATCH)";
    case "TEAM":
      return "Planilha de Clubes & Comportamento Coletivo (TEAM)";
  }
}

/**
 * Server Action Principal: Processa o arquivo Excel ou CSV enviado via Dropzone
 * com Auto-Detect automático e roteamento para o pipeline correspondente.
 */
export async function importWyscoutSpreadsheetAction(
  formData: FormData
): Promise<ImportResultSummary> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return {
        success: false,
        detectedType: "ATHLETE",
        detectedTypeLabel: "Indefinido",
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 1,
        details: [],
        error: "Nenhum arquivo enviado. Por favor, arraste um arquivo .xlsx ou .csv.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      dense: true,
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        detectedType: "ATHLETE",
        detectedTypeLabel: "Indefinido",
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 1,
        details: [],
        error: "A planilha enviada está vazia ou não contém abas válidas.",
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (rawRows.length === 0) {
      return {
        success: false,
        detectedType: "ATHLETE",
        detectedTypeLabel: "Indefinido",
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 0,
        details: [],
        error: "A planilha não contém linhas de dados preenchidas.",
      };
    }

    // Extrair cabeçalhos da primeira linha para detecção
    const headers = Object.keys(rawRows[0] || {});
    const detectedType = await detectFileType(file.name, headers);
    const detectedTypeLabel = await getDetectedTypeLabel(detectedType);

    // Passo 2: Roteamento para Pipelines Independentes
    switch (detectedType) {
      case "MATCH":
        return await processMatchFile(rawRows, file.name, detectedTypeLabel);
      case "TEAM":
        return await processTeamFile(rawRows, file.name, detectedTypeLabel);
      case "ATHLETE":
      default:
        return await processAthleteFile(rawRows, file.name, detectedTypeLabel);
    }
  } catch (error) {
    console.error("Falha fatal na importação da planilha:", error);
    return {
      success: false,
      detectedType: "ATHLETE",
      detectedTypeLabel: "Erro",
      totalRows: 0,
      matchedCount: 0,
      createdCount: 0,
      errorCount: 1,
      details: [],
      error: error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE 1: ATLETAS (Acúmulo Cronológico de Dados)
// ─────────────────────────────────────────────────────────────────────────────
export async function processAthleteFile(
  rawRows: Record<string, unknown>[],
  fileName: string,
  detectedTypeLabel: string
): Promise<ImportResultSummary> {
  const [existingAthletes, existingTeams, firstLeague] = await Promise.all([
    prisma.athlete.findMany({
      include: {
        team: { select: { id: true, name: true, shortName: true } },
      },
    }),
    prisma.team.findMany(),
    prisma.league.findFirst(),
  ]);

  const defaultLeague =
    firstLeague ||
    (await prisma.league.create({
      data: {
        name: "Brasileirão Série A",
        country: "Brasil",
        season: "2026",
      },
    }));

  const teamMapByName = new Map<string, typeof existingTeams[0]>();
  for (const t of existingTeams) {
    teamMapByName.set(t.name.toLowerCase().trim(), t);
    if (t.shortName) teamMapByName.set(t.shortName.toLowerCase().trim(), t);
  }

  const candidateAthletes: CandidateAthlete[] = existingAthletes.map((a) => ({
    id: a.id,
    name: a.name,
    teamName: a.team.name,
  }));

  const details: ImportDetailItem[] = [];
  let matchedCount = 0;
  let createdCount = 0;
  let errorCount = 0;

  // Cache de partidas por clube + rodada para acúmulo
  const roundMatchCache = new Map<string, string>();

  const CHUNK_SIZE = 25;
  for (let i = 0; i < rawRows.length; i += CHUNK_SIZE) {
    const chunk = rawRows.slice(i, i + CHUNK_SIZE);

    await Promise.all(
      chunk.map(async (row, chunkIdx) => {
        const rowNumber = i + chunkIdx + 2;

        try {
          const playerName = String(
            row["Jogador"] ||
              row["Player"] ||
              row["Nome"] ||
              row["Atleta"] ||
              row["Athlete"] ||
              ""
          ).trim();

          const rawTeam = String(
            row["Time"] ||
              row["Equipe"] ||
              row["Team"] ||
              row["Clube"] ||
              row["Club"] ||
              ""
          ).trim();

          if (!playerName) {
            errorCount++;
            return;
          }

          // Resolver ou criar clube
          let team =
            teamMapByName.get(rawTeam.toLowerCase().trim()) ||
            existingTeams.find(
              (t) =>
                rawTeam.toLowerCase().includes(t.name.toLowerCase()) ||
                t.name.toLowerCase().includes(rawTeam.toLowerCase())
            ) ||
            existingTeams[0];

          if (!team) {
            team = await prisma.team.create({
              data: {
                name: rawTeam || "Clube Não Identificado",
                country: "Brasil",
                leagueId: defaultLeague.id,
              },
            });
            teamMapByName.set(team.name.toLowerCase().trim(), team);
          }

          // Parsing cronológico (Rodada e Data do Evento com parseIsoDate)
          const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
          const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;

          const rawDateStr = row["Data"] || row["Date"] || row["Data do Jogo"];
          let eventDate = rawDateStr
            ? parseIsoDate(rawDateStr)
            : parsedRound
            ? new Date(2026, 3, 10 + parsedRound * 7)
            : new Date("2026-08-01T12:00:00.000Z");

          // Chave única para o evento da partida
          const matchCacheKey = `${team.id}-R${parsedRound || 0}-${eventDate.toISOString().slice(0, 10)}`;
          let matchId = roundMatchCache.get(matchCacheKey);

          if (!matchId) {
            const existingMatch = await prisma.match.findFirst({
              where: {
                teamId: team.id,
                round: parsedRound ? `Rodada ${parsedRound}` : "Rodada Regular",
                date: eventDate,
              },
            });

            if (existingMatch) {
              matchId = existingMatch.id;
            } else {
              const newMatch = await prisma.match.create({
                data: {
                  teamId: team.id,
                  opponentName: "Série A 2026",
                  date: eventDate,
                  round: parsedRound ? `Rodada ${parsedRound}` : "Rodada Regular",
                  competition: "Brasileirão Série A",
                  leagueId: defaultLeague.id,
                },
              });
              matchId = newMatch.id;
            }
            roundMatchCache.set(matchCacheKey, matchId);
          }

          // Normalização via SportsBase Athlete Map:
          // '№' -> jersey_number
          // 'Minutos jogados' -> minutes_played
          // 'Passes precisos, %' -> pass_accuracy
          // 'Duelos defensivos ganhos, %' -> defensive_duels_won_pct
          // 'Passes-chave precisos' -> key_passes_accurate
          const sbAthlete = normalizeSportsBaseAthleteRow(row);

          // Fuzzy Match do Atleta
          const matchResult = matchAthleteName(playerName, candidateAthletes, rawTeam);
          const rawPos = String(row["Posição"] || row["Position"] || row["Pos"] || "");
          const position = mapWyscoutPosition(rawPos);
          const age = parseNum(row["Idade"] || row["Age"]);
          const height = parseNum(row["Altura"] || row["Height"]);
          const weight = parseNum(row["Peso"] || row["Weight"]);
          const nationality = String(row["Nacionalidade"] || row["País"] || "Brasil").trim();
          const minutes = sbAthlete.minutes_played > 0 ? sbAthlete.minutes_played : parseNum(row["Minutos jogados"] || row["Minutos"] || 90);
          const matches = parseNum(row["Partidas jogadas"] || row["Jogos"] || row["Matches"] || 1);
          const rating = parseNum(row["Índice"] || row["Nota"] || row["Rating"] || 7.0);
          const jerseyNumber = sbAthlete.jersey_number;

          // Cálculo do IDG e Estabilidade
          const successfulActionsPct = parseNum(row["Ações com sucesso, %"]);
          const duelWinPct = parseNum(row["Duelos ganhos, %"]);
          const varianceBase = Math.abs(successfulActionsPct - 75) * 0.4 + Math.abs(duelWinPct - 50) * 0.3;
          const idgScore = Math.min(45, Math.max(8.5, Math.round((12.5 + varianceBase * 0.5) * 10) / 10));
          const stabilityCategory: StabilityCategory =
            idgScore < 15
              ? StabilityCategory.HIGH
              : idgScore <= 30
              ? StabilityCategory.MODERATE
              : StabilityCategory.LOW;

          const birthDate = age > 0 ? new Date(2026 - Math.round(age), 0, 1) : null;
          let targetAthleteId: string;
          const jerseyNote = jerseyNumber !== null ? `Camisa: #${jerseyNumber}` : null;

          if (matchResult.matched && matchResult.athlete) {
            targetAthleteId = matchResult.athlete.id;
            await prisma.athlete.update({
              where: { id: targetAthleteId },
              data: {
                position: position || undefined,
                birthDate: birthDate || undefined,
                height: height > 0 ? Math.round(height) : undefined,
                weight: weight > 0 ? Math.round(weight) : undefined,
                nationality: nationality || undefined,
                idgScore,
                stabilityCategory,
              },
            });

            matchedCount++;
            details.push({
              rowNumber,
              playerName,
              teamName: rawTeam,
              matchedAthleteName: matchResult.athlete.name,
              athleteId: targetAthleteId,
              similarityScore: matchResult.score,
              action: "UPDATED",
            });
          } else {
            const newAthlete = await prisma.athlete.create({
              data: {
                name: playerName,
                position,
                birthDate,
                height: height > 0 ? Math.round(height) : null,
                weight: weight > 0 ? Math.round(weight) : null,
                nationality,
                footPreference: FootPreference.RIGHT,
                teamId: team.id,
                notes: [jerseyNote, `Importado via Dropzone. Índice: ${rating} (${matches} jogos, ${minutes} min).`].filter(Boolean).join(" • "),
                idgScore,
                stabilityCategory,
              },
            });

            targetAthleteId = newAthlete.id;
            candidateAthletes.push({
              id: newAthlete.id,
              name: newAthlete.name,
              teamName: team.name,
            });

            createdCount++;
            details.push({
              rowNumber,
              playerName,
              teamName: rawTeam,
              matchedAthleteName: newAthlete.name,
              athleteId: targetAthleteId,
              similarityScore: 100,
              action: "CREATED",
            });
          }

          // Métricas numéricas
          const goals = parseNum(row["Gols"] || row["Goals"]);
          const assists = parseNum(row["Assistências"] || row["Assists"]);
          const shots = parseNum(row["Chutes"] || row["Shots"] || row["Finalizações"]);
          const shotsOnTarget = parseNum(row["Chutes no alvo"] || row["Finalizações no alvo"]);
          const xg = parseNum(row["xG (Gols esperados)"] || row["xG"]);
          const passes = parseNum(row["Passes"]);
          const passAccuracy = sbAthlete.pass_accuracy > 0 ? sbAthlete.pass_accuracy : parseNum(row["Passes precisos, %"] || row["Pass accuracy, %"]);
          const progPasses = parseNum(row["Passes progressivos"] || row["Progressive passes"]);
          const keyPasses = parseNum(row["Passes-chave"] || row["Passes decisivos"] || row["Key passes"]);
          const keyPassesAccurate = sbAthlete.key_passes_accurate > 0 ? sbAthlete.key_passes_accurate : keyPasses;
          const crosses = parseNum(row["Cruzamentos"] || row["Crosses"]);
          const tackles = parseNum(row["Desarmes"] || row["Tackles"]);
          const interceptions = parseNum(row["Interceptações"] || row["Interceptions"]);
          const dribbles = parseNum(row["Dribles"] || row["Dribles com sucesso"]);
          const aerialDuelsWon = parseNum(row["Duelos aéreos ganhos"] || row["Duelos aéreos"]);
          const groundDuelsWon = parseNum(row["Duelos defensivos ganhos"] || row["Duelos defensivos"]);
          const defDuelsWonPct = sbAthlete.defensive_duels_won_pct > 0 ? sbAthlete.defensive_duels_won_pct : (groundDuelsWon > 0 ? 50 : 0);
          const recoveries = parseNum(row["Recuperações da bola"] || row["Recuperações"]);

          const per90 = (v: number) =>
            minutes > 0 ? Number(((v / minutes) * 90).toFixed(2)) : Number(v.toFixed(2));

          const padjTackles = calculatePAdj(tackles, 50);
          const padjInterceptions = calculatePAdj(interceptions, 50);
          const xgPerShot = calculateXgPerShot(xg, shots);

          // ─── A Regra de Ouro (Acúmulo Longitudinal): ──────────────────────
          // NÃO fazemos delete indiscriminado. Substitui APENAS o registro da mesma partida/rodada!
          await prisma.rawMetric.deleteMany({
            where: {
              athleteId: targetAthleteId,
              matchId,
            },
          });

          const rawMetric = await prisma.rawMetric.create({
            data: {
              athleteId: targetAthleteId,
              matchId,
              round: parsedRound,
              date: eventDate,
              source: MetricSource.SPORTSBASE,
              minutesPlayed: Math.round(minutes),
              data: {
                ...row,
                jersey_number: jerseyNumber,
                minutes_played: minutes,
                pass_accuracy: passAccuracy,
                defensive_duels_won_pct: defDuelsWonPct,
                key_passes_accurate: keyPassesAccurate,
              } as Prisma.InputJsonValue,
            },
          });

          await prisma.canonicalMetric.deleteMany({
            where: {
              athleteId: targetAthleteId,
              matchId,
            },
          });

          const canonicalRecords = [
            { metricName: "goals", absoluteValue: goals, per90Value: per90(goals) },
            { metricName: "assists", absoluteValue: assists, per90Value: per90(assists) },
            { metricName: "shots", absoluteValue: shots, per90Value: per90(shots) },
            { metricName: "shots_on_target", absoluteValue: shotsOnTarget, per90Value: per90(shotsOnTarget) },
            { metricName: "xg", absoluteValue: xg, per90Value: per90(xg) },
            { metricName: "xg_per_shot", absoluteValue: xgPerShot, per90Value: xgPerShot },
            { metricName: "passes", absoluteValue: passes, per90Value: per90(passes) },
            { metricName: "pass_accuracy", absoluteValue: passAccuracy, per90Value: passAccuracy },
            { metricName: "progressive_passes", absoluteValue: progPasses, per90Value: per90(progPasses) },
            { metricName: "key_passes", absoluteValue: keyPasses, per90Value: per90(keyPasses) },
            { metricName: "key_passes_accurate", absoluteValue: keyPassesAccurate, per90Value: per90(keyPassesAccurate) },
            { metricName: "crosses_accurate", absoluteValue: crosses, per90Value: per90(crosses) },
            { metricName: "tackles", absoluteValue: tackles, per90Value: per90(tackles) },
            { metricName: "padj_tackles", absoluteValue: padjTackles, per90Value: padjTackles },
            { metricName: "interceptions", absoluteValue: interceptions, per90Value: per90(interceptions) },
            { metricName: "padj_interceptions", absoluteValue: padjInterceptions, per90Value: padjInterceptions },
            { metricName: "dribbles_completed", absoluteValue: dribbles, per90Value: per90(dribbles) },
            { metricName: "aerial_duels_won", absoluteValue: aerialDuelsWon, per90Value: per90(aerialDuelsWon) },
            { metricName: "ground_duels_won", absoluteValue: groundDuelsWon, per90Value: per90(groundDuelsWon) },
            { metricName: "defensive_duels_won_pct", absoluteValue: defDuelsWonPct, per90Value: defDuelsWonPct },
            { metricName: "recoveries", absoluteValue: recoveries, per90Value: per90(recoveries) },
          ];

          for (const item of canonicalRecords) {
            await prisma.canonicalMetric.create({
              data: {
                athleteId: targetAthleteId,
                matchId,
                rawMetricId: rawMetric.id,
                round: parsedRound,
                date: eventDate,
                metricName: item.metricName,
                absoluteValue: item.absoluteValue,
                per90Value: item.per90Value,
              },
            });
          }
        } catch (rowErr) {
          console.error(`Erro ao processar linha ${rowNumber}:`, rowErr);
          errorCount++;
        }
      })
    );
  }

  try {
    revalidatePath("/athletes");
    revalidatePath("/catalog");
    revalidatePath("/competition/leaders");
    revalidatePath("/dashboard");
  } catch (e) {
    console.warn("RevalidatePath ignorado no ambiente atual:", e);
  }

  return {
    success: true,
    detectedType: "ATHLETE",
    detectedTypeLabel,
    totalRows: rawRows.length,
    matchedCount,
    createdCount,
    errorCount,
    details,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE 2: PARTIDAS (Confrontos e Resultados por Rodada)
// ─────────────────────────────────────────────────────────────────────────────
export async function processMatchFile(
  rawRows: Record<string, unknown>[],
  fileName: string,
  detectedTypeLabel: string
): Promise<ImportResultSummary> {
  const [existingTeams, firstLeague] = await Promise.all([
    prisma.team.findMany(),
    prisma.league.findFirst(),
  ]);

  const defaultLeague =
    firstLeague ||
    (await prisma.league.create({
      data: {
        name: "Brasileirão Série A",
        country: "Brasil",
        season: "2026",
      },
    }));

  const teamMap = new Map<string, typeof existingTeams[0]>();
  for (const t of existingTeams) {
    teamMap.set(t.name.toLowerCase().trim(), t);
    if (t.shortName) teamMap.set(t.shortName.toLowerCase().trim(), t);
  }

  let matchedCount = 0;
  let createdCount = 0;
  let errorCount = 0;
  const details: ImportDetailItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNumber = i + 2;

    try {
      // Normalização via SportsBase Match Map:
      // 'Data' -> date (ISO)
      // 'Match' -> match_string (separar mandante e visitante)
      // 'Posse de bola, %' -> possession_percentage
      // 'Tática (inicial)' -> starting_formation
      // 'Pressão do time bem-sucedida, %' -> successful_pressing_pct
      // 'Entradas no campo adversário' -> entries_final_third_team
      const sbMatch = normalizeSportsBaseMatchRow(row);

      const homeTeamName = sbMatch.homeTeam;
      const awayTeamName = sbMatch.awayTeam;

      if (!homeTeamName) {
        errorCount++;
        continue;
      }

      let homeTeam =
        teamMap.get(homeTeamName.toLowerCase()) ||
        existingTeams.find((t) => t.name.toLowerCase().includes(homeTeamName.toLowerCase()));

      if (!homeTeam) {
        homeTeam = await prisma.team.create({
          data: {
            name: homeTeamName,
            country: "Brasil",
            leagueId: defaultLeague.id,
          },
        });
        teamMap.set(homeTeam.name.toLowerCase(), homeTeam);
        existingTeams.push(homeTeam);
      }

      let awayTeam = awayTeamName
        ? teamMap.get(awayTeamName.toLowerCase()) ||
          existingTeams.find((t) => t.name.toLowerCase().includes(awayTeamName.toLowerCase()))
        : null;

      if (awayTeamName && !awayTeam) {
        awayTeam = await prisma.team.create({
          data: {
            name: awayTeamName,
            country: "Brasil",
            leagueId: defaultLeague.id,
          },
        });
        teamMap.set(awayTeam.name.toLowerCase(), awayTeam);
        existingTeams.push(awayTeam);
      }

      const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
      const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;
      const roundLabel = parsedRound ? `Rodada ${parsedRound}` : "Rodada Regular";

      const matchDate = sbMatch.date; // Garantido DateTime ISO

      const goalsFor = sbMatch.goalsFor ?? parseNum(row["Gols Mandante"] || row["Home Goals"] || row["Gols Pró"]);
      const goalsAgainst = sbMatch.goalsAgainst ?? parseNum(row["Gols Visitante"] || row["Away Goals"] || row["Gols Sofridos"]);
      const possession = sbMatch.possession_percentage;
      const xgHome = parseNum(row["xG Mandante"] || row["Home xG"] || row["xG"]);

      const notesParts = [
        sbMatch.match_string ? `Confronto: ${sbMatch.match_string}` : null,
        sbMatch.starting_formation ? `Tática: ${sbMatch.starting_formation}` : null,
        sbMatch.successful_pressing_pct > 0 ? `Pressão: ${sbMatch.successful_pressing_pct}%` : null,
        sbMatch.entries_final_third_team > 0 ? `Entradas Terço Final: ${sbMatch.entries_final_third_team}` : null,
        xgHome > 0 ? `xG: ${xgHome.toFixed(2)}` : null,
        "Importado via SportsBase Match Pipeline",
      ].filter(Boolean);

      // Upsert / Busca da partida para acumular sem duplicar
      const existingMatch = await prisma.match.findFirst({
        where: {
          teamId: homeTeam.id,
          round: roundLabel,
          date: matchDate,
        },
      });

      if (existingMatch) {
        await prisma.match.update({
          where: { id: existingMatch.id },
          data: {
            opponentId: awayTeam?.id || null,
            opponentName: awayTeam?.name || awayTeamName || "Adversário",
            goalsFor: Math.round(goalsFor),
            goalsAgainst: Math.round(goalsAgainst),
            possession,
            opponentPossession: Math.max(0, 100 - possession),
            notes: notesParts.join(" • "),
          },
        });
        matchedCount++;
        details.push({
          rowNumber,
          playerName: sbMatch.match_string || `${homeTeam.name} vs ${awayTeam?.name || awayTeamName}`,
          teamName: homeTeam.name,
          similarityScore: 100,
          action: "UPDATED",
        });
      } else {
        await prisma.match.create({
          data: {
            teamId: homeTeam.id,
            opponentId: awayTeam?.id || null,
            opponentName: awayTeam?.name || awayTeamName || "Adversário",
            venue: MatchVenue.HOME,
            date: matchDate,
            round: roundLabel,
            competition: "Brasileirão Série A",
            leagueId: defaultLeague.id,
            goalsFor: Math.round(goalsFor),
            goalsAgainst: Math.round(goalsAgainst),
            possession,
            opponentPossession: Math.max(0, 100 - possession),
            notes: notesParts.join(" • "),
          },
        });
        createdCount++;
        details.push({
          rowNumber,
          playerName: sbMatch.match_string || `${homeTeam.name} vs ${awayTeam?.name || awayTeamName}`,
          teamName: homeTeam.name,
          similarityScore: 100,
          action: "CREATED",
        });
      }
    } catch (err) {
      console.error(`Erro ao processar partida linha ${rowNumber}:`, err);
      errorCount++;
    }
  }

  try {
    revalidatePath("/competition/leaders");
    revalidatePath("/league");
    revalidatePath("/dashboard");
  } catch (e) {
    console.warn("RevalidatePath ignorado:", e);
  }

  return {
    success: true,
    detectedType: "MATCH",
    detectedTypeLabel,
    totalRows: rawRows.length,
    matchedCount,
    createdCount,
    errorCount,
    details,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PIPELINE 3: CLUBES (Estatísticas Coletivas & Eficiência de Bloco)
// ─────────────────────────────────────────────────────────────────────────────
export async function processTeamFile(
  rawRows: Record<string, unknown>[],
  fileName: string,
  detectedTypeLabel: string
): Promise<ImportResultSummary> {
  const [existingTeams, firstLeague] = await Promise.all([
    prisma.team.findMany(),
    prisma.league.findFirst(),
  ]);

  const defaultLeague =
    firstLeague ||
    (await prisma.league.create({
      data: {
        name: "Brasileirão Série A",
        country: "Brasil",
        season: "2026",
      },
    }));

  const teamMap = new Map<string, typeof existingTeams[0]>();
  for (const t of existingTeams) {
    teamMap.set(t.name.toLowerCase().trim(), t);
    if (t.shortName) teamMap.set(t.shortName.toLowerCase().trim(), t);
  }

  let matchedCount = 0;
  let createdCount = 0;
  let errorCount = 0;
  const details: ImportDetailItem[] = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNumber = i + 2;

    try {
      const teamName = String(
        row["Time"] || row["Equipe"] || row["Team"] || row["Clube"] || row["Club"] || ""
      ).trim();

      if (!teamName) {
        errorCount++;
        continue;
      }

      let team =
        teamMap.get(teamName.toLowerCase()) ||
        existingTeams.find((t) => t.name.toLowerCase().includes(teamName.toLowerCase()));

      if (!team) {
        team = await prisma.team.create({
          data: {
            name: teamName,
            country: "Brasil",
            leagueId: defaultLeague.id,
          },
        });
        teamMap.set(team.name.toLowerCase(), team);
        createdCount++;
      } else {
        matchedCount++;
      }

      const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
      const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;
      const roundLabel = parsedRound ? `Rodada ${parsedRound}` : "Rodada Regular";

      const rawDateStr = row["Data"] || row["Date"] || row["Data do Jogo"];
      const eventDate = parseIsoDate(rawDateStr);

      const xg = parseNum(row["xG"] || row["xG Total"] || row["Gols Esperados"] || 1.6);
      const xga = parseNum(row["xGA"] || row["xG Concedido"] || row["xGA Total"] || 1.3);
      const goalsFor = parseNum(row["Gols Pró"] || row["Gols"] || row["GF"]);
      const goalsAgainst = parseNum(row["Gols Sofridos"] || row["GA"]);
      const possession = parseFlexibleNumber(row["Posse de bola, %"] || row["possession_percentage"] || row["Posse, %"] || 50);
      const startingFormation = String(row["Tática (inicial)"] || row["starting_formation"] || "").trim();
      const pressing = parseFlexibleNumber(row["Pressão do time bem-sucedida, %"] || row["successful_pressing_pct"]);
      const entries = parseFlexibleNumber(row["Entradas no campo adversário"] || row["entries_final_third_team"]);

      const teamNotesParts = [
        `xG: ${xg.toFixed(2)}`,
        `xGA: ${xga.toFixed(2)}`,
        startingFormation ? `Tática: ${startingFormation}` : null,
        pressing > 0 ? `Pressão: ${pressing}%` : null,
        entries > 0 ? `Entradas Terço Final: ${entries}` : null,
        "Importado via SportsBase Team Pipeline",
      ].filter(Boolean);

      // Registra partida coletiva com o xG e xGA empilhados na série temporal
      await prisma.match.create({
        data: {
          teamId: team.id,
          opponentName: "Série A 2026",
          date: eventDate,
          round: roundLabel,
          competition: "Brasileirão Série A",
          leagueId: defaultLeague.id,
          goalsFor: Math.round(goalsFor),
          goalsAgainst: Math.round(goalsAgainst),
          possession,
          opponentPossession: Math.max(0, 100 - possession),
          notes: teamNotesParts.join(" • "),
        },
      });

      details.push({
        rowNumber,
        playerName: team.name,
        teamName: team.name,
        similarityScore: 100,
        action: "UPDATED",
      });
    } catch (err) {
      console.error(`Erro ao processar time linha ${rowNumber}:`, err);
      errorCount++;
    }
  }

  try {
    revalidatePath("/competition/leaders");
    revalidatePath("/league");
  } catch (e) {
    console.warn("RevalidatePath ignorado:", e);
  }

  return {
    success: true,
    detectedType: "TEAM",
    detectedTypeLabel,
    totalRows: rawRows.length,
    matchedCount,
    createdCount,
    errorCount,
    details,
  };
}
