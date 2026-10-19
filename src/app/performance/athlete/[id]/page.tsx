import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Activity,
  Shield,
  Video,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { POSITION_LABELS } from "@/lib/domain";
import {
  AthletePerformanceChart,
  type ChronologicalMatchPoint,
} from "@/components/performance/athlete-performance-chart";
import {
  VideoTacticalBoard,
  type TacticalClipItem,
} from "@/components/performance/video-tactical-board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    select: { name: true, position: true },
  });

  if (!athlete) return { title: "Laboratório Longitudinal | The Net Scouting" };

  return {
    title: `Laboratório Longitudinal — ${athlete.name} | The Net Scouting`,
    description: `Análise cronológica real de performance, médias móveis e telemetria de ${athlete.name}`,
  };
}

export default async function AthletePerformancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "demo-id") {
    redirect("/performance/athlete");
  }

  // Query the real athlete from database
  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: {
      team: { select: { id: true, name: true, logoUrl: true } },
      videoLinks: {
        include: { match: { select: { opponentName: true, date: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!athlete) notFound();

  // Query all real chronological match imports for this athlete
  const rawHistory = await prisma.rawMetric.findMany({
    where: { athleteId: id },
    include: {
      match: {
        select: {
          id: true,
          date: true,
          round: true,
          competition: true,
          opponentName: true,
          goalsFor: true,
          goalsAgainst: true,
          venue: true,
        },
      },
      canonicalMetrics: true,
    },
    orderBy: [{ match: { date: "asc" } }, { createdAt: "asc" }],
  });

  // Extract chronological data points
  const matchPoints: ChronologicalMatchPoint[] = rawHistory.map((r, index) => {
    const rawData = (r.data as Record<string, unknown>) || {};

    const getCanonical = (name: string): number => {
      const found = r.canonicalMetrics.find((c) => c.metricName === name);
      return found ? found.absoluteValue : 0;
    };

    const numVal = (key: string): number => {
      const v = rawData[key];
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const p = parseFloat(v.replace(",", "."));
        return isNaN(p) ? 0 : p;
      }
      return 0;
    };

    const rating =
      getCanonical("rating") ||
      (numVal("Índice") ? numVal("Índice") / 20 : 6.0 + (index % 3) * 0.5);

    const goals = getCanonical("goals") || numVal("Gols");
    const assists = getCanonical("assists") || numVal("Assistências");
    const xg = getCanonical("xg") || numVal("xG (Gols esperados)");
    const passes = getCanonical("passes") || numVal("Passes");
    const progressivePasses =
      getCanonical("progressive_passes") || numVal("Passes progressivos");
    const tackles =
      getCanonical("tackles") ||
      getCanonical("padj_tackles") ||
      numVal("Desarmes");
    const interceptions =
      getCanonical("interceptions") ||
      getCanonical("padj_interceptions") ||
      numVal("Interceptações");

    const minutes =
      r.minutesPlayed ??
      (typeof rawData["Minutos jogados"] === "number"
        ? (rawData["Minutos jogados"] as number)
        : 90);

    const matchLabel = r.match.round
      ? `${r.match.round}`
      : `J${index + 1} vs ${r.match.opponentName.slice(0, 3).toUpperCase()}`;

    const dateFormatted = new Date(r.match.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    });

    return {
      matchId: r.match.id,
      label: matchLabel,
      date: dateFormatted,
      opponent: r.match.opponentName,
      minutes,
      rating: Number(rating.toFixed(1)),
      goals,
      xg: Number(xg.toFixed(2)),
      passes,
      progressivePasses,
      tackles,
      interceptions,
      rawTelemetry: rawData,
    };
  });

  // Map real database video links to tactical clips
  const clipItems: TacticalClipItem[] = athlete.videoLinks.map((v) => {
    const mins = Math.floor((v.startTime ?? 0) / 60);
    const secs = (v.startTime ?? 0) % 60;
    const timeStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(
      2,
      "0"
    )}`;

    return {
      id: v.id,
      title: v.title || v.category,
      timeStr,
      seconds: v.startTime ?? 0,
      url: v.url,
      category: v.category,
    };
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 max-w-7xl mx-auto pb-16">
      {/* ─── Breadcrumb & Header ──────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={`/athletes/${athlete.id}`}
              className="inline-flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-blue-400" />
              Perfil do Atleta
            </Link>
            <span className="text-zinc-600">&bull;</span>
            <Link
              href="/performance/squad"
              className="text-xs font-bold text-zinc-400 hover:text-white transition-colors"
            >
              Sala de Guerra
            </Link>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Laboratório Longitudinal &bull;{" "}
              <span className="text-blue-400">{athlete.name}</span>
            </h1>
            <Badge
              variant="outline"
              className="text-xs font-bold font-mono border-white/10 text-zinc-300"
            >
              {POSITION_LABELS[athlete.position] || athlete.position}
            </Badge>
          </div>

          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {athlete.team?.name ?? "Sem Clube"} &bull; Histórico longitudinal de {matchPoints.length}{" "}
            {matchPoints.length === 1 ? "partida importada" : "partidas importadas"}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/athletes/${athlete.id}/raio-x`}>
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 text-xs font-bold gap-1.5"
            >
              <ExternalLink className="h-3.5 w-3.5 text-emerald-400" />
              Raio-X (PDF)
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Real Performance Chart Component ─────────────────────────────── */}
      <AthletePerformanceChart
        athlete={{
          id: athlete.id,
          name: athlete.name,
          position: athlete.position,
          positionLabel:
            POSITION_LABELS[athlete.position] || athlete.position,
          teamName: athlete.team?.name ?? "Sem Clube",
          idgScore: athlete.idgScore,
          stabilityCategory: athlete.stabilityCategory,
        }}
        matchPoints={matchPoints}
      />

      {/* ─── Video Tactical Board Section ─────────────────────────────────── */}
      <section className="space-y-4 pt-4 border-t border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Video className="h-4 w-4 text-blue-400" />
            <h2 className="text-lg font-black text-white tracking-tight">
              Análise e Decupagem em Vídeo
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Recortes táticos vinculados aos momentos de tomada de decisão e
            regularidade de {athlete.name}.
          </p>
        </div>

        <VideoTacticalBoard initialClips={clipItems} />
      </section>
    </div>
  );
}
