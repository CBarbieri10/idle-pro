import { prisma } from "@/lib/prisma";
import { Prisma, type MetricSource } from "@prisma/client";
import { METRIC_BY_KEY, type MetricData } from "@/lib/metrics";
import { normalizeHeader } from "@/lib/import/mapping";
import { calculatePAdj, calculateXgPerShot } from "@/lib/math-engine";

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

/**
 * Dicionário Oficial de Mapeamento SportsBase - Partidas (processMatchFile)
 */
export const SPORTSBASE_MATCH_MAP = {
  "Data": "date",
  "Match": "match_string",
  "Posse de bola, %": "possession_percentage",
  "Tática (inicial)": "starting_formation",
  "Pressão do time bem-sucedida, %": "successful_pressing_pct",
  "Entradas no campo adversário": "entries_final_third_team",
} as const;

/**
 * Dicionário Oficial de Mapeamento SportsBase - Atletas (processAthleteFile)
 */
export const SPORTSBASE_ATHLETE_MAP = {
  "№": "jersey_number",
  "Minutos jogados": "minutes_played",
  "Passes precisos, %": "pass_accuracy",
  "Duelos defensivos ganhos, %": "defensive_duels_won_pct",
  "Passes-chave precisos": "key_passes_accurate",
} as const;

/**
 * Converte formatos variados de datas (ISO, DD/MM/YYYY, DD.MM.YYYY, timestamp ou Excel serial)
 * para um objeto Date garantido compatível com DateTime ISO do Prisma.
 */
export function parseIsoDate(dateVal: unknown): Date {
  if (!dateVal) return new Date("2026-08-01T12:00:00.000Z");
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? new Date("2026-08-01T12:00:00.000Z") : dateVal;
  }
  if (typeof dateVal === "number") {
    // Excel serial date (ex: 46152)
    if (dateVal > 10000 && dateVal < 80000) {
      const dt = new Date(Math.round((Math.floor(dateVal) - 25569) * 86400000));
      return isNaN(dt.getTime()) ? new Date("2026-08-01T12:00:00.000Z") : dt;
    }
    const dt = new Date(dateVal);
    return isNaN(dt.getTime()) ? new Date("2026-08-01T12:00:00.000Z") : dt;
  }
  const str = String(dateVal).trim();
  if (!str) return new Date("2026-08-01T12:00:00.000Z");

  // Formato brasileiro DD/MM/YYYY ou DD.MM.YYYY ou DD-MM-YYYY
  const brMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})/);
  if (brMatch) {
    let year = parseInt(brMatch[3], 10);
    if (year < 100) year += 2000;
    const month = parseInt(brMatch[2], 10) - 1;
    const day = parseInt(brMatch[1], 10);
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }

  // Formato ISO padrão ou YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
    if (!isNaN(d.getTime())) return d;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) return parsed;

  return new Date("2026-08-01T12:00:00.000Z");
}

export interface ParsedMatchString {
  matchString: string;
  homeTeam: string;
  awayTeam: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
}

/**
 * Faz o parsing inteligente da coluna 'Match' (ex: 'Flamengo 2 - 1 Palmeiras', 'Grêmio 1x0 Inter', 'Vasco - Bahia')
 * separando mandante, visitante e placares.
 */
export function parseMatchString(rawMatch: unknown): ParsedMatchString {
  const matchString = String(rawMatch || "").trim();
  if (!matchString) {
    return {
      matchString: "",
      homeTeam: "",
      awayTeam: "",
      goalsFor: null,
      goalsAgainst: null,
    };
  }

  // 1. Padrão com placar explícito (ex: "Flamengo 2 - 1 Palmeiras" ou "Flamengo 2x1 Palmeiras")
  const scoreRegex = /^(.+?)\s+(\d{1,2})\s*(?:[-–—x×:]|\s+x\s+)\s*(\d{1,2})\s+(.+)$/i;
  const scoreMatch = matchString.match(scoreRegex);
  if (scoreMatch) {
    return {
      matchString,
      homeTeam: scoreMatch[1].trim(),
      awayTeam: scoreMatch[4].trim(),
      goalsFor: parseInt(scoreMatch[2], 10),
      goalsAgainst: parseInt(scoreMatch[3], 10),
    };
  }

  // 2. Padrão sem placar (ex: "Flamengo - Palmeiras", "Flamengo vs Palmeiras", "Flamengo x Palmeiras")
  const vsParts = matchString.split(/\s+(?:vs\.?|x|[-–—])\s+/i);
  if (vsParts.length >= 2) {
    return {
      matchString,
      homeTeam: vsParts[0].trim(),
      awayTeam: vsParts.slice(1).join(" - ").trim(),
      goalsFor: null,
      goalsAgainst: null,
    };
  }

  return {
    matchString,
    homeTeam: matchString,
    awayTeam: "",
    goalsFor: null,
    goalsAgainst: null,
  };
}

/**
 * Converte valores textuais e numéricos variados ("64,5%", "2.4", etc.) em número puro seguro
 */
export function parseFlexibleNumber(val: unknown, fallback = 0): number {
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (typeof val === "string") {
    const clean = val.replace("%", "").replace(",", ".").trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

export interface NormalizedMatchRow {
  date: Date;
  dateIso: string;
  match_string: string;
  homeTeam: string;
  awayTeam: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  possession_percentage: number;
  starting_formation: string;
  successful_pressing_pct: number;
  entries_final_third_team: number;
  raw: Record<string, unknown>;
}

/**
 * Normaliza os dados brutos de uma linha de partida de acordo com o dicionário SportsBase
 */
export function normalizeSportsBaseMatchRow(row: Record<string, unknown>): NormalizedMatchRow {
  // 'Data' -> date (ISO)
  const rawDate = row["Data"] ?? row["date"] ?? row["Date"] ?? row["Data do Jogo"];
  const date = parseIsoDate(rawDate);

  // 'Match' -> match_string (separar mandante e visitante)
  const rawMatch = row["Match"] ?? row["match_string"] ?? row["match"] ?? row["Confronto"];
  const parsedMatch = parseMatchString(rawMatch);

  const homeTeam = parsedMatch.homeTeam || String(row["Mandante"] ?? row["Home Team"] ?? row["Time Mandante"] ?? "").trim();
  const awayTeam = parsedMatch.awayTeam || String(row["Visitante"] ?? row["Away Team"] ?? row["Time Visitante"] ?? "").trim();

  // 'Posse de bola, %' -> possession_percentage
  const rawPoss = row["Posse de bola, %"] ?? row["possession_percentage"] ?? row["Posse Mandante, %"] ?? row["Posse, %"];
  const possession_percentage = parseFlexibleNumber(rawPoss, 50);

  // 'Tática (inicial)' -> starting_formation
  const rawFormation = row["Tática (inicial)"] ?? row["starting_formation"] ?? row["Tatica (inicial)"] ?? row["Formação"];
  const starting_formation = String(rawFormation || "").trim();

  // 'Pressão do time bem-sucedida, %' -> successful_pressing_pct
  const rawPressing = row["Pressão do time bem-sucedida, %"] ?? row["successful_pressing_pct"] ?? row["Pressao do time bem-sucedida, %"];
  const successful_pressing_pct = parseFlexibleNumber(rawPressing, 0);

  // 'Entradas no campo adversário' -> entries_final_third_team
  const rawEntries = row["Entradas no campo adversário"] ?? row["entries_final_third_team"] ?? row["Entradas no campo adversario"];
  const entries_final_third_team = parseFlexibleNumber(rawEntries, 0);

  return {
    date,
    dateIso: date.toISOString(),
    match_string: parsedMatch.matchString || (homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : ""),
    homeTeam,
    awayTeam,
    goalsFor: parsedMatch.goalsFor,
    goalsAgainst: parsedMatch.goalsAgainst,
    possession_percentage,
    starting_formation,
    successful_pressing_pct,
    entries_final_third_team,
    raw: row,
  };
}

export interface NormalizedAthleteRow {
  jersey_number: number | null;
  minutes_played: number;
  pass_accuracy: number;
  defensive_duels_won_pct: number;
  key_passes_accurate: number;
  raw: Record<string, unknown>;
}

/**
 * Normaliza os dados brutos de uma linha de atleta de acordo com o dicionário SportsBase
 */
export function normalizeSportsBaseAthleteRow(row: Record<string, unknown>): NormalizedAthleteRow {
  // '№' -> jersey_number
  const rawJersey = row["№"] ?? row["jersey_number"] ?? row["Numero"] ?? row["Número"] ?? row["No"];
  const parsedJersey = parseFlexibleNumber(rawJersey, -1);
  const jersey_number = parsedJersey >= 0 ? Math.round(parsedJersey) : null;

  // 'Minutos jogados' -> minutes_played
  const rawMinutes = row["Minutos jogados"] ?? row["minutes_played"] ?? row["Minutos"] ?? row["Minutes"];
  const minutes_played = Math.round(parseFlexibleNumber(rawMinutes, 90));

  // 'Passes precisos, %' -> pass_accuracy
  const rawPassAcc = row["Passes precisos, %"] ?? row["pass_accuracy"] ?? row["Pass accuracy, %"];
  const pass_accuracy = parseFlexibleNumber(rawPassAcc, 0);

  // 'Duelos defensivos ganhos, %' -> defensive_duels_won_pct
  const rawDefDuels = row["Duelos defensivos ganhos, %"] ?? row["defensive_duels_won_pct"] ?? row["Defensive duels won, %"];
  const defensive_duels_won_pct = parseFlexibleNumber(rawDefDuels, 0);

  // 'Passes-chave precisos' -> key_passes_accurate
  const rawKeyPasses = row["Passes-chave precisos"] ?? row["key_passes_accurate"] ?? row["Passes chave precisos"];
  const key_passes_accurate = parseFlexibleNumber(rawKeyPasses, 0);

  return {
    jersey_number,
    minutes_played,
    pass_accuracy,
    defensive_duels_won_pct,
    key_passes_accurate,
    raw: row,
  };
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
  xgpershot: "xg_per_shot",
  xgshot: "xg_per_shot",
  xgporshot: "xg_per_shot",
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
  padjtackles: "padj_tackles",
  padjdesarmes: "padj_tackles",
  interceptacoes: "interceptions",
  int: "interceptions",
  padjinterceptions: "padj_interceptions",
  padjinterceptacoes: "padj_interceptions",
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
  // SportsBase Atletas
  passesprecisospct: "pass_accuracy",
  duelosdefensivosganhospct: "defensive_duels_won_pct",
  passeschaveprecisos: "key_passes_accurate",
  minutosjogados: "minutes_played",
  no: "jersey_number",
  numero: "jersey_number",
  jerseynumber: "jersey_number",
  // SportsBase Partidas / Coletivo
  possedebolapct: "possession_percentage",
  taticainicial: "starting_formation",
  pressaodotimebemsucedidapct: "successful_pressing_pct",
  entradasnocampoadversario: "entries_final_third_team",
  match: "match_string",
  data: "date",
};

export interface MatchNormalizationContext {
  opponentPossession?: number | null;
}

/**
 * Extracts and maps raw metric JSON data into canonical metric records.
 * Calculates both absoluteValue and per90Value.
 */
export function extractCanonicalMetrics(
  rawData: MetricData,
  minutesPlayed: number | null | undefined,
  _source?: MetricSource,
  matchContext?: MatchNormalizationContext
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

    // Check direct SportsBase Athlete Map hit
    if (SPORTSBASE_ATHLETE_MAP[rawKey as keyof typeof SPORTSBASE_ATHLETE_MAP]) {
      const canonicalKey = SPORTSBASE_ATHLETE_MAP[rawKey as keyof typeof SPORTSBASE_ATHLETE_MAP];
      if (METRIC_BY_KEY[canonicalKey] && !result.has(canonicalKey)) {
        result.set(canonicalKey, val);
        continue;
      }
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

  // 2. Compound and Advanced Scientific Rules (Issue #18)
  // 2a. shots = shots_on_target + shots_off_target if shots not explicitly present
  if (!result.has("shots")) {
    const onTarget = Number(rawData["shots_on_target"] ?? rawData["chutes_no_alvo"] ?? 0);
    const offTarget = Number(rawData["shots_off_target"] ?? rawData["chutes_fora"] ?? 0);
    if (onTarget > 0 || offTarget > 0) {
      result.set("shots", onTarget + offTarget);
    }
  }

  // 2b. Eficiência Ofensiva (xG / Shot)
  if (!result.has("xg_per_shot")) {
    const xgVal = result.get("xg") ?? Number(rawData["xg"] ?? rawData["gols_esperados"] ?? 0);
    const shotsVal = result.get("shots") ?? Number(rawData["shots"] ?? rawData["finalizacoes"] ?? 0);
    if (shotsVal > 0 && xgVal > 0) {
      result.set("xg_per_shot", calculateXgPerShot(xgVal, shotsVal));
    }
  }

  // 2c. Normalização Defensiva por Posse (PAdj)
  // Identifica posse de bola adversária da partida ou do JSON
  let oppPoss = matchContext?.opponentPossession ?? null;
  if (oppPoss === null || oppPoss === undefined) {
    if (typeof rawData["opponent_possession"] === "number") {
      oppPoss = rawData["opponent_possession"];
    } else if (typeof rawData["posse_adversaria"] === "number") {
      oppPoss = rawData["posse_adversaria"];
    } else if (typeof rawData["possession"] === "number") {
      oppPoss = 100 - rawData["possession"];
    } else if (typeof rawData["posse"] === "number") {
      oppPoss = 100 - rawData["posse"];
    }
  }
  const opponentPossessionFinal = typeof oppPoss === "number" && oppPoss > 0 ? oppPoss : 50;

  if (!result.has("padj_tackles") && result.has("tackles")) {
    const rawTackles = result.get("tackles")!;
    result.set("padj_tackles", calculatePAdj(rawTackles, opponentPossessionFinal));
  }

  if (!result.has("padj_interceptions") && result.has("interceptions")) {
    const rawInterceptions = result.get("interceptions")!;
    result.set("padj_interceptions", calculatePAdj(rawInterceptions, opponentPossessionFinal));
  }

  // 3. Convert mapped canonical metrics with Per-90 calculation
  const output: NormalizedCanonicalValue[] = [];

  for (const [metricName, absoluteValue] of result.entries()) {
    const def = METRIC_BY_KEY[metricName];
    // Taxas de eficiência, percentuais e notas não sofrem diluição per-90 linear
    const isRateOrPercentage =
      def?.unit === "percent" ||
      metricName === "rating" ||
      metricName === "xg_per_shot";

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
      match: {
        select: {
          possession: true,
          opponentPossession: true,
        },
      },
    },
  });

  if (!raw) return 0;

  const oppPoss =
    raw.match?.opponentPossession ??
    (typeof raw.match?.possession === "number" ? 100 - raw.match.possession : null);

  const canonicalItems = extractCanonicalMetrics(
    raw.data as MetricData,
    raw.minutesPlayed,
    raw.source,
    { opponentPossession: oppPoss }
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
