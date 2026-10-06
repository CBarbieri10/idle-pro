import { getAthleteById, getSimilarAthletes } from "@/lib/actions/athletes";
import { getTeams, getLeagues } from "@/lib/actions/teams";
import { getAthleteMatchHistory, getMatchOptions } from "@/lib/actions/matches";
import {
  getAthleteStatsForProfile,
  isAthleteInPortfolio,
} from "@/lib/actions/portfolio";
import { EditAthleteButton, DeleteAthleteButton } from "@/components/athletes/athlete-dialogs";
import { AthletePhotoUpload } from "@/components/athletes/athlete-photo-upload";
import { AddMetricButton } from "@/components/matches/metric-entry";
import { AthleteMatchHistory } from "@/components/matches/athlete-match-history";
import { RadarChart } from "@/components/charts/radar-chart";
import { TacticalPitchHeatmap } from "@/components/charts/tactical-pitch-heatmap";
import { SimilarAthletes } from "@/components/athletes/similar-athletes";
import { AthleteRaioXModal, type RaioXAthleteData } from "@/components/reports/athlete-raio-x-modal";
import { getVideoLinksByAthlete } from "@/lib/actions/video-links";
import { AthleteVideoLinks } from "@/components/athletes/athlete-video-links";
import { getGoalsByAthlete } from "@/lib/actions/goals";
import { AthleteGoals } from "@/components/athletes/athlete-goals";
import { PortfolioToggleButton } from "@/components/portfolio/portfolio-toggle-button";
import { StabilityBadge } from "@/components/athletes/stability-badge";
import { AthleteTacticalAiSummary } from "@/components/athletes/athlete-tactical-ai-summary";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  FOOT_LABELS,
  formatHeight,
  formatWeight,
  formatAge,
  formatDate,
} from "@/lib/domain";
import {
  ArrowLeft,
  Shield,
  Globe,
  Camera,
  BarChart3,
  Fingerprint,
  Sparkles,
  ExternalLink,
  TrendingUp,
  Clock,
  Calendar,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const athlete = await getAthleteById(id);
  if (!athlete) return { title: "Atleta não encontrado" };
  return {
    title: `${athlete.name} | The Net Scouting`,
    description: `Perfil e inteligência de performance de ${athlete.name} — ${POSITION_LABELS[athlete.position]}`,
  };
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.12] bg-gradient-to-b from-[#131b2a]/95 to-[#080e18]/95 p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[#00e676]/40 transition-all">
      <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-300">
        {label}
      </p>
      <p className="text-base font-black text-[#00e676] font-mono mt-1 drop-shadow-sm">{value}</p>
    </div>
  );
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athlete, teams, leagues, history, matchOptions, athleteStats, inPortfolio, videoLinks, goals] =
    await Promise.all([
      getAthleteById(id),
      getTeams(),
      getLeagues(),
      getAthleteMatchHistory(id),
      getMatchOptions(),
      getAthleteStatsForProfile(id),
      isAthleteInPortfolio(id),
      getVideoLinksByAthlete(id),
      getGoalsByAthlete(id),
    ]);

  if (!athlete) notFound();

  const similarAthletes = await getSimilarAthletes(athlete.id, athlete.position, 3);

  // Extract totals for quick indicators
  const totalGoals = Math.round(
    (athleteStats?.metrics["goals"]?.per90 ?? 0) *
      ((athleteStats?.totalMinutes ?? 0) / 90)
  );
  const totalAssists = Math.round(
    (athleteStats?.metrics["assists"]?.per90 ?? 0) *
      ((athleteStats?.totalMinutes ?? 0) / 90)
  );
  const totalYellowCards = history.reduce((sum, h) => {
    const card = h.canonicalMetrics.find(
      (m) => m.metricName === "yellow_cards" || m.metricName === "cartoes_amarelos"
    );
    return sum + (card?.absoluteValue ?? 0);
  }, 0);
  const totalRedCards = history.reduce((sum, h) => {
    const card = h.canonicalMetrics.find(
      (m) => m.metricName === "red_cards" || m.metricName === "cartoes_vermelhos"
    );
    return sum + (card?.absoluteValue ?? 0);
  }, 0);

  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));
  const leagueList = leagues.map((l) => ({ id: l.id, name: l.name }));
  const metricProps = {
    athleteId: athlete.id,
    athleteTeamId: athlete.teamId,
    position: athlete.position,
    matches: matchOptions,
    teams: teamList,
    leagues: leagueList,
  };

  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const raioXData: RaioXAthleteData = {
    id: athlete.id,
    name: athlete.name,
    position: athlete.position,
    birthDate: athlete.birthDate,
    nationality: athlete.nationality,
    height: athlete.height,
    weight: athlete.weight,
    footPreference: athlete.footPreference,
    photoUrl: athlete.photoUrl,
    photoHasAlpha: athlete.photoHasAlpha,
    actionPhotoUrl: athlete.actionPhotoUrl,
    team: {
      id: athlete.team.id,
      name: athlete.team.name,
      shortName: athlete.team.shortName,
    },
    totalMinutes: athleteStats?.totalMinutes ?? 0,
    totalMatches: athleteStats?.totalMatches ?? 0,
    canonicalMetrics: athleteStats?.metrics ?? {},
    recentMatches: athleteStats?.recentMatches ?? [],
    goals,
    videoLinks,
    idgScore: athlete.idgScore,
    stabilityCategory: athlete.stabilityCategory,
    analysisNotes: {
      tacticalTitle: athlete.tacticalTitle ?? undefined,
      tacticalSummary: athlete.tacticalSummary ?? undefined,
      strengths: athlete.tacticalStrengths.length > 0 ? athlete.tacticalStrengths : undefined,
      weaknesses: athlete.tacticalWeaknesses.length > 0 ? athlete.tacticalWeaknesses : undefined,
    },
  };

  const hasMetrics = athleteStats && Object.keys(athleteStats.metrics).length > 0;

  return (
    <div className="space-y-6 w-full">
      {/* ─── Breadcrumb & Action Toolbar ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-4">
        <Link
          href="/athletes"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
          Voltar para lista de atletas
        </Link>

        {/* Executive Action Toolbar */}
        <div className="flex items-center gap-2">
          <PortfolioToggleButton
            athleteId={athlete.id}
            athleteName={athlete.name}
            initialInPortfolio={inPortfolio}
          />

          <Link
            href={`/athletes/${athlete.id}/raio-x`}
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-bg-surface-highlight transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5 text-indigo-400" />
            Dossiê A4 (Tela Cheia)
          </Link>

          <AthleteRaioXModal athlete={raioXData} />
        </div>
      </div>

      {/* ─── Hero Executive Header ────────────────────────────────────────── */}
      <section className="relative mt-2">
        {/* Holographic background */}
        <div className="hero-stage absolute inset-0 overflow-hidden rounded-2xl border border-border-strong shadow-2xl" />

        {/* Monogram watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        >
          <span className="absolute -bottom-6 right-4 select-none text-[9rem] font-black leading-none tracking-tighter text-white/[0.03]">
            {initials}
          </span>
        </div>

        <div className="relative z-10 flex min-h-[220px] flex-col items-start gap-6 p-6 sm:flex-row sm:items-end sm:pl-8">
          {/* Profile photo with alpha float stage */}
          {athlete.photoUrl && athlete.photoHasAlpha ? (
            <div className="relative -mt-16 h-[260px] w-[200px] shrink-0 sm:-mb-6 sm:self-end">
              <Image
                src={athlete.photoUrl}
                alt={athlete.name}
                fill
                priority
                className="object-contain object-bottom drop-shadow-[0_20px_30px_rgba(0,0,0,0.6)]"
                sizes="200px"
                unoptimized
              />
            </div>
          ) : athlete.photoUrl ? (
            <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 ring-indigo-500/40 shadow-xl border border-indigo-500/30">
              <Image
                src={athlete.photoUrl}
                alt={athlete.name}
                fill
                priority
                className="object-cover"
                sizes="112px"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/20 text-3xl font-black text-indigo-400 ring-1 ring-indigo-500/30">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    className={`text-[10px] font-bold px-2 py-0.5 border-0 ${POSITION_COLORS[athlete.position]}`}
                  >
                    {POSITION_LABELS[athlete.position]}
                  </Badge>
                  {(athlete.idgScore !== undefined && athlete.idgScore !== null || athlete.stabilityCategory) && (
                    <StabilityBadge
                      idgScore={athlete.idgScore}
                      category={athlete.stabilityCategory}
                      size="sm"
                    />
                  )}
                </div>
                <h1 className="truncate text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {athlete.name}
                </h1>
                {athlete.nationality && (
                  <span className="mt-1 flex items-center gap-1 text-xs text-white/70">
                    <Globe className="h-3.5 w-3.5 text-indigo-400" />
                    {athlete.nationality}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <EditAthleteButton athlete={athlete} teams={teamList} />
                <DeleteAthleteButton id={athlete.id} name={athlete.name} />
              </div>
            </div>

            {/* Club & Physical Pills Bar */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-md">
                <Shield className="h-4 w-4 text-indigo-400" />
                <div>
                  <p className="text-[9px] uppercase font-bold tracking-wider text-white/50">Clube</p>
                  <p className="text-xs font-bold text-white">{athlete.team.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/35 px-3 py-1.5 backdrop-blur-md font-mono text-xs text-zinc-300">
                <Clock className="h-3.5 w-3.5 text-indigo-400" />
                <span>
                  <strong>Amostragem:</strong> {athleteStats?.totalMinutes ?? 0}&apos; ({athleteStats?.totalMatches ?? 0} jogos)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tactical Center: Radar + Heatmap Pitch (BeSoccer Pro Model) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tactical Radar & Similar Players (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="rounded-2xl border border-[#1e2638] bg-[#0c0f17] p-6 shadow-xl tactical-canvas">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#1e2638]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
                    <Fingerprint className="h-4 w-4" />
                  </div>
                  <h2 className="text-base font-black text-white">
                    Impressão Digital Tática (Radar Multidimensional)
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Métricas Per-90 calibradas em relação aos padrões de referência da liga profissional.
                </p>
              </div>

              <Badge variant="outline" className="border-[#00e676]/30 text-[#00e676] bg-[#00e676]/10 gap-1 text-[11px] font-bold">
                <Sparkles className="h-3 w-3" />
                *Métricas por percentil
              </Badge>
            </div>

            {hasMetrics ? (
              <div className="flex flex-col items-center justify-center py-2">
                <RadarChart
                  metrics={athleteStats.metrics}
                  size={360}
                  showCategoryTabs={true}
                  colorVariant="emerald"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Fingerprint className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-bold text-foreground">Nenhuma métrica computada</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Adicione métricas por jogo ou importe planilhas de scouts para gerar o radar tático deste atleta.
                </p>
              </div>
            )}
          </Card>

          {/* Similar Players row */}
          <SimilarAthletes
            athletes={similarAthletes}
            currentPositionName={POSITION_LABELS[athlete.position]}
          />
        </div>

        {/* Right: Pitch Heatmap + 5 Quick Metrics + Biometrics & Market Matrix (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <TacticalPitchHeatmap
            position={athlete.position}
            athleteName={athlete.name}
            totalMatches={athleteStats?.totalMatches ?? 0}
            totalMinutes={athleteStats?.totalMinutes ?? 0}
            goals={totalGoals}
            assists={totalAssists}
            yellowCards={totalYellowCards}
            redCards={totalRedCards}
            age={athlete.birthDate ? formatAge(athlete.birthDate) : null}
            height={athlete.height}
            weight={athlete.weight}
            footPreference={athlete.footPreference}
          />
        </div>
      </div>

      {/* ─── Top Destaques Estatísticos ────────────────────────────────────── */}
      {hasMetrics && (
        <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-white">
                <BarChart3 className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                Destaques de Performance Per-90 Minutos
              </h3>
            </div>
            <span className="text-xs font-mono text-muted-foreground">Normalizado</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(athleteStats.metrics)
              .filter(([, m]) => m.per90 > 0)
              .sort(([, a], [, b]) => b.per90 - a.per90)
              .slice(0, 6)
              .map(([k, m]) => {
                const isHigh = m.per90 >= 2.0 || k === "goals" || k === "xg" || k === "key_passes";
                return (
                  <div
                    key={k}
                    className="rounded-xl border border-border-strong bg-bg-surface-elevated p-3 text-center"
                  >
                    <p className="text-[10px] text-muted-foreground font-bold uppercase truncate">
                      {m.label}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-mono font-black text-lg tabular-nums",
                        isHigh ? "text-emerald-400" : "text-foreground"
                      )}
                    >
                      {m.per90}
                    </p>
                    <span className="text-[9px] text-muted-foreground font-mono">/90 min</span>
                  </div>
                );
              })}
          </div>
        </Card>
      )}

      {/* ─── Inteligência Científica: Eficiência & PAdj (Fase 6 - Issue #18) ─── */}
      {hasMetrics && (athleteStats.metrics["xg_per_shot"] || athleteStats.metrics["padj_tackles"] || athleteStats.metrics["padj_interceptions"]) && (
        <Card className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/20 via-bg-surface to-bg-surface p-5 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                Inteligência Científica & Ajuste Tático
              </h3>
            </div>
            <span className="text-[10px] font-mono text-indigo-300/80 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              PAdj Sigmoide &bull; xG/Shot
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {athleteStats.metrics["xg_per_shot"] && (
              <div className="rounded-xl border border-border-strong bg-bg-surface-elevated p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                  <span>Qualidade de Finalização</span>
                  <span className="text-rose-400 font-mono">xG/Fin</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono font-black text-xl text-foreground">
                    {athleteStats.metrics["xg_per_shot"].per90.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-sans">
                    {athleteStats.metrics["xg_per_shot"].per90 >= 0.18 ? "🔥 Alta Letalidade" : "Volume Periférico"}
                  </span>
                </div>
              </div>
            )}

            {athleteStats.metrics["padj_tackles"] && (
              <div className="rounded-xl border border-border-strong bg-bg-surface-elevated p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                  <span>Desarmes Ajustados por Posse</span>
                  <span className="text-emerald-400 font-mono">PAdj</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono font-black text-xl text-emerald-400">
                    {athleteStats.metrics["padj_tackles"].per90.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    /90 (bruto: {athleteStats.metrics["tackles"]?.per90.toFixed(1) ?? "—"})
                  </span>
                </div>
              </div>
            )}

            {athleteStats.metrics["padj_interceptions"] && (
              <div className="rounded-xl border border-border-strong bg-bg-surface-elevated p-3">
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold uppercase">
                  <span>Interceptações Ajustadas</span>
                  <span className="text-emerald-400 font-mono">PAdj</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-mono font-black text-xl text-emerald-400">
                    {athleteStats.metrics["padj_interceptions"].per90.toFixed(1)}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    /90 (bruto: {athleteStats.metrics["interceptions"]?.per90.toFixed(1) ?? "—"})
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ─── Parecer Tático com IA (Fase 6 - Issue #20) ──────────────────── */}
      <AthleteTacticalAiSummary
        athleteId={athlete.id}
        athleteName={athlete.name}
        initialTitle={athlete.tacticalTitle}
        initialSummary={athlete.tacticalSummary}
        initialStrengths={athlete.tacticalStrengths}
        initialWeaknesses={athlete.tacticalWeaknesses}
      />

      {/* ─── Metas de Desenvolvimento & KPIs (Fase 4 - Issue #12) ─────────── */}
      <AthleteGoals
        athleteId={athlete.id}
        athleteName={athlete.name}
        goals={goals}
      />

      {/* ─── Videoteca Tática & Decupagens (Fase 4 - Issue #11) ───────────── */}
      <AthleteVideoLinks
        athleteId={athlete.id}
        athleteName={athlete.name}
        videos={videoLinks}
        matchOptions={matchOptions.map((m) => ({
          id: m.id,
          label: `${m.competition} • vs ${m.opponentName} (${new Date(m.date).toLocaleDateString("pt-BR")})`,
        }))}
      />

      {/* ─── Biographical Data Grid ───────────────────────────────────────── */}
      <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-400" />
          Ficha Biográfica & Biometria
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatTile
            label="Nascimento"
            value={formatDate(athlete.birthDate)}
          />
          <StatTile label="Idade" value={athlete.birthDate ? `${formatAge(athlete.birthDate)}` : "—"} />
          <StatTile label="Pé Dominante" value={FOOT_LABELS[athlete.footPreference]} />
          <StatTile label="Altura" value={formatHeight(athlete.height)} />
          <StatTile label="Peso" value={formatWeight(athlete.weight)} />
          <StatTile label="Nacionalidade" value={athlete.nationality ?? "—"} />
        </div>

        {athlete.notes && (
          <>
            <Separator className="my-5 border-border-subtle" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Anotações do Scout
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap bg-bg-surface-elevated p-3 rounded-xl border border-border-subtle">
                {athlete.notes}
              </p>
            </div>
          </>
        )}
      </Card>

      {/* ─── Manage Photos ────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-md">
        <div className="flex items-center gap-2 mb-5">
          <Camera className="h-4 w-4 text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Fotos do Atleta & Transparência
          </h2>
        </div>

        <AthletePhotoUpload
          athleteId={athlete.id}
          photoUrl={athlete.photoUrl ?? null}
          photoHasAlpha={athlete.photoHasAlpha}
          actionPhotoUrl={athlete.actionPhotoUrl ?? null}
          actionPhotoHasAlpha={athlete.actionPhotoHasAlpha}
        />
      </Card>

      {/* ─── Matches History (T04) ────────────────────────────────────────── */}
      <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-md" id="athlete-metrics">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Histórico & Métricas por Jogo
            </h2>
          </div>
          <AddMetricButton {...metricProps} usedMatchIds={history.map((h) => h.matchId)} />
        </div>
        <AthleteMatchHistory history={history} {...metricProps} />
      </Card>
    </div>
  );
}
