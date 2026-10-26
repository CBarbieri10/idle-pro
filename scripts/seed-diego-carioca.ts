/**
 * Seed do atleta Diego Carioca (Al-Kahraba Club) a partir do export Wyscout.
 *
 * - Cria/atualiza Liga, Clube e Atleta (dados cadastrais confirmados pelo analista).
 * - Cria uma Match por jogo e uma RawMetric (ADR-002) por jogo, com chaves canônicas.
 * - Gera as CanonicalMetric (absoluto + per90) via normalizeRawMetric.
 * - Idempotente: pode ser executado múltiplas vezes sem duplicar registros.
 *
 * Execução: npm run db:diego [caminho-opcional-do-xlsx]
 */

import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import { FootPreference, MatchVenue, MetricSource, Position, Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";
import { normalizeRawMetric } from "../src/lib/normalization";

const DEFAULT_XLSX = path.resolve(process.cwd(), "data", "wyscout", "Player stats Diego Carioca.xlsx");

const CLUB_NAME = "Al-Kahraba Club";
const CLUB_ALIASES = ["al kahrabaa", "al-kahraba", "al kahraba"];
const LEAGUE_NAME = "Iraqi League";
const SEASON = "2026/2027";

const ATHLETE = {
  name: "Diego Silva Nascimento Santos",
  position: Position.FORWARD,
  birthDate: new Date(Date.UTC(1998, 1, 6, 12, 0, 0)),
  nationality: "Brasil",
  height: 180,
  footPreference: FootPreference.RIGHT,
  isRegistered: true,
  notes:
    "Atleta monitorado • Diego Carioca. Atacante brasileiro no Al-Kahraba Club (Iraque). " +
    "Dados importados do Wyscout (Iraqi League 2026/27). Funções observadas: CF, LWF, LW, AMF.",
} as const;

// ─── Leitura da planilha (cabeçalhos duplicados "x/y" → índices fixos validados) ─────────────

/** Mapa índice-da-coluna → cabeçalho esperado. Falha cedo se o layout do Wyscout mudar. */
const COLUMN_CHECKS: Record<number, string> = {
  0: "Jogo",
  2: "Date",
  3: "Posição",
  4: "Minutos jogados",
  7: "Golos",
  8: "Assistências",
  11: "xG",
  24: "Intercepções",
  29: "Cartão amarelo",
  30: "Cartão vermelho",
  36: "xA",
};

function num(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(",", ".").replace("-", "").trim());
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function pct(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 1000) / 10 : 0;
}

interface ParsedGame {
  title: string;
  competition: string;
  date: Date;
  positions: string;
  minutes: number;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  data: Record<string, number>;
}

function parseGame(row: unknown[]): ParsedGame {
  const title = String(row[0] ?? "").trim();
  const m = title.match(/^(.+?)\s+-\s+(.+?)\s+(\d+):(\d+)$/);
  if (!m) throw new Error(`Título de jogo inválido: "${title}"`);

  const date = new Date(`${String(row[2]).slice(0, 10)}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Data inválida em "${title}": ${String(row[2])}`);

  const n = (i: number) => num(row[i]);

  const passesAtt = n(12);
  const passesOk = n(13);
  const duels = n(20);
  const duelsWon = n(21);
  const yellowMinute = n(29);
  const redMinute = n(30);

  const data: Record<string, number> = {
    actions_total: n(5),
    actions_successful: n(6),
    goals: n(7),
    assists: n(8),
    shots: n(9),
    shots_on_target: n(10),
    xg: n(11),
    passes_attempted: passesAtt,
    passes: passesOk,
    pass_accuracy: pct(passesOk, passesAtt),
    long_balls_accurate: n(15),
    crosses: n(16),
    crosses_accurate: n(17),
    dribbles_attempted: n(18),
    dribbles_completed: n(19),
    duels,
    duels_won: duelsWon,
    duels_won_pct: pct(duelsWon, duels),
    aerial_duels: n(22),
    aerial_duels_won: n(23),
    interceptions: n(24),
    losses: n(25),
    losses_own_half: n(26),
    recoveries: n(27),
    recoveries_opponent_half: n(28),
    // O Wyscout exporta o MINUTO do cartão; o app conta ocorrências.
    yellow_cards: yellowMinute > 0 ? 1 : 0,
    red_cards: redMinute > 0 ? 1 : 0,
    key_passes: n(31), // assistências para remate
    offensive_duels: n(32),
    offensive_duels_won: n(33),
    through_passes_accurate: n(35),
    xa: n(36),
    passes_final_third_accurate: n(38),
    passes_penalty_area_accurate: n(40),
  };
  if (yellowMinute > 0) data.yellow_card_minute = yellowMinute;
  if (redMinute > 0) data.red_card_minute = redMinute;

  return {
    title,
    competition: String(row[1] ?? "").replace(/^Iraq\.\s*/i, "").trim() || LEAGUE_NAME,
    date,
    positions: String(row[3] ?? "").trim(),
    minutes: n(4),
    homeTeam: m[1].trim(),
    awayTeam: m[2].trim(),
    homeGoals: parseInt(m[3], 10),
    awayGoals: parseInt(m[4], 10),
    data,
  };
}

function isClub(name: string): boolean {
  const norm = name.toLowerCase().trim();
  return CLUB_ALIASES.some((a) => norm === a);
}

function readGames(file: string): ParsedGame[] {
  if (!fs.existsSync(file)) throw new Error(`Planilha não encontrada: ${file}`);
  const wb = XLSX.read(fs.readFileSync(file), { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  if (rows.length < 2) throw new Error("Planilha sem linhas de dados.");

  const header = rows[0];
  for (const [idx, expected] of Object.entries(COLUMN_CHECKS)) {
    const got = String(header[Number(idx)] ?? "").toLowerCase();
    if (!got.includes(expected.toLowerCase().replace(":", ""))) {
      throw new Error(`Layout inesperado: coluna ${idx} esperava "${expected}", veio "${got}".`);
    }
  }

  return rows
    .slice(1)
    .filter((r) => r[0])
    .map(parseGame)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// ─── Persistência ───────────────────────────────────────────────────────────────────────────

async function main() {
  const file = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_XLSX;
  const games = readGames(file);
  console.log(`📄 ${games.length} jogos lidos de ${file}`);

  const league =
    (await prisma.league.findFirst({ where: { name: LEAGUE_NAME, season: SEASON } })) ??
    (await prisma.league.create({ data: { name: LEAGUE_NAME, country: "Iraque", season: SEASON } }));

  const team =
    (await prisma.team.findFirst({ where: { name: CLUB_NAME } })) ??
    (await prisma.team.create({
      data: { name: CLUB_NAME, shortName: "KAH", country: "Iraque", leagueId: league.id },
    }));

  const existing = await prisma.athlete.findFirst({ where: { name: ATHLETE.name } });
  const athleteData = { ...ATHLETE, teamId: team.id };
  const athlete = existing
    ? await prisma.athlete.update({ where: { id: existing.id }, data: athleteData })
    : await prisma.athlete.create({ data: athleteData });
  console.log(`🧑 Atleta: ${athlete.name} (${athlete.id}) • ${team.name}`);

  let round = 0;
  let canonicalCount = 0;
  for (const g of games) {
    round += 1;
    const home = isClub(g.homeTeam);
    const away = isClub(g.awayTeam);
    if (!home && !away) throw new Error(`Jogo sem o clube de referência: "${g.title}"`);

    const opponentName = home ? g.awayTeam : g.homeTeam;
    const goalsFor = home ? g.homeGoals : g.awayGoals;
    const goalsAgainst = home ? g.awayGoals : g.homeGoals;

    const matchFields = {
      competition: g.competition,
      leagueId: league.id,
      round: `Jogo ${round}`,
      venue: home ? MatchVenue.HOME : MatchVenue.AWAY,
      goalsFor,
      goalsAgainst,
      notes: `Wyscout • ${g.title} • Posição: ${g.positions}`,
    };

    const found = await prisma.match.findFirst({
      where: { teamId: team.id, date: g.date, opponentName },
    });
    const match = found
      ? await prisma.match.update({ where: { id: found.id }, data: matchFields })
      : await prisma.match.create({
          data: { ...matchFields, date: g.date, teamId: team.id, opponentName },
        });

    const raw = await prisma.rawMetric.upsert({
      where: {
        matchId_athleteId_source: {
          matchId: match.id,
          athleteId: athlete.id,
          source: MetricSource.WYSCOUT,
        },
      },
      create: {
        matchId: match.id,
        athleteId: athlete.id,
        round,
        date: g.date,
        source: MetricSource.WYSCOUT,
        minutesPlayed: g.minutes,
        data: g.data as Prisma.InputJsonObject,
      },
      update: {
        round,
        date: g.date,
        minutesPlayed: g.minutes,
        data: g.data as Prisma.InputJsonObject,
      },
    });

    canonicalCount += await normalizeRawMetric(prisma, raw.id);
    console.log(
      `  ✔ ${g.date.toISOString().slice(0, 10)} ${home ? "vs" : "@"} ${opponentName} ${goalsFor}-${goalsAgainst} • ${g.minutes}' • ${g.data.goals}G ${g.data.xg}xG`
    );
  }

  const totals = games.reduce(
    (acc, g) => ({
      min: acc.min + g.minutes,
      goals: acc.goals + g.data.goals,
      xg: acc.xg + g.data.xg,
    }),
    { min: 0, goals: 0, xg: 0 }
  );
  console.log(
    `\n✅ ${games.length} jogos • ${canonicalCount} métricas canônicas • ${totals.min} min • ${totals.goals} gols • ${totals.xg.toFixed(2)} xG`
  );
}

main()
  .catch((e) => {
    console.error("❌ Falha no seed do Diego Carioca:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
