"use server";

import { prisma } from "@/lib/prisma";
import { Position, FootPreference } from "@prisma/client";
import { METRIC_BY_KEY, metricLabel } from "@/lib/metrics";

export type CatalogAthleteMetric = {
  metricName: string;
  label: string;
  total: number;
  per90: number;
  matchCount: number;
};

export type CatalogAthlete = {
  id: string;
  name: string;
  position: Position;
  birthDate: Date | null;
  age: number | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  footPreference: FootPreference;
  photoUrl: string | null;
  photoHasAlpha: boolean;
  idgScore?: number | null;
  stabilityCategory?: string | null;
  team: {
    id: string;
    name: string;
    shortName: string | null;
  };
  totalMinutes: number;
  totalMatches: number;
  metrics: Record<string, CatalogAthleteMetric>;
};

export type CatalogFilters = {
  search?: string;
  position?: Position | "ALL";
  teamId?: string;
  footPreference?: FootPreference | "ALL";
  minAge?: number;
  maxAge?: number;
  metricFilter?: {
    metricName: string;
    minPer90: number;
  };
  sortBy?: string; // e.g. "name_asc", "age_asc", "metric_goals_desc", etc.
};

function calculateAge(birthDate: Date | null | undefined): number | null {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export async function getCatalogAthletes(
  filters?: CatalogFilters
): Promise<{ athletes: CatalogAthlete[]; totalCount: number }> {
  // 1. Fetch athletes with their rawMetrics and canonicalMetrics
  const athletesFromDb = await prisma.athlete.findMany({
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
    orderBy: { name: "asc" },
  });

  // 2. Aggregate each athlete's canonical metrics and time played
  let athletes: CatalogAthlete[] = athletesFromDb.map((a) => {
    const age = calculateAge(a.birthDate);
    const totalMinutes = a.rawMetrics.reduce(
      (sum, m) => sum + (m.minutesPlayed ?? 0),
      0
    );
    const uniqueMatches = new Set(a.rawMetrics.map((m) => m.matchId));
    const totalMatches = uniqueMatches.size;

    // Aggregate canonical metrics
    const metricSums: Record<
      string,
      { total: number; sumPer90: number; count: number }
    > = {};

    for (const c of a.canonicalMetrics) {
      if (!metricSums[c.metricName]) {
        metricSums[c.metricName] = { total: 0, sumPer90: 0, count: 0 };
      }
      metricSums[c.metricName].total += c.absoluteValue;
      metricSums[c.metricName].sumPer90 += c.per90Value;
      metricSums[c.metricName].count += 1;
    }

    const metrics: Record<string, CatalogAthleteMetric> = {};

    for (const [k, v] of Object.entries(metricSums)) {
      const def = METRIC_BY_KEY[k];
      const isRate = def?.unit === "percent" || k === "rating" || k === "xg_per_shot";

      // If rate/percentage/ratio, average the values. If count, calculate weighted per-90
      const per90 = isRate
        ? v.count > 0
          ? Math.round((v.total / v.count) * 100) / 100
          : 0
        : totalMinutes > 0
        ? Math.round(((v.total / totalMinutes) * 90) * 100) / 100
        : 0;

      metrics[k] = {
        metricName: k,
        label: metricLabel(k),
        total: Math.round(v.total * 100) / 100,
        per90,
        matchCount: v.count,
      };
    }

    return {
      id: a.id,
      name: a.name,
      position: a.position,
      birthDate: a.birthDate,
      age,
      nationality: a.nationality,
      height: a.height,
      weight: a.weight,
      footPreference: a.footPreference,
      photoUrl: a.photoUrl,
      photoHasAlpha: a.photoHasAlpha,
      idgScore: a.idgScore,
      stabilityCategory: a.stabilityCategory,
      team: a.team,
      totalMinutes,
      totalMatches,
      metrics,
    };
  });

  // 3. Apply Filters
  if (filters) {
    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase();
      athletes = athletes.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.team.name.toLowerCase().includes(q) ||
          (a.nationality && a.nationality.toLowerCase().includes(q))
      );
    }

    if (filters.position && filters.position !== "ALL") {
      athletes = athletes.filter((a) => a.position === filters.position);
    }

    if (filters.teamId && filters.teamId !== "ALL") {
      athletes = athletes.filter((a) => a.team.id === filters.teamId);
    }

    if (filters.footPreference && filters.footPreference !== "ALL") {
      athletes = athletes.filter((a) => a.footPreference === filters.footPreference);
    }

    if (filters.minAge != null && filters.minAge > 0) {
      athletes = athletes.filter((a) => a.age != null && a.age >= filters.minAge!);
    }

    if (filters.maxAge != null && filters.maxAge > 0) {
      athletes = athletes.filter((a) => a.age != null && a.age <= filters.maxAge!);
    }

    // Mathematical Canonical Per-90 filter
    if (
      filters.metricFilter &&
      filters.metricFilter.metricName &&
      Number.isFinite(filters.metricFilter.minPer90)
    ) {
      const { metricName, minPer90 } = filters.metricFilter;
      athletes = athletes.filter((a) => {
        const m = a.metrics[metricName];
        return m ? m.per90 >= minPer90 : false;
      });
    }

    // 4. Smart Sorting
    if (filters.sortBy) {
      const [type, key, direction] = filters.sortBy.split("_");

      if (type === "name") {
        athletes.sort((a, b) =>
          key === "desc"
            ? b.name.localeCompare(a.name)
            : a.name.localeCompare(b.name)
        );
      } else if (type === "age") {
        athletes.sort((a, b) => {
          const ageA = a.age ?? 999;
          const ageB = b.age ?? 999;
          return key === "desc" ? ageB - ageA : ageA - ageB;
        });
      } else if (type === "metric") {
        // e.g. "metric_goals_desc" -> type: "metric", key: "goals", direction: "desc"
        const metricKey = key;
        const isDesc = direction === "desc" || !direction;

        athletes.sort((a, b) => {
          const valA = a.metrics[metricKey]?.per90 ?? 0;
          const valB = b.metrics[metricKey]?.per90 ?? 0;
          return isDesc ? valB - valA : valA - valB;
        });
      }
    }
  }

  return {
    athletes,
    totalCount: athletes.length,
  };
}
