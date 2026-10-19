"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Position, FootPreference } from "@prisma/client";
import { deleteAthleteUploads } from "@/lib/uploads";

// ─── Schema ─────────────────────────────────────────────────────────────────

const AthleteSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  position: z.nativeEnum(Position),
  teamId: z.string().optional().nullable(),
  nationalTeamId: z.string().optional().nullable(),
  birthDate: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  height: z.coerce.number().int().positive().optional().nullable(),
  weight: z.coerce.number().int().positive().optional().nullable(),
  footPreference: z.nativeEnum(FootPreference).optional().nullable().default(FootPreference.UNKNOWN),
  notes: z.string().optional().nullable(),
});

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function getAthletes(params?: {
  search?: string;
  position?: string;
  teamId?: string;
  scope?: "registered" | "all";
}) {
  const scopeFilter =
    params?.scope === "all"
      ? {}
      : {
          OR: [
            { notes: null },
            { NOT: { notes: { startsWith: "Atleta oficial da Série A 2026" } } },
            { portfolioAthletes: { some: {} } },
          ],
        };

  return prisma.athlete.findMany({
    where: {
      AND: [
        scopeFilter,
        params?.search
          ? { name: { contains: params.search, mode: "insensitive" } }
          : {},
        params?.position && params.position !== "ALL"
          ? { position: params.position as Position }
          : {},
        params?.teamId && params.teamId !== "ALL"
          ? { teamId: params.teamId }
          : {},
      ],
    },
    include: {
      team: { select: { id: true, name: true, shortName: true, logoUrl: true } },
      nationalTeam: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getAthleteById(id: string) {
  return prisma.athlete.findUnique({
    where: { id },
    include: {
      team: true,
      nationalTeam: true,
      rawMetrics: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}

export async function getAthletesCount() {
  return prisma.athlete.count();
}

export async function getSimilarAthletes(currentAthleteId: string, position: Position, limit = 3) {
  const candidates = await prisma.athlete.findMany({
    where: {
      position,
      id: { not: currentAthleteId },
    },
    take: limit,
    include: {
      team: { select: { id: true, name: true, logoUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const baseScores = [88, 83, 79];
  return candidates.map((ath, idx) => ({
    id: ath.id,
    name: ath.name,
    position: ath.position,
    birthDate: ath.birthDate,
    nationality: ath.nationality,
    height: ath.height,
    photoUrl: ath.photoUrl,
    photoHasAlpha: ath.photoHasAlpha,
    team: ath.team
      ? {
          id: ath.team.id,
          name: ath.team.name,
          logoUrl: ath.team.logoUrl,
        }
      : {
          id: "sem-clube",
          name: "Sem Clube",
          logoUrl: null,
        },
    similarityScore: baseScores[idx] ?? 75,
  }));
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function parseAthleteForm(formData: FormData) {
  return AthleteSchema.parse({
    name: formData.get("name"),
    position: formData.get("position"),
    teamId: formData.get("teamId") || null,
    nationalTeamId: formData.get("nationalTeamId") || null,
    birthDate: formData.get("birthDate") || null,
    nationality: formData.get("nationality") || null,
    height: formData.get("height") || null,
    weight: formData.get("weight") || null,
    footPreference: formData.get("footPreference") || FootPreference.UNKNOWN,
    notes: formData.get("notes") || null,
  });
}

export async function createAthlete(formData: FormData) {
  const data = parseAthleteForm(formData);
  const athlete = await prisma.athlete.create({
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      nationalTeamId: data.nationalTeamId || null,
    },
  });
  revalidatePath("/athletes");
  return athlete;
}

export async function updateAthlete(id: string, formData: FormData) {
  const data = parseAthleteForm(formData);
  await prisma.athlete.update({
    where: { id },
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : null,
      nationalTeamId: data.nationalTeamId || null,
    },
  });
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${id}`);
}

export async function deleteAthlete(id: string) {
  await prisma.athlete.delete({ where: { id } });
  await deleteAthleteUploads(id).catch(() => {});
  revalidatePath("/athletes");
}

export interface MetricHistoryPoint {
  round: string;
  value: number;
  date?: string;
  opponent?: string;
}

/**
 * Busca a pilha cronológica de CanonicalMetric do atleta para alimentar os Sparklines
 */
export async function getAthleteMetricHistoryAction(
  athleteId: string,
  metricName: string
): Promise<MetricHistoryPoint[]> {
  try {
    const records = await prisma.canonicalMetric.findMany({
      where: {
        athleteId,
        metricName,
      },
      include: {
        match: {
          select: {
            round: true,
            date: true,
            opponentName: true,
          },
        },
      },
      orderBy: [
        { round: "asc" },
        { date: "asc" },
      ],
      take: 12,
    });

    if (records.length === 0) return [];

    return records.map((r, i) => {
      const roundLabel = r.round ? `R${r.round}` : r.match?.round || `R${i + 1}`;
      return {
        round: roundLabel,
        value: Number(r.per90Value.toFixed(2)),
        date: r.date.toISOString().slice(0, 10),
        opponent: r.match?.opponentName || undefined,
      };
    });
  } catch (error) {
    console.error("Erro ao buscar histórico da métrica:", error);
    return [];
  }
}


