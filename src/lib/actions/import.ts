"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { MetricSource, Prisma } from "@prisma/client";
import { normalizeName, type StagedRow } from "@/lib/import/mapping";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback outside Next.js request context
  }
}

export interface ResolvedStagedRow extends StagedRow {
  status: "READY" | "UNREGISTERED_ATHLETE" | "ERROR";
  resolvedAthleteId: string | null;
  resolvedAthleteName: string | null;
  resolvedTeamId: string | null;
  resolvedTeamName: string | null;
  resolvedOpponentId: string | null;
}

export interface StagingResolutionResult {
  rows: ResolvedStagedRow[];
  summary: {
    total: number;
    readyCount: number;
    unregisteredCount: number;
    errorCount: number;
    unregisteredAthleteNames: string[];
    uniqueMatchesCount: number;
  };
}

export type ImportActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Resolves staged rows against the database:
 * - Matches athletes by normalized name (prioritizing the row or fallback team)
 * - Identifies unregistered athletes (triggering prominent alerts in the UI)
 * - Matches teams and opponents by normalized name
 * - Groups rows and validates readiness for bulk insertion
 */
export async function resolveStagedImport(
  stagedRows: StagedRow[],
  defaultTeamId?: string
): Promise<StagingResolutionResult> {
  const [teams, athletes] = await Promise.all([
    prisma.team.findMany({
      select: { id: true, name: true, shortName: true },
    }),
    prisma.athlete.findMany({
      select: {
        id: true,
        name: true,
        teamId: true,
        team: { select: { id: true, name: true, shortName: true } },
      },
    }),
  ]);

  // Index teams by normalized name & short name
  const teamByNorm = new Map<string, { id: string; name: string }>();
  for (const t of teams) {
    teamByNorm.set(normalizeName(t.name), { id: t.id, name: t.name });
    if (t.shortName) {
      teamByNorm.set(normalizeName(t.shortName), { id: t.id, name: t.name });
    }
  }

  const defaultTeam = defaultTeamId ? teams.find((t) => t.id === defaultTeamId) : null;

  // Index athletes by normalized name (an athlete name can have multiple entries across clubs)
  const athletesByNorm = new Map<string, typeof athletes>();
  for (const a of athletes) {
    const k = normalizeName(a.name);
    const list = athletesByNorm.get(k) ?? [];
    list.push(a);
    athletesByNorm.set(k, list);
  }

  const unregisteredNames = new Set<string>();
  const matchKeys = new Set<string>();

  const resolvedRows: ResolvedStagedRow[] = stagedRows.map((row) => {
    const normAthlete = normalizeName(row.athleteName);
    const candidateAthletes = athletesByNorm.get(normAthlete) ?? [];

    // Resolve team
    let resolvedTeamId: string | null = null;
    let resolvedTeamName: string | null = null;

    if (row.teamName) {
      const matchedTeam = teamByNorm.get(normalizeName(row.teamName));
      if (matchedTeam) {
        resolvedTeamId = matchedTeam.id;
        resolvedTeamName = matchedTeam.name;
      }
    }

    if (!resolvedTeamId && defaultTeam) {
      resolvedTeamId = defaultTeam.id;
      resolvedTeamName = defaultTeam.name;
    }

    // Resolve opponent team if registered
    let resolvedOpponentId: string | null = null;
    if (row.opponentName) {
      const matchedOpponent = teamByNorm.get(normalizeName(row.opponentName));
      if (matchedOpponent) {
        resolvedOpponentId = matchedOpponent.id;
      }
    }

    // Resolve athlete
    let resolvedAthlete: (typeof athletes)[number] | null = null;
    if (candidateAthletes.length === 1) {
      resolvedAthlete = candidateAthletes[0];
    } else if (candidateAthletes.length > 1) {
      // Prioritize athlete belonging to the matched team
      resolvedAthlete =
        (resolvedTeamId && candidateAthletes.find((a) => a.teamId === resolvedTeamId)) ||
        candidateAthletes[0];
    }

    // If athlete is resolved, infer team if not yet set
    if (resolvedAthlete && !resolvedTeamId) {
      resolvedTeamId = resolvedAthlete.teamId;
      resolvedTeamName = resolvedAthlete.team.name;
    }

    // Determine row status
    const rowErrors = [...row.errors];
    let status: ResolvedStagedRow["status"] = "READY";

    if (!resolvedTeamId) {
      rowErrors.push("Clube não identificado (selecione um clube padrão)");
    }

    if (rowErrors.length > 0) {
      status = "ERROR";
    } else if (!resolvedAthlete) {
      status = "UNREGISTERED_ATHLETE";
      unregisteredNames.add(row.athleteName);
    }

    if (status === "READY" && row.date && resolvedTeamId && row.opponentName) {
      matchKeys.add(`${row.date}_${resolvedTeamId}_${normalizeName(row.opponentName)}_${row.competition}`);
    }

    return {
      ...row,
      errors: rowErrors,
      status,
      resolvedAthleteId: resolvedAthlete?.id ?? null,
      resolvedAthleteName: resolvedAthlete?.name ?? null,
      resolvedTeamId,
      resolvedTeamName,
      resolvedOpponentId,
    };
  });

  const readyCount = resolvedRows.filter((r) => r.status === "READY").length;
  const unregisteredCount = resolvedRows.filter((r) => r.status === "UNREGISTERED_ATHLETE").length;
  const errorCount = resolvedRows.filter((r) => r.status === "ERROR").length;

  return {
    rows: resolvedRows,
    summary: {
      total: resolvedRows.length,
      readyCount,
      unregisteredCount,
      errorCount,
      unregisteredAthleteNames: Array.from(unregisteredNames),
      uniqueMatchesCount: matchKeys.size,
    },
  };
}

export interface ExecuteImportParams {
  rows: ResolvedStagedRow[];
  source: MetricSource;
  defaultTeamId?: string;
}

export interface ImportExecutionResult {
  importedCount: number;
  matchesCreated: number;
  matchesLinked: number;
  skippedCount: number;
  unregisteredAthletes: string[];
}

/**
 * Commits the valid staged rows into the database using a transactional batch operation.
 * Automatically finds or creates matches, and upserts RawMetric records.
 */
export async function executeBatchImport(
  params: ExecuteImportParams
): Promise<ImportActionResult<ImportExecutionResult>> {
  try {
    const validRows = params.rows.filter(
      (r) =>
        r.status === "READY" &&
        r.resolvedAthleteId &&
        r.resolvedTeamId &&
        r.date &&
        r.opponentName &&
        r.competition
    );

    if (validRows.length === 0) {
      return {
        ok: false,
        error: "Nenhuma linha válida pronta para importação.",
      };
    }

    const unregistered = params.rows
      .filter((r) => r.status === "UNREGISTERED_ATHLETE")
      .map((r) => r.athleteName);

    const affectedAthleteIds = new Set<string>();

    const result = await prisma.$transaction(async (tx) => {
      let matchesCreated = 0;
      let matchesLinked = 0;
      let importedCount = 0;

      // Group rows by match identity: date + teamId + opponentName + competition
      type MatchGroup = {
        key: string;
        date: string;
        teamId: string;
        opponentId: string | null;
        opponentName: string;
        competition: string;
        round: string | null;
        venue: ResolvedStagedRow["venue"];
        goalsFor: number | null;
        goalsAgainst: number | null;
        rows: ResolvedStagedRow[];
      };

      const groups = new Map<string, MatchGroup>();

      for (const row of validRows) {
        const teamId = row.resolvedTeamId!;
        const groupKey = `${row.date}_${teamId}_${normalizeName(row.opponentName)}_${normalizeName(row.competition)}`;

        let group = groups.get(groupKey);
        if (!group) {
          group = {
            key: groupKey,
            date: row.date!,
            teamId,
            opponentId: row.resolvedOpponentId,
            opponentName: row.opponentName,
            competition: row.competition,
            round: row.round,
            venue: row.venue,
            goalsFor: row.goalsFor,
            goalsAgainst: row.goalsAgainst,
            rows: [],
          };
          groups.set(groupKey, group);
        }
        group.rows.push(row);
      }

      // Process each match group
      for (const group of groups.values()) {
        const matchDate = new Date(`${group.date}T12:00:00.000Z`);

        // Check if matching match already exists in DB
        let match = await tx.match.findFirst({
          where: {
            date: matchDate,
            teamId: group.teamId,
            opponentName: { equals: group.opponentName, mode: "insensitive" },
            competition: { equals: group.competition, mode: "insensitive" },
          },
        });

        if (match) {
          matchesLinked++;
          // Update score or round if currently null on match but provided in spreadsheet
          if (
            (match.goalsFor === null && group.goalsFor !== null) ||
            (match.goalsAgainst === null && group.goalsAgainst !== null) ||
            (!match.round && group.round)
          ) {
            match = await tx.match.update({
              where: { id: match.id },
              data: {
                goalsFor: match.goalsFor ?? group.goalsFor,
                goalsAgainst: match.goalsAgainst ?? group.goalsAgainst,
                round: match.round ?? group.round,
              },
            });
          }
        } else {
          matchesCreated++;
          match = await tx.match.create({
            data: {
              date: matchDate,
              teamId: group.teamId,
              opponentId: group.opponentId,
              opponentName: group.opponentName,
              venue: group.venue,
              competition: group.competition,
              round: group.round,
              goalsFor: group.goalsFor,
              goalsAgainst: group.goalsAgainst,
            },
          });
        }

        // Upsert raw metrics for each athlete in this match
        for (const row of group.rows) {
          const athleteId = row.resolvedAthleteId!;
          affectedAthleteIds.add(athleteId);

          await tx.rawMetric.upsert({
            where: {
              matchId_athleteId_source: {
                matchId: match.id,
                athleteId,
                source: params.source,
              },
            },
            create: {
              matchId: match.id,
              athleteId,
              source: params.source,
              minutesPlayed: row.minutesPlayed,
              data: row.data as Prisma.InputJsonObject,
            },
            update: {
              minutesPlayed: row.minutesPlayed,
              data: row.data as Prisma.InputJsonObject,
            },
          });
          importedCount++;
        }
      }

      return {
        importedCount,
        matchesCreated,
        matchesLinked,
        skippedCount: params.rows.length - validRows.length,
        unregisteredAthletes: Array.from(new Set(unregistered)),
      };
    });

    safeRevalidate("/matches");
    for (const aId of affectedAthleteIds) {
      safeRevalidate(`/athletes/${aId}`);
    }

    return { ok: true, data: result };
  } catch (err) {
    console.error("Batch import error:", err);
    return {
      ok: false,
      error:
        err instanceof Error ? err.message : "Erro inesperado ao realizar a importação em lote.",
    };
  }
}
