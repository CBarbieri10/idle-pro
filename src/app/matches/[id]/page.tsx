import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowLeft,
  CalendarDays,
  FileSpreadsheet,
  Share2,
  Swords,
  Trophy,
} from "lucide-react";
import { getMatchById } from "@/lib/actions/matches";
import { getTeams, getLeagues } from "@/lib/actions/teams";
import { MatchScoreboard } from "@/components/matches/match-scoreboard";
import { MatchH2HStats } from "@/components/matches/match-h2h-stats";
import { EditMatchButton } from "@/components/matches/match-dialogs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const matchData = await getMatchById(id);

  if (!matchData) {
    return {
      title: "Partida não encontrada | The Net Scouting",
    };
  }

  const { homeTeam, awayTeam, match } = matchData;
  const scoreText =
    match.goalsFor != null && match.goalsAgainst != null
      ? `${match.goalsFor} × ${match.goalsAgainst}`
      : "vs";

  return {
    title: `${homeTeam.name} ${scoreText} ${awayTeam.name} — Match Report | The Net Scouting`,
    description: `Relatório tático e estatísticas completas do confronto entre ${homeTeam.name} e ${awayTeam.name} pela ${match.competition}.`,
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [matchData, teams, leagues] = await Promise.all([
    getMatchById(id),
    getTeams(),
    getLeagues(),
  ]);

  if (!matchData) {
    notFound();
  }

  const { match, homeTeam, awayTeam, h2hMetrics, featuredAthletes } = matchData;
  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));
  const leagueList = leagues.map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ─── Breadcrumb & Quick Actions Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
            <Link
              href="/matches"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Jogos</span>
            </Link>
            <span>/</span>
            <span className="text-zinc-300 truncate max-w-[200px] sm:max-w-xs">
              {homeTeam.shortName} vs {awayTeam.shortName}
            </span>
            <span>/</span>
            <span className="text-zinc-500">Match Report</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2.5">
            <Swords className="h-6 w-6 text-emerald-400" />
            <span>Match Report &bull; Relatório Tático</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Análise aprofundada de posse, desempenho coletivo e atuações individuais do confronto.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/matches"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs font-bold border-white/15 hover:bg-white/5"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5 text-zinc-400" />
            <span>Todos os Jogos</span>
          </Link>

          <Link
            href="/matches/import"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs font-bold border-white/15 hover:border-emerald-500/40"
            )}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Importar Dados</span>
          </Link>

          <EditMatchButton
            match={{
              id: match.id,
              date: match.date,
              teamId: match.teamId,
              opponentName: match.opponentName,
              opponentId: match.opponentId,
              venue: match.venue,
              competition: match.competition,
              leagueId: match.leagueId,
              round: match.round,
              goalsFor: match.goalsFor,
              goalsAgainst: match.goalsAgainst,
              notes: match.notes,
            }}
            teams={teamList}
            leagues={leagueList}
          />
        </div>
      </div>

      {/* ─── PASSO 2: O Cabeçalho do Confronto (Scoreboard) ──────────────────── */}
      <MatchScoreboard
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        date={match.date}
        competition={match.competition}
        round={match.round}
        venue={match.venue}
        goalsFor={match.goalsFor}
        goalsAgainst={match.goalsAgainst}
        notes={match.notes}
      />

      {/* ─── PASSO 3: Painel Head-to-Head (H2H) & Atuações de Destaque ──────── */}
      <MatchH2HStats
        homeTeam={homeTeam}
        awayTeam={awayTeam}
        h2hMetrics={h2hMetrics}
        featuredAthletes={featuredAthletes}
      />
    </div>
  );
}
