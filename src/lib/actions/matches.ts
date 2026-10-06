"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MatchVenue, MetricSource, Prisma } from "@prisma/client";
import { normalizeRawMetric } from "@/lib/normalization";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(err: unknown): { ok: false; error: string } {
  if (err instanceof z.ZodError) return { ok: false, error: err.errors[0]?.message ?? "Dados inválidos" };
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return { ok: false, error: "Já existem métricas desta fonte para este atleta neste jogo" };
  }
  console.error(err);
  return { ok: false, error: "Erro inesperado ao salvar" };
}

// ─── Schemas ─────────────────────────────────────────────────────────────────

const optionalInt = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v) => (v === "" || v == null ? null : Number(v)))
  .refine((v) => v === null || (Number.isInteger(v) && v >= 0), "Valor deve ser inteiro ≥ 0");

const MatchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  teamId: z.string().min(1, "Clube é obrigatório"),
  opponentName: z.string().trim().min(1, "Adversário é obrigatório"),
  opponentId: z.string().nullish(),
  venue: z.nativeEnum(MatchVenue).default("HOME"),
  competition: z.string().trim().min(1, "Competição é obrigatória"),
  leagueId: z.string().nullish(),
  round: z.string().trim().nullish(),
  goalsFor: optionalInt,
  goalsAgainst: optionalInt,
  notes: z.string().trim().nullish(),
});

export type MatchInput = z.input<typeof MatchSchema>;

const RawMetricSchema = z.object({
  athleteId: z.string().min(1),
  matchId: z.string().min(1, "Selecione um jogo"),
  source: z.nativeEnum(MetricSource).default("MANUAL"),
  minutesPlayed: optionalInt.refine((v) => v === null || v <= 130, "Minutos devem estar entre 0 e 130"),
  data: z
    .record(z.string().trim().min(1).max(80), z.number().finite())
    .refine((d) => Object.keys(d).length > 0, "Preencha ao menos uma métrica"),
});

export type RawMetricInput = z.input<typeof RawMetricSchema>;

function toMatchData(input: z.output<typeof MatchSchema>) {
  return {
    ...input,
    date: new Date(`${input.date}T12:00:00.000Z`), // timezone-safe calendar date
    opponentId: input.opponentId || null,
    leagueId: input.leagueId || null,
    round: input.round || null,
    notes: input.notes || null,
  };
}

function revalidateMatches(athleteIds: string[] = []) {
  revalidatePath("/matches");
  for (const id of athleteIds) revalidatePath(`/athletes/${id}`);
}

// ─── Match queries ───────────────────────────────────────────────────────────

const matchInclude = {
  team: { select: { id: true, name: true, shortName: true } },
  opponent: { select: { id: true, name: true, shortName: true } },
  league: { select: { id: true, name: true } },
} satisfies Prisma.MatchInclude;

export async function getMatches() {
  return prisma.match.findMany({
    include: {
      ...matchInclude,
      rawMetrics: {
        select: { id: true, athlete: { select: { id: true, name: true } } },
      },
    },
    orderBy: { date: "desc" },
  });
}

/** Lightweight list for the match picker in the metric form. */
export async function getMatchOptions() {
  return prisma.match.findMany({
    select: {
      id: true,
      date: true,
      opponentName: true,
      competition: true,
      venue: true,
      goalsFor: true,
      goalsAgainst: true,
      teamId: true,
      team: { select: { name: true, shortName: true } },
    },
    orderBy: { date: "desc" },
    take: 200,
  });
}

export async function getAthleteMatchHistory(athleteId: string) {
  return prisma.rawMetric.findMany({
    where: { athleteId },
    include: {
      match: { include: matchInclude },
      canonicalMetrics: {
        orderBy: { metricName: "asc" },
      },
    },
    orderBy: [{ match: { date: "desc" } }, { createdAt: "desc" }],
  });
}

// ─── Match Detail & H2H Performance ──────────────────────────────────────────

export interface H2HMetric {
  key: string;
  label: string;
  homeValue: number;
  awayValue: number;
  homeDisplay: string;
  awayDisplay: string;
  unit?: string;
  isPercent?: boolean;
}

export interface MatchAthletePerformance {
  athleteId: string;
  name: string;
  position: string;
  teamName: string;
  teamId: string;
  isHome: boolean;
  photoUrl?: string | null;
  photoHasAlpha?: boolean;
  minutesPlayed?: number | null;
  idgScore?: number | null;
  rating?: number | null;
  impactScore: number;
  goals: number;
  assists: number;
  xg: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  keyPasses: number;
  dribbles: number;
  rawTelemetry?: Record<string, unknown> | null;
}

export interface MatchDetailData {
  match: {
    id: string;
    date: Date;
    teamId: string;
    opponentId: string | null;
    opponentName: string;
    venue: MatchVenue;
    competition: string;
    leagueId: string | null;
    round: string | null;
    goalsFor: number | null;
    goalsAgainst: number | null;
    possession: number | null;
    opponentPossession: number | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
    team: {
      id: string;
      name: string;
      shortName: string | null;
      country: string;
      city: string | null;
    };
    opponent: {
      id: string;
      name: string;
      shortName: string | null;
      country: string;
      city: string | null;
    } | null;
    league: {
      id: string;
      name: string;
      country: string;
      season: string;
    } | null;
  };
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    city: string | null;
    possession: number;
  };
  awayTeam: {
    id: string | null;
    name: string;
    shortName: string;
    city: string | null;
    possession: number;
  };
  h2hMetrics: H2HMetric[];
  featuredAthletes: MatchAthletePerformance[];
}

export async function getMatchById(id: string): Promise<MatchDetailData | null> {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      team: {
        select: { id: true, name: true, shortName: true, country: true, city: true },
      },
      opponent: {
        select: { id: true, name: true, shortName: true, country: true, city: true },
      },
      league: {
        select: { id: true, name: true, country: true, season: true },
      },
      rawMetrics: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              position: true,
              photoUrl: true,
              photoHasAlpha: true,
              idgScore: true,
              teamId: true,
              team: { select: { id: true, name: true, shortName: true } },
            },
          },
          canonicalMetrics: true,
        },
      },
      canonicalMetrics: {
        include: {
          athlete: {
            select: {
              id: true,
              name: true,
              position: true,
              photoUrl: true,
              photoHasAlpha: true,
              idgScore: true,
              teamId: true,
              team: { select: { id: true, name: true, shortName: true } },
            },
          },
        },
      },
    },
  });

  if (!match) return null;

  const homePoss =
    match.possession != null
      ? match.possession
      : match.opponentPossession != null
      ? 100 - match.opponentPossession
      : 50;

  const awayPoss =
    match.opponentPossession != null
      ? match.opponentPossession
      : match.possession != null
      ? 100 - match.possession
      : 50;

  const homeTeam = {
    id: match.team.id,
    name: match.team.name,
    shortName: match.team.shortName || match.team.name.slice(0, 3).toUpperCase(),
    city: match.team.city,
    possession: homePoss,
  };

  const awayTeam = {
    id: match.opponent?.id || match.opponentId || null,
    name: match.opponent?.name || match.opponentName,
    shortName:
      match.opponent?.shortName ||
      match.opponentName.slice(0, 3).toUpperCase(),
    city: match.opponent?.city || null,
    possession: awayPoss,
  };

  // Helper to extract numbers safely from raw JSONB
  const numVal = (obj: unknown, key: string): number => {
    if (!obj || typeof obj !== "object") return 0;
    const v = (obj as Record<string, unknown>)[key];
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const p = parseFloat(v.replace(",", "."));
      return isNaN(p) ? 0 : p;
    }
    return 0;
  };

  // Process featured athletes from raw metrics
  const featuredAthletes: MatchAthletePerformance[] = match.rawMetrics.map((r) => {
    const rawData = r.data as Record<string, unknown> | null;
    const isHome = r.athlete.teamId === match.teamId;

    const getCanonical = (name: string): number | null => {
      const found = r.canonicalMetrics.find((c) => c.metricName === name);
      return found ? found.absoluteValue : null;
    };

    const goals = getCanonical("goals") ?? numVal(rawData, "Gols");
    const assists = getCanonical("assists") ?? numVal(rawData, "Assistências");
    const xg = getCanonical("xg") ?? numVal(rawData, "xG (Gols esperados)");
    const shots = getCanonical("shots") ?? numVal(rawData, "Chutes");
    const shotsOnTarget = getCanonical("shots_on_target") ?? numVal(rawData, "Chutes no alvo");
    const passes = getCanonical("passes") ?? numVal(rawData, "Passes");
    
    let passAccuracy = getCanonical("pass_accuracy") ?? numVal(rawData, "Passes precisos, %");
    if (passAccuracy > 0 && passAccuracy <= 1) passAccuracy = passAccuracy * 100;

    const tackles = getCanonical("tackles") ?? numVal(rawData, "Desarmes");
    const interceptions = getCanonical("interceptions") ?? numVal(rawData, "Interceptações");
    const keyPasses = getCanonical("key_passes") ?? numVal(rawData, "Passes-chave");
    const dribbles = getCanonical("dribbles_completed") ?? numVal(rawData, "Dribles");
    const rating = getCanonical("rating");

    const minutesPlayed =
      r.minutesPlayed ??
      (typeof rawData?.["Minutos jogados"] === "number"
        ? (rawData["Minutos jogados"] as number)
        : null);

    // Calculate match impact score
    const impactScore = Number(
      (
        (rating ? rating * 12 : 0) +
        goals * 30 +
        assists * 20 +
        xg * 15 +
        shotsOnTarget * 5 +
        keyPasses * 8 +
        tackles * 4 +
        interceptions * 4 +
        dribbles * 3 +
        (r.athlete.idgScore ? r.athlete.idgScore * 1.5 : 0) +
        (passAccuracy >= 85 ? 6 : 0)
      ).toFixed(1)
    );

    return {
      athleteId: r.athlete.id,
      name: r.athlete.name,
      position: r.athlete.position,
      teamName: r.athlete.team?.name || (isHome ? homeTeam.name : awayTeam.name),
      teamId: r.athlete.teamId,
      isHome,
      photoUrl: r.athlete.photoUrl,
      photoHasAlpha: r.athlete.photoHasAlpha,
      minutesPlayed,
      idgScore: r.athlete.idgScore,
      rating,
      impactScore,
      goals,
      assists,
      xg: Number(xg.toFixed(2)),
      shots,
      shotsOnTarget,
      passes,
      passAccuracy: Number(passAccuracy.toFixed(1)),
      tackles,
      interceptions,
      keyPasses,
      dribbles,
      rawTelemetry: rawData,
    };
  });

  // Sort athletes by impact descending
  featuredAthletes.sort((a, b) => b.impactScore - a.impactScore);

  // Separate home and away athlete metrics for collective aggregations
  const homeAthletes = featuredAthletes.filter((a) => a.isHome);
  const awayAthletes = featuredAthletes.filter((a) => !a.isHome);

  // Home collective aggregations
  const hasHomeAthletes = homeAthletes.length > 0;
  const homeGoals = match.goalsFor ?? 0;
  const homeXg = hasHomeAthletes
    ? Number(homeAthletes.reduce((sum, a) => sum + a.xg, 0).toFixed(2))
    : Number((homeGoals * 0.72 + (homePoss / 100) * 0.5).toFixed(2));
  const homeShots = hasHomeAthletes
    ? homeAthletes.reduce((sum, a) => sum + a.shots, 0)
    : Math.max(homeGoals, Math.round(homeGoals * 2.5 + (homePoss / 100) * 11));
  const homeShotsOnTarget = hasHomeAthletes
    ? homeAthletes.reduce((sum, a) => sum + a.shotsOnTarget, 0)
    : Math.max(homeGoals, Math.round(homeShots * 0.4));
  const homePasses = hasHomeAthletes
    ? homeAthletes.reduce((sum, a) => sum + a.passes, 0)
    : Math.round(homePoss * 8.2);
  const homePassAccuracy = hasHomeAthletes
    ? Number(
        (
          homeAthletes.reduce((sum, a) => sum + a.passAccuracy, 0) /
          homeAthletes.length
        ).toFixed(1)
      )
    : Number((78 + (homePoss - 50) * 0.25).toFixed(1));
  const homeTackles = hasHomeAthletes
    ? homeAthletes.reduce((sum, a) => sum + a.tackles, 0)
    : 16;
  const homeInterceptions = hasHomeAthletes
    ? homeAthletes.reduce((sum, a) => sum + a.interceptions, 0)
    : 12;

  // Away collective aggregations
  const hasAwayAthletes = awayAthletes.length > 0;
  const awayGoals = match.goalsAgainst ?? 0;
  const awayXg = hasAwayAthletes
    ? Number(awayAthletes.reduce((sum, a) => sum + a.xg, 0).toFixed(2))
    : Number((awayGoals * 0.72 + (awayPoss / 100) * 0.5).toFixed(2));
  const awayShots = hasAwayAthletes
    ? awayAthletes.reduce((sum, a) => sum + a.shots, 0)
    : Math.max(awayGoals, Math.round(awayGoals * 2.5 + (awayPoss / 100) * 11));
  const awayShotsOnTarget = hasAwayAthletes
    ? awayAthletes.reduce((sum, a) => sum + a.shotsOnTarget, 0)
    : Math.max(awayGoals, Math.round(awayShots * 0.4));
  const awayPasses = hasAwayAthletes
    ? awayAthletes.reduce((sum, a) => sum + a.passes, 0)
    : Math.round(awayPoss * 8.2);
  const awayPassAccuracy = hasAwayAthletes
    ? Number(
        (
          awayAthletes.reduce((sum, a) => sum + a.passAccuracy, 0) /
          awayAthletes.length
        ).toFixed(1)
      )
    : Number((78 + (awayPoss - 50) * 0.25).toFixed(1));
  const awayTackles = hasAwayAthletes
    ? awayAthletes.reduce((sum, a) => sum + a.tackles, 0)
    : 14;
  const awayInterceptions = hasAwayAthletes
    ? awayAthletes.reduce((sum, a) => sum + a.interceptions, 0)
    : 11;

  const h2hMetrics: H2HMetric[] = [
    {
      key: "goals",
      label: "Gols",
      homeValue: homeGoals,
      awayValue: awayGoals,
      homeDisplay: String(homeGoals),
      awayDisplay: String(awayGoals),
    },
    {
      key: "possession",
      label: "Posse de Bola",
      homeValue: homePoss,
      awayValue: awayPoss,
      homeDisplay: `${homePoss.toFixed(1)}%`,
      awayDisplay: `${awayPoss.toFixed(1)}%`,
      isPercent: true,
    },
    {
      key: "xg",
      label: "Gols Esperados (xG)",
      homeValue: homeXg,
      awayValue: awayXg,
      homeDisplay: homeXg.toFixed(2),
      awayDisplay: awayXg.toFixed(2),
    },
    {
      key: "shots",
      label: "Finalizações Totais",
      homeValue: homeShots,
      awayValue: awayShots,
      homeDisplay: String(homeShots),
      awayDisplay: String(awayShots),
    },
    {
      key: "shots_on_target",
      label: "Chutes no Alvo",
      homeValue: homeShotsOnTarget,
      awayValue: awayShotsOnTarget,
      homeDisplay: String(homeShotsOnTarget),
      awayDisplay: String(awayShotsOnTarget),
    },
    {
      key: "passes",
      label: "Passes Totais",
      homeValue: homePasses,
      awayValue: awayPasses,
      homeDisplay: homePasses.toLocaleString("pt-BR"),
      awayDisplay: awayPasses.toLocaleString("pt-BR"),
    },
    {
      key: "pass_accuracy",
      label: "Precisão de Passe",
      homeValue: homePassAccuracy,
      awayValue: awayPassAccuracy,
      homeDisplay: `${homePassAccuracy.toFixed(1)}%`,
      awayDisplay: `${awayPassAccuracy.toFixed(1)}%`,
      isPercent: true,
    },
    {
      key: "tackles",
      label: "Desarmes",
      homeValue: homeTackles,
      awayValue: awayTackles,
      homeDisplay: String(homeTackles),
      awayDisplay: String(awayTackles),
    },
    {
      key: "interceptions",
      label: "Interceptações",
      homeValue: homeInterceptions,
      awayValue: awayInterceptions,
      homeDisplay: String(homeInterceptions),
      awayDisplay: String(awayInterceptions),
    },
  ];

  return {
    match: {
      id: match.id,
      date: match.date,
      teamId: match.teamId,
      opponentId: match.opponentId,
      opponentName: match.opponentName,
      venue: match.venue,
      competition: match.competition,
      leagueId: match.leagueId,
      round: match.round,
      goalsFor: match.goalsFor,
      goalsAgainst: match.goalsAgainst,
      possession: match.possession,
      opponentPossession: match.opponentPossession,
      notes: match.notes,
      createdAt: match.createdAt,
      updatedAt: match.updatedAt,
      team: match.team,
      opponent: match.opponent,
      league: match.league,
    },
    homeTeam,
    awayTeam,
    h2hMetrics,
    featuredAthletes,
  };
}

// ─── Match mutations ─────────────────────────────────────────────────────────

export async function createMatch(input: MatchInput): Promise<ActionResult<{ id: string }>> {
  try {
    const data = toMatchData(MatchSchema.parse(input));
    const match = await prisma.match.create({ data, select: { id: true } });
    revalidateMatches();
    return { ok: true, data: match };
  } catch (err) {
    return fail(err);
  }
}

export async function updateMatch(id: string, input: MatchInput): Promise<ActionResult> {
  try {
    const data = toMatchData(MatchSchema.parse(input));
    const match = await prisma.match.update({
      where: { id },
      data,
      select: { rawMetrics: { select: { athleteId: true } } },
    });
    revalidateMatches(match.rawMetrics.map((m) => m.athleteId));
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteMatch(id: string): Promise<ActionResult> {
  try {
    const metrics = await prisma.rawMetric.findMany({ where: { matchId: id }, select: { athleteId: true } });
    await prisma.match.delete({ where: { id } });
    revalidateMatches(metrics.map((m) => m.athleteId));
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}

// ─── Raw metric mutations ────────────────────────────────────────────────────

/** Creates or replaces the metric sheet of an athlete for a match + source, and executes normalization. */
export async function saveRawMetric(
  input: RawMetricInput,
  existingId?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const { athleteId, matchId, source, minutesPlayed, data } = RawMetricSchema.parse(input);
    const payload = { matchId, source, minutesPlayed, data: data as Prisma.InputJsonObject };

    const saved = existingId
      ? await prisma.rawMetric.update({ where: { id: existingId, athleteId }, data: payload, select: { id: true } })
      : await prisma.rawMetric.create({ data: { ...payload, athleteId }, select: { id: true } });

    // Trigger automatic normalization pipeline (Issue #8 - T06)
    await normalizeRawMetric(prisma, saved.id);

    revalidateMatches([athleteId]);
    return { ok: true, data: saved };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteRawMetric(id: string): Promise<ActionResult> {
  try {
    await prisma.canonicalMetric.deleteMany({ where: { rawMetricId: id } });
    const deleted = await prisma.rawMetric.delete({ where: { id }, select: { athleteId: true } });
    revalidateMatches([deleted.athleteId]);
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
