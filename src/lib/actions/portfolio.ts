"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { METRIC_BY_KEY, metricLabel } from "@/lib/metrics";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside request context
  }
}

async function getOrCreateCurrentUserId(): Promise<string> {
  try {
    const session = await auth();
    if (session?.user?.id) {
      return session.user.id;
    }
  } catch {
    // Outside of request context or unauthenticated
  }

  // Fallback to first existing user or create a default analyst
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

export async function getOrCreatePortfolio(userId?: string) {
  const resolvedUserId = userId ?? (await getOrCreateCurrentUserId());

  let portfolio = await prisma.analystPortfolio.findFirst({
    where: { userId: resolvedUserId },
  });

  if (!portfolio) {
    portfolio = await prisma.analystPortfolio.create({
      data: {
        userId: resolvedUserId,
        name: "Meu Portfólio",
      },
    });
  }

  return portfolio;
}

export async function getPortfolioAthletes() {
  const portfolio = await getOrCreatePortfolio();

  const items = await prisma.portfolioAthlete.findMany({
    where: { portfolioId: portfolio.id },
    include: {
      athlete: {
        include: {
          team: { select: { id: true, name: true, shortName: true } },
          rawMetrics: {
            select: {
              id: true,
              matchId: true,
              minutesPlayed: true,
            },
          },
          canonicalMetrics: {
            select: {
              metricName: true,
              absoluteValue: true,
              per90Value: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => {
    const a = item.athlete;
    const totalMinutes = a.rawMetrics.reduce(
      (sum, m) => sum + (m.minutesPlayed ?? 0),
      0
    );
    const uniqueMatches = new Set(a.rawMetrics.map((m) => m.matchId));

    // Aggregate metrics
    const metricSums: Record<string, { total: number; count: number }> = {};
    for (const c of a.canonicalMetrics) {
      if (!metricSums[c.metricName]) {
        metricSums[c.metricName] = { total: 0, count: 0 };
      }
      metricSums[c.metricName].total += c.absoluteValue;
      metricSums[c.metricName].count += 1;
    }

    const metrics: Record<
      string,
      { label: string; total: number; per90: number }
    > = {};

    for (const [k, v] of Object.entries(metricSums)) {
      const def = METRIC_BY_KEY[k];
      const isRate = def?.unit === "percent" || k === "rating";
      const per90 = isRate
        ? v.count > 0
          ? Math.round((v.total / v.count) * 100) / 100
          : 0
        : totalMinutes > 0
        ? Math.round(((v.total / totalMinutes) * 90) * 100) / 100
        : 0;

      metrics[k] = {
        label: metricLabel(k),
        total: Math.round(v.total * 100) / 100,
        per90,
      };
    }

    return {
      portfolioAthleteId: item.id,
      notes: item.notes,
      addedAt: item.createdAt,
      athlete: {
        id: a.id,
        name: a.name,
        position: a.position,
        birthDate: a.birthDate,
        nationality: a.nationality,
        footPreference: a.footPreference,
        photoUrl: a.photoUrl,
        photoHasAlpha: a.photoHasAlpha,
        team: a.team,
        totalMinutes,
        totalMatches: uniqueMatches.size,
        metrics,
      },
    };
  });
}

export async function addAthleteToPortfolio(athleteId: string, notes?: string) {
  const portfolio = await getOrCreatePortfolio();

  await prisma.portfolioAthlete.upsert({
    where: {
      portfolioId_athleteId: {
        portfolioId: portfolio.id,
        athleteId,
      },
    },
    create: {
      portfolioId: portfolio.id,
      athleteId,
      notes: notes ?? null,
    },
    update: {
      notes: notes ?? undefined,
    },
  });

  safeRevalidate("/");
  safeRevalidate("/athletes");
  safeRevalidate(`/athletes/${athleteId}`);
  safeRevalidate("/league");

  return { ok: true };
}

export async function removeAthleteFromPortfolio(athleteId: string) {
  const portfolio = await getOrCreatePortfolio();

  await prisma.portfolioAthlete.deleteMany({
    where: {
      portfolioId: portfolio.id,
      athleteId,
    },
  });

  safeRevalidate("/");
  safeRevalidate("/athletes");
  safeRevalidate(`/athletes/${athleteId}`);
  safeRevalidate("/league");

  return { ok: true };
}

export async function isAthleteInPortfolio(athleteId: string): Promise<boolean> {
  const portfolio = await getOrCreatePortfolio();
  const item = await prisma.portfolioAthlete.findUnique({
    where: {
      portfolioId_athleteId: {
        portfolioId: portfolio.id,
        athleteId,
      },
    },
  });
  return Boolean(item);
}

export async function getPortfolioAthleteIds(): Promise<string[]> {
  const portfolio = await getOrCreatePortfolio();
  const items = await prisma.portfolioAthlete.findMany({
    where: { portfolioId: portfolio.id },
    select: { athleteId: true },
  });
  return items.map((i) => i.athleteId);
}

export async function getAthleteStatsForProfile(athleteId: string) {
  const athlete = await prisma.athlete.findUnique({
    where: { id: athleteId },
    include: {
      team: { select: { id: true, name: true, shortName: true } },
      rawMetrics: {
        select: {
          id: true,
          matchId: true,
          minutesPlayed: true,
          match: {
            select: {
              date: true,
              opponentName: true,
              goalsFor: true,
              goalsAgainst: true,
            },
          },
        },
      },
      canonicalMetrics: {
        select: {
          metricName: true,
          absoluteValue: true,
          per90Value: true,
        },
      },
    },
  });

  if (!athlete) return null;

  const totalMinutes = athlete.rawMetrics.reduce(
    (sum: number, m) => sum + (m.minutesPlayed ?? 0),
    0
  );
  const uniqueMatches = new Set(athlete.rawMetrics.map((m) => m.matchId));

  const metricSums: Record<string, { total: number; count: number }> = {};
  for (const c of athlete.canonicalMetrics) {
    if (!metricSums[c.metricName]) {
      metricSums[c.metricName] = { total: 0, count: 0 };
    }
    metricSums[c.metricName].total += c.absoluteValue;
    metricSums[c.metricName].count += 1;
  }

  const metrics: Record<
    string,
    { label: string; total: number; per90: number }
  > = {};

  for (const [k, v] of Object.entries(metricSums)) {
    const def = METRIC_BY_KEY[k];
    const isRate = def?.unit === "percent" || k === "rating";
    const per90 = isRate
      ? v.count > 0
        ? Math.round((v.total / v.count) * 100) / 100
        : 0
      : totalMinutes > 0
      ? Math.round(((v.total / totalMinutes) * 90) * 100) / 100
      : 0;

    metrics[k] = {
      label: metricLabel(k),
      total: Math.round(v.total * 100) / 100,
      per90,
    };
  }

  const recentMatches = athlete.rawMetrics
    .filter((m) => m.match != null)
    .slice(0, 5)
    .map((m) => {
      const match = m.match!;
      return {
        date: match.date,
        opponentName: match.opponentName,
        goalsFor: match.goalsFor,
        goalsAgainst: match.goalsAgainst,
        minutesPlayed: m.minutesPlayed,
      };
    });

  return {
    totalMinutes,
    totalMatches: uniqueMatches.size,
    metrics,
    recentMatches,
  };
}

export async function getAnalystDashboardData() {
  const portfolio = await getOrCreatePortfolio();

  const [
    totalAthletes,
    totalMatches,
    totalCanonicalMetrics,
    portfolioCount,
    portfolioAthletes,
  ] = await Promise.all([
    prisma.athlete.count(),
    prisma.match.count(),
    prisma.canonicalMetric.count(),
    prisma.portfolioAthlete.count({
      where: { portfolioId: portfolio.id },
    }),
    getPortfolioAthletes(),
  ]);

  return {
    totalAthletes,
    totalMatches,
    totalCanonicalMetrics,
    portfolioCount,
    portfolioAthletes,
  };
}

export async function getAnalystHighlights() {
  const targetMetrics = ["goals", "assists", "passes", "tackles"];

  const highlights: Record<
    string,
    Array<{
      athleteId: string;
      athleteName: string;
      athletePosition: string;
      teamName: string;
      photoUrl: string | null;
      value: number;
    }>
  > = {};

  for (const metric of targetMetrics) {
    const records = await prisma.canonicalMetric.findMany({
      where: { metricName: metric, per90Value: { gt: 0 } },
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            position: true,
            photoUrl: true,
            team: { select: { name: true } },
          },
        },
      },
      orderBy: { per90Value: "desc" },
      take: 6,
    });

    const seen = new Set<string>();
    const list = [];
    for (const r of records) {
      if (!seen.has(r.athleteId)) {
        seen.add(r.athleteId);
        list.push({
          athleteId: r.athlete.id,
          athleteName: r.athlete.name,
          athletePosition: r.athlete.position,
          teamName: r.athlete.team.name,
          photoUrl: r.athlete.photoUrl,
          value: r.per90Value,
        });
      }
      if (list.length >= 3) break;
    }
    highlights[metric] = list;
  }

  return highlights;
}

