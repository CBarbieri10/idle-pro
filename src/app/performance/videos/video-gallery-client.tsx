"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  Film,
  Video,
  X,
  Sparkles,
  Users,
  Layers,
  ChevronDown,
} from "lucide-react";
import { VideoCard } from "@/components/videos/video-card";
import { VideoPlayerModal, type VideoClipItem } from "@/components/videos/video-player-modal";
import { getCategoryTheme } from "@/lib/video-helpers";
import { cn } from "@/lib/utils";

interface VideoGalleryClientProps {
  initialClips: VideoClipItem[];
}

export function VideoGalleryClient({ initialClips }: VideoGalleryClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("ALL");
  const [activeClip, setActiveClip] = useState<VideoClipItem | null>(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);

  // Lista única de atletas para o filtro
  const athletesList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; teamName?: string | null; count: number }>();
    for (const clip of initialClips) {
      const existing = map.get(clip.athlete.id);
      if (existing) {
        existing.count++;
      } else {
        map.set(clip.athlete.id, {
          id: clip.athlete.id,
          name: clip.athlete.name,
          teamName: clip.athlete.team?.name ?? "Sem Clube",
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [initialClips]);

  // Lista de categorias presentes + contagem
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const clip of initialClips) {
      counts[clip.category] = (counts[clip.category] || 0) + 1;
    }
    return counts;
  }, [initialClips]);

  const presentCategories = useMemo(() => {
    return Object.keys(categoryStats).sort();
  }, [categoryStats]);

  // Filtragem combinada
  const filteredClips = useMemo(() => {
    return initialClips.filter((clip) => {
      // 1. Busca textual
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesTitle = clip.title.toLowerCase().includes(query);
        const matchesAthlete = clip.athlete.name.toLowerCase().includes(query);
        const matchesTeam = clip.athlete.team?.name?.toLowerCase().includes(query) ?? false;
        const matchesCategory = clip.category.toLowerCase().includes(query);
        const matchesMatch = clip.match?.opponentName?.toLowerCase().includes(query) ?? false;

        if (!matchesTitle && !matchesAthlete && !matchesTeam && !matchesCategory && !matchesMatch) {
          return false;
        }
      }

      // 2. Filtro de Categoria
      if (selectedCategory !== "ALL" && clip.category !== selectedCategory) {
        return false;
      }

      // 3. Filtro de Atleta
      if (selectedAthleteId !== "ALL" && clip.athlete.id !== selectedAthleteId) {
        return false;
      }

      return true;
    });
  }, [initialClips, searchTerm, selectedCategory, selectedAthleteId]);

  const hasActiveFilters = searchTerm.trim() !== "" || selectedCategory !== "ALL" || selectedAthleteId !== "ALL";

  function clearAllFilters() {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSelectedAthleteId("ALL");
  }

  function handlePlayClip(clip: VideoClipItem) {
    setActiveClip(clip);
    setIsPlayerOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* ─── Barra de Filtros Inteligentes (Frosted Glass) ─────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.1] bg-card/70 backdrop-blur-xl p-4 sm:p-5 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Input de Busca Textual */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por lance, atleta, clube ou momento tático..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-all text-xs sm:text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filtro por Atleta */}
          <div className="relative min-w-[220px]">
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400 pointer-events-none" />
              <select
                value={selectedAthleteId}
                onChange={(e) => setSelectedAthleteId(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white appearance-none text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500/60 transition-colors cursor-pointer"
              >
                <option value="ALL">Todos os Atletas ({athletesList.length})</option>
                {athletesList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.count} {a.count === 1 ? "vídeo" : "vídeos"})
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-all shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>

        {/* Category Pills (Thermal Badges) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar border-t border-white/[0.06]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1 flex items-center gap-1.5">
            <Filter className="w-3 h-3 text-emerald-400" />
            Categorias:
          </span>

          <button
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
              selectedCategory === "ALL"
                ? "bg-white/15 text-white border-white/30 shadow-sm"
                : "bg-white/[0.02] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
            )}
          >
            Todas ({initialClips.length})
          </button>

          {presentCategories.map((cat) => {
            const theme = getCategoryTheme(cat);
            const isSelected = selectedCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border",
                  isSelected
                    ? theme.badgeClass
                    : "bg-white/[0.02] text-zinc-400 border-white/5 hover:text-zinc-200 hover:border-white/10"
                )}
              >
                <span className={cn("h-1.5 w-1.5 rounded-full", theme.dotClass)} />
                <span>{cat}</span>
                <span className="text-[10px] opacity-75 font-mono">({categoryStats[cat]})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Barra de Estatísticas de Filtro ───────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
        <p className="flex items-center gap-2">
          <span>Exibindo</span>
          <strong className="text-emerald-400 font-mono font-black">{filteredClips.length}</strong>
          <span>de {initialClips.length} decupagens táticas cadastradas</span>
        </p>

        {selectedAthleteId !== "ALL" && (
          <span className="text-zinc-400 hidden sm:inline">
            Filtro ativo por atleta &bull;{" "}
            <strong className="text-white">
              {athletesList.find((a) => a.id === selectedAthleteId)?.name}
            </strong>
          </span>
        )}
      </div>

      {/* ─── Galeria de Vídeos (Grid Frosted Glass) ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredClips.map((clip) => (
          <VideoCard key={clip.id} clip={clip} onPlay={handlePlayClip} />
        ))}

        {/* Empty State */}
        {filteredClips.length === 0 && (
          <div className="col-span-full py-20 px-4 text-center rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500 mb-4 shadow-inner">
              <Film className="h-8 w-8 opacity-60 text-emerald-400" />
            </div>
            <h3 className="text-base font-bold text-white">Nenhum vídeo tático encontrado</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 mb-5">
              Não encontramos nenhum recorte correspondente aos filtros de busca aplicados.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                <X className="w-4 h-4" />
                <span>Resetar Todos os Filtros</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Modal Interativo de Vídeo Player ─────────────────────────────────────── */}
      <VideoPlayerModal
        clip={activeClip}
        isOpen={isPlayerOpen}
        onClose={() => {
          setIsPlayerOpen(false);
          setActiveClip(null);
        }}
      />
    </div>
  );
}
