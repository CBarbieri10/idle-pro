import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MatchVenue } from "@prisma/client";
import {
  normalizeTeamName,
  parseIsoDate,
  parseMatchString,
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

    let matchedCount = 0;
    let createdCount = 0;
    let errorCount = 0;
    const details: ImportDetailItem[] = [];

    // Regex robusto para extrair: [Mandante] [golsMandante] :|-|x [golsVisitante] [Visitante]
    // Ex: "Esporte Clube Bahia 0:3 CR Flamengo"
    const scoreRegex = /^(.+?)\s+(\d{1,2})\s*[:xX\-–—]\s*(\d{1,2})\s+(.+)$/;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNumber = i + 2;

      try {
        const rawData = String(row["Data"] ?? row["date"] ?? row["Date"] ?? "").trim();
        const rawMatch = String(
          row["Match"] ?? row["match_string"] ?? row["match"] ?? row["Confronto"] ?? ""
        ).trim();

        // Ignora linha de resumo ("Total") ou linhas secundárias isoladas sem Match/Data
        if (!rawMatch || rawData.toLowerCase().includes("total") || !rawData) {
          continue;
        }

        // Detecta a linha secundária (parceira) do SportsBase que contém métricas do visitante
        const nextRow = i + 1 < rawRows.length ? rawRows[i + 1] : null;
        const isSecondaryRow =
          nextRow !== null &&
          (!nextRow["Match"] || String(nextRow["Match"]).trim() === "") &&
          (!nextRow["Data"] || String(nextRow["Data"]).trim() === "");

        // Extrai placar e nomes brutos via Regex
        let rawHomeTeam = "";
        let rawAwayTeam = "";
        let goalsFor = 0;
        let goalsAgainst = 0;

        const scoreMatch = rawMatch.match(scoreRegex);
        if (scoreMatch) {
          rawHomeTeam = scoreMatch[1].trim();
          goalsFor = parseInt(scoreMatch[2], 10);
          goalsAgainst = parseInt(scoreMatch[3], 10);
          rawAwayTeam = scoreMatch[4].trim();
        } else {
          const parsed = parseMatchString(rawMatch);
          rawHomeTeam = parsed.homeTeam;
          rawAwayTeam = parsed.awayTeam;
          goalsFor = parsed.goalsFor ?? 0;
          goalsAgainst = parsed.goalsAgainst ?? 0;
        }

        if (!rawHomeTeam) {
          errorCount++;
          continue;
        }

        // AÇÃO 2: Unificação Canônica Forçada (Mandatória)
        const cleanHomeTeam = normalizeTeamName(rawHomeTeam);
        const cleanAwayTeam = rawAwayTeam ? normalizeTeamName(rawAwayTeam) : "";

        // Busca Mandante com nome canônico unificado
        let homeTeam =
          existingTeams.find(
            (t) => t.name.toLowerCase().trim() === cleanHomeTeam.toLowerCase().trim()
          ) ?? null;
        if (!homeTeam) {
          homeTeam = await prisma.team.findFirst({
            where: { name: { equals: cleanHomeTeam, mode: "insensitive" } },
          });
          if (homeTeam) existingTeams.push(homeTeam);
        }
        if (!homeTeam) {
          homeTeam = await prisma.team.create({
            data: {
              name: cleanHomeTeam,
              country: "Brasil",
              leagueId: defaultLeague.id,
            },
          });
          existingTeams.push(homeTeam);
        }

        // Busca Visitante com nome canônico unificado
        let awayTeam = cleanAwayTeam
          ? existingTeams.find(
              (t) => t.name.toLowerCase().trim() === cleanAwayTeam.toLowerCase().trim()
            ) ?? null
          : null;
        if (cleanAwayTeam && !awayTeam) {
          awayTeam = await prisma.team.findFirst({
            where: { name: { equals: cleanAwayTeam, mode: "insensitive" } },
          });
          if (awayTeam) existingTeams.push(awayTeam);
        }
        if (cleanAwayTeam && !awayTeam) {
          awayTeam = await prisma.team.create({
            data: {
              name: cleanAwayTeam,
              country: "Brasil",
              leagueId: defaultLeague.id,
            },
          });
          existingTeams.push(awayTeam);
        }

        // Parsing da Data
        const matchDate = parseIsoDate(rawData);

        // Parsing da Rodada
        const rawRound = parseNum(row["Rodada"] || row["Round"] || row["Matchday"]);
        const parsedRound = rawRound > 0 ? Math.round(rawRound) : null;
        const roundLabel = parsedRound ? `Rodada ${parsedRound}` : "Rodada Regular";

        // Posse de bola da linha primária (Mandante)
        const rawHomePoss = parseFlexibleNumber(
          row["Posse de bola, %"] ?? row["possession_percentage"],
          50
        );
        const possession =
          rawHomePoss > 0 && rawHomePoss <= 1
            ? Math.round(rawHomePoss * 100)
            : Math.round(rawHomePoss);

        // Posse de bola do visitante (extraída da linha secundária quando disponível)
        let opponentPossession = Math.max(0, 100 - possession);
        if (isSecondaryRow && nextRow) {
          const rawAwayPoss = parseFlexibleNumber(
            nextRow["Posse de bola, %"] ?? nextRow["possession_percentage"],
            0
          );
          if (rawAwayPoss > 0) {
            opponentPossession =
              rawAwayPoss <= 1
                ? Math.round(rawAwayPoss * 100)
                : Math.round(rawAwayPoss);
          }
        }

        const homeFormation = String(row["Tática (inicial)"] ?? "").trim();
        const awayFormation =
          isSecondaryRow && nextRow
            ? String(nextRow["Tática (inicial)"] ?? "").trim()
            : "";
        const homeChances = parseFlexibleNumber(row["Chances de gol"], 0);
        const awayChances =
          isSecondaryRow && nextRow
            ? parseFlexibleNumber(nextRow["Chances de gol"], 0)
            : 0;
        const homePressing = parseFlexibleNumber(
          row["Pressão do time bem-sucedida, %"],
          0
        );
        const homePressingPct =
          homePressing > 0 && homePressing <= 1
            ? Math.round(homePressing * 100)
            : Math.round(homePressing);
        const homeEntries = parseFlexibleNumber(
          row["Entradas no campo adversário"],
          0
        );
        const homeRecovAdv = parseFlexibleNumber(
          row["Recuperações da bola no campo adversário"],
          0
        );

        const notesParts = [
          `Confronto: ${cleanHomeTeam} ${goalsFor}:${goalsAgainst} ${cleanAwayTeam || rawAwayTeam}`,
          homeFormation ? `Tática Mandante: ${homeFormation}` : null,
          awayFormation ? `Tática Visitante: ${awayFormation}` : null,
          homePressingPct > 0 ? `Pressão: ${homePressingPct}%` : null,
          homeEntries > 0 ? `Entradas Terço Final: ${homeEntries}` : null,
          homeChances > 0 ? `Chances Mandante: ${homeChances}` : null,
          awayChances > 0 ? `Chances Visitante: ${awayChances}` : null,
          homeRecovAdv > 0 ? `Recuperações Campo Adv: ${homeRecovAdv}` : null,
          "Importado via MatchAgent (2-Linhas SportsBase)",
        ].filter(Boolean);

        // Upsert / Busca da partida por mandante e data
        const existingMatch = await prisma.match.findFirst({
          where: {
            teamId: homeTeam.id,
            date: matchDate,
          },
        });

        if (existingMatch) {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              opponentId: awayTeam?.id || null,
              opponentName: awayTeam?.name || cleanAwayTeam || rawAwayTeam || "Adversário",
              goalsFor: Math.round(goalsFor),
              goalsAgainst: Math.round(goalsAgainst),
              possession,
              opponentPossession,
              round: roundLabel,
              notes: notesParts.join(" • "),
            },
          });
          matchedCount++;
          details.push({
            rowNumber,
            playerName: `${cleanHomeTeam} ${goalsFor}:${goalsAgainst} ${cleanAwayTeam || rawAwayTeam}`,
            teamName: homeTeam.name,
            similarityScore: 100,
            action: "UPDATED",
          });
        } else {
          await prisma.match.create({
            data: {
              teamId: homeTeam.id,
              opponentId: awayTeam?.id || null,
              opponentName: awayTeam?.name || cleanAwayTeam || rawAwayTeam || "Adversário",
              venue: MatchVenue.HOME,
              date: matchDate,
              round: roundLabel,
              competition: "Brasileirão Série A",
              leagueId: defaultLeague.id,
              goalsFor: Math.round(goalsFor),
              goalsAgainst: Math.round(goalsAgainst),
              possession,
              opponentPossession,
              notes: notesParts.join(" • "),
            },
          });
          createdCount++;
          details.push({
            rowNumber,
            playerName: `${cleanHomeTeam} ${goalsFor}:${goalsAgainst} ${cleanAwayTeam || rawAwayTeam}`,
            teamName: homeTeam.name,
            similarityScore: 100,
            action: "CREATED",
          });
        }

        // Se consumiu a linha secundária, avança o índice para iterar de 2 em 2
        if (isSecondaryRow) {
          i++;
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
    } catch {
      // Ignora silenciosamente fora de contexto HTTP
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
