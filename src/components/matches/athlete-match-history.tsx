import {
  EditMetricButton,
  DeleteMetricButton,
  type MatchOption,
} from "@/components/matches/metric-entry";
import type { Option } from "@/components/matches/match-dialogs";
import {
  METRIC_BY_KEY,
  OUTCOME_LABELS,
  OUTCOME_STYLES,
  POSITION_PRESETS,
  SOURCE_LABELS,
  SOURCE_STYLES,
  VENUE_LABELS,
  formatMatchDate,
  formatMetric,
  matchOutcome,
  metricLabel,
  sortMetricKeys,
  type MetricData,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { getAthleteMatchHistory } from "@/lib/actions/matches";
import type { Position } from "@prisma/client";
import { Clock, Trophy } from "lucide-react";

type History = Awaited<ReturnType<typeof getAthleteMatchHistory>>;

export function AthleteMatchHistory({
  history,
  athleteId,
  athleteTeamId,
  position,
  matches,
  teams,
  leagues,
}: {
  history: History;
  athleteId: string;
  athleteTeamId: string;
  position: Position;
  matches: MatchOption[];
  teams: Option[];
  leagues: Option[];
}) {
  const preset = POSITION_PRESETS[position];
  const usedMatchIds = history.map((h) => h.matchId);

  // Aggregate summary (sum of count metrics, average of the rest)
  const totalMinutes = history.reduce((s, h) => s + (h.minutesPlayed ?? 0), 0);
  const sums: Record<string, { sum: number; n: number }> = {};
  for (const h of history) {
    for (const [k, v] of Object.entries(h.data as MetricData)) {
      if (typeof v !== "number") continue;
      sums[k] ??= { sum: 0, n: 0 };
      sums[k].sum += v;
      sums[k].n += 1;
    }
  }
  const summaryKeys = sortMetricKeys(Object.keys(sums), preset).slice(0, 6);

  return (
    <div className="space-y-4">
      {history.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryTile label="Jogos" value={String(history.length)} />
          <SummaryTile label="Minutos" value={totalMinutes.toLocaleString("pt-BR")} />
          {summaryKeys.slice(0, 2).map((k) => {
            const { sum, n } = sums[k];
            const isCount = (METRIC_BY_KEY[k]?.unit ?? "count") === "count";
            const per90 = totalMinutes > 0 && isCount ? ((sum / totalMinutes) * 90).toFixed(2) : null;
            return (
              <SummaryTile
                key={k}
                label={
                  isCount
                    ? `${metricLabel(k)} (total${per90 ? ` · ${per90}/90` : ""})`
                    : `${metricLabel(k)} (média)`
                }
                value={formatMetric(k, isCount ? sum : sum / n)}
              />
            );
          })}
        </div>
      )}

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10 text-center">
          <Trophy className="mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Nenhuma métrica lançada</p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Use &ldquo;Lançar Métricas&rdquo; para registrar o desempenho deste atleta em um jogo.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-3 border-l border-border/60 pl-5">
          {history.map((h) => {
            const m = h.match;
            const outcome = matchOutcome(m.goalsFor, m.goalsAgainst);
            const data = h.data as MetricData;
            const keys = sortMetricKeys(Object.keys(data), preset);
            const label = `${formatMatchDate(m.date)} vs ${m.opponentName}`;
            const canonicalMap = new Map(
              (h.canonicalMetrics ?? []).map((c) => [c.metricName, c])
            );

            return (
              <li key={h.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[27px] top-4 h-3 w-3 rounded-full ring-4 ring-background",
                    outcome === "W" ? "bg-emerald-400" : outcome === "L" ? "bg-rose-400" : "bg-zinc-400"
                  )}
                />
                <article className="group rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary/30">
                  <header className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {formatMatchDate(m.date, { day: "2-digit", month: "short", year: "numeric" })} · {m.competition}
                        {m.round ? ` · ${m.round}` : ""}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">
                          {m.team.shortName ?? m.team.name}
                          {m.goalsFor != null && m.goalsAgainst != null ? (
                            <span className="mx-1.5 tabular-nums">{m.goalsFor} × {m.goalsAgainst}</span>
                          ) : (
                            <span className="mx-1.5 text-muted-foreground">vs</span>
                          )}
                          {m.opponentName}
                        </h3>
                        {outcome && (
                          <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold ring-1", OUTCOME_STYLES[outcome])}>
                            {OUTCOME_LABELS[outcome]}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">{VENUE_LABELS[m.venue]}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {h.minutesPlayed != null && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {h.minutesPlayed}&apos;
                        </span>
                      )}
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1", SOURCE_STYLES[h.source])}>
                        {SOURCE_LABELS[h.source]}
                      </span>
                      <div className="flex items-center opacity-60 transition-opacity group-hover:opacity-100">
                        <EditMetricButton
                          athleteId={athleteId}
                          athleteTeamId={athleteTeamId}
                          position={position}
                          matches={matches}
                          usedMatchIds={usedMatchIds}
                          teams={teams}
                          leagues={leagues}
                          metric={{
                            id: h.id,
                            matchId: h.matchId,
                            source: h.source,
                            minutesPlayed: h.minutesPlayed,
                            data,
                          }}
                        />
                        <DeleteMetricButton id={h.id} label={label} />
                      </div>
                    </div>
                  </header>

                  <dl className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {keys.map((k) => {
                      const canonical = canonicalMap.get(k);
                      const def = METRIC_BY_KEY[k];
                      const isRate = def?.unit === "percent" || k === "rating";
                      const showPer90 = canonical && !isRate && canonical.per90Value > 0 && h.minutesPlayed && h.minutesPlayed > 0;

                      return (
                        <div key={k} className="rounded-lg bg-background/50 px-2.5 py-2">
                          <dt className="truncate text-[10px] text-muted-foreground" title={metricLabel(k)}>
                            {metricLabel(k)}
                          </dt>
                          <dd className="text-base font-bold tabular-nums text-foreground flex items-baseline gap-1.5">
                            <span>{formatMetric(k, data[k])}</span>
                            {showPer90 && (
                              <span
                                className="text-[10px] font-semibold text-primary font-mono tracking-tight"
                                title={`Normalizado: ${canonical.per90Value.toLocaleString("pt-BR")} a cada 90 minutos`}
                              >
                                {canonical.per90Value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/90
                              </span>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                </article>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/10 to-transparent p-3 ring-1 ring-primary/15">
      <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
