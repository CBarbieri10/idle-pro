// Spreadsheet import — pure, isomorphic helpers (client + server, no I/O).
//
// Pipeline (ADR-003):
//   file → string[][] grid → header row detection → column mapping (De-Para)
//   → StagedRow[] (typed + validated per row) → server resolution → commit.
//
// Unknown numeric columns are preserved verbatim as raw keys (ADR-002: no data
// is lost on import); unknown non-numeric columns are ignored by default.

import { METRICS, METRIC_BY_KEY, type MetricData } from "@/lib/metrics";
import type { MatchVenue } from "@prisma/client";

export type Cell = string | number | boolean | Date | null | undefined;
export type Grid = Cell[][];

// ─── Column targets ──────────────────────────────────────────────────────────

export const IDENTITY_FIELDS = {
  date: "Data do jogo",
  athlete: "Atleta",
  team: "Clube",
  opponent: "Adversário",
  competition: "Competição",
  round: "Rodada / Fase",
  venue: "Mando",
  score: "Placar (ex: 2-1)",
  goalsFor: "Gols pró",
  goalsAgainst: "Gols contra",
  minutes: "Minutos jogados",
} as const;

export type IdentityField = keyof typeof IDENTITY_FIELDS;

/**
 * Where a spreadsheet column goes:
 *  - an identity field (`date`, `athlete`, ...)
 *  - `metric:<catalogKey>` → canonical-vocabulary key in the JSONB
 *  - `raw` → kept in the JSONB under the original header text
 *  - `ignore`
 */
export type ColumnTarget = IdentityField | `metric:${string}` | "raw" | "ignore";

export function targetLabel(t: ColumnTarget): string {
  if (t === "raw") return "Manter como bruta";
  if (t === "ignore") return "Ignorar";
  if (t.startsWith("metric:")) return METRIC_BY_KEY[t.slice(7)]?.label ?? t.slice(7);
  return IDENTITY_FIELDS[t as IdentityField];
}

/** Lowercase, strip accents and punctuation. "%" becomes "pct" so "Passes %" ≠ "Passes". */
export function normalizeHeader(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/%/g, "pct")
    .replace(/[^a-z0-9]/g, "");
}

/** Accent/case/whitespace-insensitive key for matching people and team names. */
export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const IDENTITY_ALIASES: Record<IdentityField, string[]> = {
  date: ["data", "date", "matchdate", "datadojogo", "datajogo", "dia", "gamedate"],
  athlete: ["atleta", "jogador", "player", "playername", "nome", "name", "nomedoatleta", "jogadora"],
  team: ["clube", "time", "team", "equipe", "club", "squad"],
  opponent: ["adversario", "opponent", "oponente", "vs", "contra", "against", "rival"],
  competition: ["competicao", "competition", "campeonato", "torneio", "tournament", "liga", "league"],
  round: ["rodada", "round", "fase", "matchday", "jornada", "stage"],
  venue: ["mando", "venue", "local", "homeaway", "casafora", "ha"],
  score: ["placar", "resultado", "score", "result", "finalscore"],
  goalsFor: ["golspro", "gf", "goalsfor", "golsmarcados"],
  goalsAgainst: ["golscontra", "ga", "goalsagainst"],
  minutes: ["minutos", "min", "mins", "minutes", "minutosjogados", "minutesplayed", "minjogados"],
};

const METRIC_ALIASES: Record<string, string[]> = {
  rating: ["rating", "nota", "sofascorerating", "avaliacao", "notamedia"],
  goals: ["goals", "gols", "gol", "golos"],
  assists: ["assists", "ast", "assistencias", "assist", "assistencia"],
  shots: ["shots", "totalshots", "finalizacoes", "chutes", "remates", "shotstotal"],
  shots_on_target: ["shotsontarget", "sot", "ontarget", "finalizacoesnoalvo", "finalizacoescertas", "chutesnoalvo", "chutesnogol"],
  xg: ["xg", "expectedgoals", "golsesperados"],
  dribbles_completed: ["dribbles", "successfuldribbles", "dribblescompleted", "driblescertos", "dribles", "driblesbemsucedidos"],
  key_passes: ["keypasses", "kp", "passesdecisivos", "passeschave"],
  passes: ["passes", "accuratepasses", "passescertos", "passescompleted", "passescompletos"],
  pass_accuracy: ["passaccuracy", "passpct", "passespct", "accuratepassespct", "precisaodepasse", "precisaodepasses", "passescertospct"],
  progressive_passes: ["progressivepasses", "passesprogressivos"],
  long_balls_accurate: ["accuratelongballs", "longballs", "bolaslongascertas", "bolaslongas", "lancamentoscertos"],
  crosses_accurate: ["accuratecrosses", "crosses", "cruzamentoscertos", "cruzamentos"],
  tackles: ["tackles", "tackleswon", "desarmes"],
  interceptions: ["interceptions", "interceptacoes", "int"],
  clearances: ["clearances", "cortes", "afastamentos"],
  aerial_duels_won: ["aerialduelswon", "aerialswon", "aerialduels", "duelosaereosganhos", "duelosaereos"],
  ground_duels_won: ["groundduelswon", "groundduels", "duelosnochaoganhos", "duelosnochao"],
  recoveries: ["recoveries", "ballrecoveries", "recuperacoes", "recuperacoesdebola", "recuperacoesdeposse"],
  blocks: ["blocks", "blockedshots", "bloqueios"],
  fouls_committed: ["fouls", "foulscommitted", "faltascometidas", "faltas"],
  saves: ["saves", "defesas"],
  saves_inside_box: ["savesinsidebox", "savesfrominsidebox", "defesasdentrodaarea"],
  goals_conceded: ["goalsconceded", "golssofridos"],
  high_claims: ["highclaims", "saidasdogol", "saidas"],
};

/** normalized alias → target. Identity aliases win over metric aliases. */
const ALIAS_INDEX: Map<string, ColumnTarget> = (() => {
  const idx = new Map<string, ColumnTarget>();
  const put = (alias: string, t: ColumnTarget) => {
    const k = normalizeHeader(alias);
    if (k && !idx.has(k)) idx.set(k, t);
  };
  for (const [field, aliases] of Object.entries(IDENTITY_ALIASES)) {
    for (const a of aliases) put(a, field as IdentityField);
  }
  for (const [key, aliases] of Object.entries(METRIC_ALIASES)) {
    for (const a of aliases) put(a, `metric:${key}`);
  }
  // Catalog keys / labels / short codes from the manual-entry vocabulary.
  for (const m of METRICS) {
    put(m.key, `metric:${m.key}`);
    put(m.label, `metric:${m.key}`);
  }
  for (const m of METRICS) put(m.short, `metric:${m.key}`);
  return idx;
})();

export function guessTarget(header: string, sample: Cell[] = []): ColumnTarget {
  const norm = normalizeHeader(header);
  if (!norm) return "ignore";
  const hit = ALIAS_INDEX.get(norm);
  if (hit) return hit;
  const filled = sample.filter((v) => v !== null && v !== undefined && String(v).trim() !== "");
  if (filled.length === 0) return "ignore";
  const numeric = filled.filter((v) => {
    const p = parseNumber(v);
    return p.ok && p.value !== null;
  }).length;
  return numeric / filled.length >= 0.8 ? "raw" : "ignore";
}

export interface ColumnMapping {
  index: number;
  header: string;
  target: ColumnTarget;
}

// ─── Grid helpers ────────────────────────────────────────────────────────────

const isBlank = (v: Cell) => v === null || v === undefined || String(v).trim() === "";

/** First row (within the first 20) with ≥ 2 non-empty text cells is the header. */
export function detectHeaderRow(grid: Grid): number {
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const textCells = (grid[i] ?? []).filter((c) => !isBlank(c) && typeof c === "string");
    if (textCells.length >= 2) return i;
  }
  return 0;
}

export function autoMap(grid: Grid, headerRow: number): ColumnMapping[] {
  const header = grid[headerRow] ?? [];
  const body = grid.slice(headerRow + 1, headerRow + 51);
  const width = Math.max(header.length, ...body.map((r) => r.length), 0);
  const seen = new Set<ColumnTarget>();
  const out: ColumnMapping[] = [];
  for (let i = 0; i < width; i++) {
    const h = isBlank(header[i]) ? "" : String(header[i]).trim();
    let target = guessTarget(h, body.map((r) => r[i]));
    // Only one column per identity/catalog target; extra ones are kept raw.
    if (target !== "raw" && target !== "ignore") {
      if (seen.has(target)) target = "raw";
      else seen.add(target);
    }
    out.push({ index: i, header: h || `Coluna ${i + 1}`, target });
  }
  return out;
}

export function applyTemplateToGrid(
  grid: Grid,
  headerRow: number,
  templateColumns: Record<string, { header: string; target: ColumnTarget }>
): ColumnMapping[] {
  const header = grid[headerRow] ?? [];
  const body = grid.slice(headerRow + 1, headerRow + 51);
  const width = Math.max(header.length, ...body.map((r) => r.length), 0);
  const out: ColumnMapping[] = [];

  for (let i = 0; i < width; i++) {
    const h = isBlank(header[i]) ? "" : String(header[i]).trim();
    const norm = normalizeHeader(h);
    const matched = templateColumns[norm];

    let target: ColumnTarget;
    if (matched) {
      target = matched.target;
    } else {
      target = guessTarget(h, body.map((r) => r[i]));
    }

    out.push({ index: i, header: h || `Coluna ${i + 1}`, target });
  }

  return out;
}

// ─── Value parsers ───────────────────────────────────────────────────────────

type Parsed<T> = { ok: true; value: T | null } | { ok: false };

export function parseNumber(v: Cell): Parsed<number> {
  if (v === null || v === undefined) return { ok: true, value: null };
  if (typeof v === "number") return Number.isFinite(v) ? { ok: true, value: v } : { ok: false };
  if (typeof v === "boolean" || v instanceof Date) return { ok: false };
  let s = v.trim().replace(/\s/g, "").replace(/%$/, "");
  if (s === "" || s === "-" || s === "—" || s === "–") return { ok: true, value: null };
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Both separators: the last one is the decimal mark.
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma > -1) {
    s = s.replace(",", ".");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return { ok: false };
  return { ok: true, value: Number(s) };
}

const pad = (n: number) => String(n).padStart(2, "0");

function isoIfValid(y: number, m: number, d: number): string | null {
  if (y < 100) y += 2000;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  if (y < 1950 || y > 2100) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}

/** Returns a calendar date as "YYYY-MM-DD". Day-first for ambiguous strings (pt-BR). */
export function parseDate(v: Cell): Parsed<string> {
  if (isBlank(v)) return { ok: true, value: null };
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return { ok: false };
    return { ok: true, value: `${v.getFullYear()}-${pad(v.getMonth() + 1)}-${pad(v.getDate())}` };
  }
  if (typeof v === "number") {
    // Excel serial date (days since 1899-12-30).
    if (v < 18000 || v > 80000) return { ok: false };
    const dt = new Date(Math.round((Math.floor(v) - 25569) * 86400000));
    return { ok: true, value: dt.toISOString().slice(0, 10) };
  }
  const s = String(v).trim().split(/[ T]/)[0];
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) {
    const iso = isoIfValid(+m[1], +m[2], +m[3]);
    return iso ? { ok: true, value: iso } : { ok: false };
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})$/);
  if (m) {
    const iso = isoIfValid(+m[3], +m[2], +m[1]);
    return iso ? { ok: true, value: iso } : { ok: false };
  }
  if (/^\d{5}$/.test(s)) return parseDate(Number(s));
  return { ok: false };
}

export function parseVenue(v: Cell): Parsed<MatchVenue> {
  if (isBlank(v)) return { ok: true, value: null };
  const s = normalizeHeader(String(v));
  if (["casa", "home", "h", "c", "mandante", "emcasa"].includes(s)) return { ok: true, value: "HOME" };
  if (["fora", "away", "a", "f", "visitante", "foradecasa"].includes(s)) return { ok: true, value: "AWAY" };
  if (["neutro", "neutral", "n"].includes(s)) return { ok: true, value: "NEUTRAL" };
  return { ok: false };
}

export function parseScore(v: Cell): Parsed<{ goalsFor: number; goalsAgainst: number }> {
  if (isBlank(v)) return { ok: true, value: null };
  const m = String(v).trim().match(/^(\d{1,2})\s*[-x×:]\s*(\d{1,2})$/i);
  if (!m) return { ok: false };
  return { ok: true, value: { goalsFor: +m[1], goalsAgainst: +m[2] } };
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

/** Sniffs `;`, `,` or tab from the first non-empty line (outside quotes). */
export function detectDelimiter(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.trim()) ?? "";
  const counts: Record<string, number> = { ";": 0, ",": 0, "\t": 0 };
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (!q && ch in counts) counts[ch]++;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][1] > 0
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : ",";
}

/** RFC 4180-ish CSV parser (quoted fields, escaped quotes, CRLF). Cells stay strings. */
export function parseCsv(text: string, delimiter = detectDelimiter(text)): Grid {
  const src = text.replace(/^\uFEFF/, "");
  const rows: Grid = [];
  let row: Cell[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (q) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else q = false;
      } else field += ch;
    } else if (ch === '"' && field === "") q = true;
    else if (ch === delimiter) { row.push(field); field = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field); rows.push(row); row = []; field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => !isBlank(c)));
}

// ─── Staging ─────────────────────────────────────────────────────────────────

export interface StagedRow {
  /** 1-based spreadsheet line number (for user-facing messages). */
  line: number;
  date: string | null;
  athleteName: string;
  teamName: string | null;
  opponentName: string;
  competition: string;
  round: string | null;
  venue: MatchVenue;
  goalsFor: number | null;
  goalsAgainst: number | null;
  minutesPlayed: number | null;
  data: MetricData;
  errors: string[];
}

export interface StagingOptions {
  defaultCompetition?: string;
}

const text = (v: Cell) => (isBlank(v) ? "" : String(v).trim());

export function buildStagedRows(
  grid: Grid,
  headerRow: number,
  mapping: ColumnMapping[],
  opts: StagingOptions = {}
): StagedRow[] {
  const col = (field: IdentityField) => mapping.find((m) => m.target === field)?.index;
  const idx = {
    date: col("date"), athlete: col("athlete"), team: col("team"), opponent: col("opponent"),
    competition: col("competition"), round: col("round"), venue: col("venue"), score: col("score"),
    goalsFor: col("goalsFor"), goalsAgainst: col("goalsAgainst"), minutes: col("minutes"),
  };
  const metricCols = mapping.filter((m) => m.target === "raw" || m.target.startsWith("metric:"));
  const get = (r: Cell[], i: number | undefined) => (i === undefined ? undefined : r[i]);

  const out: StagedRow[] = [];
  grid.slice(headerRow + 1).forEach((r, offset) => {
    if (!r.some((c) => !isBlank(c))) return;
    const errors: string[] = [];

    const date = parseDate(get(r, idx.date));
    if (!date.ok) errors.push(`Data inválida: "${text(get(r, idx.date))}"`);
    else if (!date.value) errors.push("Data do jogo ausente");

    const athleteName = text(get(r, idx.athlete));
    if (!athleteName) errors.push("Nome do atleta ausente");

    const opponentName = text(get(r, idx.opponent));
    if (!opponentName) errors.push("Adversário ausente");

    const competition = text(get(r, idx.competition)) || opts.defaultCompetition?.trim() || "";
    if (!competition) errors.push("Competição ausente");

    const venue = parseVenue(get(r, idx.venue));
    if (!venue.ok) errors.push(`Mando inválido: "${text(get(r, idx.venue))}"`);

    let goalsFor: number | null = null;
    let goalsAgainst: number | null = null;
    const score = parseScore(get(r, idx.score));
    if (!score.ok) errors.push(`Placar inválido: "${text(get(r, idx.score))}"`);
    else if (score.value) ({ goalsFor, goalsAgainst } = score.value);
    for (const [field, label] of [["goalsFor", "Gols pró"], ["goalsAgainst", "Gols contra"]] as const) {
      const p = parseNumber(get(r, idx[field]));
      if (!p.ok || (p.value !== null && (!Number.isInteger(p.value) || p.value < 0))) {
        errors.push(`${label} inválido`);
      } else if (p.value !== null) {
        if (field === "goalsFor") goalsFor = p.value;
        else goalsAgainst = p.value;
      }
    }

    const min = parseNumber(get(r, idx.minutes));
    let minutesPlayed: number | null = null;
    if (!min.ok) errors.push(`Minutos inválidos: "${text(get(r, idx.minutes))}"`);
    else if (min.value !== null) {
      if (min.value < 0 || min.value > 130) errors.push("Minutos devem estar entre 0 e 130");
      else minutesPlayed = Math.round(min.value);
    }

    const data: MetricData = {};
    for (const m of metricCols) {
      const raw = r[m.index];
      const p = parseNumber(raw);
      const key = m.target === "raw" ? m.header : m.target.slice(7);
      if (!p.ok) {
        errors.push(`"${m.header}": valor inválido "${text(raw)}"`);
        continue;
      }
      if (p.value === null) continue;
      const max = METRIC_BY_KEY[key]?.max;
      if (p.value < 0 && m.target !== "raw") errors.push(`"${m.header}" não pode ser negativo`);
      else if (max !== undefined && p.value > max) errors.push(`"${m.header}" acima do máximo (${max})`);
      else data[key] = p.value;
    }
    if (Object.keys(data).length === 0 && errors.length === 0) errors.push("Nenhuma métrica preenchida");

    out.push({
      line: headerRow + offset + 2,
      date: date.ok ? date.value : null,
      athleteName,
      teamName: text(get(r, idx.team)) || null,
      opponentName,
      competition,
      round: text(get(r, idx.round)) || null,
      venue: (venue.ok && venue.value) || "HOME",
      goalsFor,
      goalsAgainst,
      minutesPlayed,
      data,
      errors,
    });
  });
  return out;
}

// ─── Template ────────────────────────────────────────────────────────────────

export const TEMPLATE_HEADERS = [
  "Data", "Atleta", "Clube", "Adversário", "Competição", "Rodada", "Mando", "Placar", "Minutos",
  "Nota", "Gols", "Assistências", "Finalizações", "Finalizações no Alvo", "xG",
  "Passes Certos", "Precisão de Passe", "Passes Decisivos", "Desarmes", "Interceptações",
  "Duelos Aéreos Ganhos", "Recuperações",
];

export const TEMPLATE_EXAMPLE = [
  "28/09/2026", "Nome do Atleta", "Clube Cadastrado", "Adversário FC", "Brasileirão Série A", "Rodada 27", "Casa", "2-1", "90",
  "7,4", "1", "0", "3", "2", "0,45", "31", "86", "2", "2", "1", "3", "5",
];

export function templateCsv(): string {
  const esc = (s: string) => (/[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return "\uFEFF" + [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE].map((r) => r.map(esc).join(";")).join("\r\n") + "\r\n";
}
