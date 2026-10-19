import { prisma } from "@/lib/prisma";
import { VideoGalleryClient } from "./video-gallery-client";
import { Film, Sparkles, Video, Play, Users, Calendar } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central de Vídeos Táticos • The Net Scouting",
  description: "Repositório global de decupagens táticas, recortes de lances e análise em vídeo de atletas e partidas.",
};

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  const clips = await prisma.videoClip.findMany({
    include: {
      athlete: {
        include: {
          team: true,
        },
      },
      match: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Estatísticas do cabeçalho
  const totalClips = clips.length;
  const uniqueAthletes = new Set(clips.map((c) => c.athleteId)).size;
  const uniqueMatches = new Set(clips.map((c) => c.matchId).filter(Boolean)).size;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* ─── Hero Header Executivo ────────────────────────────────────────────── */}
      <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0c1424] via-[#090d16] to-[#0d161a] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Decupagem Tática 2.0
              </span>
              <span className="text-xs font-mono text-zinc-400">Tríade Analítica do Scouting</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight flex items-center gap-3">
              <span>Central de Vídeos Táticos</span>
            </h1>

            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Repositório unificado de recortes táticos, finalizações, passes progressivos e ações defensivas conectadas diretamente aos atletas e confrontos do campeonato.
            </p>
          </div>

          {/* Quick Stats Tiles */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Clipes</span>
              <span className="text-xl font-black font-mono text-emerald-400">{totalClips}</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Atletas</span>
              <span className="text-xl font-black font-mono text-cyan-400">{uniqueAthletes}</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center min-w-[90px]">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Partidas</span>
              <span className="text-xl font-black font-mono text-indigo-400">{uniqueMatches}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Galeria Interativa com Filtros e Player Modal ────────────────────── */}
      <VideoGalleryClient initialClips={clips} />
    </div>
  );
}
