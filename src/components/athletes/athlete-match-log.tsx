"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckSquare,
  Square,
  Activity,
  Flame,
  Shield,
  TrendingUp,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  BarChart3,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AthleteTelemetryModal } from "@/components/athletes/athlete-telemetry-modal";
import {
  formatMatchDate,
  matchOutcome,
  OUTCOME_LABELS,
  OUTCOME_STYLES,
  VENUE_LABELS,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";

export interface AthleteMatchEntry {
  rawMetricId: string;
  matchId: string;
  date: Date | string;
  opponentName: string;
  venue: string;
  competition: string;
  round?: string | null;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  minutesPlayed?: number | null;
  goals: number;
  assists: number;
  xg: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  rating?: number | null;
  rawTelemetry?: Record<string, unknown> | null;
}

interface AthleteMatchLogProps {
  athleteId: string;
  athleteName: string;
  athletePosition?: string;
  teamName?: string;
  history: AthleteMatchEntry[];
}

export function AthleteMatchLog({
  athleteId,
  athleteName,
  athletePosition,
  teamName,
  history,
}: AthleteMatchLogProps) {
  // Set of selected match IDs (default: all matches selected)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(history.map((h) => h.matchId));
  });

  // Handle quick presets
  const selectLastN = (n: number) => {
    const sliced = history.slice(0, n).map((h) => h.matchId);
    setSelectedIds(new Set(sliced));
  };

  const selectAll = () => {
    setSelectedIds(new Set(history.map((h) => h.matchId)));
  };

  const toggleMatch = (matchId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) {
        if (next.size > 1) next.delete(matchId); // Keep at least 1
      } else {
        next.add(matchId);
      }
      return next;
    });
  };

  // Filtered entries for calculation
  const selectedEntries = useMemo(() => {
    return history.filter((h) => selectedIds.has(h.matchId));
  }, [history, selectedIds]);

  // Aggregated totals & averages for the selected matches
  const statsSummary = useMemo(() => {
    const count = selectedEntries.length || 1;
    let totalMinutes = 0;
    let totalGoals = 0;
    let totalAssists = 0;
    let totalXg = 0;
    let totalShots = 0;
    let totalShotsOnTarget = 0;
    let totalPasses = 0;
    let sumPassAccuracy = 0;
    let totalTackles = 0;
    let totalInterceptions = 0;
    let sumRating = 0;
    let ratingCount = 0;

    for (const h of selectedEntries) {
      totalMinutes += h.minutesPlayed ?? 90;
      totalGoals += h.goals;
      totalAssists += h.assists;
      totalXg += h.xg;
      totalShots += h.shots;
      totalShotsOnTarget += h.shotsOnTarget;
      totalPasses += h.passes;
      sumPassAccuracy += h.passAccuracy;
      totalTackles += h.tackles;
      totalInterceptions += h.interceptions;
      if (h.rating != null) {
        sumRating += h.rating;
        ratingCount++;
      }
    }

    return {
      count: selectedEntries.length,
      totalMinutes,
      totalGoals,
      goalsPerGame: Number((totalGoals / count).toFixed(2)),
      totalAssists,
      assistsPerGame: Number((totalAssists / count).toFixed(2)),
      totalXg: Number(totalXg.toFixed(2)),
      xgPerGame: Number((totalXg / count).toFixed(2)),
      totalShots,
      shotsPerGame: Number((totalShots / count).toFixed(1)),
      totalShotsOnTarget,
      totalPasses,
      passesPerGame: Math.round(totalPasses / count),
      avgPassAccuracy: Number((sumPassAccuracy / count).toFixed(1)),
      totalTackles,
      totalInterceptions,
      avgRating: ratingCount > 0 ? Number((sumRating / ratingCount).toFixed(2)) : null,
    };
  }, [selectedEntries]);

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-[#090d16]/80 p-8 text-center text-zinc-400">
        <CalendarDays className="h-8 w-8 mx-auto text-zinc-600 mb-2" />
        <p className="text-sm font-bold text-zinc-300">Nenhuma partida registrada para este atleta</p>
        <p className="text-xs text-zinc-500 mt-0.5">As estatísticas jogo a jogo serão exibidas assim que vinculadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-3xl border border-white/10 bg-[#090e1a]/95 backdrop-blur-xl p-5 sm:p-7 shadow-2xl">
      {/* ─── Header & Controls ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30 uppercase tracking-wider font-mono">
              <CalendarDays className="h-3 w-3" /> Histórico Jogo a Jogo
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {history.length} {history.length === 1 ? "partida" : "partidas"} na temporada
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
            Desempenho por Partida &bull; Amostragem Flexível
          </h3>
          <p className="text-xs text-zinc-400">
            Selecione qualquer conjunto de jogos para calcular as médias e o impacto acumulado de {athleteName}.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectLastN(5)}
            className={cn(
              "h-8 text-xs font-bold border-white/10 text-zinc-300 hover:text-white hover:bg-white/10",
              selectedIds.size === 5 && "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
            )}
          >
            Últimos 5 Jogos
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => selectLastN(10)}
            className={cn(
              "h-8 text-xs font-bold border-white/10 text-zinc-300 hover:text-white hover:bg-white/10",
              selectedIds.size === 10 && "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
            )}
          >
            Últimos 10 Jogos
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            className={cn(
              "h-8 text-xs font-bold border-white/10 text-zinc-300 hover:text-white hover:bg-white/10",
              selectedIds.size === history.length && "border-emerald-500/50 bg-emerald-500/15 text-emerald-300"
            )}
          >
            Todos ({history.length})
          </Button>
        </div>
      </div>

      {/* ─── Live KPI Summary Aggregator ────────────────────────────────────── */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/30 via-[#0d1424] to-indigo-950/20 p-4 sm:p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <span className="flex items-center gap-1.5 text-cyan-300 font-black uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            Amostragem: {statsSummary.count} {statsSummary.count === 1 ? "partida" : "partidas"} ({statsSummary.totalMinutes}&apos;)
          </span>
          <span className="text-zinc-400 text-[11px]">
            Totais e médias recalculados dinamicamente
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center font-mono">
          {/* Gols */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Gols Totais</span>
            <span className="text-lg font-black text-white">{statsSummary.totalGoals}</span>
            <span className="text-[10px] text-zinc-500 block">({statsSummary.goalsPerGame}/j)</span>
          </div>

          {/* Assistências */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assistências</span>
            <span className="text-lg font-black text-cyan-300">{statsSummary.totalAssists}</span>
            <span className="text-[10px] text-zinc-500 block">({statsSummary.assistsPerGame}/j)</span>
          </div>

          {/* xG */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">xG Acumulado</span>
            <span className="text-lg font-black text-emerald-400">{statsSummary.totalXg}</span>
            <span className="text-[10px] text-zinc-500 block">({statsSummary.xgPerGame}/j)</span>
          </div>

          {/* Finalizações */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Chutes (Alvo)</span>
            <span className="text-lg font-black text-white">
              {statsSummary.totalShots} <span className="text-xs text-zinc-400">({statsSummary.totalShotsOnTarget})</span>
            </span>
            <span className="text-[10px] text-zinc-500 block">({statsSummary.shotsPerGame}/j)</span>
          </div>

          {/* Passes & Precisão */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Passes (% Acc)</span>
            <span className="text-lg font-black text-white">{statsSummary.passesPerGame}/j</span>
            <span className="text-[10px] text-emerald-400 block font-bold">{statsSummary.avgPassAccuracy}%</span>
          </div>

          {/* Nota Média */}
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950/40 to-indigo-950/40 border border-cyan-500/30">
            <span className="text-[10px] uppercase font-bold text-cyan-300 block">Nota Média</span>
            <span className="text-lg font-black text-cyan-200">
              {statsSummary.avgRating ? `★ ${statsSummary.avgRating}` : "—"}
            </span>
            <span className="text-[10px] text-zinc-400 block">Des/Int: {statsSummary.totalTackles}/{statsSummary.totalInterceptions}</span>
          </div>
        </div>
      </div>

      {/* ─── Match-by-Match Rows ─────────────────────────────────────────────── */}
      <div className="space-y-2">
        {history.map((entry) => {
          const isSelected = selectedIds.has(entry.matchId);
          const outcome = matchOutcome(entry.goalsFor ?? null, entry.goalsAgainst ?? null);

          return (
            <div
              key={entry.matchId}
              onClick={() => toggleMatch(entry.matchId)}
              className={cn(
                "group flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer shadow-sm select-none",
                isSelected
                  ? "border-cyan-500/30 bg-[#0f172a]/90 hover:bg-[#131d35]"
                  : "border-white/[0.05] bg-black/30 opacity-60 hover:opacity-90"
              )}
            >
              {/* Left: Selector, Date, Opponent, Score */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMatch(entry.matchId);
                  }}
                  className="text-cyan-400 hover:text-cyan-300 p-0.5 shrink-0"
                >
                  {isSelected ? (
                    <CheckSquare className="h-4 w-4 text-cyan-400" />
                  ) : (
                    <Square className="h-4 w-4 text-zinc-600" />
                  )}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-400">
                      {formatMatchDate(entry.date, { day: "2-digit", month: "short" })}
                    </span>
                    {entry.round && (
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">
                        &bull; {entry.round}
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-zinc-500">
                      &bull; {entry.venue === "HOME" ? "Casa" : "Fora"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black text-white truncate">
                      vs {entry.opponentName}
                    </span>

                    {entry.goalsFor != null && entry.goalsAgainst != null && (
                      <span className="font-mono text-xs font-bold text-zinc-300 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                        {entry.goalsFor} &times; {entry.goalsAgainst}
                      </span>
                    )}

                    {outcome && (
                      <span className={cn("text-[10px] font-mono font-black px-1.5 py-0.2 rounded", OUTCOME_STYLES[outcome])}>
                        {OUTCOME_LABELS[outcome]}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: Player Match Stats */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
                {/* Minutos */}
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-zinc-500 block uppercase">Min</span>
                  <span className="font-bold text-zinc-300">{entry.minutesPlayed ?? 90}&apos;</span>
                </div>

                {/* Gols / Assistências */}
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-zinc-500 block uppercase">G / A</span>
                  <span className={cn("font-black", entry.goals > 0 ? "text-emerald-400" : "text-white")}>
                    {entry.goals}/{entry.assists}
                  </span>
                </div>

                {/* xG */}
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-zinc-500 block uppercase">xG</span>
                  <span className="font-bold text-cyan-300">{entry.xg.toFixed(2)}</span>
                </div>

                {/* Passes (Acc%) */}
                <div className="p-1.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[9px] text-zinc-500 block uppercase">Passes</span>
                  <span className="font-bold text-zinc-300">
                    {entry.passes} <span className="text-[10px] text-emerald-400">({entry.passAccuracy}%)</span>
                  </span>
                </div>

                {/* Rating */}
                <div className="p-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20 col-span-4 sm:col-span-1">
                  <span className="text-[9px] text-cyan-400 block uppercase">Nota</span>
                  <span className="font-black text-cyan-200">
                    {entry.rating ? `★ ${entry.rating}` : "—"}
                  </span>
                </div>
              </div>

              {/* Right: Actions (Match Report & Telemetry) */}
              <div
                className="flex items-center gap-2 justify-end shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                {entry.rawTelemetry && (
                  <AthleteTelemetryModal
                    athleteName={athleteName}
                    athletePosition={athletePosition}
                    teamName={teamName}
                    rawData={entry.rawTelemetry}
                    triggerVariant="button"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] font-bold text-cyan-400 hover:text-white hover:bg-cyan-500/20 px-2 rounded-lg gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      <span>75 Dados</span>
                    </Button>
                  </AthleteTelemetryModal>
                )}

                <Link
                  href={`/matches/${entry.matchId}`}
                  className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-bold text-zinc-300 hover:text-white transition-all font-mono"
                >
                  <span>Jogo</span>
                  <ExternalLink className="h-3 w-3 text-cyan-400" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
