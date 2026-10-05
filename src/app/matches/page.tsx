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
import { cn } from "@/lib/utils";
import { CalendarDays, Users } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jogos</h1>
          <p className="text-muted-foreground mt-1">
            {matches.length} {matches.length === 1 ? "jogo registrado" : "jogos registrados"}
          </p>
        </div>
        <CreateMatchButton teams={teamList} leagues={leagueList} />
      </div>

      {matches.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/60">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum jogo registrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Registre um jogo para lançar métricas dos atletas</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {matches.map((m) => {
            const outcome = matchOutcome(m.goalsFor, m.goalsAgainst);
            const hasScore = m.goalsFor != null && m.goalsAgainst != null;
            return (
              <Card key={m.id} className="group p-5 border-border bg-card hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {formatMatchDate(m.date, { day: "2-digit", month: "short", year: "numeric" })} · {m.competition}
                    {m.round ? ` · ${m.round}` : ""} · {VENUE_LABELS[m.venue]}
                  </p>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <EditMatchButton match={m} teams={teamList} leagues={leagueList} />
                    <DeleteMatchButton
                      id={m.id}
                      label={`${m.team.name} vs ${m.opponentName}`}
                      metricsCount={m.rawMetrics.length}
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="flex-1 truncate text-right font-semibold">{m.team.name}</span>
                  <span className="rounded-lg bg-muted/60 px-3 py-1 text-lg font-extrabold tabular-nums">
                    {hasScore ? `${m.goalsFor} × ${m.goalsAgainst}` : "vs"}
                  </span>
                  <span className="flex-1 truncate font-semibold">{m.opponentName}</span>
                  {outcome && (
                    <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold ring-1", OUTCOME_STYLES[outcome])}>
                      {OUTCOME_LABELS[outcome]}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {m.rawMetrics.length === 0 ? (
                    <span>Sem métricas lançadas</span>
                  ) : (
                    m.rawMetrics.map((r) => (
                      <Link
                        key={r.id}
                        href={`/athletes/${r.athlete.id}#athlete-metrics`}
                        className="rounded-full bg-muted/60 px-2 py-0.5 hover:bg-primary/15 hover:text-primary transition-colors"
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
