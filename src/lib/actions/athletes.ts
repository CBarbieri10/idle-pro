"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Position, FootPreference, Prisma } from "@prisma/client";
import { deleteAthleteUploads } from "@/lib/uploads";
import {
  POSITION_LABELS,
  FOOT_LABELS,
  formatAge,
  formatFootPreference,
} from "@/lib/domain";

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

// ─── Motor de Busca Avançada & Scouting Multidimensional ─────────────────────

export const POSITION_GROUP_MAP: Record<string, Position[]> = {
  Zagueiro: [Position.CENTER_BACK],
  Lateral: [Position.RIGHT_BACK, Position.LEFT_BACK],
  Volante: [Position.DEFENSIVE_MID],
  "Meia Central": [Position.CENTRAL_MID, Position.ATTACKING_MID],
  Ponta: [Position.RIGHT_WING, Position.LEFT_WING],
  Centroavante: [Position.STRIKER, Position.FORWARD],
  Goleiro: [Position.GOALKEEPER],
  GOALKEEPER: [Position.GOALKEEPER],
  CENTER_BACK: [Position.CENTER_BACK],
  RIGHT_BACK: [Position.RIGHT_BACK],
  LEFT_BACK: [Position.LEFT_BACK],
  DEFENSIVE_MID: [Position.DEFENSIVE_MID],
  CENTRAL_MID: [Position.CENTRAL_MID],
  ATTACKING_MID: [Position.ATTACKING_MID],
  RIGHT_WING: [Position.RIGHT_WING],
  LEFT_WING: [Position.LEFT_WING],
  STRIKER: [Position.STRIKER],
  FORWARD: [Position.FORWARD],
};

export const FOOT_MAP: Record<string, FootPreference> = {
  LEFT: FootPreference.LEFT,
  RIGHT: FootPreference.RIGHT,
  BOTH: FootPreference.BOTH,
  UNKNOWN: FootPreference.UNKNOWN,
  Esquerdo: FootPreference.LEFT,
  Canhoto: FootPreference.LEFT,
  Direito: FootPreference.RIGHT,
  Destro: FootPreference.RIGHT,
  Ambidestro: FootPreference.BOTH,
};

export interface AdvancedScoutingParams {
  search?: string;
  pos?: string; // ex: "Lateral,Ponta" ou "Zagueiro"
  positions?: string[];
  teamId?: string;
  scope?: "registered" | "all";
  minAge?: number | string;
  maxAge?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  foot?: string; // ex: "LEFT,RIGHT"
  stable?: boolean | string;
  minZ?: number | string;
  page?: number | string;
  pageSize?: number | string;
}

export interface ScoutingAthleteCardData {
  id: string;
  name: string;
  position: Position;
  positionLabel: string;
  photoUrl?: string | null;
  photoHasAlpha?: boolean;
  birthDate?: Date | null;
  age?: number | null;
  height?: number | null;
  weight?: number | null;
  footPreference?: FootPreference | null;
  footLabel?: string;
  idgScore?: number | null;
  stabilityCategory?: string | null;
  tacticalTitle?: string | null;
  zScore: string;
  zScoreVal: number;
  isNegative: boolean;
  totalMinutes: number;
  jerseyNumber?: string | number | null;
  team?: {
    id: string;
    name: string;
    shortName?: string | null;
    logoUrl?: string | null;
  } | null;
}

export interface ScoutingSearchResult {
  athletes: ScoutingAthleteCardData[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Motor de Busca Avançada de Atletas com query dinâmica do Prisma e paginação
 */
export async function getScoutingAthletes(
  params: AdvancedScoutingParams = {}
): Promise<ScoutingSearchResult> {
  const page = Math.max(1, parseInt(String(params.page || 1), 10) || 1);
  const pageSize = Math.max(1, Math.min(100, parseInt(String(params.pageSize || 20), 10) || 20));

  // 1. Resolução de Posições (Grupos amigáveis e enums do Prisma)
  let resolvedPositions: Position[] = [];
  const rawPosInput = params.pos || (params.positions ? params.positions.join(",") : "");
  if (rawPosInput) {
    const tokens = rawPosInput.split(",").map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const mapped = POSITION_GROUP_MAP[token];
      if (mapped) {
        resolvedPositions.push(...mapped);
      } else if (Object.values(Position).includes(token as Position)) {
        resolvedPositions.push(token as Position);
      }
    }
    resolvedPositions = Array.from(new Set(resolvedPositions));
  }

  // 2. Resolução de Pé Preferencial
  let resolvedFoots: FootPreference[] = [];
  if (params.foot) {
    const tokens = params.foot.split(",").map((t) => t.trim()).filter(Boolean);
    for (const token of tokens) {
      const mapped = FOOT_MAP[token];
      if (mapped) resolvedFoots.push(mapped);
    }
    resolvedFoots = Array.from(new Set(resolvedFoots));
  }

  // 3. Resolução Biométrica: Idade e Altura
  const today = new Date();
  const minAgeNum = params.minAge ? parseInt(String(params.minAge), 10) : undefined;
  const maxAgeNum = params.maxAge ? parseInt(String(params.maxAge), 10) : undefined;
  const minHeightNum = params.minHeight ? parseInt(String(params.minHeight), 10) : undefined;
  const maxHeightNum = params.maxHeight ? parseInt(String(params.maxHeight), 10) : undefined;

  const birthDateFilter: Prisma.DateTimeNullableFilter = {};
  if (maxAgeNum !== undefined && !isNaN(maxAgeNum)) {
    birthDateFilter.gte = new Date(today.getFullYear() - maxAgeNum - 1, today.getMonth(), today.getDate());
  }
  if (minAgeNum !== undefined && !isNaN(minAgeNum)) {
    birthDateFilter.lte = new Date(today.getFullYear() - minAgeNum, today.getMonth(), today.getDate());
  }

  const heightFilter: Prisma.IntNullableFilter = {};
  if (minHeightNum !== undefined && !isNaN(minHeightNum)) {
    heightFilter.gte = minHeightNum;
  }
  if (maxHeightNum !== undefined && !isNaN(maxHeightNum)) {
    heightFilter.lte = maxHeightNum;
  }

  // 4. Filtro Térmico de Estabilidade (IDG < 20%) e Z-Score Mínimo
  const isStableOnly = params.stable === true || params.stable === "true" || params.stable === "1";
  let minZNum: number | undefined = undefined;
  if (params.minZ !== undefined && params.minZ !== "") {
    const parsed = parseFloat(String(params.minZ));
    if (!isNaN(parsed)) minZNum = parsed;
  }

  const idgFilter: Prisma.FloatNullableFilter = {};
  if (isStableOnly) {
    idgFilter.lte = 20;
  }
  if (minZNum !== undefined) {
    const maxIdgForZ = 25.0 - minZNum * 6.0;
    idgFilter.lte = idgFilter.lte !== undefined ? Math.min(idgFilter.lte, maxIdgForZ) : maxIdgForZ;
  }

  // 5. Escopo (por padrão busca toda a base da Série A; ou apenas cadastrados se explicitamente pedido)
  const scopeFilter =
    params.scope === "registered"
      ? {
          OR: [
            { notes: null },
            { NOT: { notes: { startsWith: "Atleta oficial da Série A 2026" } } },
            { portfolioAthletes: { some: {} } },
          ],
        }
      : {};

  // 6. Montagem da Cláusula WHERE Dinâmica
  const whereConditions: Prisma.AthleteWhereInput[] = [
    scopeFilter,
    params.search && params.search.trim()
      ? { name: { contains: params.search.trim(), mode: "insensitive" } }
      : {},
    resolvedPositions.length > 0 ? { position: { in: resolvedPositions } } : {},
    resolvedFoots.length > 0 ? { footPreference: { in: resolvedFoots } } : {},
    params.teamId && params.teamId !== "ALL" ? { teamId: params.teamId } : {},
    Object.keys(birthDateFilter).length > 0 ? { birthDate: birthDateFilter } : {},
    Object.keys(heightFilter).length > 0 ? { height: heightFilter } : {},
    Object.keys(idgFilter).length > 0 ? { idgScore: idgFilter } : {},
  ];

  const where: Prisma.AthleteWhereInput = {
    AND: whereConditions,
  };

  // 7. Execução com Paginação e Contagem Total
  const [totalCount, rawAthletes] = await Promise.all([
    prisma.athlete.count({ where }),
    prisma.athlete.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            shortName: true,
            logoUrl: true,
          },
        },
        rawMetrics: {
          select: {
            data: true,
            minutesPlayed: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        canonicalMetrics: {
          where: { metricName: "rating" },
          select: { absoluteValue: true },
          orderBy: { match: { date: "desc" } },
          take: 10,
        },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  // 8. Processamento e Cálculo Térmico (Z-Score e IDG)
  const athletes: ScoutingAthleteCardData[] = rawAthletes.map((a) => {
    const rawData = a.rawMetrics?.[0]?.data as Record<string, unknown> | undefined;
    const rawNum = rawData?.["jersey_number"] ?? rawData?.["№"] ?? rawData?.["no"] ?? null;
    const jerseyNumber = typeof rawNum === "number" || typeof rawNum === "string" ? rawNum : null;

    const totalMinutes = a.rawMetrics.reduce((sum, r) => sum + (r.minutesPlayed ?? 0), 0);

    const ratings = a.canonicalMetrics.map((c) => c.absoluteValue);
    let zScoreVal = 0;
    if (ratings.length >= 2) {
      const mean = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      const variance =
        ratings.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / Math.max(1, ratings.length - 1);
      const stdDev = Math.sqrt(variance);
      const latest = ratings[0];
      zScoreVal = stdDev > 0 ? (latest - mean) / stdDev : 0;
    } else if (a.idgScore != null) {
      // Invertido: menor IDG = maior estabilidade competitiva
      zScoreVal = (25.0 - a.idgScore) / 6.0;
    }

    zScoreVal = Math.max(-3.5, Math.min(3.5, zScoreVal));
    const zScore = (zScoreVal >= 0 ? "+" : "") + zScoreVal.toFixed(2);

    let calculatedAge: number | null = null;
    if (a.birthDate) {
      const bDate = new Date(a.birthDate);
      calculatedAge = today.getFullYear() - bDate.getFullYear();
      const m = today.getMonth() - bDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < bDate.getDate())) {
        calculatedAge -= 1;
      }
    }

    return {
      id: a.id,
      name: a.name,
      position: a.position,
      positionLabel: POSITION_LABELS[a.position] || a.position,
      photoUrl: a.photoUrl,
      photoHasAlpha: a.photoHasAlpha,
      birthDate: a.birthDate,
      age: calculatedAge,
      height: a.height,
      weight: a.weight,
      footPreference: a.footPreference,
      footLabel: formatFootPreference(a.footPreference),
      idgScore: a.idgScore,
      stabilityCategory: a.stabilityCategory,
      tacticalTitle: a.tacticalTitle,
      zScore,
      zScoreVal: Number(zScoreVal.toFixed(2)),
      isNegative: zScoreVal < 0,
      totalMinutes,
      jerseyNumber,
      team: a.team,
    };
  });

  // Filtro opcional pós-cálculo de Z-Score mínimo se fornecido
  let finalAthletes = athletes;
  if (params.minZ !== undefined && params.minZ !== "") {
    const minZNum = parseFloat(String(params.minZ));
    if (!isNaN(minZNum)) {
      finalAthletes = athletes.filter((a) => a.zScoreVal >= minZNum);
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return {
    athletes: finalAthletes,
    totalCount,
    page,
    pageSize,
    totalPages,
  };
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


