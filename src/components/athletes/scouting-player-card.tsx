"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Shield,
  ArrowRight,
  Clock,
  User,
} from "lucide-react";
import { type ScoutingAthleteCardData } from "@/lib/actions/athletes";
import { getClubColors } from "@/lib/club-colors";
import { Badge } from "@/components/ui/badge";
import { AddToPortfolioDialog } from "@/components/portfolio/add-to-portfolio-dialog";
import { CompareButton } from "@/components/compare/compare-button";
import { cn } from "@/lib/utils";

interface ScoutingPlayerCardProps {
  athlete: ScoutingAthleteCardData;
}

export function ScoutingPlayerCard({ athlete }: ScoutingPlayerCardProps) {
  const clubColors = getClubColors(athlete.team?.name);

  // Determina estilo térmico do IDG
  const isHighStability = athlete.idgScore != null && athlete.idgScore < 20;
  const isModerateStability =
    athlete.idgScore != null && athlete.idgScore >= 20 && athlete.idgScore <= 30;

  return (
    <Link
      href={`/athletes/${athlete.id}`}
      className={cn(
        "group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0c101d]/85 backdrop-blur-xl p-4.5 shadow-xl transition-all duration-300",
        "hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-[#111728]/95",
        "hover:shadow-[0_16px_36px_rgba(0,0,0,0.6),0_0_24px_rgba(16,185,129,0.15)]"
      )}
    >
      {/* ─── Topo: Posição, Número, Clube Canônico e Bookmark ─────────────────── */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border-white/15 text-zinc-200 truncate"
          >
            {athlete.positionLabel}
          </Badge>

          {athlete.jerseyNumber && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-zinc-400">
              #{athlete.jerseyNumber}
            </span>
          )}
        </div>

        {/* Lado Direito: Clube Canônico + Ação Rápida de Bookmark */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 shrink-0">
            {athlete.team?.logoUrl ? (
              <div className="h-5 w-5 relative overflow-hidden rounded">
                <img
                  src={athlete.team.logoUrl}
                  alt={athlete.team.name}
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className="h-4 w-4 rounded-full border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: clubColors.primaryColor,
                  borderColor: clubColors.secondaryColor,
                }}
              >
                <Shield className="h-2.5 w-2.5 text-white" />
              </div>
            )}
            <span
              className="text-[11px] font-bold truncate max-w-[85px]"
              style={{
                color: clubColors.primaryColor === "#ffffff" ? "#ffffff" : clubColors.primaryColor,
              }}
            >
              {athlete.team?.shortName || athlete.team?.name || "Sem Clube"}
            </span>
          </div>

          {/* Botão de Comparação Rápida (Head-to-Head) */}
          <CompareButton
            athlete={{
              id: athlete.id,
              name: athlete.name,
              position: athlete.positionLabel,
              photoUrl: athlete.photoUrl,
              teamName: athlete.team?.name,
              jerseyNumber: athlete.jerseyNumber,
            }}
            variant="icon"
          />

          {/* Botão de Ação Rápida: Bookmark / Shadow Board */}
          <AddToPortfolioDialog
            athleteId={athlete.id}
            athleteName={athlete.name}
            athletePosition={athlete.positionLabel}
            athleteClub={athlete.team?.name ?? undefined}
            variant="icon"
          />
        </div>
      </div>

      {/* ─── Centro: Foto, Nome e Biometria ──────────────────────────────────── */}
      <div className="py-3 flex items-center gap-3.5">
        <div className="relative h-14 w-14 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-md group-hover:border-emerald-500/40 transition-colors">
          {athlete.photoUrl ? (
            <Image
              src={athlete.photoUrl}
              alt={athlete.name}
              fill
              className="object-cover"
              sizes="56px"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-zinc-400 font-mono font-bold text-sm bg-black/40">
              {athlete.name
                .split(" ")
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-black text-sm text-white group-hover:text-emerald-300 transition-colors truncate">
            {athlete.name}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1 flex-wrap">
            {athlete.age ? <span>{athlete.age} anos</span> : null}
            {athlete.height ? (
              <>
                <span>&bull;</span>
                <span>{athlete.height}cm</span>
              </>
            ) : null}
            {athlete.footPreference && athlete.footPreference !== "UNKNOWN" ? (
              <>
                <span>&bull;</span>
                <span>Pé {athlete.footLabel}</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* ─── Badges Térmicas Principais (Z-Score & IDG Brilhando) ─────────────── */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
        {/* Z-Score Térmico */}
        <div
          className={cn(
            "p-2 rounded-xl border flex flex-col justify-between transition-all",
            athlete.isNegative
              ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.18)]"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.22)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">
              Z-Score
            </span>
            {athlete.isNegative ? (
              <AlertTriangle className="h-3 w-3 text-rose-400" />
            ) : (
              <TrendingUp className="h-3 w-3 text-emerald-400" />
            )}
          </div>
          <span className="font-mono font-black text-sm mt-0.5">
            {athlete.zScore}
          </span>
        </div>

        {/* IDG Térmico */}
        <div
          className={cn(
            "p-2 rounded-xl border flex flex-col justify-between transition-all",
            isHighStability
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.22)]"
              : isModerateStability
              ? "bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.18)]"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-75">
              IDG
            </span>
            <Sparkles className="h-3 w-3 opacity-80" />
          </div>
          <span className="font-mono font-black text-sm mt-0.5">
            {athlete.idgScore != null ? `${athlete.idgScore.toFixed(1)}%` : "—"}
          </span>
        </div>
      </div>

      {/* ─── Rodapé: Minutagem e CTA ─────────────────────────────────────────── */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Clock className="h-3 w-3 text-zinc-500" />
          <span>{athlete.totalMinutes}m jogados</span>
        </div>

        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 group-hover:translate-x-0.5 transition-transform">
          <span>Abrir Dossiê</span>
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
  );
}
