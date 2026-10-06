"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Swords,
  Star,
  Users,
  Search,
  ExternalLink,
  Sparkles,
  Shield,
  Activity,
  Flame,
  Award,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AthleteTelemetryModal } from "@/components/athletes/athlete-telemetry-modal";
import { POSITION_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type {
  H2HMetric,
  MatchAthletePerformance,
} from "@/lib/actions/matches";
import type { Position } from "@prisma/client";

interface TeamSummary {
  id?: string | null;
  name: string;
  shortName: string;
  city?: string | null;
  possession: number;
}

interface MatchH2HStatsProps {
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  h2hMetrics: H2HMetric[];
  featuredAthletes: MatchAthletePerformance[];
}

export function MatchH2HStats({
  homeTeam,
  awayTeam,
  h2hMetrics,
  featuredAthletes,
}: MatchH2HStatsProps) {
  const [activeTab, setActiveTab] = useState<"h2h" | "athletes">("h2h");
  const [teamFilter, setTeamFilter] = useState<"all" | "home" | "away">("all");
  const [athleteSearch, setAthleteSearch] = useState("");

  const filteredAthletes = useMemo(() => {
    return featuredAthletes.filter((a) => {
      const matchesTeam =
        teamFilter === "all"
          ? true
          : teamFilter === "home"
          ? a.isHome
          : !a.isHome;

      const q = athleteSearch.trim().toLowerCase();
      const posLabel = (
        POSITION_LABELS[a.position as Position] ?? a.position
      ).toLowerCase();
      const matchesSearch =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.teamName.toLowerCase().includes(q) ||
        posLabel.includes(q);

      return matchesTeam && matchesSearch;
    });
  }, [featuredAthletes, teamFilter, athleteSearch]);

  const homeAthletesCount = useMemo(
    () => featuredAthletes.filter((a) => a.isHome).length,
    [featuredAthletes]
  );
  const awayAthletesCount = useMemo(
    () => featuredAthletes.filter((a) => !a.isHome).length,
    [featuredAthletes]
  );

  return (
    <div className="space-y-6">
      {/* ─── Navigation Tabs ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("h2h")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all",
              activeTab === "h2h"
                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <Swords className="h-4 w-4 text-emerald-400" />
            <span>Painel Head-to-Head (H2H)</span>
          </button>

          <button
            onClick={() => setActiveTab("athletes")}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all",
              activeTab === "athletes"
                ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
            )}
          >
            <Star className="h-4 w-4 text-cyan-400" />
            <span>Atuações de Destaque</span>
            <Badge className="bg-white/10 text-zinc-300 font-mono text-[10px] py-0 h-4 border-0">
              {featuredAthletes.length}
            </Badge>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-zinc-400">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span>Estatísticas Oficiais da Partida</span>
        </div>
      </div>

      {/* ─── TAB 1: HEAD-TO-HEAD (EA FC / TV BROADCAST STYLE) ────────────────── */}
      {activeTab === "h2h" && (
        <div className="rounded-3xl border border-white/10 bg-[#090e1a]/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Top header with team identities */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
            <div className="flex items-center gap-2 text-left">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-black text-emerald-300 font-mono tracking-tight uppercase">
                {homeTeam.name}
              </span>
            </div>

            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Desempenho Coletivo Comparado
            </span>

            <div className="flex items-center gap-2 text-right">
              <span className="text-sm font-black text-indigo-300 font-mono tracking-tight uppercase">
                {awayTeam.name}
              </span>
              <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
            </div>
          </div>

          {/* Mirrored Progress Bars Rows */}
          <div className="space-y-4">
            {h2hMetrics.map((metric) => {
              const isHigherBetter = metric.key !== "fouls";
              const homeIsWinner =
                isHigherBetter
                  ? metric.homeValue > metric.awayValue
                  : metric.homeValue < metric.awayValue;
              const awayIsWinner =
                isHigherBetter
                  ? metric.awayValue > metric.homeValue
                  : metric.awayValue < metric.homeValue;

              // Calculate relative progress width (0 - 100%)
              let homeRatio = 50;
              let awayRatio = 50;

              if (metric.isPercent) {
                homeRatio = Math.min(100, Math.max(5, metric.homeValue));
                awayRatio = Math.min(100, Math.max(5, metric.awayValue));
              } else {
                const total = metric.homeValue + metric.awayValue;
                if (total > 0) {
                  homeRatio = Math.round((metric.homeValue / total) * 100);
                  awayRatio = Math.round((metric.awayValue / total) * 100);
                }
              }

              return (
                <div
                  key={metric.key}
                  className="group relative rounded-2xl border border-white/[0.06] bg-[#0d1424]/70 p-3 sm:p-4 hover:border-white/15 hover:bg-[#111a2f]/80 transition-all shadow-sm"
                >
                  {/* Values & Label row */}
                  <div className="flex items-center justify-between text-xs sm:text-sm font-black mb-2">
                    {/* Home Team Value */}
                    <div className="w-16 sm:w-20 text-left font-mono">
                      <span
                        className={cn(
                          "transition-colors",
                          homeIsWinner
                            ? "text-emerald-400 font-black text-sm sm:text-base drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                            : "text-zinc-400 font-bold"
                        )}
                      >
                        {metric.homeDisplay}
                      </span>
                    </div>

                    {/* Center Metric Label */}
                    <div className="flex-1 text-center px-2">
                      <span className="text-[11px] sm:text-xs uppercase font-extrabold tracking-wider text-zinc-300 group-hover:text-white transition-colors">
                        {metric.label}
                      </span>
                    </div>

                    {/* Away Team Value */}
                    <div className="w-16 sm:w-20 text-right font-mono">
                      <span
                        className={cn(
                          "transition-colors",
                          awayIsWinner
                            ? "text-indigo-400 font-black text-sm sm:text-base drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                            : "text-zinc-400 font-bold"
                        )}
                      >
                        {metric.awayDisplay}
                      </span>
                    </div>
                  </div>

                  {/* Dual Mirrored Progress Bar Track */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 items-center">
                    {/* Home Side: Bar fills from RIGHT to LEFT */}
                    <div className="h-2.5 sm:h-3 w-full rounded-full bg-black/50 border border-white/5 overflow-hidden flex justify-end">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          homeIsWinner
                            ? "bg-gradient-to-l from-emerald-400 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                            : "bg-emerald-500/40"
                        )}
                        style={{ width: `${homeRatio}%` }}
                      />
                    </div>

                    {/* Away Side: Bar fills from LEFT to RIGHT */}
                    <div className="h-2.5 sm:h-3 w-full rounded-full bg-black/50 border border-white/5 overflow-hidden flex justify-start">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          awayIsWinner
                            ? "bg-gradient-to-r from-indigo-500 to-purple-400 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                            : "bg-indigo-500/40"
                        )}
                        style={{ width: `${awayRatio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-mono">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              Barras normalizadas e calibradas com dados oficiais
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              The Net Scouting &bull; Match Intelligence
            </span>
          </div>
        </div>
      )}

      {/* ─── TAB 2: ATUAÇÕES DE DESTAQUE ───────────────────────────────────────── */}
      {activeTab === "athletes" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a0f1b]/90 border border-white/10 rounded-2xl p-3 sm:p-4 backdrop-blur-md">
            {/* Team Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setTeamFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  teamFilter === "all"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                Todos ({featuredAthletes.length})
              </button>

              <button
                onClick={() => setTeamFilter("home")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  teamFilter === "home"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                {homeTeam.name} ({homeAthletesCount})
              </button>

              <button
                onClick={() => setTeamFilter("away")}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                  teamFilter === "away"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                )}
              >
                {awayTeam.name} ({awayAthletesCount})
              </button>
            </div>

            {/* Quick Search */}
            <div className="relative sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
              <input
                type="text"
                value={athleteSearch}
                onChange={(e) => setAthleteSearch(e.target.value)}
                placeholder="Buscar jogador ou posição..."
                className="w-full bg-[#111728] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>

          {/* Athletes List */}
          {filteredAthletes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-[#090d16]/80 p-12 text-center space-y-3">
              <Users className="mx-auto h-8 w-8 text-zinc-500" />
              <p className="text-sm font-bold text-zinc-300">
                Nenhum jogador encontrado para os filtros atuais
              </p>
              <p className="text-xs text-zinc-500">
                Tente buscar outro termo ou selecione outra equipe.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAthletes.map((athlete, index) => {
                const isManOfTheMatch = index === 0;
                const posLabel =
                  POSITION_LABELS[athlete.position as Position] ??
                  athlete.position;

                return (
                  <div
                    key={athlete.athleteId}
                    className={cn(
                      "group relative flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 transition-all shadow-lg backdrop-blur-xl",
                      isManOfTheMatch
                        ? "border-amber-400/40 bg-gradient-to-r from-amber-950/20 via-[#101726]/90 to-[#0b101c]/90 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
                        : "border-white/[0.08] bg-[#0c1220]/80 hover:border-cyan-500/30 hover:bg-[#10172a]/90"
                    )}
                  >
                    {/* Left: Player Identity & Ranking */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Badge */}
                      <div className="flex flex-col items-center justify-center shrink-0 w-8">
                        {isManOfTheMatch ? (
                          <div className="h-8 w-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 font-black text-xs font-mono shadow-[0_0_12px_rgba(251,191,36,0.3)]">
                            🥇
                          </div>
                        ) : index === 1 ? (
                          <div className="h-7 w-7 rounded-lg bg-zinc-300/15 border border-zinc-300/30 flex items-center justify-center text-zinc-200 font-black text-xs font-mono">
                            🥈
                          </div>
                        ) : index === 2 ? (
                          <div className="h-7 w-7 rounded-lg bg-amber-700/20 border border-amber-600/30 flex items-center justify-center text-amber-400 font-black text-xs font-mono">
                            🥉
                          </div>
                        ) : (
                          <span className="font-mono text-xs font-bold text-zinc-500">
                            #{index + 1}
                          </span>
                        )}
                      </div>

                      {/* Avatar / Monogram */}
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/10 flex items-center justify-center text-white font-bold font-mono text-sm shrink-0">
                        {athlete.name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>

                      {/* Name & Tags */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/athletes/${athlete.athleteId}`}
                            className="text-sm sm:text-base font-black text-white hover:text-cyan-300 transition-colors truncate"
                          >
                            {athlete.name}
                          </Link>

                          {isManOfTheMatch && (
                            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/40 text-[9px] font-black uppercase py-0 h-4">
                              Craque do Jogo
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-zinc-400">
                          <span
                            className={cn(
                              "font-bold",
                              athlete.isHome
                                ? "text-emerald-400"
                                : "text-indigo-400"
                            )}
                          >
                            {athlete.teamName}
                          </span>
                          <span>&bull;</span>
                          <span className="text-zinc-300">{posLabel}</span>
                          {athlete.minutesPlayed && (
                            <>
                              <span>&bull;</span>
                              <span className="font-mono text-[11px] text-zinc-400">
                                {athlete.minutesPlayed}&apos;
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Core Match Stats in Mono Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-center py-2 sm:py-0 border-y sm:border-y-0 border-white/[0.06]">
                      {/* Gols / Assistências */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                          G / A
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-white">
                          {athlete.goals}/{athlete.assists}
                        </span>
                      </div>

                      {/* xG */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                          xG
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-cyan-300">
                          {athlete.xg.toFixed(2)}
                        </span>
                      </div>

                      {/* Finalizações (alvo) */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                          Chutes
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-white">
                          {athlete.shots} ({athlete.shotsOnTarget})
                        </span>
                      </div>

                      {/* Passes (Acc%) */}
                      <div className="p-2 rounded-xl bg-black/40 border border-white/[0.05]">
                        <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                          Passes
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-white">
                          {athlete.passes}{" "}
                          <span className="text-[10px] text-emerald-400">
                            ({athlete.passAccuracy}%)
                          </span>
                        </span>
                      </div>

                      {/* Impact / Rating */}
                      <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 col-span-4 sm:col-span-1">
                        <span className="text-[9px] uppercase font-bold text-cyan-300 block">
                          Impacto
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-cyan-200">
                          {athlete.rating ? `★ ${athlete.rating}` : athlete.impactScore}
                        </span>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 justify-end shrink-0">
                      {athlete.rawTelemetry && (
                        <AthleteTelemetryModal
                          athleteName={athlete.name}
                          athletePosition={posLabel}
                          teamName={athlete.teamName}
                          rawData={athlete.rawTelemetry}
                          triggerVariant="button"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/15 gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>75 Indicadores</span>
                          </Button>
                        </AthleteTelemetryModal>
                      )}

                      <Link
                        href={`/athletes/${athlete.athleteId}`}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-200 transition-all"
                      >
                        <span>Perfil</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
