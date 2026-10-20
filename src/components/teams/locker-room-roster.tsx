"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  FileText,
  User,
  Shield,
  Layers,
  ArrowRight,
  Play,
} from "lucide-react";
import { ShirtSVG } from "@/components/ui/shirt-svg";
import { getClubColors } from "@/lib/club-colors";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface LockerRoomAthlete {
  id: string;
  name: string;
  position: string;
  positionLabel?: string;
  jerseyNumber?: string | number | null;
  photoUrl?: string | null;
  totalMinutes?: number | null;
  l5Minutes?: number | null;
  idgScore?: number | null;
  stabilityCategory?: string | null;
  zScore?: string | null;
  zScoreVal?: number | null;
  isNegative?: boolean;
  tacticalTitle?: string | null;
}

interface LockerRoomRosterProps {
  athletes: LockerRoomAthlete[];
  teamName: string;
  className?: string;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function LockerRoomRoster({
  athletes = [],
  teamName,
  className,
}: LockerRoomRosterProps) {
  // Configuração do Embla Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    dragFree: false,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index);
    },
    [emblaApi]
  );

  // Cores oficiais do clube
  const clubColors = useMemo(() => getClubColors(teamName), [teamName]);

  // Atleta em foco
  const activeAthlete = athletes[selectedIndex] || athletes[0] || null;

  if (athletes.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#0c1018]/60 p-8 text-center backdrop-blur-xl">
        <p className="text-zinc-400 text-sm">
          Nenhum atleta cadastrado no elenco de {teamName}.
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        "relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#0b101c]/90 via-[#070b14]/95 to-[#05080e]/95 p-4 sm:p-6 shadow-2xl backdrop-blur-2xl overflow-hidden space-y-6",
        className
      )}
      aria-label="Vestiário Interativo"
    >
      {/* ─── Brilho de Fundo com as Cores do Clube ─────────────────────────── */}
      <div
        className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: clubColors.primaryColor }}
      />

      {/* ─── Topo do Vestiário: Título & Controles ──────────────────────────── */}
      <div className="relative z-10 flex items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-2xl border flex items-center justify-center shadow-lg shrink-0 transition-colors"
            style={{
              backgroundColor: `${clubColors.primaryColor}25`,
              borderColor: `${clubColors.primaryColor}60`,
              color: clubColors.primaryColor === "#ffffff" ? "#111111" : clubColors.primaryColor,
            }}
          >
            <Shield className="h-5 w-5 fill-current" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white font-serif">
                Vestiário Interativo
              </h2>
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${clubColors.primaryColor}20`,
                  color: clubColors.primaryColor === "#ffffff" ? "#ffffff" : clubColors.primaryColor,
                  borderColor: `${clubColors.primaryColor}40`,
                }}
              >
                {teamName}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Deslize para navegar pelas camisas oficiais do elenco e decupar o atleta
            </p>
          </div>
        </div>

        {/* Setas de Navegação Desktop */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block text-xs font-mono text-zinc-400 mr-2">
            <strong className="text-white">{selectedIndex + 1}</strong> / {athletes.length}
          </span>
          <button
            onClick={scrollPrev}
            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
            aria-label="Atleta anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={scrollNext}
            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition-all active:scale-95"
            aria-label="Próximo atleta"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ─── Carrossel Horizontal Contínuo de Camisas ──────────────────────── */}
      <div className="relative z-10 w-full overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 touch-pan-y py-4 sm:py-6">
          {athletes.map((athlete, idx) => {
            const isSelected = idx === selectedIndex;
            const jerseyNumber = athlete.jerseyNumber ?? idx + 1;

            return (
              <div
                key={athlete.id}
                onClick={() => scrollTo(idx)}
                className="flex-[0_0_58%] sm:flex-[0_0_36%] md:flex-[0_0_28%] lg:flex-[0_0_22%] min-w-0 pl-4 select-none flex flex-col items-center justify-center transition-all duration-300 cursor-pointer"
              >
                {/* Camisa com Transição Suave e Física de Foco */}
                <div
                  className={cn(
                    "relative w-40 sm:w-44 md:w-48 aspect-[240/280] transition-all duration-300 ease-out transform",
                    isSelected
                      ? "scale-110 opacity-100 z-20 drop-shadow-[0_20px_35px_rgba(0,0,0,0.9)] filter brightness-105"
                      : "scale-90 opacity-45 z-10 hover:opacity-75 filter contrast-90"
                  )}
                >
                  <ShirtSVG
                    number={jerseyNumber}
                    playerName={athlete.name}
                    primaryColor={clubColors.primaryColor}
                    secondaryColor={clubColors.secondaryColor}
                    textColor={clubColors.textColor}
                    showHanger={true}
                  />

                  {/* Indicador pulsante no centro da camisa ativa */}
                  {isSelected && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/80 border border-white/20 text-[10px] font-mono font-bold text-white shadow-lg backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>EM FOCO</span>
                    </div>
                  )}
                </div>

                {/* Nome rápido abaixo da camisa */}
                <div className="mt-4 text-center">
                  <p
                    className={cn(
                      "text-xs font-bold truncate max-w-[150px] transition-colors",
                      isSelected ? "text-white text-sm" : "text-zinc-500"
                    )}
                  >
                    {athlete.name}
                  </p>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                    {athlete.positionLabel || athlete.position}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Indicadores Rápidos em Pontos (Mobile Thumb Navigation) ─────────── */}
      <div className="flex items-center justify-center gap-1.5 pt-1 pb-1 overflow-x-auto no-scrollbar">
        {athletes.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              idx === selectedIndex
                ? "w-6 bg-emerald-400"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            )}
            aria-label={`Ir para camisa ${idx + 1}`}
          />
        ))}
      </div>

      {/* ─── Painel Dinâmico de Decupagem (Data Panel) ─────────────────────── */}
      {activeAthlete && (
        <div
          key={activeAthlete.id}
          className="relative z-10 rounded-2xl border border-white/10 bg-[#0c121e]/85 backdrop-blur-xl p-5 shadow-2xl animate-in fade-in duration-300"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Bloco 1: Avatar, Nome e Posição */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/15 flex items-center justify-center shrink-0 shadow-lg">
                {activeAthlete.photoUrl ? (
                  <Image
                    src={activeAthlete.photoUrl}
                    alt={activeAthlete.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <span className="text-base font-black font-mono text-emerald-400">
                    {getInitials(activeAthlete.name)}
                  </span>
                )}
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                    {activeAthlete.name}
                  </h3>
                  <Badge className="bg-white/10 text-zinc-300 text-[10px] font-mono border-white/10">
                    #{activeAthlete.jerseyNumber ?? selectedIndex + 1}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="font-bold text-emerald-400">
                    {activeAthlete.positionLabel || activeAthlete.position}
                  </span>
                  <span>&bull;</span>
                  <span className="truncate">{teamName}</span>
                  {activeAthlete.tacticalTitle && (
                    <>
                      <span>&bull;</span>
                      <span className="text-zinc-300 font-medium truncate">
                        {activeAthlete.tacticalTitle}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bloco 2: Badges Térmicas de Decupagem Rápida */}
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
              {/* Minutagem */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span>
                  <strong className="text-white font-mono">
                    {activeAthlete.totalMinutes ?? (activeAthlete.l5Minutes ?? 0)}
                  </strong>{" "}
                  minutos
                </span>
                {activeAthlete.l5Minutes != null && (
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ({activeAthlete.l5Minutes}m L5)
                  </span>
                )}
              </div>

              {/* Z-Score Térmico */}
              {activeAthlete.zScore != null && (
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-xs",
                    activeAthlete.isNegative
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  )}
                >
                  {activeAthlete.isNegative ? (
                    <AlertTriangle className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingUp className="h-3.5 w-3.5" />
                  )}
                  <span>Z-Score {activeAthlete.zScore}</span>
                  <span className="text-[10px] opacity-80 font-sans font-normal">
                    {activeAthlete.isNegative ? "Oscilação" : "Alta Performance"}
                  </span>
                </div>
              )}

              {/* IDG Score */}
              {activeAthlete.idgScore != null && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-300 font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  <span>
                    IDG: <strong className="text-white">{activeAthlete.idgScore.toFixed(1)}%</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Bloco 3: Call-to-Action (Abrir Raio-X Dossiê) */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
              <Link
                href={`/athletes/${activeAthlete.id}`}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.35)] active:scale-95 w-full sm:w-auto"
              >
                <FileText className="h-4 w-4" />
                <span>Abrir Raio-X (Dossiê)</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
