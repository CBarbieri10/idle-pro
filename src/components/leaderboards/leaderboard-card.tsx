"use client";

import React from "react";
import Link from "next/link";
import {
  Crown,
  Medal,
  Sparkles,
  Flame,
  Target,
  Shield,
  Compass,
  ArrowRight,
  TrendingUp,
  Brain,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeaderboardCardData, LeaderboardPlayer } from "@/lib/actions/leaderboards";

interface LeaderboardCardProps {
  card: LeaderboardCardData;
}

const ACCENT_STYLES = {
  rose: {
    border: "border-rose-500/30 hover:border-rose-500/50",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.12)]",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    rankOneBorder: "border-rose-500/40 bg-gradient-to-r from-rose-950/25 via-card to-card",
    rankOneVal: "text-rose-400",
    barFill: "from-rose-500 to-amber-500",
    icon: Flame,
  },
  indigo: {
    border: "border-indigo-500/30 hover:border-indigo-500/50",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.12)]",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    iconBg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
    rankOneBorder: "border-indigo-500/40 bg-gradient-to-r from-indigo-950/25 via-card to-card",
    rankOneVal: "text-indigo-400",
    barFill: "from-indigo-500 to-purple-500",
    icon: Target,
  },
  cyan: {
    border: "border-cyan-500/30 hover:border-cyan-500/50",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.12)]",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    rankOneBorder: "border-cyan-500/40 bg-gradient-to-r from-cyan-950/25 via-card to-card",
    rankOneVal: "text-cyan-300",
    barFill: "from-cyan-500 to-blue-500",
    icon: Shield,
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.12)]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    rankOneBorder: "border-emerald-500/40 bg-gradient-to-r from-emerald-950/25 via-card to-card",
    rankOneVal: "text-emerald-400",
    barFill: "from-emerald-500 to-teal-500",
    icon: Compass,
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-500/50",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    rankOneBorder: "border-amber-500/40 bg-gradient-to-r from-amber-950/25 via-card to-card",
    rankOneVal: "text-amber-400",
    barFill: "from-amber-500 to-yellow-500",
    icon: Zap,
  },
};

export function LeaderboardCard({ card }: LeaderboardCardProps) {
  const style = ACCENT_STYLES[card.accentColor] || ACCENT_STYLES.indigo;
  const IconComponent = style.icon;

  const leader = card.players[0];
  const runnersUp = card.players.slice(1);

  // Maximum value for horizontal reference bars
  const maxValue = leader?.metricValue || 1;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-3xl border bg-card/90 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-300",
        style.border,
        style.glow
      )}
    >
      {/* ─── Card Header ─────────────────────────────────────────────────── */}
      <div className="space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "h-10 w-10 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm",
                style.iconBg
              )}
            >
              <IconComponent className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
                {card.title}
              </h3>
              <p className="text-[11px] text-zinc-400 font-medium">{card.subtitle}</p>
            </div>
          </div>

          <Badge variant="outline" className={cn("text-[10px] font-mono shrink-0 py-0.5", style.badge)}>
            {card.lessonTag}
          </Badge>
        </div>

        {/* ─── Passo 3: A Assinatura do Analista IA (Cérebro Micro-Insight) ─ */}
        <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="h-2.5 w-2.5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              Assinatura do Analista IA &bull; Cérebro
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            {card.microInsight}
          </p>
        </div>
      </div>

      {/* ─── Leaderboard Players List ────────────────────────────────────── */}
      <div className="my-5 space-y-2.5">
        {card.players.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Nenhum atleta registrado com volume mínimo nesta métrica.
          </div>
        ) : (
          <>
            {/* ─── Rank #1: The Leader Spotlight ─────────────────────────── */}
            {leader && (
              <Link
                href={`/athletes/${leader.id}`}
                className={cn(
                  "group relative block rounded-2xl border p-3.5 transition-all shadow-md hover:scale-[1.01] hover:shadow-xl",
                  style.rankOneBorder
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge with Crown */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-card border border-amber-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                        {leader.photoUrl ? (
                          <img
                            src={leader.photoUrl}
                            alt={leader.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-mono font-bold text-amber-300">
                            {leader.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                        )}
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black shadow-md">
                        <Crown className="h-2.5 w-2.5" />
                      </span>
                    </div>

                    {/* Name & Club */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-amber-300 font-mono">
                          #1
                        </span>
                        <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-amber-300 transition-colors truncate">
                          {leader.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                        {leader.team.logoUrl ? (
                          <img
                            src={leader.team.logoUrl}
                            alt={leader.team.name}
                            className="h-3 w-3 object-contain shrink-0"
                          />
                        ) : null}
                        <span className="truncate">{leader.team.name}</span>
                        <span>&bull;</span>
                        <span className="text-[10px] uppercase font-mono text-zinc-400">
                          {leader.positionLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Value */}
                  <div className="text-right shrink-0">
                    <span
                      className={cn(
                        "text-base sm:text-lg font-black font-mono tracking-tight",
                        style.rankOneVal
                      )}
                    >
                      {leader.formattedValue}
                    </span>
                    {leader.subValue && (
                      <p className="text-[10px] text-zinc-400 font-mono">
                        {leader.subValue}
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Leader Highlight Note if present */}
                {leader.tacticalInsight && (
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400 flex items-center gap-1.5 italic">
                    <Brain className="h-3 w-3 text-cyan-400 shrink-0 not-italic" />
                    <span className="truncate">{leader.tacticalInsight}</span>
                  </div>
                )}
              </Link>
            )}

            {/* ─── Ranks #2 to #5 ────────────────────────────────────────── */}
            <div className="space-y-1.5 pt-1">
              {runnersUp.map((player) => {
                const pct = Math.round((player.metricValue / maxValue) * 100);

                return (
                  <Link
                    key={player.id}
                    href={`/athletes/${player.id}`}
                    className="group flex items-center justify-between p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-[11px] font-mono font-bold text-zinc-400 w-4 text-center shrink-0">
                        #{player.rank}
                      </span>

                      <div className="h-6 w-6 rounded-lg bg-card border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={player.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-zinc-400">
                            {player.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                          {player.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {player.team.shortName || player.team.name} &bull; {player.positionLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-bold text-white">
                        {player.formattedValue}
                      </span>
                      {player.subValue && (
                        <p className="text-[9px] font-mono text-zinc-400">
                          {player.subValue}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ─── Card Footer ─────────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-mono">
          {card.players.length} atletas classificados
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          Unidade: {card.unit}
        </span>
      </div>
    </div>
  );
}
