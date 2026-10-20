"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Position } from "@prisma/client";
import { POSITION_LABELS } from "@/lib/domain";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Outside request context
  }
}

async function getOrCreateCurrentUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Unauthenticated or background
  }

  // Fallback para primeiro usuário do sistema ou analista padrão
  let defaultUser = await prisma.user.findFirst();
  if (!defaultUser) {
    defaultUser = await prisma.user.create({
      data: {
        email: "analista@thenetscouting.com",
        name: "Analista de Desempenho",
        password: "hashed_default_pwd",
        role: "ANALYST",
      },
    });
  }
  return defaultUser.id;
}

export interface ShadowBoardPortfolioSummary {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
}

export interface ShadowBoardAthleteItem {
  id: string;
  portfolioId: string;
  athleteId: string;
  notes: string | null;
  addedAt: Date;
  athlete: {
    id: string;
    name: string;
    position: Position;
    positionLabel: string;
    photoUrl: string | null;
    birthDate: Date | null;
    age: number | null;
    height: number | null;
    weight: number | null;
    footPreference: string | null;
    idgScore: number | null;
    zScore: string;
    zScoreVal: number;
    isNegative: boolean;
    team: {
      id: string;
      name: string;
      shortName: string | null;
      logoUrl: string | null;
    } | null;
  };
}

/**
 * Retorna todos os portfólios do analista atual.
 * Se nenhum existir, cria um portfólio inicial ("Alvos Prioritários 2026").
 */
export async function getUserPortfolios(): Promise<ShadowBoardPortfolioSummary[]> {
  const userId = await getOrCreateCurrentUserId();

  let portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (portfolios.length === 0) {
    const defaultPortfolio = await prisma.portfolio.create({
      data: {
        userId,
        name: "Alvos Prioritários 2026",
        description: "Shortlist executiva com alvos monitorados para a próxima janela.",
      },
      include: {
        _count: {
          select: { items: true },
        },
      },
    });
    portfolios = [defaultPortfolio];
  }

  return portfolios.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    itemCount: p._count.items,
  }));
}

/**
 * Cria um novo portfólio customizado para o analista
 */
export async function createPortfolio(data: {
  name: string;
  description?: string;
}): Promise<{ ok: boolean; portfolio?: ShadowBoardPortfolioSummary; error?: string }> {
  try {
    if (!data.name || !data.name.trim()) {
      return { ok: false, error: "Nome do portfólio é obrigatório." };
    }

    const userId = await getOrCreateCurrentUserId();

    const created = await prisma.portfolio.create({
      data: {
        userId,
        name: data.name.trim(),
        description: data.description?.trim() || null,
      },
    });

    safeRevalidate("/market/portfolios");
    safeRevalidate("/athletes");

    return {
      ok: true,
      portfolio: {
        id: created.id,
        name: created.name,
        description: created.description,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        itemCount: 0,
      },
    };
  } catch (err: unknown) {
    console.error("Erro ao criar portfólio:", err);
    return { ok: false, error: "Falha ao criar o portfólio." };
  }
}

/**
 * Retorna detalhes e itens de um portfólio específico
 */
export async function getPortfolioDetails(portfolioId: string): Promise<{
  portfolio: ShadowBoardPortfolioSummary | null;
  items: ShadowBoardAthleteItem[];
}> {
  const portfolio = await prisma.portfolio.findUnique({
    where: { id: portfolioId },
    include: {
      items: {
        include: {
          athlete: {
            include: {
              team: {
                select: {
                  id: true,
                  name: true,
                  shortName: true,
                  logoUrl: true,
                },
              },
              canonicalMetrics: {
                where: { metricName: "rating" },
                select: { absoluteValue: true },
                orderBy: { match: { date: "desc" } },
                take: 10,
              },
            },
          },
        },
        orderBy: { addedAt: "desc" },
      },
      _count: {
        select: { items: true },
      },
    },
  });

  if (!portfolio) {
    return { portfolio: null, items: [] };
  }

  const today = new Date();

  const items: ShadowBoardAthleteItem[] = portfolio.items.map((item) => {
    const a = item.athlete;

    // Cálculo Térmico Z-Score
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
      id: item.id,
      portfolioId: item.portfolioId,
      athleteId: item.athleteId,
      notes: item.notes,
      addedAt: item.addedAt,
      athlete: {
        id: a.id,
        name: a.name,
        position: a.position,
        positionLabel: POSITION_LABELS[a.position] || a.position,
        photoUrl: a.photoUrl,
        birthDate: a.birthDate,
        age: calculatedAge,
        height: a.height,
        weight: a.weight,
        footPreference: a.footPreference,
        idgScore: a.idgScore,
        zScore,
        zScoreVal: Number(zScoreVal.toFixed(2)),
        isNegative: zScoreVal < 0,
        team: a.team,
      },
    };
  });

  return {
    portfolio: {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
      itemCount: portfolio._count.items,
    },
    items,
  };
}

/**
 * Adiciona um atleta a um portfólio específico com anotação opcional
 */
export async function addAthleteToPortfolio(
  portfolioId: string,
  athleteId: string,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.portfolioItem.upsert({
      where: {
        portfolioId_athleteId: {
          portfolioId,
          athleteId,
        },
      },
      create: {
        portfolioId,
        athleteId,
        notes: notes?.trim() || null,
      },
      update: {
        notes: notes !== undefined ? notes?.trim() || null : undefined,
      },
    });

    safeRevalidate("/market/portfolios");
    safeRevalidate(`/market/portfolios?portfolioId=${portfolioId}`);
    safeRevalidate("/athletes");
    safeRevalidate(`/athletes/${athleteId}`);

    return { ok: true };
  } catch (err: unknown) {
    console.error("Erro ao adicionar atleta ao portfólio:", err);
    return { ok: false, error: "Falha ao adicionar atleta ao portfólio." };
  }
}

/**
 * Remove um atleta de um portfólio específico
 */
export async function removeAthleteFromPortfolio(
  portfolioId: string,
  athleteId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.portfolioItem.deleteMany({
      where: {
        portfolioId,
        athleteId,
      },
    });

    safeRevalidate("/market/portfolios");
    safeRevalidate(`/market/portfolios?portfolioId=${portfolioId}`);
    safeRevalidate("/athletes");
    safeRevalidate(`/athletes/${athleteId}`);

    return { ok: true };
  } catch (err: unknown) {
    console.error("Erro ao remover atleta do portfólio:", err);
    return { ok: false, error: "Falha ao remover atleta do portfólio." };
  }
}

/**
 * Atualiza a nota de observação de um atleta dentro de um portfólio
 */
export async function updatePortfolioItemNotes(
  portfolioId: string,
  athleteId: string,
  notes: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.portfolioItem.update({
      where: {
        portfolioId_athleteId: {
          portfolioId,
          athleteId,
        },
      },
      data: {
        notes: notes.trim() || null,
      },
    });

    safeRevalidate("/market/portfolios");
    safeRevalidate(`/market/portfolios?portfolioId=${portfolioId}`);

    return { ok: true };
  } catch (err: unknown) {
    console.error("Erro ao atualizar notas do atleta:", err);
    return { ok: false, error: "Falha ao atualizar observações." };
  }
}

/**
 * Exclui um portfólio (com deleção em cascata dos seus itens)
 */
export async function deletePortfolio(
  portfolioId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await prisma.portfolio.delete({
      where: { id: portfolioId },
    });

    safeRevalidate("/market/portfolios");
    safeRevalidate("/athletes");

    return { ok: true };
  } catch (err: unknown) {
    console.error("Erro ao excluir portfólio:", err);
    return { ok: false, error: "Falha ao excluir portfólio." };
  }
}

/**
 * Retorna os IDs dos portfólios onde o atleta já está salvo
 */
export async function getAthletePortfolios(athleteId: string): Promise<string[]> {
  const items = await prisma.portfolioItem.findMany({
    where: { athleteId },
    select: { portfolioId: true },
  });
  return items.map((i) => i.portfolioId);
}
