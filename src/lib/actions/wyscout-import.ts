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
 * Server Action Principal: Processa o arquivo Excel ou CSV enviado via Dropzone
 */
export async function importWyscoutSpreadsheetAction(
  formData: FormData
): Promise<ImportResultSummary> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return {
        success: false,
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
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 0,
        details: [],
        error: "A planilha não contém linhas de dados preenchidas.",
      };
    }

    // 1. Pré-carregar todos os atletas e clubes existentes no banco Neon/Prisma
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

    // Criar mapa de clubes para rápida resolução
    const teamMapByName = new Map<string, typeof existingTeams[0]>();
    for (const t of existingTeams) {
      teamMapByName.set(t.name.toLowerCase().trim(), t);
      if (t.shortName) teamMapByName.set(t.shortName.toLowerCase().trim(), t);
    }

    // Candidatos para o Fuzzy Match
    const candidateAthletes: CandidateAthlete[] = existingAthletes.map((a) => ({
      id: a.id,
      name: a.name,
      teamId: a.teamId,
      teamName: a.team?.name,
      position: a.position,
    }));

    // Garantir partida de referência para armazenar RawMetric e CanonicalMetric
    const teamMatchMap = new Map<string, string>();
    for (const team of existingTeams) {
      const match = await prisma.match.findFirst({
        where: { teamId: team.id },
      });
      if (match) {
        teamMatchMap.set(team.id, match.id);
      } else {
        const createdMatch = await prisma.match.create({
          data: {
            teamId: team.id,
            opponentName: "Wyscout Aggregated Data",
            date: new Date("2026-08-01"),
            competition: "Brasileirão Série A (Temporada)",
            round: "Temporada Regular",
            venue: MatchVenue.HOME,
            leagueId: defaultLeague.id,
          },
        });
        teamMatchMap.set(team.id, createdMatch.id);
      }
    }

    let matchedCount = 0;
    let createdCount = 0;
    let errorCount = 0;
    const details: ImportDetailItem[] = [];

    // Processamento em lotes para performance
    const BATCH_SIZE = 25;
    for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
      const batch = rawRows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row, batchIdx) => {
          const rowNumber = i + batchIdx + 2; // Linha 1 é cabeçalho

          // Detecção dinâmica de colunas
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

          // Executar Fuzzy Match
          const matchResult = matchAthleteName(playerName, candidateAthletes, rawTeam);

          // Resolver ou criar o clube
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

          // Garantir partida de referência para o time
          let defaultMatchId = teamMatchMap.get(team.id);
          if (!defaultMatchId) {
            const m = await prisma.match.create({
              data: {
                teamId: team.id,
                opponentName: "Wyscout Dataset",
                date: new Date("2026-08-01"),
                competition: "Brasileirão Série A",
                venue: MatchVenue.HOME,
                leagueId: defaultLeague.id,
              },
            });
            defaultMatchId = m.id;
            teamMatchMap.set(team.id, m.id);
          }

          // Extração e normalização de variáveis biométricas e de jogo
          const position = mapWyscoutPosition(
            row["Posição"] ? String(row["Posição"]) : row["Position"] ? String(row["Position"]) : null
          );
          const age = parseNum(row["Idade"] || row["Age"]);
          const height = parseNum(row["Altura"] || row["Height"]);
          const weight = parseNum(row["Peso"] || row["Weight"]);
          const nationality = String(row["Nacionalidade"] || row["Nationality"] || "Brasil");
          const minutes = parseNum(row["Minutos jogados"] || row["Minutes"] || row["Minutos"]);
          const matches = parseNum(row["Partidas jogadas"] || row["Matches"] || row["Jogos"]);
          const rating = parseNum(row["Índice"] || row["Rating"]);

          // Métricas numéricas
          const goals = parseNum(row["Gols"] || row["Goals"]);
          const assists = parseNum(row["Assistências"] || row["Assists"]);
          const shots = parseNum(row["Chutes"] || row["Shots"] || row["Finalizações"]);
          const shotsOnTarget = parseNum(row["Chutes no alvo"] || row["Finalizações no alvo"]);
          const xg = parseNum(row["xG (Gols esperados)"] || row["xG"]);
          const passes = parseNum(row["Passes"]);
          const passAccuracy = parseNum(row["Passes precisos, %"] || row["Pass accuracy, %"]);
          const progPasses = parseNum(row["Passes progressivos"] || row["Progressive passes"]);
          const keyPasses = parseNum(row["Passes-chave"] || row["Passes decisivos"] || row["Key passes"]);
          const crosses = parseNum(row["Cruzamentos"] || row["Crosses"]);
          const tackles = parseNum(row["Desarmes"] || row["Tackles"]);
          const interceptions = parseNum(row["Interceptações"] || row["Interceptions"]);
          const dribbles = parseNum(row["Dribles"] || row["Dribles com sucesso"]);
          const aerialDuelsWon = parseNum(row["Duelos aéreos ganhos"] || row["Duelos aéreos"]);
          const groundDuelsWon = parseNum(row["Duelos defensivos ganhos"] || row["Duelos defensivos"]);
          const recoveries = parseNum(row["Recuperações da bola"] || row["Recuperações"]);

          // Per-90 seguro
          const per90 = (v: number) =>
            minutes > 0 ? Math.round(((v / minutes) * 90) * 100) / 100 : 0;

          // PAdj (Ajuste por posse)
          const padjTackles = calculatePAdj(per90(tackles), 50);
          const padjInterceptions = calculatePAdj(per90(interceptions), 50);
          const xgPerShot = calculateXgPerShot(xg, shots);

          // IDG & Estabilidade
          const successfulActionsPct = parseNum(row["Ações bem-sucedidas, %"]);
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

          if (matchResult.matched && matchResult.athlete) {
            // CASO 1: Atleta já existe -> Atualizar perfil e métricas
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
            // CASO 2: Atleta novo -> Criar no banco
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
                notes: `Importado via Dropzone Wyscout. Índice: ${rating} (${matches} jogos, ${minutes} min).`,
                idgScore,
                stabilityCategory,
              },
            });

            targetAthleteId = newAthlete.id;
            // Registrar novo candidato para os próximos itens da mesma planilha
            candidateAthletes.push({
              id: newAthlete.id,
              name: newAthlete.name,
              teamId: newAthlete.teamId,
              teamName: team.name,
              position: newAthlete.position,
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

          // Parsing cronológico (Rodada e Data da Partida/Evento)
          const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
          const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;

          const rawDateStr = row["Data"] || row["Date"] || row["Data do Jogo"];
          let eventDate = new Date();
          if (rawDateStr) {
            const d = new Date(String(rawDateStr));
            if (!isNaN(d.getTime())) eventDate = d;
          }

          // Gravação do JSONB bruto (todas as 75+ colunas da planilha)
          // Limpa apenas da mesma partida/rodada, permitindo acúmulo longitudinal de eventos
          await prisma.rawMetric.deleteMany({
            where: {
              athleteId: targetAthleteId,
              matchId: defaultMatchId,
            },
          });

          const rawMetric = await prisma.rawMetric.create({
            data: {
              athleteId: targetAthleteId,
              matchId: defaultMatchId,
              round: parsedRound,
              date: eventDate,
              source: MetricSource.WYSCOUT,
              minutesPlayed: Math.round(minutes),
              data: row as Prisma.InputJsonValue,
            },
          });

          // Gravação das métricas canônicas normalizadas
          await prisma.canonicalMetric.deleteMany({
            where: {
              athleteId: targetAthleteId,
              matchId: defaultMatchId,
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
            { metricName: "crosses_accurate", absoluteValue: crosses, per90Value: per90(crosses) },
            { metricName: "tackles", absoluteValue: tackles, per90Value: per90(tackles) },
            { metricName: "padj_tackles", absoluteValue: padjTackles, per90Value: padjTackles },
            { metricName: "interceptions", absoluteValue: interceptions, per90Value: per90(interceptions) },
            { metricName: "padj_interceptions", absoluteValue: padjInterceptions, per90Value: padjInterceptions },
            { metricName: "dribbles_completed", absoluteValue: dribbles, per90Value: per90(dribbles) },
            { metricName: "aerial_duels_won", absoluteValue: aerialDuelsWon, per90Value: per90(aerialDuelsWon) },
            { metricName: "ground_duels_won", absoluteValue: groundDuelsWon, per90Value: per90(groundDuelsWon) },
            { metricName: "recoveries", absoluteValue: recoveries, per90Value: per90(recoveries) },
          ];

          for (const item of canonicalRecords) {
            await prisma.canonicalMetric.create({
              data: {
                athleteId: targetAthleteId,
                matchId: defaultMatchId,
                rawMetricId: rawMetric.id,
                round: parsedRound,
                date: eventDate,
                metricName: item.metricName,
                absoluteValue: item.absoluteValue,
                per90Value: item.per90Value,
              },
            });
          }
        })
      );
    }

    try {
      revalidatePath("/athletes");
      revalidatePath("/catalog");
      revalidatePath("/scouting");
      revalidatePath("/admin/import");
    } catch {
      // Ignorar fora do ciclo de renderização
    }

    return {
      success: true,
      totalRows: rawRows.length,
      matchedCount,
      createdCount,
      errorCount,
      details,
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao processar planilha";
    return {
      success: false,
      totalRows: 0,
      matchedCount: 0,
      createdCount: 0,
      errorCount: 1,
      details: [],
      error: `Falha no processamento: ${message}`,
    };
  }
}
