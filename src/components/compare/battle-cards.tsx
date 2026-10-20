"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  X,
  Swords,
} from "lucide-react";
import { type CompareAthleteDetailed } from "@/lib/actions/compare";
import { getClubColors } from "@/lib/club-colors";
import { useCompareStore } from "@/lib/stores/compare-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BattleCardsProps {
  athletes: CompareAthleteDetailed[];
}

export function BattleCards({ athletes }: BattleCardsProps) {
  const { removeAthlete } = useCompareStore();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {athletes.map((a, index) => {
        const clubColors = getClubColors(a.team?.name);
        const letter = String.fromCharCode(65 + index); // "A", "B", "C"

        return (
          <div
            key={a.id}
            className="group relative flex flex-col justify-between rounded-2xl border bg-[#0c101d]/90 backdrop-blur-xl p-4.5 shadow-2xl transition-all duration-300"
            style={{
              borderColor: `${a.color}50`,
              boxShadow: `0 16px 36px rgba(0,0,0,0.6), 0 0 20px ${a.color}15`,
            }}
          >
            {/* ─── Topo: Indicador de Batalha (Atleta A/B/C) e Clube Canônico ────── */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-black text-black"
                  style={{ backgroundColor: a.color }}
                >
                  ATLETA {letter}
                </span>

                <Badge
                  variant="outline"
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border-white/15 text-zinc-300"
                >
                  {a.positionLabel}
                </Badge>
              </div>

              {/* Clube Canônico com Escudo */}
              <div className="flex items-center gap-1.5 shrink-0">
                {a.team?.logoUrl ? (
                  <div className="h-5 w-5 relative overflow-hidden rounded">
                    <img
                      src={a.team.logoUrl}
                      alt={a.team.name}
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
                  className="text-[11px] font-bold truncate max-w-[100px]"
                  style={{
                    color:
                      clubColors.primaryColor === "#ffffff"
                        ? "#ffffff"
                        : clubColors.primaryColor,
                  }}
                >
                  {a.team?.shortName || a.team?.name || "Sem Clube"}
                </span>
              </div>
            </div>

            {/* ─── Centro: Foto, Nome e Biometria ──────────────────────────────── */}
            <div className="py-4 flex items-center gap-3.5">
              <div
                className="relative h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border-2 flex items-center justify-center shrink-0 shadow-lg"
                style={{ borderColor: a.color }}
              >
                {a.photoUrl ? (
                  <Image
                    src={a.photoUrl}
                    alt={a.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="font-mono font-black text-sm text-zinc-300">
                    {a.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/athletes/${a.id}`}
                  className="font-black text-base text-white hover:text-emerald-300 transition-colors block truncate"
                >
                  {a.name}
                </Link>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-1 flex-wrap">
                  {a.age ? <span>{a.age} anos</span> : null}
                  {a.height ? (
                    <>
                      <span>&bull;</span>
                      <span>{a.height}cm</span>
                    </>
                  ) : null}
                  {a.footLabel && <span>&bull; Pé {a.footLabel}</span>}
                </div>
              </div>
            </div>

            {/* ─── Badges Térmicas (Z-Score & IDG) ─────────────────────────────── */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
              {/* Z-Score */}
              <div
                className={cn(
                  "p-2 rounded-xl border flex flex-col justify-between",
                  a.isNegative
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase opacity-75">
                    Z-Score
                  </span>
                  {a.isNegative ? (
                    <AlertTriangle className="h-3 w-3 text-rose-400" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                  )}
                </div>
                <span className="font-mono font-black text-sm mt-0.5">
                  {a.zScore}
                </span>
              </div>

              {/* IDG */}
              <div className="p-2 rounded-xl border border-white/10 bg-white/[0.03] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono font-bold uppercase text-zinc-400">
                    IDG (Oscilação)
                  </span>
                  <Sparkles className="h-3 w-3 text-cyan-400 opacity-80" />
                </div>
                <span className="font-mono font-black text-sm text-cyan-300 mt-0.5">
                  {a.idgScore != null ? `${a.idgScore.toFixed(1)}%` : "—"}
                </span>
              </div>
            </div>

            {/* ─── Rodapé: Link para Dossiê ────────────────────────────────────── */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-xs">
              <span className="text-[11px] font-mono text-zinc-500">
                {a.totalMinutes}m jogados ({a.matchesCount} jogos)
              </span>

              <Link
                href={`/athletes/${a.id}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors"
              >
                <span>Ver Dossiê</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
