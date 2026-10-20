import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Shield, Users, ArrowLeft, Activity, Trophy } from "lucide-react";
import { LockerRoomRoster, type LockerRoomAthlete } from "@/components/teams/locker-room-roster";
import { POSITION_LABELS } from "@/lib/domain";
import { getClubColors } from "@/lib/club-colors";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const team = await prisma.team.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!team) return { title: "Clube não encontrado" };
  return {
    title: `${team.name} • Vestiário e Elenco | Overview Scout`,
    description: `Vestiário interativo, decupagem do elenco e métricas de performance de ${team.name}`,
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      league: true,
      athletes: {
        include: {
          rawMetrics: {
            orderBy: { match: { date: "desc" } },
            take: 5,
          },
          canonicalMetrics: {
            where: { metricName: { in: ["rating", "goals", "xg"] } },
            orderBy: { match: { date: "desc" } },
            take: 10,
          },
        },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!team) notFound();

  // Processa atletas para o Vestiário Interativo
  const processedAthletes: LockerRoomAthlete[] = team.athletes.map((a, idx) => {
    const rawData = a.rawMetrics?.[0]?.data as Record<string, unknown> | undefined;
    const rawNum = rawData?.["jersey_number"] ?? rawData?.["№"] ?? rawData?.["no"] ?? null;
    const jerseyNumber =
      typeof rawNum === "number" || typeof rawNum === "string" ? rawNum : idx + 1;

    const totalMinutes = a.rawMetrics.reduce(
      (sum, r) => sum + (r.minutesPlayed ?? 0),
      0
    );

    const ratings = a.canonicalMetrics
      .filter((c) => c.metricName === "rating")
      .map((c) => c.absoluteValue);

    let zScoreVal = 0;
    if (ratings.length >= 2) {
      const mean = ratings.reduce((s, v) => s + v, 0) / ratings.length;
      const stdDev = Math.sqrt(
        ratings.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (ratings.length - 1)
      );
      const latest = ratings[0];
      zScoreVal = stdDev > 0 ? (latest - mean) / stdDev : 0;
    } else if (a.idgScore != null) {
      zScoreVal = (25.0 - a.idgScore) / 6.0;
    }

    const zScore = (zScoreVal >= 0 ? "+" : "") + zScoreVal.toFixed(2);

    return {
      id: a.id,
      name: a.name,
      position: a.position,
      positionLabel: POSITION_LABELS[a.position] || a.position,
      jerseyNumber,
      photoUrl: a.photoUrl,
      totalMinutes,
      idgScore: a.idgScore,
      stabilityCategory: a.stabilityCategory,
      zScore,
      zScoreVal,
      isNegative: zScoreVal < 0,
      tacticalTitle: a.tacticalTitle,
    };
  });

  const clubColors = getClubColors(team.name);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* ─── Breadcrumb & Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/teams" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Clubes</span>
            </Link>
            <ChevronRight className="h-3 w-3 text-zinc-600" />
            <span className="text-white font-bold">{team.name}</span>
          </nav>

          <div className="flex items-center gap-3">
            <div
              className="h-12 w-12 rounded-2xl border flex items-center justify-center p-2 overflow-hidden shadow-lg"
              style={{
                backgroundColor: `${clubColors.primaryColor}20`,
                borderColor: `${clubColors.primaryColor}50`,
              }}
            >
              {team.logoUrl ? (
                <img src={team.logoUrl} alt={team.name} className="h-full w-full object-contain" />
              ) : (
                <Shield className="h-6 w-6 text-white" />
              )}
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {team.name}
              </h1>
              <p className="text-xs text-zinc-400">
                {team.league?.name ?? "Brasileirão Série A"} &bull; {team.athletes.length} atletas vinculados
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/performance/squad?teamId=${team.id}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-bold transition-all"
          >
            <Activity className="h-4 w-4" />
            <span>Abrir Sala de Guerra</span>
          </Link>
        </div>
      </div>

      {/* ─── Vestiário Interativo (Interactive Locker Room) ────────────────── */}
      <LockerRoomRoster athletes={processedAthletes} teamName={team.name} />

      {/* ─── Tabela Rápida do Elenco ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c101d]/75 p-6 backdrop-blur-md space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <span>Elenco Completo ({team.athletes.length} Atletas)</span>
          </h2>
          <span className="text-xs font-mono text-zinc-400">Série A 2026</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {processedAthletes.map((athlete) => (
            <Link
              key={athlete.id}
              href={`/athletes/${athlete.id}`}
              className="p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-emerald-500/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-bold text-zinc-400 w-6 text-center">
                  #{athlete.jerseyNumber}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                    {athlete.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {athlete.positionLabel}
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono font-bold text-zinc-400 group-hover:text-white">
                Dossiê &rarr;
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
