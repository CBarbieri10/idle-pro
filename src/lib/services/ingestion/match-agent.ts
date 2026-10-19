import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MatchVenue } from "@prisma/client";
import {
  normalizeSportsBaseMatchRow,
  normalizeTeamName,
  findMatchingTeam,
} from "@/lib/normalization";
import type {
  IngestionAgent,
  ImportResultSummary,
  ImportDetailItem,
  DetectedFileType,
} from "./types";

function parseNum(val: unknown): number {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const clean = val.replace("%", "").replace(",", ".").trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export class MatchAgent implements IngestionAgent {
  readonly agentName = "MatchAgent";
  readonly supportedType: DetectedFileType = "MATCH";

  async process(
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
        // Normalização via SportsBase Match Map
        const sbMatch = normalizeSportsBaseMatchRow(row);

        const rawHomeTeam = sbMatch.homeTeam;
        const rawAwayTeam = sbMatch.awayTeam;

        if (!rawHomeTeam) {
          errorCount++;
          continue;
        }

        const cleanHomeTeam = normalizeTeamName(rawHomeTeam);
        let homeTeam = findMatchingTeam(cleanHomeTeam, existingTeams);

        if (!homeTeam) {
          homeTeam = await prisma.team.create({
            data: {
              name: cleanHomeTeam || rawHomeTeam,
              country: "Brasil",
              leagueId: defaultLeague.id,
            },
          });
          teamMap.set(homeTeam.name.toLowerCase(), homeTeam);
          existingTeams.push(homeTeam);
        }

        const cleanAwayTeam = rawAwayTeam ? normalizeTeamName(rawAwayTeam) : "";
        let awayTeam = cleanAwayTeam ? findMatchingTeam(cleanAwayTeam, existingTeams) : null;

        if (cleanAwayTeam && !awayTeam) {
          awayTeam = await prisma.team.create({
            data: {
              name: cleanAwayTeam,
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
          sbMatch.goal_chances > 0 ? `Chances de gol: ${sbMatch.goal_chances}` : null,
          sbMatch.recoveries_opponent_half > 0 ? `Recuperações Campo Adv: ${sbMatch.recoveries_opponent_half}` : null,
          xgHome > 0 ? `xG: ${xgHome.toFixed(2)}` : null,
          "Importado via MatchAgent",
        ].filter(Boolean);

        // Upsert / Busca da partida para acumular cronologicamente
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
              opponentName: awayTeam?.name || rawAwayTeam || "Adversário",
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
            playerName: sbMatch.match_string || `${homeTeam.name} vs ${awayTeam?.name || rawAwayTeam}`,
            teamName: homeTeam.name,
            similarityScore: 100,
            action: "UPDATED",
          });
        } else {
          await prisma.match.create({
            data: {
              teamId: homeTeam.id,
              opponentId: awayTeam?.id || null,
              opponentName: awayTeam?.name || rawAwayTeam || "Adversário",
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
            playerName: sbMatch.match_string || `${homeTeam.name} vs ${awayTeam?.name || rawAwayTeam}`,
            teamName: homeTeam.name,
            similarityScore: 100,
            action: "CREATED",
          });
        }
      } catch (err) {
        console.error(`MatchAgent - Erro na linha ${rowNumber}:`, err);
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
}

export const matchAgent = new MatchAgent();
