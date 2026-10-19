import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MatchVenue } from "@prisma/client";
import {
  normalizeTeamName,
  findMatchingTeam,
  parseIsoDate,
  parseFlexibleNumber,
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

export class TeamAgent implements IngestionAgent {
  readonly agentName = "TeamAgent";
  readonly supportedType: DetectedFileType = "TEAM";

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
        const rawTeam = String(
          row["Time"] ||
            row["Equipe"] ||
            row["Team"] ||
            row["Clube"] ||
            row["Club"] ||
            ""
        ).trim();

        if (!rawTeam) {
          errorCount++;
          continue;
        }

        const cleanTeam = normalizeTeamName(rawTeam);
        let team = findMatchingTeam(cleanTeam, existingTeams);

        if (!team) {
          team = await prisma.team.create({
            data: {
              name: cleanTeam || rawTeam,
              country: "Brasil",
              leagueId: defaultLeague.id,
            },
          });
          teamMap.set(team.name.toLowerCase(), team);
          existingTeams.push(team);
          createdCount++;
        } else {
          matchedCount++;
        }

        // Métricas coletivas vitais para os Quadrantes (Ofensividade e Controle)
        const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
        const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;
        const roundLabel = parsedRound ? `Rodada ${parsedRound}` : "Métricas Coletivas Acumuladas";

        const rawDateStr = row["Data"] || row["Date"] || row["Data do Jogo"];
        const matchDate = rawDateStr
          ? parseIsoDate(rawDateStr)
          : parsedRound
          ? new Date(2026, 3, 10 + parsedRound * 7)
          : new Date("2026-08-01T12:00:00.000Z");

        const possession = parseFlexibleNumber(
          row["Posse de bola, %"] || row["Posse, %"] || row["Posse"] || 50,
          50
        );
        const pressingPct = parseFlexibleNumber(
          row["Pressão do time bem-sucedida, %"] || row["Pressao, %"] || 0,
          0
        );
        const finalThirdEntries = parseFlexibleNumber(
          row["Entradas no campo adversário"] || row["Entradas terço final"] || 0,
          0
        );
        const goalChances = parseFlexibleNumber(
          row["Chances de gol"] || row["Oportunidades de gol"] || 0,
          0
        );
        const recoveriesOpponentHalf = parseFlexibleNumber(
          row["Recuperações da bola no campo adversário"] || row["Recuperações campo adv"] || 0,
          0
        );
        const goalsFor = parseNum(row["Gols Pró"] || row["Gols"] || 0);
        const goalsAgainst = parseNum(row["Gols Sofridos"] || row["Gols Contra"] || 0);

        const notesParts = [
          `Posse: ${possession}%`,
          pressingPct > 0 ? `Pressão: ${pressingPct}%` : null,
          finalThirdEntries > 0 ? `Entradas Terço Final: ${finalThirdEntries}` : null,
          goalChances > 0 ? `Chances de gol: ${goalChances}` : null,
          recoveriesOpponentHalf > 0 ? `Recuperações Campo Adv: ${recoveriesOpponentHalf}` : null,
          "Telemetria Coletiva (TeamAgent)",
        ].filter(Boolean);

        const existingMatch = await prisma.match.findFirst({
          where: {
            teamId: team.id,
            round: roundLabel,
            date: matchDate,
          },
        });

        if (existingMatch) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              goalsFor: Math.round(goalsFor),
              goalsAgainst: Math.round(goalsAgainst),
              possession,
              opponentPossession: Math.max(0, 100 - possession),
              notes: notesParts.join(" • "),
            },
          });
        } else {
          await prisma.match.create({
            data: {
              teamId: team.id,
              opponentName: "Média da Série A",
              venue: MatchVenue.NEUTRAL,
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
        }

        details.push({
          rowNumber,
          playerName: team.name,
          teamName: team.name,
          similarityScore: 100,
          action: "UPDATED",
        });
      } catch (err) {
        console.error(`TeamAgent - Erro na linha ${rowNumber}:`, err);
        errorCount++;
      }
    }

    try {
      revalidatePath("/competition/leaders");
      revalidatePath("/league");
      revalidatePath("/dashboard");
    } catch {
      // Ignora silenciosamente quando executado fora do contexto HTTP do Next.js (ex: CLI / scripts)
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
}

export const teamAgent = new TeamAgent();
