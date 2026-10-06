"use client";

import React from "react";
import {
  Trophy,
  Calendar,
  MapPin,
  Activity,
  Shield,
  Sparkles,
  Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  formatMatchDate,
  matchOutcome,
  OUTCOME_LABELS,
  OUTCOME_STYLES,
  VENUE_LABELS,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { MatchVenue } from "@prisma/client";

interface TeamSummary {
  id?: string | null;
  name: string;
  shortName: string;
  city?: string | null;
  possession: number;
}

interface MatchScoreboardProps {
  homeTeam: TeamSummary;
  awayTeam: TeamSummary;
  date: Date | string;
  competition: string;
  round?: string | null;
  venue: MatchVenue;
  goalsFor?: number | null;
  goalsAgainst?: number | null;
  notes?: string | null;
}

export function MatchScoreboard({
  homeTeam,
  awayTeam,
  date,
  competition,
  round,
  venue,
  goalsFor,
  goalsAgainst,
  notes,
}: MatchScoreboardProps) {
  const hasScore = goalsFor != null && goalsAgainst != null;
  const outcome = matchOutcome(goalsFor ?? null, goalsAgainst ?? null);

  const homeInitials = homeTeam.shortName || homeTeam.name.slice(0, 3).toUpperCase();
  const awayInitials = awayTeam.shortName || awayTeam.name.slice(0, 3).toUpperCase();

  const homePoss = Number(homeTeam.possession.toFixed(1));
  const awayPoss = Number(awayTeam.possession.toFixed(1));

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#111827]/95 via-[#0c1220]/95 to-[#080d18]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl group">
      {/* Background ambient decorative glows */}
      <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-80 rounded-full bg-cyan-500/5 blur-3xl" />

      {/* Top Meta Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-5">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-xs font-bold gap-1 py-1">
            <Trophy className="h-3.5 w-3.5 text-emerald-400" />
            <span>{competition}</span>
          </Badge>

          {round && (
            <Badge variant="outline" className="border-white/15 text-zinc-300 text-xs font-mono py-1">
              {round}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cyan-400" />
            {formatMatchDate(date, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>

          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-400" />
            {VENUE_LABELS[venue]}
          </span>
        </div>
      </div>

      {/* Main Scoreboard Arena */}
      <div className="relative z-10 my-8 grid grid-cols-1 md:grid-cols-7 items-center gap-6">
        {/* Mandante (Home Team) */}
        <div className="md:col-span-3 flex flex-row items-center justify-start md:justify-end gap-4 text-left md:text-right">
          <div className="order-2 md:order-1 min-w-0">
            <div className="flex items-center md:justify-end gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono">
                Mandante
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 truncate" title={homeTeam.name}>
              {homeTeam.name}
            </h2>
            {homeTeam.city && (
              <p className="text-xs text-zinc-400 mt-0.5">{homeTeam.city}</p>
            )}
          </div>

          <div className="order-1 md:order-2 h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 via-[#13221c] to-cyan-500/20 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.25)] shrink-0 font-black text-lg sm:text-xl font-mono tracking-wider">
            {homeInitials}
          </div>
        </div>

        {/* Center Score & Result */}
        <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
          {hasScore ? (
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center gap-3 bg-black/70 border border-white/15 px-5 py-2.5 rounded-2xl shadow-inner">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400 font-mono tracking-tight drop-shadow-sm">
                  {goalsFor}
                </span>
                <span className="text-zinc-600 font-bold text-xl font-mono">&times;</span>
                <span className="text-3xl sm:text-4xl font-black text-indigo-400 font-mono tracking-tight drop-shadow-sm">
                  {goalsAgainst}
                </span>
              </div>

              {outcome && (
                <div className="flex justify-center">
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-0.5 text-[11px] font-black uppercase font-mono tracking-wider shadow-sm",
                      OUTCOME_STYLES[outcome]
                    )}
                  >
                    {outcome === "W"
                      ? `Vitória ${homeTeam.shortName}`
                      : outcome === "L"
                      ? `Vitória ${awayTeam.shortName}`
                      : "Empate Oficial"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5">
              <span className="rounded-xl bg-black/60 border border-white/10 px-4 py-2 text-xl font-black text-zinc-300 font-mono">
                VS
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Partida Agendada
              </span>
            </div>
          )}
        </div>

        {/* Visitante (Away Team) */}
        <div className="md:col-span-3 flex flex-row items-center justify-start gap-4 text-left">
          <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-[#161a2f] to-purple-500/20 border-2 border-indigo-500/40 flex items-center justify-center text-indigo-300 shadow-[0_0_25px_rgba(99,102,241,0.25)] shrink-0 font-black text-lg sm:text-xl font-mono tracking-wider">
            {awayInitials}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-md font-mono">
                Visitante
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 truncate" title={awayTeam.name}>
              {awayTeam.name}
            </h2>
            {awayTeam.city && (
              <p className="text-xs text-zinc-400 mt-0.5">{awayTeam.city}</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Comparative Ball Possession Bar (Barra Horizontal) ─────────────── */}
      <div className="relative z-10 pt-4 border-t border-white/[0.08] mt-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
              Posse de Bola
            </span>
          </div>
          <div className="text-[11px] font-mono text-zinc-400">
            Controle de Jogo &bull; Tempo Regulamentar
          </div>
        </div>

        {/* Labels & Percentages */}
        <div className="flex items-center justify-between text-xs font-mono font-black mb-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="text-white font-bold">{homeTeam.shortName}:</span>
            <span className="text-sm font-black">{homePoss}%</span>
          </div>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <span className="text-sm font-black">{awayPoss}%</span>
            <span className="text-white font-bold">:{awayTeam.shortName}</span>
          </div>
        </div>

        {/* The Dual Mirrored Split Bar */}
        <div className="relative h-4 w-full rounded-full bg-black/60 border border-white/10 overflow-hidden flex shadow-inner">
          {/* Home possession bar segment */}
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
            style={{ width: `${homePoss}%` }}
          />

          {/* Center Divider tick */}
          <div className="w-[2px] h-full bg-white/40 z-10" />

          {/* Away possession bar segment */}
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            style={{ width: `${awayPoss}%` }}
          />
        </div>
      </div>

      {notes && (
        <div className="relative z-10 mt-4 pt-3 border-t border-white/[0.06] text-xs text-zinc-400 italic">
          <span className="font-bold text-zinc-300 not-italic">Observações táticas: </span>
          {notes}
        </div>
      )}
    </div>
  );
}
