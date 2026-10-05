import { prisma } from "@/lib/prisma";
import { Prisma, type MetricSource } from "@prisma/client";
import { METRIC_BY_KEY, type MetricData } from "@/lib/metrics";
import { normalizeHeader } from "@/lib/import/mapping";

export interface NormalizedCanonicalValue {
  metricName: string;
  absoluteValue: number;
  per90Value: number;
}

/**
 * Calculates Per-90 metric value: (value / minutes) * 90.
 *
 * Safety guarantees:
 * - If minutes <= 0, null, undefined, or NaN, returns 0 (prevents division by zero).
 * - If value is NaN or infinite, returns 0.
 * - Rounds result to 2 decimal places.
 */
export function calculatePer90(
  value: number,
  minutesPlayed: number | null | undefined
): number {
  if (
    !minutesPlayed ||
    minutesPlayed <= 0 ||
    !Number.isFinite(minutesPlayed) ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  const per90 = (value / minutesPlayed) * 90;
  return Math.round(per90 * 100) / 100;
}

/** Known aliases to resolve raw keys to canonical vocabulary */
const CANONICAL_ALIASES: Record<string, string> = {
  gols: "goals",
  gol: "goals",
  assistencias: "assists",
  assist: "assists",
  ast: "assists",
  finalizacoes: "shots",
  chutes: "shots",
  remates: "shots",
  finalizacoesnoalvo: "shots_on_target",
  chutesnoalvo: "shots_on_target",
  sot: "shots_on_target",
  xg: "xg",
  golsesperados: "xg",
  expectedgoals: "xg",
  driblescertos: "dribles_completed",
  dribles: "dribles_completed",
  successfuldribbles: "dribles_completed",
  passeschave: "key_passes",
  passesdecisivos: "key_passes",
  kp: "key_passes",
  passescertos: "passes",
  passes: "passes",
  precisaodepasse: "pass_accuracy",
  passaccuracy: "pass_accuracy",
  passesprogressivos: "progressive_passes",
  progressivepasses: "progressive_passes",
  bolaslongascertas: "long_balls_accurate",
  longballs: "long_balls_accurate",
  cruzamentoscertos: "crosses_accurate",
  crosses: "crosses_accurate",
  desarmes: "tackles",
  tackles: "tackles",
  interceptacoes: "interceptions",
  int: "interceptions",
  cortes: "clearances",
  clearances: "clearances",
  duelosaereosganhos: "aerial_duels_won",
  aerialduelswon: "aerial_duels_won",
  duelosnochaoganhos: "ground_duels_won",
  groundduelswon: "ground_duels_won",
  recuperacoes: "recoveries",
  ballrecoveries: "recoveries",
  bloqueios: "blocks",
  blocks: "blocks",
  faltascometidas: "fouls_committed",
  fouls: "fouls_committed",
  defesas: "saves",
  saves: "saves",
  defesasdentrodaarea: "saves_inside_box",
  savesinsidebox: "saves_inside_box",
  golssofridos: "goals_conceded",
  goalsconceded: "goals_conceded",
  saidasdogol: "high_claims",
  highclaims: "high_claims",
  nota: "rating",
  rating: "rating",
  sofascorerating: "rating",
  avaliacao: "rating",
};

/**
 * Extracts and maps raw metric JSON data into canonical metric records.
 * Calculates both absoluteValue and per90Value.
 */
export function extractCanonicalMetrics(
  rawData: MetricData,
  minutesPlayed: number | null | undefined,
  _source?: MetricSource
): NormalizedCanonicalValue[] {
  const result = new Map<string, number>();

  // 1. Direct and aliased mappings
  for (const [rawKey, val] of Object.entries(rawData)) {
    if (typeof val !== "number" || !Number.isFinite(val)) continue;

    // Check direct canonical key
    if (METRIC_BY_KEY[rawKey]) {
      result.set(rawKey, val);
      continue;
    }

    // Check normalized alias
    const norm = normalizeHeader(rawKey);
    const aliasHit = CANONICAL_ALIASES[norm];
    if (aliasHit && METRIC_BY_KEY[aliasHit]) {
      if (!result.has(aliasHit)) {
        result.set(aliasHit, val);
      }
    }
  }

  // 2. Compound rules (ADR-002)
  // e.g. shots = shots_on_target + shots_off_target if shots not explicitly present
  if (!result.has("shots")) {
    const onTarget = Number(rawData["shots_on_target"] ?? rawData["chutes_no_alvo"] ?? 0);
    const offTarget = Number(rawData["shots_off_target"] ?? rawData["chutes_fora"] ?? 0);
    if (onTarget > 0 || offTarget > 0) {
      result.set("shots", onTarget + offTarget);
    }
  }

  // 3. Convert mapped canonical metrics with Per-90 calculation
  const output: NormalizedCanonicalValue[] = [];

  for (const [metricName, absoluteValue] of result.entries()) {
    const def = METRIC_BY_KEY[metricName];
    const isRateOrPercentage = def?.unit === "percent" || metricName === "rating";

    const per90Value = isRateOrPercentage
      ? Math.round(absoluteValue * 100) / 100
      : calculatePer90(absoluteValue, minutesPlayed);

    output.push({
      metricName,
      absoluteValue,
      per90Value,
    });
  }

  return output;
}

type DbClient = Prisma.TransactionClient | typeof prisma;

/**
 * Normalizes a RawMetric record and upserts the calculated CanonicalMetric rows into the database.
 */
export async function normalizeRawMetric(
  db: DbClient,
  rawMetricId: string
): Promise<number> {
  const raw = await db.rawMetric.findUnique({
    where: { id: rawMetricId },
    select: {
      id: true,
      matchId: true,
      athleteId: true,
      minutesPlayed: true,
      source: true,
      data: true,
    },
  });

  if (!raw) return 0;

  const canonicalItems = extractCanonicalMetrics(
    raw.data as MetricData,
    raw.minutesPlayed,
    raw.source
  );

  for (const item of canonicalItems) {
    await db.canonicalMetric.upsert({
      where: {
        matchId_athleteId_metricName: {
          matchId: raw.matchId,
          athleteId: raw.athleteId,
          metricName: item.metricName,
        },
      },
      create: {
        athleteId: raw.athleteId,
        matchId: raw.matchId,
        rawMetricId: raw.id,
        metricName: item.metricName,
        absoluteValue: item.absoluteValue,
        per90Value: item.per90Value,
      },
      update: {
        rawMetricId: raw.id,
        absoluteValue: item.absoluteValue,
        per90Value: item.per90Value,
      },
    });
  }

  return canonicalItems.length;
}

/**
 * Batch normalizes multiple RawMetric records.
 */
export async function normalizeRawMetricsBatch(
  db: DbClient,
  rawMetricIds: string[]
): Promise<number> {
  let count = 0;
  for (const id of rawMetricIds) {
    count += await normalizeRawMetric(db, id);
  }
  return count;
}
