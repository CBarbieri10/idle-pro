"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Calendar, User, Shield } from "lucide-react";
import { type VideoClipItem } from "./video-player-modal";
import { getCategoryTheme } from "@/lib/video-helpers";
import { POSITION_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";

interface VideoCardProps {
  clip: VideoClipItem;
  onPlay: (clip: VideoClipItem) => void;
}

export function VideoCard({ clip, onPlay }: VideoCardProps) {
  const theme = getCategoryTheme(clip.category);
  const posLabel = (POSITION_LABELS as Record<string, string>)[clip.athlete.position] ?? clip.athlete.position;
  const matchDate = clip.match?.date
    ? new Date(clip.match.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : null;

  return (
    <div
      onClick={() => onPlay(clip)}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0c1018]/80 backdrop-blur-xl overflow-hidden cursor-pointer transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(16,185,129,0.12)]",
        theme.borderHover
      )}
    >
      {/* Top Media Container (16:9 Aspect Ratio) */}
      <div className="relative aspect-video w-full overflow-hidden bg-black/60">
        {clip.thumbnailUrl ? (
          <Image
            src={clip.thumbnailUrl}
            alt={clip.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black">
            <span className="text-zinc-600 font-mono text-xs">Sem Thumbnail</span>
          </div>
        )}

        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/40" />

        {/* Thermal Category Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md",
              theme.badgeClass
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", theme.dotClass)} />
            {clip.category}
          </span>
        </div>

        {/* Timestamp Badge (Bottom Right) */}
        {clip.timestamp && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 border border-white/10 text-[10px] font-mono font-bold text-zinc-300 backdrop-blur-sm">
              <Clock className="h-2.5 w-2.5 text-zinc-400" />
              {clip.timestamp}
            </span>
          </div>
        )}

        {/* Match Date Badge (Bottom Left) */}
        {matchDate && (
          <div className="absolute bottom-2.5 left-2.5 z-10">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-[10px] font-mono text-zinc-400 backdrop-blur-sm">
              <Calendar className="h-2.5 w-2.5 text-zinc-500" />
              {matchDate}
            </span>
          </div>
        )}

        {/* Center Hover Play Button with Neon Pulse */}
        <div className="absolute inset-0 flex items-center justify-center z-10 opacity-70 group-hover:opacity-100 transition-opacity">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-400/40 backdrop-blur-md flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-black group-hover:border-emerald-300 transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Bottom Content Body */}
      <div className="p-4 flex flex-col justify-between flex-1 gap-3">
        <div>
          {/* Tactical Title */}
          <h3 className="font-bold text-sm text-white line-clamp-2 leading-snug group-hover:text-emerald-300 transition-colors">
            {clip.title}
          </h3>

          {/* Match Context if Available */}
          {clip.match && (
            <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
              {clip.match.competition} &bull; vs {clip.match.opponentName}
            </p>
          )}
        </div>

        {/* Athlete Footer Strip */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="relative h-7 w-7 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0">
              {clip.athlete.photoUrl ? (
                <Image
                  src={clip.athlete.photoUrl}
                  alt={clip.athlete.name}
                  fill
                  className="object-cover"
                  sizes="28px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-zinc-500">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <span className="block text-xs font-bold text-zinc-200 truncate group-hover:text-white">
                {clip.athlete.name}
              </span>
              <span className="block text-[10px] text-zinc-500 truncate">
                {clip.athlete.team?.name ?? "Sem Clube"} &bull; {posLabel}
              </span>
            </div>
          </div>

          <span className="text-[10px] font-mono text-emerald-400/80 group-hover:text-emerald-400 font-bold shrink-0">
            Assistir &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}
