import { getAthleteById } from "@/lib/actions/athletes";
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
import { AthleteRaioXModal, type RaioXAthleteData } from "@/components/reports/athlete-raio-x-modal";
import { PortfolioToggleButton } from "@/components/portfolio/portfolio-toggle-button";
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
    <div className="rounded-xl border border-border-subtle bg-bg-surface-elevated p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-black text-foreground font-mono mt-1">{value}</p>
    </div>
  );
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athlete, teams, leagues, history, matchOptions, athleteStats, inPortfolio] =
    await Promise.all([
      getAthleteById(id),
      getTeams(),
      getLeagues(),
      getAthleteMatchHistory(id),
      getMatchOptions(),
      getAthleteStatsForProfile(id),
      isAthleteInPortfolio(id),
    ]);

  if (!athlete) notFound();

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
  };

  const hasMetrics = athleteStats && Object.keys(athleteStats.metrics).length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
                <Badge
                  className={`mb-2 text-[10px] font-bold px-2 py-0.5 border-0 ${POSITION_COLORS[athlete.position]}`}
                >
                  {POSITION_LABELS[athlete.position]}
                </Badge>
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

      {/* ─── Tactical Spider Radar & Key Highlights ───────────────────────── */}
      <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-white">
                <Fingerprint className="h-4 w-4" />
              </div>
              <h2 className="text-base font-black text-foreground">
                Impressão Digital Tática (Radar Multidimensional)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Métricas Per-90 calibradas em relação aos padrões de referência da liga profissional.
            </p>
          </div>

          <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 gap-1 text-[11px] font-bold">
            <Sparkles className="h-3 w-3" />
            Normalização Per-90
          </Badge>
        </div>

        {hasMetrics ? (
          <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
            {/* SVG Radar */}
            <div className="flex-1 flex justify-center py-2">
              <RadarChart
                metrics={athleteStats.metrics}
                size={340}
                showCategoryTabs={true}
              />
            </div>

            {/* Quick summary column */}
            <div className="w-full lg:w-80 space-y-4">
              <div className="rounded-xl border border-border-strong bg-bg-surface-elevated p-4 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                    Top Destaques Estatísticos
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">Per-90</span>
                </p>

                <div className="space-y-2">
                  {Object.entries(athleteStats.metrics)
                    .filter(([, m]) => m.per90 > 0)
                    .sort(([, a], [, b]) => b.per90 - a.per90)
                    .slice(0, 6)
                    .map(([k, m]) => {
                      const isHigh = m.per90 >= 2.0 || k === "goals" || k === "xg" || k === "key_passes";
                      return (
                        <div
                          key={k}
                          className="flex items-center justify-between text-xs border-b border-border-subtle/60 pb-1.5 last:border-none last:pb-0"
                        >
                          <span className="text-muted-foreground truncate max-w-[160px]">
                            {m.label}
                          </span>
                          <span
                            className={cn(
                              "font-mono font-black tabular-nums text-xs",
                              isHigh ? "text-emerald-400" : "text-foreground"
                            )}
                          >
                            {m.per90}
                            <span className="text-[9px] text-muted-foreground ml-0.5">/90</span>
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Tactical Coach / Analyst Insight Card */}
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5 text-[11px] text-muted-foreground leading-relaxed">
                💡 <span className="font-bold text-foreground">Dica do Analista:</span> Use as abas do radar (Ataque, Passe, Defesa) para isolar sub-dimensões e comparar o volume de ações com o equilíbrio tático.
              </div>
            </div>
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
