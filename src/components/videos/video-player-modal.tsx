"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Play,
  Calendar,
  Clock,
  ExternalLink,
  User,
  Shield,
  Film,
  Sparkles,
  Loader2,
} from "lucide-react";
import { parseVideoUrl, getCategoryTheme } from "@/lib/video-helpers";
import { POSITION_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface VideoClipItem {
  id: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  category: string;
  timestamp?: string | null;
  createdAt: Date | string;
  athlete: {
    id: string;
    name: string;
    position: string;
    photoUrl?: string | null;
    team?: {
      id: string;
      name: string;
      shortName?: string | null;
      badgeUrl?: string | null;
    } | null;
  };
  match?: {
    id: string;
    competition: string;
    round?: string | null;
    opponentName: string;
    date: Date | string;
  } | null;
}

interface VideoPlayerModalProps {
  clip: VideoClipItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function VideoPlayerModal({ clip, isOpen, onClose }: VideoPlayerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsMediaLoading(true);
    }
  }, [isOpen, clip?.id, clip?.url]);

  // Fecha no Esc e bloqueia scroll do body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !clip) return null;

  const embedInfo = parseVideoUrl(clip.url);
  const theme = getCategoryTheme(clip.category);
  const posLabel = (POSITION_LABELS as Record<string, string>)[clip.athlete.position] ?? clip.athlete.position;
  const matchDate = clip.match?.date
    ? new Date(clip.match.date).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-card/95 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.1)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Superior */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border",
                theme.badgeClass
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", theme.dotClass)} />
              {clip.category}
            </span>

            {clip.timestamp && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-zinc-300 font-mono text-xs">
                <Clock className="h-3 w-3 text-zinc-400" />
                {clip.timestamp}
              </span>
            )}

            {clip.match && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-zinc-400 truncate">
                <Calendar className="h-3 w-3 text-zinc-500 shrink-0" />
                <span className="truncate">
                  {clip.match.competition} &bull; vs {clip.match.opponentName} {matchDate ? `(${matchDate})` : ""}
                </span>
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            title="Fechar (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Video Player Viewport (16:9 Aspect Ratio) */}
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-white/10">
          {/* Loading Fallback Spinner for 4G/5G connections */}
          {isMediaLoading && embedInfo.type !== "other" && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xs text-zinc-400 gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-300">Carregando lance tático...</span>
            </div>
          )}

          {embedInfo.type === "youtube" && embedInfo.embedUrl && (
            <iframe
              src={embedInfo.embedUrl}
              title={clip.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              onLoad={() => setIsMediaLoading(false)}
            />
          )}

          {embedInfo.type === "vimeo" && embedInfo.embedUrl && (
            <iframe
              src={embedInfo.embedUrl}
              title={clip.title}
              className="absolute inset-0 w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsMediaLoading(false)}
            />
          )}

          {embedInfo.type === "mp4" && (
            <video
              src={embedInfo.directUrl}
              controls
              autoPlay
              className="w-full h-full object-contain bg-black"
              onLoadedData={() => setIsMediaLoading(false)}
            >
              Seu navegador não suporta a reprodução deste arquivo de vídeo.
            </video>
          )}

          {embedInfo.type === "other" && (
            <div className="text-center p-8 space-y-4">
              <Film className="h-12 w-12 text-zinc-500 mx-auto" />
              <div>
                <p className="text-sm font-bold text-white">Reprodução Externa Requerida</p>
                <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                  Este vídeo está hospedado em uma plataforma externa. Clique abaixo para abrir no player original.
                </p>
              </div>
              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-colors"
              >
                <span>Assistir no Navegador</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Informações Táticas & Atleta */}
        <div className="p-5 space-y-4 bg-gradient-to-b from-card to-card overflow-y-auto">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug">
              {clip.title}
            </h2>
            {clip.match && (
              <p className="sm:hidden text-xs text-zinc-400 mt-1.5 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                <span>
                  {clip.match.competition} &bull; vs {clip.match.opponentName} {matchDate ? `(${matchDate})` : ""}
                </span>
              </p>
            )}
          </div>

          {/* Card do Atleta Vinculado */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                {clip.athlete.photoUrl ? (
                  <Image
                    src={clip.athlete.photoUrl}
                    alt={clip.athlete.name}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-zinc-400">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">{clip.athlete.name}</h3>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/10 text-zinc-300">
                    {posLabel}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {clip.athlete.team?.name ?? "Atleta Sem Clube"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={`/athletes/${clip.athlete.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Ver Perfil Completo</span>
              </Link>

              <a
                href={clip.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-medium transition-colors"
                title="Abrir URL original"
              >
                <span>Fonte</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
