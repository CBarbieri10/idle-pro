import { prisma } from "@/lib/prisma";
import { getMyTeam } from "@/lib/actions/performance";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { SquadTeamSelector } from "./squad-team-selector";
import { POSITION_LABELS } from "@/lib/domain";
import { STABILITY_CONFIG, type StabilityCategory } from "@/lib/math-engine";
import { Badge } from "@/components/ui/badge";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sala de Guerra & Saúde do Elenco | The Net Scouting",
  description:
    "Monitoramento longitudinal de minutagem (L5), estabilidade do IDG e risco de oscilação do elenco",
};

export default async function SquadPage({
  searchParams,
}: {
  searchParams: Promise<{ teamId?: string }>;
}) {
  const params = await searchParams;
  const allTeams = await prisma.team.findMany({
    select: { id: true, name: true, logoUrl: true, _count: { select: { athletes: true } } },
    orderBy: { name: "asc" },
  });

  let team = null;

  if (params.teamId) {
    team = await prisma.team.findUnique({
      where: { id: params.teamId },
      include: {
        athletes: {
          include: {
            rawMetrics: {
              include: {
                match: {
                  select: { date: true, opponentName: true, round: true },
                },
              },
              orderBy: { match: { date: "desc" } },
              take: 10,
            },
            canonicalMetrics: {
              where: { metricName: { in: ["rating", "goals", "xg", "tackles", "passes"] } },
              orderBy: { match: { date: "desc" } },
              take: 30,
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });
  }

  if (!team) {
    const myTeam = await getMyTeam();
    if (myTeam) {
      team = await prisma.team.findUnique({
        where: { id: myTeam.id },
        include: {
          athletes: {
            include: {
              rawMetrics: {
                include: {
                  match: {
                    select: { date: true, opponentName: true, round: true },
                  },
                },
                orderBy: { match: { date: "desc" } },
                take: 10,
              },
              canonicalMetrics: {
                where: { metricName: { in: ["rating", "goals", "xg", "tackles", "passes"] } },
                orderBy: { match: { date: "desc" } },
                take: 30,
              },
            },
            orderBy: { name: "asc" },
          },
        },
      });
    }
  }

  // Fallback to first team if none configured
  if (!team && allTeams.length > 0) {
    team = await prisma.team.findUnique({
      where: { id: allTeams[0].id },
      include: {
        athletes: {
          include: {
            rawMetrics: {
              include: {
                match: {
                  select: { date: true, opponentName: true, round: true },
                },
              },
              orderBy: { match: { date: "desc" } },
              take: 10,
            },
            canonicalMetrics: {
              where: { metricName: { in: ["rating", "goals", "xg", "tackles", "passes"] } },
              orderBy: { match: { date: "desc" } },
              take: 30,
            },
          },
          orderBy: { name: "asc" },
        },
      },
    });
  }

  if (!team) {
    return (
      <div className="p-8 max-w-3xl mx-auto mt-20 text-center space-y-6">
        <h1 className="text-4xl font-black text-white tracking-tight">
          Sala de Guerra
        </h1>
        <p className="text-zinc-400 text-lg">
          Nenhum clube encontrado no banco de dados para monitoramento de performance.
        </p>
      </div>
    );
  }

  // Calculate real squad-level IDG statistics for relative baseline
  const squadIdgs = team.athletes
    .map((a) => a.idgScore)
    .filter((v): v is number => typeof v === "number" && !isNaN(v));

  const squadMeanIdg =
    squadIdgs.length > 0
      ? squadIdgs.reduce((acc, v) => acc + v, 0) / squadIdgs.length
      : 25.0;

  const squadStdDevIdg =
    squadIdgs.length > 1
      ? Math.sqrt(
          squadIdgs.reduce((acc, v) => acc + Math.pow(v - squadMeanIdg, 2), 0) /
            (squadIdgs.length - 1)
        )
      : 5.0;

  // Process each athlete using 100% real imported data
  const processedAthletes = team.athletes.map((a) => {
    const rawMatches = a.rawMetrics;
    const l5Matches = rawMatches.slice(0, 5);

    // Sum of minutes in the last 5 matches
    const l5Minutes = l5Matches.reduce(
      (sum, r) => sum + (r.minutesPlayed ?? 0),
      0
    );

    // Total minutes across all recorded matches
    const totalMinutes = rawMatches.reduce(
      (sum, r) => sum + (r.minutesPlayed ?? 0),
      0
    );

    const matchCount = rawMatches.length;

    // Real ratings or impact trendline (chronological order)
    const ratingsSeries = a.canonicalMetrics
      .filter((c) => c.metricName === "rating")
      .map((c) => c.absoluteValue)
      .reverse();

    let sparkline: number[] = [];
    if (ratingsSeries.length > 0) {
      sparkline = ratingsSeries.map((r) =>
        Math.min(100, Math.max(15, Math.round((r / 10) * 100)))
      );
    } else if (l5Matches.length > 0) {
      sparkline = l5Matches
        .map((r) =>
          Math.min(100, Math.max(15, Math.round(((r.minutesPlayed ?? 0) / 90) * 100)))
        )
        .reverse();
    } else {
      sparkline = [20, 20];
    }

    // Real Z-Score Calculation:
    // If the athlete has a series of ratings in their matches, calculate the Z-Score of the last match vs their mean.
    // If only 1 match or no matches, calculate relative stability vs the squad IDG.
    let zScoreVal = 0;
    if (ratingsSeries.length >= 3) {
      const mean =
        ratingsSeries.reduce((s, v) => s + v, 0) / ratingsSeries.length;
      const variance =
        ratingsSeries.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
        (ratingsSeries.length - 1);
      const stdDev = Math.sqrt(variance);
      const latest = ratingsSeries[ratingsSeries.length - 1];
      zScoreVal = stdDev > 0 ? (latest - mean) / stdDev : 0;
    } else if (a.idgScore != null) {
      // Inverted so lower IDG (more stable) gives a positive performance Z-Score
      zScoreVal =
        squadStdDevIdg > 0
          ? (squadMeanIdg - a.idgScore) / squadStdDevIdg
          : 0;
    }

    const zScore = (zScoreVal >= 0 ? "+" : "") + zScoreVal.toFixed(2);
    const isNegative = zScoreVal < 0;

    // Real status based on minutes and role
    const isStarter =
      l5Minutes >= 270 || (matchCount > 0 && l5Minutes / Math.min(matchCount, 5) >= 60);
    const isRotation = !isStarter && l5Minutes > 90;

    // Stability classification from Cérebro
    const category: StabilityCategory =
      a.stabilityCategory ||
      (a.idgScore != null
        ? a.idgScore > 30
          ? "LOW"
          : a.idgScore >= 15
          ? "MODERATE"
          : "HIGH"
        : "MODERATE");

    return {
      id: a.id,
      name: a.name,
      position: a.position,
      positionLabel: POSITION_LABELS[a.position] || a.position,
      photoUrl: a.photoUrl,
      idgScore: a.idgScore,
      stabilityCategory: category,
      l5Minutes,
      totalMinutes,
      matchCount,
      isStarter,
      isRotation,
      zScore,
      zScoreVal,
      isNegative,
      sparkline,
    };
  });

  // Calculate High-level Squad Health KPIs
  const totalSquadAthletes = processedAthletes.length;
  const highStabilityCount = processedAthletes.filter(
    (a) => a.stabilityCategory === "HIGH"
  ).length;
  const criticalInstabilityCount = processedAthletes.filter(
    (a) => a.stabilityCategory === "LOW"
  ).length;
  const activeStartersCount = processedAthletes.filter((a) => a.isStarter).length;

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-12">
      {/* ─── Breadcrumb & Switcher ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-500/15 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30 uppercase tracking-wider font-mono">
              <Activity className="h-3 w-3" /> Análise de Desempenho &bull; Elenco
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {team.name} ({totalSquadAthletes} atletas)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5">
            Sala de Guerra &bull;{" "}
            <span className="text-blue-400">{team.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
            Raio-X de minutagem real das últimas planilhas importadas, alertas de
            oscilação do IDG e estabilidade competitiva.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SquadTeamSelector
            teams={allTeams.map((t) => ({ id: t.id, name: t.name }))}
          />
        </div>
      </div>

      {/* ─── Squad Health Executive KPIs ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-white/[0.08] bg-[#0c101d]/75 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Elenco Monitorado
            </span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-white font-mono mt-2">
            {totalSquadAthletes}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            {activeStartersCount} atletas com alta minutagem recente
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Alta Estabilidade (IDG)
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono mt-2">
            {highStabilityCount}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Oscilação longitudinal &lt; 15% (Elite)
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              Risco de Oscilação
            </span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 font-mono mt-2">
            {criticalInstabilityCount}
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Instabilidade &gt; 30% no Cérebro Tático
          </p>
        </div>

        <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Média do Elenco (IDG)
            </span>
            <TrendingUp className="h-4 w-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-indigo-300 font-mono mt-2">
            {squadMeanIdg.toFixed(1)}%
          </p>
          <p className="text-[11px] text-zinc-400 mt-1">
            Dispersão média da equipe
          </p>
        </div>
      </div>

      {/* ─── Real Squad Roster Data Table ─────────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0b101a]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Status do Elenco &bull; Minutagem e Regularidade
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Valores calculados com base nas planilhas importadas na base.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.03] border-b border-white/10 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Atleta</th>
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Minutagem (L5)</th>
                <th className="px-4 py-3">Estabilidade (IDG)</th>
                <th className="px-4 py-3">Tendência Real</th>
                <th className="px-4 py-3 text-right">Z-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedAthletes.map((a) => {
                const config = STABILITY_CONFIG[a.stabilityCategory];
                return (
                  <tr
                    key={a.id}
                    className="hover:bg-white/[0.03] transition-colors group"
                  >
                    <td className="px-4 py-3.5 font-medium text-white">
                      <Link
                        href={`/performance/athlete/${a.id}`}
                        className="font-bold hover:text-blue-400 transition-colors inline-flex items-center gap-2"
                      >
                        {a.name}
                        <ChevronRight className="h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </td>

                    <td className="px-4 py-3 text-xs text-zinc-400">
                      {a.positionLabel}
                    </td>

                    <td className="px-4 py-3">
                      {a.isStarter ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                          Titular
                        </span>
                      ) : a.isRotation ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md">
                          Rotação
                        </span>
                      ) : a.l5Minutes > 0 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-md">
                          Reserva
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                          Sem Minutos
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 font-mono text-zinc-300">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              a.l5Minutes >= 300
                                ? "bg-emerald-500"
                                : a.l5Minutes >= 150
                                ? "bg-blue-500"
                                : "bg-zinc-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(8, (a.l5Minutes / 450) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-bold font-mono">
                          {a.l5Minutes}&apos;
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      {a.idgScore != null ? (
                        <span
                          className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border ${config.badgeDark}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
                          {a.idgScore.toFixed(1)}% ({config.shortLabel})
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-500 font-mono">N/D</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-end h-5 gap-[2px]">
                        {a.sparkline.map((val, idx) => (
                          <div
                            key={idx}
                            className={`w-1.5 rounded-t-sm ${
                              a.isNegative
                                ? "bg-rose-500/50 group-hover:bg-rose-400"
                                : "bg-emerald-500/50 group-hover:bg-emerald-400"
                            }`}
                            style={{ height: `${val}%` }}
                          />
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div
                        className={`inline-flex items-center justify-end gap-1 font-mono font-bold text-xs ${
                          a.isNegative ? "text-rose-400" : "text-emerald-400"
                        }`}
                      >
                        {a.isNegative ? (
                          <ArrowDown className="w-3 h-3" />
                        ) : (
                          <ArrowUp className="w-3 h-3" />
                        )}
                        {a.zScore}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
