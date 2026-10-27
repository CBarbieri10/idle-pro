"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Film, Play, Sparkles, ExternalLink, Calendar, Clock, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoCard } from "@/components/videos/video-card";
import { VideoPlayerModal, type VideoClipItem } from "@/components/videos/video-player-modal";
import { cn } from "@/lib/utils";

interface AthleteVideoClipsSectionProps {
  athlete: {
    id: string;
    name: string;
    position: string;
    photoUrl?: string | null;
    team?: {
      id: string;
      name: string;
    } | null;
  };
  clips: VideoClipItem[];
}

export function AthleteVideoClipsSection({ athlete, clips }: AthleteVideoClipsSectionProps) {
  const [selectedClip, setSelectedClip] = useState<VideoClipItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  function handlePlay(clip: VideoClipItem) {
    setSelectedClip(clip);
    setIsPlayerOpen(true);
  }

  return (
    <Card className="rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-card/90 via-card/95 to-card/95 p-6 shadow-2xl backdrop-blur-xl space-y-5" id="athlete-video-clips">
      {/* ─── Header da Seção ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white">
                Central de Vídeos Táticos
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono font-bold py-0.5">
                {clips.length} {clips.length === 1 ? "lance decupado" : "lances decupados"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Recortes de performance, tomadas de decisão e lances-chave exclusivos de {athlete.name}
            </p>
          </div>
        </div>

        <Link
          href="/performance/videos"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all shrink-0"
        >
          <span>Abrir Central Global</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* ─── Grid de Vídeos do Atleta ────────────────────────────────────────── */}
      {clips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clips.map((clip) => (
            <VideoCard key={clip.id} clip={clip} onPlay={handlePlay} />
          ))}
        </div>
      ) : (
        <div className="py-10 px-4 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
          <div className="mx-auto h-12 w-12 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
            <Video className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">Nenhum clipe tático indexado ainda</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
            Os lances decupados vinculados a este atleta aparecerão automaticamente nesta seção assim que forem ingeridos ou registrados.
          </p>
          <Link
            href="/performance/videos"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Explorar Galeria Geral de Vídeos</span>
          </Link>
        </div>
      )}

      {/* ─── Modal com Player Integrado ───────────────────────────────────────── */}
      <VideoPlayerModal
        clip={selectedClip}
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false);
          setSelectedClip(null);
        }}
      />
    </Card>
  );
}
