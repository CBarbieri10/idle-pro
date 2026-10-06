import { getMatches } from "@/lib/actions/matches";
import { getTeams, getLeagues } from "@/lib/actions/teams";
import { CreateMatchButton, EditMatchButton, DeleteMatchButton } from "@/components/matches/match-dialogs";
import { Card } from "@/components/ui/card";
import {
  OUTCOME_LABELS,
  OUTCOME_STYLES,
  VENUE_LABELS,
  formatMatchDate,
  matchOutcome,
} from "@/lib/metrics";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarDays, FileSpreadsheet, Users } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jogos | The Net Scouting",
  description: "Registre e gerencie as partidas usadas para o lançamento de métricas",
};

export default async function MatchesPage() {
  const [matches, teams, leagues] = await Promise.all([getMatches(), getTeams(), getLeagues()]);
  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));
  const leagueList = leagues.map((l) => ({ id: l.id, name: l.name }));

  return (
    <div className="space-y-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00e676]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00e676] border border-[#00e676]/30 uppercase tracking-wider font-mono">
              <CalendarDays className="h-3 w-3" /> Calendário de Jogos
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {matches.length} {matches.length === 1 ? "jogo registrado" : "jogos registrados"}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">Jogos & Confrontos</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registre e gerencie as partidas oficiais usadas para o lançamento de métricas de scout.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/matches/import"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 text-xs font-bold border-white/15 hover:border-[#00e676]/50")}
          >
            <FileSpreadsheet className="h-4 w-4 text-[#00e676]" />
            Importar Planilha
          </Link>
          <CreateMatchButton teams={teamList} leagues={leagueList} />
        </div>
      </div>

      {matches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-white/15 bg-[#0d121d]/75 backdrop-blur-md rounded-2xl">
          <CalendarDays className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-white">Nenhum jogo registrado</p>
          <p className="text-xs text-zinc-400 mt-1 mb-4">
            Registre um jogo manualmente ou importe via planilha Excel/CSV
          </p>
          <div className="flex items-center gap-2">
            <Link
              href="/matches/import"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Importar Planilha
            </Link>
            <CreateMatchButton teams={teamList} leagues={leagueList} />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {matches.map((m) => {
            const outcome = matchOutcome(m.goalsFor, m.goalsAgainst);
            const hasScore = m.goalsFor != null && m.goalsAgainst != null;
            return (
              <Card
                key={m.id}
                className="group p-5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md hover:border-[#00e676]/50 hover:bg-[#121927]/95 transition-all shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
                    <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                      {formatMatchDate(m.date, { day: "2-digit", month: "short", year: "numeric" })} &bull; {m.competition}
                      {m.round ? ` &bull; ${m.round}` : ""} &bull; {VENUE_LABELS[m.venue]}
                    </p>
                    <div className="flex shrink-0 items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <EditMatchButton match={m} teams={teamList} leagues={leagueList} />
                      <DeleteMatchButton
                        id={m.id}
                        label={`${m.team.name} vs ${m.opponentName}`}
                        metricsCount={m.rawMetrics.length}
                      />
                    </div>
                  </div>

                  {/* Scoreboard visual */}
                  <div className="my-5 flex items-center justify-between gap-3">
                    <span className="flex-1 text-right font-black text-sm text-white truncate">
                      {m.team.name}
                    </span>
                    <span className="rounded-xl bg-black/60 border border-white/10 px-3.5 py-1.5 text-lg font-black text-white font-mono shadow-inner shrink-0">
                      {hasScore ? `${m.goalsFor} × ${m.goalsAgainst}` : "vs"}
                    </span>
                    <span className="flex-1 font-black text-sm text-white truncate">
                      {m.opponentName}
                    </span>
                    {outcome && (
                      <span className={cn("rounded-lg px-2 py-1 text-xs font-black uppercase font-mono shrink-0", OUTCOME_STYLES[outcome])}>
                        {OUTCOME_LABELS[outcome]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Athletes with metrics tagged */}
                <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-zinc-500 uppercase flex items-center gap-1 mr-1">
                    <Users className="h-3 w-3 text-indigo-400" />
                    Atletas:
                  </span>
                  {m.rawMetrics.length === 0 ? (
                    <span className="text-zinc-500 text-[11px] italic">Sem métricas lançadas</span>
                  ) : (
                    m.rawMetrics.map((r) => (
                      <Link
                        key={r.id}
                        href={`/athletes/${r.athlete.id}#athlete-metrics`}
                        className="rounded-lg bg-black/40 border border-white/5 px-2 py-0.5 text-[11px] font-semibold text-zinc-300 hover:border-[#00e676]/40 hover:text-[#00e676] transition-colors"
                      >
                        {r.athlete.name}
                      </Link>
                    ))
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
