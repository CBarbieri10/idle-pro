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
import { ArrowLeft, Shield, Globe, Camera, BarChart3, Fingerprint, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
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
    description: `Perfil de ${athlete.name} — ${POSITION_LABELS[athlete.position]}`,
  };
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium text-foreground">{value}</p>
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
    <div className="space-y-6 max-w-4xl">
      {/* Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/athletes"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para atletas
        </Link>

        {/* Executive Action Toolbar */}
        <div className="flex items-center gap-2">
          <PortfolioToggleButton
            athleteId={athlete.id}
            athleteName={athlete.name}
            initialInPortfolio={inPortfolio}
          />
          <AthleteRaioXModal athlete={raioXData} />
        </div>
      </div>

      {/* ─── Hero header ─────────────────────────────────────────────────── */}
      <section className="relative mt-4">
        {/* Background layer (clipped) */}
        <div className="hero-stage absolute inset-0 overflow-hidden rounded-2xl border border-border/60 shadow-2xl shadow-primary/10" />

        {/* Monogram watermark */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
        >
          <span className="absolute -bottom-6 right-4 select-none text-[9rem] font-black leading-none tracking-tighter text-white/[0.04]">
            {initials}
          </span>
        </div>

        <div className="relative flex min-h-[220px] flex-col items-start gap-6 p-6 sm:flex-row sm:items-end sm:pl-8">
          {/* Profile photo */}
          {athlete.photoUrl && athlete.photoHasAlpha ? (
            // Transparent cut-out — overflows the top of the card
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
            <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 ring-primary/40 shadow-xl">
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
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-3xl font-bold text-primary ring-1 ring-primary/30">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <Badge
                  className={`mb-2 text-xs font-medium border-0 ${POSITION_COLORS[athlete.position]}`}
                >
                  {POSITION_LABELS[athlete.position]}
                </Badge>
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                  {athlete.name}
                </h1>
                {athlete.nationality && (
                  <span className="mt-1 flex items-center gap-1 text-xs text-white/60">
                    <Globe className="h-3 w-3" />
                    {athlete.nationality}
                  </span>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <EditAthleteButton athlete={athlete} teams={teamList} />
                <DeleteAthleteButton id={athlete.id} name={athlete.name} />
              </div>
            </div>

            {/* Club & National Team */}
            <div className="mt-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-md">
                <Shield className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/50">Clube</p>
                  <p className="text-sm font-medium text-white">{athlete.team.name}</p>
                </div>
              </div>
              {athlete.nationalTeam && (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-3 py-2 backdrop-blur-md">
                  <Globe className="h-4 w-4 text-chart-2" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/50">Seleção</p>
                    <p className="text-sm font-medium text-white">{athlete.nationalTeam.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Impressão Digital Tática (Gráfico de Radar Per-90) ─────────────── */}
      <Card className="p-6 border-border bg-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border/60">
          <div>
            <div className="flex items-center gap-2">
              <Fingerprint className="h-5 w-5 text-primary" />
              <h2 className="text-base font-bold text-foreground">
                Impressão Digital Tática
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Normalização Per-90 calibrada em relação aos padrões de elite da posição
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary gap-1 text-[11px]">
              <Sparkles className="h-3 w-3" />
              Per-90 Benchmark
            </Badge>
          </div>
        </div>

        {hasMetrics ? (
          <div className="flex flex-col lg:flex-row items-center justify-around gap-8">
            <div className="flex-1 flex justify-center">
              <RadarChart
                metrics={athleteStats.metrics}
                size={340}
                showCategoryTabs={true}
              />
            </div>

            {/* Quick summary column */}
            <div className="w-full lg:w-72 space-y-4">
              <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-primary" />
                  Destaques Estatísticos
                </p>
                <div className="space-y-2.5">
                  {Object.entries(athleteStats.metrics)
                    .filter(([, m]) => m.per90 > 0)
                    .sort(([, a], [, b]) => b.per90 - a.per90)
                    .slice(0, 5)
                    .map(([k, m]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between text-xs border-b border-border/40 pb-1.5 last:border-none last:pb-0"
                      >
                        <span className="text-muted-foreground truncate max-w-[150px]">
                          {m.label}
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {m.per90}
                          <span className="text-[10px] text-muted-foreground ml-0.5">/90</span>
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-[11px] text-muted-foreground leading-relaxed">
                💡 <span className="font-semibold text-foreground">Dica do Analista:</span> Use as abas do radar (Ataque, Passe, Defesa) para isolar sub-dimensões e comparar o volume de ações com o equilíbrio tático.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Fingerprint className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-medium text-foreground">Nenhuma métrica computada</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Adicione métricas por jogo ou importe planilhas de scouts para gerar o radar tático deste atleta.
            </p>
          </div>
        )}
      </Card>

      {/* ─── Galeria de ação ───────────────────────────────────────────────── */}
      {athlete.actionPhotoUrl && (
        <div
          className={`relative overflow-hidden rounded-2xl border border-border/50 ${
            athlete.actionPhotoHasAlpha ? "photo-stage" : ""
          }`}
          style={{ aspectRatio: "16/9" }}
        >
          <Image
            src={athlete.actionPhotoUrl}
            alt={`${athlete.name} — foto de ação`}
            fill
            className={
              athlete.actionPhotoHasAlpha
                ? "object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.55)]"
                : "object-cover"
            }
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-5 py-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
              Foto de Ação
            </p>
            <p className="text-sm font-semibold text-white">{athlete.name}</p>
          </div>
        </div>
      )}

      {/* ─── Gerenciar fotos ───────────────────────────────────────────────── */}
      <Card className="p-6 border-border bg-card">
        <div className="flex items-center gap-2 mb-5">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-foreground">Fotos do Atleta</h2>
        </div>

        <AthletePhotoUpload
          athleteId={athlete.id}
          photoUrl={athlete.photoUrl ?? null}
          photoHasAlpha={athlete.photoHasAlpha}
          actionPhotoUrl={athlete.actionPhotoUrl ?? null}
          actionPhotoHasAlpha={athlete.actionPhotoHasAlpha}
        />
      </Card>

      {/* Biographical data */}
      <Card className="p-6 border-border bg-card">
        <h2 className="text-sm font-semibold text-foreground mb-4">Dados Biográficos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <StatItem
            label="Data de Nascimento"
            value={formatDate(athlete.birthDate)}
          />
          <StatItem label="Idade" value={formatAge(athlete.birthDate)} />
          <StatItem label="Pé Dominante" value={FOOT_LABELS[athlete.footPreference]} />
          <StatItem label="Altura" value={formatHeight(athlete.height)} />
          <StatItem label="Peso" value={formatWeight(athlete.weight)} />
          <StatItem label="Nacionalidade" value={athlete.nationality ?? "—"} />
        </div>

        {athlete.notes && (
          <>
            <Separator className="my-5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Anotações
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {athlete.notes}
              </p>
            </div>
          </>
        )}
      </Card>

      {/* ─── Métricas por jogo (T04) ──────────────────────────────────────── */}
      <Card className="p-6 border-border bg-card" id="athlete-metrics">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Métricas por Jogo</h2>
          </div>
          <AddMetricButton {...metricProps} usedMatchIds={history.map((h) => h.matchId)} />
        </div>
        <AthleteMatchHistory history={history} {...metricProps} />
      </Card>
    </div>
  );
}
