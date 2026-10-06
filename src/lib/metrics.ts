// Shared (client + server) metric vocabulary for manual entry.
// Raw metrics are stored as a free-form JSON object (ADR-002). Known keys below
// get labels/formatting; any unknown key (custom field or imported column) is
// preserved and displayed verbatim.

import type { MatchVenue, MetricSource, Position } from "@prisma/client";

export type MetricUnit = "count" | "percent" | "decimal";
export type MetricGroup = "Geral" | "Ataque" | "Passe" | "Defesa" | "Goleiro";

export interface MetricDef {
  key: string;
  label: string;
  short: string;
  unit: MetricUnit;
  group: MetricGroup;
  max?: number;
}

export const METRICS: MetricDef[] = [
  // Geral
  { key: "rating", label: "Nota", short: "Nota", unit: "decimal", group: "Geral", max: 10 },
  // Ataque
  { key: "goals", label: "Gols", short: "G", unit: "count", group: "Ataque" },
  { key: "assists", label: "Assistências", short: "A", unit: "count", group: "Ataque" },
  { key: "shots", label: "Finalizações", short: "Fin", unit: "count", group: "Ataque" },
  { key: "shots_on_target", label: "Finalizações no Alvo", short: "FnA", unit: "count", group: "Ataque" },
  { key: "xg", label: "Gols Esperados (xG)", short: "xG", unit: "decimal", group: "Ataque" },
  { key: "xg_per_shot", label: "xG por Finalização", short: "xG/Fin", unit: "decimal", group: "Ataque", max: 1 },
  { key: "dribbles_completed", label: "Dribles Certos", short: "Dri", unit: "count", group: "Ataque" },
  { key: "key_passes", label: "Passes Decisivos", short: "PD", unit: "count", group: "Ataque" },
  // Passe
  { key: "passes", label: "Passes Certos", short: "PC", unit: "count", group: "Passe" },
  { key: "pass_accuracy", label: "Precisão de Passe", short: "%P", unit: "percent", group: "Passe", max: 100 },
  { key: "progressive_passes", label: "Passes Progressivos", short: "PP", unit: "count", group: "Passe" },
  { key: "long_balls_accurate", label: "Bolas Longas Certas", short: "BL", unit: "count", group: "Passe" },
  { key: "crosses_accurate", label: "Cruzamentos Certos", short: "Cru", unit: "count", group: "Passe" },
  // Defesa
  { key: "tackles", label: "Desarmes", short: "Des", unit: "count", group: "Defesa" },
  { key: "padj_tackles", label: "Desarmes PAdj (Posse)", short: "Des PAdj", unit: "decimal", group: "Defesa" },
  { key: "interceptions", label: "Interceptações", short: "Int", unit: "count", group: "Defesa" },
  { key: "padj_interceptions", label: "Interceptações PAdj", short: "Int PAdj", unit: "decimal", group: "Defesa" },
  { key: "clearances", label: "Cortes", short: "Cor", unit: "count", group: "Defesa" },
  { key: "aerial_duels_won", label: "Duelos Aéreos Ganhos", short: "DA", unit: "count", group: "Defesa" },
  { key: "ground_duels_won", label: "Duelos no Chão Ganhos", short: "DC", unit: "count", group: "Defesa" },
  { key: "recoveries", label: "Recuperações", short: "Rec", unit: "count", group: "Defesa" },
  { key: "blocks", label: "Bloqueios", short: "Blq", unit: "count", group: "Defesa" },
  { key: "fouls_committed", label: "Faltas Cometidas", short: "FC", unit: "count", group: "Defesa" },
  // Goleiro
  { key: "saves", label: "Defesas", short: "Def", unit: "count", group: "Goleiro" },
  { key: "saves_inside_box", label: "Defesas Dentro da Área", short: "DDA", unit: "count", group: "Goleiro" },
  { key: "goals_conceded", label: "Gols Sofridos", short: "GS", unit: "count", group: "Goleiro" },
  { key: "high_claims", label: "Saídas do Gol", short: "SG", unit: "count", group: "Goleiro" },
];

export const METRIC_BY_KEY: Record<string, MetricDef> = Object.fromEntries(
  METRICS.map((m) => [m.key, m])
);

export const METRIC_GROUPS: MetricGroup[] = ["Geral", "Ataque", "Passe", "Defesa", "Goleiro"];

// ─── Presets por posição ─────────────────────────────────────────────────────

const GK = ["rating", "saves", "saves_inside_box", "goals_conceded", "high_claims", "pass_accuracy", "long_balls_accurate"];
const CB = ["rating", "aerial_duels_won", "interceptions", "clearances", "tackles", "blocks", "recoveries", "pass_accuracy", "long_balls_accurate"];
const FB = ["rating", "tackles", "interceptions", "crosses_accurate", "key_passes", "dribbles_completed", "recoveries", "pass_accuracy"];
const DM = ["rating", "tackles", "interceptions", "recoveries", "ground_duels_won", "passes", "pass_accuracy", "progressive_passes"];
const CM = ["rating", "passes", "pass_accuracy", "progressive_passes", "key_passes", "recoveries", "tackles", "shots"];
const AM = ["rating", "goals", "assists", "key_passes", "shots", "xg", "dribbles_completed", "pass_accuracy"];
const WG = ["rating", "goals", "assists", "dribbles_completed", "crosses_accurate", "key_passes", "shots", "xg"];
const ST = ["rating", "goals", "shots", "shots_on_target", "xg", "assists", "aerial_duels_won", "key_passes"];

export const POSITION_PRESETS: Record<Position, string[]> = {
  GOALKEEPER: GK,
  CENTER_BACK: CB,
  RIGHT_BACK: FB,
  LEFT_BACK: FB,
  DEFENSIVE_MID: DM,
  CENTRAL_MID: CM,
  ATTACKING_MID: AM,
  RIGHT_WING: WG,
  LEFT_WING: WG,
  STRIKER: ST,
  FORWARD: ST,
};

// ─── Formatting ──────────────────────────────────────────────────────────────

export type MetricData = Record<string, number>;

export function metricLabel(key: string) {
  return METRIC_BY_KEY[key]?.label ?? key;
}

export function formatMetric(key: string, value: number) {
  const def = METRIC_BY_KEY[key];
  if (def?.unit === "percent") return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  if (def?.unit === "decimal") return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  return value.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

/** Orders keys: preset order first, then catalog order, then custom keys. */
export function sortMetricKeys(keys: string[], preset: string[] = []) {
  const rank = (k: string) => {
    const p = preset.indexOf(k);
    if (p >= 0) return p;
    const c = METRICS.findIndex((m) => m.key === k);
    return c >= 0 ? 100 + c : 1000;
  };
  return [...keys].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
}

// ─── Sources & matches ───────────────────────────────────────────────────────

export const SOURCE_LABELS: Record<MetricSource, string> = {
  MANUAL: "Manual",
  WYSCOUT: "Wyscout",
  SOFASCORE: "SofaScore",
  SPORTSBASE: "Sportsbase",
  OTHER: "Outra",
};

export const SOURCE_STYLES: Record<MetricSource, string> = {
  MANUAL: "bg-primary/15 text-primary ring-primary/30",
  WYSCOUT: "bg-sky-400/15 text-sky-300 ring-sky-400/30",
  SOFASCORE: "bg-emerald-400/15 text-emerald-300 ring-emerald-400/30",
  SPORTSBASE: "bg-amber-400/15 text-amber-300 ring-amber-400/30",
  OTHER: "bg-zinc-400/15 text-zinc-300 ring-zinc-400/30",
};

export const VENUE_LABELS: Record<MatchVenue, string> = {
  HOME: "Casa",
  AWAY: "Fora",
  NEUTRAL: "Neutro",
};

export type MatchOutcome = "W" | "D" | "L" | null;

export function matchOutcome(goalsFor: number | null, goalsAgainst: number | null): MatchOutcome {
  if (goalsFor == null || goalsAgainst == null) return null;
  if (goalsFor > goalsAgainst) return "W";
  if (goalsFor < goalsAgainst) return "L";
  return "D";
}

export const OUTCOME_LABELS: Record<Exclude<MatchOutcome, null>, string> = { W: "V", D: "E", L: "D" };
export const OUTCOME_STYLES: Record<Exclude<MatchOutcome, null>, string> = {
  W: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  D: "bg-zinc-400/15 text-zinc-300 ring-zinc-400/30",
  L: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
};

/** Match dates are stored at 12:00 UTC to be timezone-safe; always format in UTC. */
export function formatMatchDate(date: Date | string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC", ...opts });
}

export function toDateInput(date: Date | string) {
  return new Date(date).toISOString().slice(0, 10);
}
