"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MatchVenue, MetricSource, Prisma } from "@prisma/client";

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
    include: { match: { include: matchInclude } },
    orderBy: [{ match: { date: "desc" } }, { createdAt: "desc" }],
  });
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

/** Creates or replaces the metric sheet of an athlete for a match + source. */
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

    revalidateMatches([athleteId]);
    return { ok: true, data: saved };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteRawMetric(id: string): Promise<ActionResult> {
  try {
    const deleted = await prisma.rawMetric.delete({ where: { id }, select: { athleteId: true } });
    revalidateMatches([deleted.athleteId]);
    return { ok: true, data: undefined };
  } catch (err) {
    return fail(err);
  }
}
