import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  Position,
  FootPreference,
  MetricSource,
  StabilityCategory,
  Prisma,
} from "@prisma/client";
import { matchAthleteName, type CandidateAthlete } from "@/lib/services/fuzzyMatch";
import { calculatePAdj, calculateXgPerShot } from "@/lib/math-engine";
import {
  normalizeTeamName,
  findMatchingTeam,
  parseSafeInteger,
  parseFootPreference,
  parseIsoDate,
  parseFlexibleNumber,
} from "@/lib/normalization";
import { METRIC_BY_KEY } from "@/lib/metrics";
import { slugifyMetricKey, CANONICAL_SLUG_MAP } from "./slugify";
import type {
  IngestionAgent,
  ImportResultSummary,
  ImportDetailItem,
  DetectedFileType,
} from "./types";

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

export class AthleteAgent implements IngestionAgent {
  readonly agentName = "AthleteAgent";
  readonly supportedType: DetectedFileType = "ATHLETE";

  async process(
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

    const candidateAthletes: CandidateAthlete[] = existingAthletes.map((a) => ({
      id: a.id,
      name: a.name,
      teamName: a.team?.name ?? "Sem Clube",
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

            // 1. Limpeza agressiva e resolução segura do clube
            const cleanTeam = normalizeTeamName(rawTeam);
            const matchedTeam = findMatchingTeam(cleanTeam, existingTeams);

            // Regra de Ouro: Se o time não der match, NUNCA insira os atletas em um clube aleatório (como Chapecoense).
            // O teamId do atleta deve ficar nulo (Sem Clube).
            const athleteTeamId = matchedTeam ? matchedTeam.id : null;

            // 2. Parsing cronológico (Rodada e Data do Evento)
            const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
            const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;

            const rawDateStr = row["Data"] || row["Date"] || row["Data do Jogo"];
            let eventDate = rawDateStr
              ? parseIsoDate(rawDateStr)
              : parsedRound
              ? new Date(2026, 3, 10 + parsedRound * 7)
              : new Date("2026-08-01T12:00:00.000Z");

            // Para a tabela Match (que exige teamId como chave estrangeira relacional):
            let matchTeamId: string;
            if (matchedTeam) {
              matchTeamId = matchedTeam.id;
            } else {
              let unassignedTeam = existingTeams.find((t) => t.name === "Sem Clube");
              if (!unassignedTeam) {
                unassignedTeam = await prisma.team.create({
                  data: {
                    name: "Sem Clube",
                    country: "Brasil",
                    leagueId: defaultLeague.id,
                  },
                });
                existingTeams.push(unassignedTeam);
              }
              matchTeamId = unassignedTeam.id;
            }

            // Chave única para o evento da partida
            const matchCacheKey = `${matchTeamId}-R${parsedRound || 0}-${eventDate.toISOString().slice(0, 10)}`;
            let matchId = roundMatchCache.get(matchCacheKey);

            if (!matchId) {
              const existingMatch = await prisma.match.findFirst({
                where: {
                  teamId: matchTeamId,
                  round: parsedRound ? `Rodada ${parsedRound}` : "Rodada Regular",
                  date: eventDate,
                },
              });

              if (existingMatch) {
                matchId = existingMatch.id;
              } else {
                const newMatch = await prisma.match.create({
                  data: {
                    teamId: matchTeamId,
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

            // 3. Biometria & Atributos Gerais Seguros
            const rawPos = String(row["Posição"] || row["Position"] || row["Pos"] || "");
            const position = mapWyscoutPosition(rawPos);
            const age = parseNum(row["Idade"] || row["Age"]);
            const nationality = String(row["Nacionalidade"] || row["País"] || "Brasil").trim();
            const rating = parseNum(row["Índice"] || row["Nota"] || row["Rating"] || 7.0);

            // Altura e Peso com conversão segura de '-' para null
            const height = parseSafeInteger(row["Altura"] ?? row["Height"] ?? row["altura"]);
            const weight = parseSafeInteger(row["Peso"] ?? row["Weight"] ?? row["peso"]);

            // Pé preferencial sem fallback artificial para 'Direito'
            const footPreference = parseFootPreference(row["Pé"] ?? row["Pe"] ?? row["Foot"] ?? row["Pé preferencial"]);

            // 4. O ASPIRADOR DINÂMICO DE COLUNAS NUMÉRICAS (Ação 2)
            // Varre TODAS as colunas numéricas do Excel, aplica slugify e salva no metrics_json
            const metricsJson: Record<string, number> = {};
            for (const [colKey, colVal] of Object.entries(row)) {
              if (colVal === null || colVal === undefined || colVal === "") continue;
              const numVal = parseFlexibleNumber(colVal, NaN);
              if (!isNaN(numVal) && isFinite(numVal)) {
                const slugKey = slugifyMetricKey(colKey);
                if (slugKey) {
                  metricsJson[slugKey] = numVal;
                }
              }
            }

            // Extração de métricas com suporte do aspirador
            const minutes =
              metricsJson["minutos_jogados"] ??
              metricsJson["minutos"] ??
              metricsJson["minutes"] ??
              parseNum(row["Minutos jogados"] || row["Minutos"] || 90);

            const matches =
              metricsJson["partidas_jogadas"] ??
              metricsJson["jogos"] ??
              metricsJson["matches"] ??
              1;

            const jerseyNumber =
              parseSafeInteger(row["№"] ?? row["no"] ?? row["Numero"] ?? row["Número"]) ??
              (metricsJson["no"] !== undefined ? Math.round(metricsJson["no"]) : null);

            // Cálculo do IDG e Estabilidade
            const successfulActionsPct = metricsJson["acoes_com_sucesso_pct"] ?? parseNum(row["Ações com sucesso, %"]);
            const duelWinPct = metricsJson["duelos_ganhos_pct"] ?? parseNum(row["Duelos ganhos, %"]);
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

            // Fuzzy Match do Atleta
            const matchResult = matchAthleteName(playerName, candidateAthletes, cleanTeam || rawTeam);

            if (matchResult.matched && matchResult.athlete) {
              targetAthleteId = matchResult.athlete.id;
              await prisma.athlete.update({
                where: { id: targetAthleteId },
                data: {
                  position: position || undefined,
                  birthDate: birthDate || undefined,
                  height: height !== null ? height : undefined,
                  weight: weight !== null ? weight : undefined,
                  footPreference: footPreference ?? undefined,
                  teamId: athleteTeamId, // strictly null if no match found!
                  nationality: nationality || undefined,
                  idgScore,
                  stabilityCategory,
                },
              });

              matchedCount++;
              details.push({
                rowNumber,
                playerName,
                teamName: matchedTeam ? matchedTeam.name : (rawTeam ? `${rawTeam} (Sem Match)` : "Sem Clube"),
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
                  height,
                  weight,
                  nationality,
                  footPreference: footPreference ?? FootPreference.UNKNOWN, // NO right foot fallback!
                  teamId: athleteTeamId, // strictly null if no match found!
                  notes: [jerseyNote, `Importado via AthleteAgent. Índice: ${rating} (${matches} jogos, ${minutes} min).`].filter(Boolean).join(" • "),
                  idgScore,
                  stabilityCategory,
                },
              });

              targetAthleteId = newAthlete.id;
              candidateAthletes.push({
                id: newAthlete.id,
                name: newAthlete.name,
                teamName: matchedTeam ? matchedTeam.name : "Sem Clube",
              });

              createdCount++;
              details.push({
                rowNumber,
                playerName,
                teamName: matchedTeam ? matchedTeam.name : (rawTeam ? `${rawTeam} (Sem Match)` : "Sem Clube"),
                matchedAthleteName: newAthlete.name,
                athleteId: targetAthleteId,
                similarityScore: 100,
                action: "CREATED",
              });
            }

            // 5. Salva no RawMetric.data contendo metrics_json completo
            const rawMetricPayload = {
              ...row,
              ...metricsJson,
              metrics_json: metricsJson,
              jersey_number: jerseyNumber,
              minutes_played: minutes,
            };

            const rawMetric = await prisma.rawMetric.upsert({
              where: {
                matchId_athleteId_source: {
                  matchId,
                  athleteId: targetAthleteId,
                  source: MetricSource.SPORTSBASE,
                },
              },
              create: {
                athleteId: targetAthleteId,
                matchId,
                round: parsedRound,
                date: eventDate,
                source: MetricSource.SPORTSBASE,
                minutesPlayed: Math.round(minutes),
                data: rawMetricPayload as Prisma.InputJsonValue,
              },
              update: {
                round: parsedRound,
                date: eventDate,
                minutesPlayed: Math.round(minutes),
                data: rawMetricPayload as Prisma.InputJsonValue,
              },
            });

            // 6. TRADUÇÃO CANÔNICA DINÂMICA (Moneyball & Métricas Oficiais)
            // Agrupa todas as métricas canônicas conhecidas extraídas dos slugs
            const canonicalValuesMap = new Map<string, number>();

            // Varre o metricsJson e traduz via CANONICAL_SLUG_MAP ou direct METRIC_BY_KEY match
            for (const [slugKey, val] of Object.entries(metricsJson)) {
              if (typeof val !== "number" || isNaN(val)) continue;

              const canonicalKey = CANONICAL_SLUG_MAP[slugKey] || (METRIC_BY_KEY[slugKey] ? slugKey : null);
              if (canonicalKey && METRIC_BY_KEY[canonicalKey] && !canonicalValuesMap.has(canonicalKey)) {
                canonicalValuesMap.set(canonicalKey, val);
              }
            }

            // Garante chaves vitais para o Laboratório Moneyball
            // a) progressive_passes
            if (!canonicalValuesMap.has("progressive_passes")) {
              const pPass =
                metricsJson["passes_progressivos"] ??
                metricsJson["passes_progressivos_por_90"] ??
                metricsJson["progressive_passes"] ??
                parseNum(row["Passes progressivos"] || row["Progressive passes"]);
              if (pPass > 0) canonicalValuesMap.set("progressive_passes", pPass);
            }

            // b) recoveries_opponent_half
            if (!canonicalValuesMap.has("recoveries_opponent_half")) {
              const rAdv =
                metricsJson["recuperacoes_da_bola_no_campo_adversario"] ??
                metricsJson["recuperacoes_no_campo_adversario"] ??
                metricsJson["recuperacoes_campo_adv"] ??
                metricsJson["recoveries_opponent_half"] ??
                parseNum(row["Recuperações da bola no campo adversário"] || row["Recuperações no campo adversário"]);
              if (rAdv > 0) canonicalValuesMap.set("recoveries_opponent_half", rAdv);
            }

            // c) goal_chances
            if (!canonicalValuesMap.has("goal_chances")) {
              const gChances =
                metricsJson["chances_de_gol"] ??
                metricsJson["goal_chances"] ??
                parseNum(row["Chances de gol"]);
              if (gChances > 0) canonicalValuesMap.set("goal_chances", gChances);
            }

            // d) passes & pass_accuracy
            if (!canonicalValuesMap.has("passes")) {
              const p = metricsJson["passes"] ?? parseNum(row["Passes"]);
              if (p > 0) canonicalValuesMap.set("passes", p);
            }
            if (!canonicalValuesMap.has("pass_accuracy")) {
              const pAcc =
                metricsJson["passes_precisos_pct"] ??
                metricsJson["precisao_de_passe_pct"] ??
                parseNum(row["Passes precisos, %"]);
              if (pAcc > 0) canonicalValuesMap.set("pass_accuracy", pAcc);
            }

            // e) tackles & padj_tackles
            const tacklesVal =
              canonicalValuesMap.get("tackles") ??
              metricsJson["desarmes"] ??
              parseNum(row["Desarmes"] || row["Tackles"]);
            canonicalValuesMap.set("tackles", tacklesVal);

            if (!canonicalValuesMap.has("padj_tackles") && tacklesVal > 0) {
              canonicalValuesMap.set("padj_tackles", calculatePAdj(tacklesVal, 50));
            }

            // f) interceptions & padj_interceptions
            const interceptionsVal =
              canonicalValuesMap.get("interceptions") ??
              metricsJson["interceptacoes"] ??
              parseNum(row["Interceptações"] || row["Interceptions"]);
            canonicalValuesMap.set("interceptions", interceptionsVal);

            if (!canonicalValuesMap.has("padj_interceptions") && interceptionsVal > 0) {
              canonicalValuesMap.set("padj_interceptions", calculatePAdj(interceptionsVal, 50));
            }

            // g) xg, shots & xg_per_shot
            const xgVal =
              canonicalValuesMap.get("xg") ??
              metricsJson["xg"] ??
              metricsJson["xg_gols_esperados"] ??
              parseNum(row["xG (Gols esperados)"] || row["xG"]);
            canonicalValuesMap.set("xg", xgVal);

            const shotsVal =
              canonicalValuesMap.get("shots") ??
              metricsJson["chutes"] ??
              metricsJson["finalizacoes"] ??
              parseNum(row["Chutes"] || row["Finalizações"]);
            canonicalValuesMap.set("shots", shotsVal);

            if (!canonicalValuesMap.has("xg_per_shot") && shotsVal > 0 && xgVal > 0) {
              canonicalValuesMap.set("xg_per_shot", calculateXgPerShot(xgVal, shotsVal));
            }

            // h) key_passes & key_passes_accurate
            if (!canonicalValuesMap.has("key_passes")) {
              const kp =
                metricsJson["passes_chave"] ??
                metricsJson["passes_decisivos"] ??
                parseNum(row["Passes-chave"] || row["Passes decisivos"]);
              if (kp > 0) canonicalValuesMap.set("key_passes", kp);
            }
            if (!canonicalValuesMap.has("key_passes_accurate")) {
              const kpa =
                metricsJson["passes_chave_precisos"] ??
                parseNum(row["Passes-chave precisos"]);
              if (kpa > 0) canonicalValuesMap.set("key_passes_accurate", kpa);
            }

            // i) duelos defensivos ganhos %
            if (!canonicalValuesMap.has("defensive_duels_won_pct")) {
              const ddPct =
                metricsJson["duelos_defensivos_ganhos_pct"] ??
                parseNum(row["Duelos defensivos ganhos, %"]);
              if (ddPct > 0) canonicalValuesMap.set("defensive_duels_won_pct", ddPct);
            }

            // j) recuperações totais
            if (!canonicalValuesMap.has("recoveries")) {
              const rec =
                metricsJson["recuperacoes_da_bola"] ??
                metricsJson["recuperacoes"] ??
                parseNum(row["Recuperações da bola"] || row["Recuperações"]);
              if (rec > 0) canonicalValuesMap.set("recoveries", rec);
            }

            // Salva todas as canonical metrics calculando per90
            const safeMinutes = minutes > 0 ? minutes : 90;

            for (const [metricName, absoluteValue] of canonicalValuesMap.entries()) {
              const def = METRIC_BY_KEY[metricName];
              const isRateOrPct =
                def?.unit === "percent" ||
                metricName === "rating" ||
                metricName === "xg_per_shot";

              const per90Value = isRateOrPct
                ? Math.round(absoluteValue * 100) / 100
                : (safeMinutes > 0 ? Number(((absoluteValue / safeMinutes) * 90).toFixed(2)) : Number(absoluteValue.toFixed(2)));

              await prisma.canonicalMetric.upsert({
                where: {
                  matchId_athleteId_metricName: {
                    matchId,
                    athleteId: targetAthleteId,
                    metricName,
                  },
                },
                create: {
                  athleteId: targetAthleteId,
                  matchId,
                  rawMetricId: rawMetric.id,
                  round: parsedRound,
                  date: eventDate,
                  metricName,
                  absoluteValue,
                  per90Value,
                },
                update: {
                  rawMetricId: rawMetric.id,
                  round: parsedRound,
                  date: eventDate,
                  absoluteValue,
                  per90Value,
                },
              });
            }
          } catch (err) {
            console.error(`AthleteAgent - Erro na linha ${rowNumber}:`, err);
            errorCount++;
          }
        })
      );
    }

    try {
      revalidatePath("/athletes");
      revalidatePath("/catalog");
      revalidatePath("/league");
      revalidatePath("/league/lab");
      revalidatePath("/performance/squad");
      revalidatePath("/dashboard");
    } catch (e) {
      console.warn("RevalidatePath ignorado:", e);
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
}

export const athleteAgent = new AthleteAgent();
