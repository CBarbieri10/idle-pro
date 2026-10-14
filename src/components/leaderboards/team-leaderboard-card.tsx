"use client";

import React from "react";
import Link from "next/link";
import {
  Crown,
  Shield,
  Flame,
  Target,
  Sparkles,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Brain,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TeamLeaderboardCardData, LeaderboardTeam } from "@/lib/actions/leaderboards";

interface TeamLeaderboardCardProps {
  card: TeamLeaderboardCardData;
}

const ACCENT_STYLES = {
  rose: {
    border: "border-rose-500/30 hover:border-rose-500/50",
    glow: "shadow-[0_0_30px_rgba(244,63,94,0.12)]",
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    iconBg: "bg-rose-500/15 border-rose-500/30 text-rose-400",
    rankOneBorder: "border-rose-500/40 bg-gradient-to-r from-rose-950/25 via-[#101422] to-[#0c0f1a]",
    rankOneVal: "text-rose-400",
    icon: Flame,
  },
  indigo: {
    border: "border-indigo-500/30 hover:border-indigo-500/50",
    glow: "shadow-[0_0_30px_rgba(99,102,241,0.12)]",
    badge: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
    iconBg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-400",
    rankOneBorder: "border-indigo-500/40 bg-gradient-to-r from-indigo-950/25 via-[#101422] to-[#0c0f1a]",
    rankOneVal: "text-indigo-400",
    icon: Target,
  },
  cyan: {
    border: "border-cyan-500/30 hover:border-cyan-500/50",
    glow: "shadow-[0_0_30px_rgba(6,182,212,0.12)]",
    badge: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
    iconBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400",
    rankOneBorder: "border-cyan-500/40 bg-gradient-to-r from-cyan-950/25 via-[#101422] to-[#0c0f1a]",
    rankOneVal: "text-cyan-300",
    icon: Shield,
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-500/50",
    glow: "shadow-[0_0_30px_rgba(16,185,129,0.12)]",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    iconBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400",
    rankOneBorder: "border-emerald-500/40 bg-gradient-to-r from-emerald-950/25 via-[#101422] to-[#0c0f1a]",
    rankOneVal: "text-emerald-400",
    icon: Compass,
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-500/50",
    glow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    iconBg: "bg-amber-500/15 border-amber-500/30 text-amber-400",
    rankOneBorder: "border-amber-500/40 bg-gradient-to-r from-amber-950/25 via-[#101422] to-[#0c0f1a]",
    rankOneVal: "text-amber-400",
    icon: Target,
  },
};

export function TeamLeaderboardCard({ card }: TeamLeaderboardCardProps) {
  const style = ACCENT_STYLES[card.accentColor] || ACCENT_STYLES.cyan;
  const IconComponent = style.icon;

  const leader = card.teams[0];
  const runnersUp = card.teams.slice(1);

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-3xl border bg-[#090d18]/90 backdrop-blur-2xl p-5 sm:p-6 transition-all duration-300",
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

        {/* ─── Passo 4: Assinatura do Analista IA (Coletiva) ───────────────── */}
        <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-4 w-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sparkles className="h-2.5 w-2.5" />
            </div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              Assinatura do Analista IA &bull; Comportamento Coletivo
            </span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            {card.microInsight}
          </p>
        </div>
      </div>

      {/* ─── Teams List ──────────────────────────────────────────────────── */}
      <div className="my-5 space-y-2.5">
        {card.teams.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500">
            Nenhum clube com dados computados nesta dimensão.
          </div>
        ) : (
          <>
            {/* ─── Rank #1: The Leader Club Spotlight ────────────────────── */}
            {leader && (
              <Link
                href="/teams"
                className={cn(
                  "group relative block rounded-2xl border p-3.5 transition-all shadow-md hover:scale-[1.01] hover:shadow-xl",
                  style.rankOneBorder
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge with Crown */}
                    <div className="relative shrink-0">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-[#141b2d] border border-amber-400/40 flex items-center justify-center p-1.5 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                        {leader.logoUrl ? (
                          <img
                            src={leader.logoUrl}
                            alt={leader.name}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <Shield className="h-5 w-5 text-amber-300" />
                        )}
                      </div>
                      <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-amber-400 text-black flex items-center justify-center text-[10px] font-black shadow-md">
                        <Crown className="h-2.5 w-2.5" />
                      </span>
                    </div>

                    {/* Name & Squad */}
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
                        {leader.city && <span>{leader.city}</span>}
                        {leader.city && <span>&bull;</span>}
                        <span className="text-[10px] font-mono text-zinc-400 flex items-center gap-1">
                          <Users className="h-3 w-3 text-cyan-400" />
                          {leader.athleteCount} atletas no elenco
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

                {/* AI Leader Highlight */}
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
              {runnersUp.map((team) => (
                <Link
                  key={team.id}
                  href="/teams"
                  className="group flex items-center justify-between p-2 sm:px-3 sm:py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition-all text-left"
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-[11px] font-mono font-bold text-zinc-400 w-4 text-center shrink-0">
                      #{team.rank}
                    </span>

                    <div className="h-6 w-6 rounded-lg bg-[#141b2d] border border-white/10 overflow-hidden flex items-center justify-center p-0.5 shrink-0">
                      {team.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Shield className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-200 group-hover:text-white truncate">
                        {team.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">
                        {team.shortName || team.name} &bull; {team.athleteCount} atletas
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-mono font-bold text-white">
                      {team.formattedValue}
                    </span>
                    {team.subValue && (
                      <p className="text-[9px] font-mono text-zinc-400">
                        {team.subValue}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ─── Card Footer ─────────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
        <span className="font-mono">
          {card.teams.length} clubes ranqueados
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          Unidade: {card.unit}
        </span>
      </div>
    </div>
  );
}
