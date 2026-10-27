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
import { AthleteRaioXExportButton } from "@/components/athletes/athlete-raio-x-export-button";
import { AthleteRaioXPrintSheet } from "@/components/athletes/athlete-raio-x-print-sheet";
import { AthleteTelemetryModal } from "@/components/athletes/athlete-telemetry-modal";
import { AthleteMatchLog, type AthleteMatchEntry } from "@/components/athletes/athlete-match-log";
import { getVideoLinksByAthlete } from "@/lib/actions/video-links";
import { AthleteVideoLinks } from "@/components/athletes/athlete-video-links";
import { AthleteVideoClipsSection } from "@/components/athletes/athlete-video-clips-section";
import { getGoalsByAthlete } from "@/lib/actions/goals";
import { AthleteGoals } from "@/components/athletes/athlete-goals";
import { AddToPortfolioDialog } from "@/components/portfolio/add-to-portfolio-dialog";
import { CompareButton } from "@/components/compare/compare-button";
import { StabilityBadge } from "@/components/athletes/stability-badge";
import { AthleteTacticalAiSummary } from "@/components/athletes/athlete-tactical-ai-summary";
import { AthleteTacticalInferenceCard } from "@/components/athletes/athlete-tactical-inference-card";
import { AthleteHero } from "@/components/athletes/athlete-hero";
import { AthleteTabsView } from "@/components/athletes/athlete-tabs-view";
import {
  AthleteProfileTabs,
  type ProfileTabDef,
} from "@/components/athletes/athlete-profile-tabs";
import { StatPopoverChart } from "@/components/charts/stat-popover-chart";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  POSITION_LABELS,
  formatFootPreference,
  formatHeight,
  formatWeight,
  formatAge,
  formatDate,
} from "@/lib/domain";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
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
    title: `${athlete.name} | Overview Scout`,
    description: `Perfil e inteligência de performance de ${athlete.name} — ${POSITION_LABELS[athlete.position]}`,
  };
}

export default async function AthleteProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athlete, teams, leagues, history, matchOptions, athleteStats, inPortfolio, videoLinks, goals, videoClips] =
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
      prisma.videoClip.findMany({
        where: { athleteId: id },
        include: {
          athlete: {
            include: {
              team: true,
            },
          },
          match: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  if (!athlete) notFound();

  const session = await auth();
  const userRole = session?.user?.role;
  const isAthlete = userRole === "ATHLETE";
  const userAthleteId = session?.user?.athleteId;

  // Se o usuário ativo for ATHLETE, ele é estritamente restrito à sua própria página de perfil
  if (isAthlete && userAthleteId && userAthleteId !== id) {
    redirect(`/athletes/${userAthleteId}`);
  }

  const isAnalystOrClub = !isAthlete; // ANALYST, CLUB ou ADMIN

  // Query teammates for rapid modal switching and context
  const teammates = await prisma.athlete.findMany({
    where: { teamId: athlete.teamId },
    select: {
      id: true,
      name: true,
      position: true,
      photoUrl: true,
      rawMetrics: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { data: true },
      },
    },
    orderBy: { name: "asc" },
    take: 30,
  });

  const teammateList = teammates.map((t) => ({
    id: t.id,
    name: t.name,
    position: POSITION_LABELS[t.position] || t.position,
    photoUrl: t.photoUrl,
    teamName: athlete.team?.name ?? "Sem Clube",
    rawData: (t.rawMetrics?.[0]?.data as Record<string, unknown>) || null,
  }));

  const similarAthletes = await getSimilarAthletes(athlete.id, athlete.position, 3);

  const metrics = athleteStats?.metrics ?? {};
  const totalMatches = athleteStats?.totalMatches ?? 0;
  const totalMinutes = athleteStats?.totalMinutes ?? 0;
  const has = (k: string) => metrics[k] !== undefined;
  const total = (k: string) => metrics[k]?.total ?? 0;

  const totalGoals = total("goals");
  const totalAssists = total("assists");
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

  const ratio = (num: string, den: string) =>
    total(den) > 0 ? `${Math.round((total(num) / total(den)) * 100)}%` : null;

  // Faixa de KPIs da temporada (só exibe o que existe nos dados importados)
  const kpis: Array<{ label: string; value: string; hint?: string }> = [
    { label: "Jogos", value: String(totalMatches), hint: `${totalMinutes}' jogados` },
    { label: "Gols", value: String(totalGoals), hint: has("xg") ? `xG ${total("xg").toFixed(2)}` : undefined },
    { label: "Assistências", value: String(totalAssists), hint: has("xa") ? `xA ${total("xa").toFixed(2)}` : undefined },
    ...(has("shots")
      ? [{ label: "Finalizações", value: String(total("shots")), hint: `${total("shots_on_target")} no alvo` }]
      : []),
    ...(has("dribbles_attempted")
      ? [{ label: "Dribles", value: `${total("dribbles_completed")}/${total("dribbles_attempted")}`, hint: ratio("dribbles_completed", "dribbles_attempted") ?? undefined }]
      : []),
    ...(has("passes_attempted")
      ? [{ label: "Precisão de passe", value: ratio("passes", "passes_attempted") ?? "—", hint: `${total("passes")}/${total("passes_attempted")}` }]
      : []),
    ...(has("duels")
      ? [{ label: "Duelos ganhos", value: ratio("duels_won", "duels") ?? "—", hint: `${total("duels_won")}/${total("duels")}` }]
      : []),
    ...(has("recoveries")
      ? [{ label: "Recuperações", value: String(total("recoveries")), hint: has("recoveries_opponent_half") ? `${total("recoveries_opponent_half")} no ataque` : undefined }]
      : []),
    ...(totalYellowCards + totalRedCards > 0
      ? [{ label: "Cartões", value: `${totalYellowCards}A · ${totalRedCards}V` }]
      : []),
  ];

  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));
  const leagueList = leagues.map((l) => ({ id: l.id, name: l.name }));
  const metricProps = {
    athleteId: athlete.id,
    athleteTeamId: athlete.teamId ?? "",
    position: athlete.position,
    matches: matchOptions,
    teams: teamList,
    leagues: leagueList,
  };

  const rawTelemetryData =
    (athlete.rawMetrics?.[0]?.data as Record<string, unknown>) || null;

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
    team: athlete.team
      ? {
          id: athlete.team.id,
          name: athlete.team.name,
          shortName: athlete.team.shortName,
          logoUrl: athlete.team.logoUrl,
        }
      : null,
    totalMinutes,
    totalMatches,
    canonicalMetrics: metrics,
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

  const hasMetrics = Object.keys(metrics).length > 0;

  const matchLogEntries: AthleteMatchEntry[] = history.map((h) => {
    const rawData = h.data as Record<string, unknown> | null;
    const getCanonical = (name: string): number => {
      const found = h.canonicalMetrics.find((c) => c.metricName === name);
      return found ? found.absoluteValue : 0;
    };

    const numVal = (key: string): number => {
      if (!rawData) return 0;
      const v = rawData[key];
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const p = parseFloat(v.replace(",", "."));
        return isNaN(p) ? 0 : p;
      }
      return 0;
    };

    const matchGoals = getCanonical("goals") || numVal("Gols");
    const matchAssists = getCanonical("assists") || numVal("Assistências");
    const xg = getCanonical("xg") || numVal("xG (Gols esperados)");
    const shots = getCanonical("shots") || numVal("Chutes");
    const shotsOnTarget = getCanonical("shots_on_target") || numVal("Chutes no alvo");
    const passes = getCanonical("passes") || numVal("Passes");
    let passAccuracy = getCanonical("pass_accuracy") || numVal("Passes precisos, %");
    if (passAccuracy > 0 && passAccuracy <= 1) passAccuracy = passAccuracy * 100;

    const tackles = getCanonical("tackles") || numVal("Desarmes");
    const interceptions = getCanonical("interceptions") || numVal("Interceptações");
    const rating = getCanonical("rating") || (numVal("Índice") ? numVal("Índice") / 20 : null);

    return {
      rawMetricId: h.id,
      matchId: h.match.id,
      date: h.match.date,
      opponentName: h.match.opponent?.name || h.match.opponentName,
      venue: h.match.venue,
      competition: h.match.competition,
      round: h.match.round,
      goalsFor: h.match.goalsFor,
      goalsAgainst: h.match.goalsAgainst,
      minutesPlayed: h.minutesPlayed,
      goals: matchGoals,
      assists: matchAssists,
      xg: Number(xg.toFixed(2)),
      shots,
      shotsOnTarget,
      passes,
      passAccuracy: Number(passAccuracy.toFixed(1)),
      tackles,
      interceptions,
      rating: rating ? Number(rating.toFixed(1)) : null,
      rawTelemetry: rawData,
    };
  });

  const positionLabel = POSITION_LABELS[athlete.position];

  // ─── Abas ───────────────────────────────────────────────────────────────────

  const overviewTab = (
    <div className="space-y-4">

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <div className="rounded-2xl border border-white/[0.12] bg-card/75 p-4 backdrop-blur-xl lg:col-span-7">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              Radar de Performance (Per-90)
            </h2>
            <Badge
              variant="outline"
              className="border-emerald-500/30 bg-emerald-500/10 font-mono text-[10px] text-emerald-400"
            >
              {totalMatches} jogos
            </Badge>
          </div>
          <div className="flex justify-center">
            <RadarChart metrics={metrics} size={340} showCategoryTabs colorVariant="emerald" />
          </div>
        </div>

        <div className="space-y-4 lg:col-span-5">
          <AthleteTacticalInferenceCard
            athleteName={athlete.name}
            position={athlete.position}
            metrics={hasMetrics ? metrics : null}
            rawMetrics={rawTelemetryData}
          />
          <TacticalPitchHeatmap
            position={athlete.position}
            athleteName={athlete.name}
            totalMatches={totalMatches}
            totalMinutes={totalMinutes}
            goals={totalGoals}
            assists={totalAssists}
            yellowCards={totalYellowCards}
            redCards={totalRedCards}
            showBiometrics={false}
          />
        </div>
      </div>
    </div>
  );

  const gamesTab = (
    <div className="space-y-4">
      <AthleteMatchLog
        athleteId={athlete.id}
        athleteName={athlete.name}
        athletePosition={positionLabel}
        teamName={athlete.team?.name ?? "Sem Clube"}
        history={matchLogEntries}
      />

      {isAnalystOrClub && (
        <details className="group rounded-2xl border border-white/10 bg-card/75 p-4" id="athlete-metrics">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-black uppercase tracking-wider text-zinc-300">
            <span>Gerenciar lançamentos de scout</span>
            <span className="font-mono text-[10px] text-zinc-500 group-open:hidden">expandir</span>
            <span className="hidden font-mono text-[10px] text-zinc-500 group-open:inline">recolher</span>
          </summary>
          <div className="mt-4 space-y-4">
            <AddMetricButton {...metricProps} usedMatchIds={history.map((h) => h.matchId)} />
            <AthleteMatchHistory history={history} {...metricProps} />
          </div>
        </details>
      )}
    </div>
  );

  const scientific = [
    { key: "xg_per_shot", label: "Qualidade de Finalização", unit: "xG/Fin", digits: 2, color: "rose" as const, raw: null as string | null },
    { key: "padj_tackles", label: "Desarmes PAdj", unit: "PAdj", digits: 1, color: "emerald" as const, raw: "tackles" },
    { key: "padj_interceptions", label: "Interceptações PAdj", unit: "PAdj", digits: 1, color: "emerald" as const, raw: "interceptions" },
  ].filter((s) => metrics[s.key]);

  const analysisTab = (
    <div className="space-y-4">
      {hasMetrics && <AthleteTabsView athlete={{ position: athlete.position }} metrics={metrics} rawMetrics={rawTelemetryData} />}

      {scientific.length > 0 && (
        <Card className="rounded-2xl border border-indigo-500/20 bg-bg-surface p-4">
          <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-foreground">
            Eficiência &amp; Ajuste por Posse
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {scientific.map((s) => (
              <StatPopoverChart
                key={s.key}
                label={s.label}
                value={metrics[s.key].per90.toFixed(s.digits)}
                unit={s.unit}
                athleteId={athlete.id}
                metricKey={s.key}
                colorVariant={s.color}
                triggerClassName="w-full block"
              >
                <div className="cursor-pointer rounded-xl border border-border-strong bg-bg-surface-elevated p-3 transition-all hover:border-emerald-500/40">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">{s.label}</p>
                  <p className="mt-1 font-mono text-xl font-black text-emerald-400">
                    {metrics[s.key].per90.toFixed(s.digits)}
                    {s.raw && metrics[s.raw] && (
                      <span className="ml-2 text-[10px] font-normal text-zinc-400">
                        bruto {metrics[s.raw].per90.toFixed(1)}/90
                      </span>
                    )}
                  </p>
                </div>
              </StatPopoverChart>
            ))}
          </div>
        </Card>
      )}

      <AthleteTacticalAiSummary
        athleteId={athlete.id}
        athleteName={athlete.name}
        initialTitle={athlete.tacticalTitle}
        initialSummary={athlete.tacticalSummary}
        initialStrengths={athlete.tacticalStrengths}
        initialWeaknesses={athlete.tacticalWeaknesses}
      />

      <AthleteGoals athleteId={athlete.id} athleteName={athlete.name} goals={goals} />

      {isAnalystOrClub && (
        <SimilarAthletes athletes={similarAthletes} currentPositionName={positionLabel} />
      )}
    </div>
  );

  const videosTab = (
    <div className="space-y-4">
      <AthleteVideoClipsSection athlete={athlete} clips={videoClips} />
      <AthleteVideoLinks
        athleteId={athlete.id}
        athleteName={athlete.name}
        videos={videoLinks}
        matchOptions={matchOptions.map((m) => ({
          id: m.id,
          label: `${m.competition} • vs ${m.opponentName} (${new Date(m.date).toLocaleDateString("pt-BR")})`,
        }))}
      />
    </div>
  );

  const adminTab = (
    <div className="space-y-4">
      {athlete.notes && (
        <Card className="rounded-2xl border border-border-strong bg-bg-surface p-4">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Anotações do Scout
          </p>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {athlete.notes}
          </p>
        </Card>
      )}
      <Card className="rounded-2xl border border-border-strong bg-bg-surface p-4">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-foreground">
          Fotos do Atleta &amp; Transparência
        </h2>
        <AthletePhotoUpload
          athleteId={athlete.id}
          photoUrl={athlete.photoUrl ?? null}
          photoHasAlpha={athlete.photoHasAlpha}
          actionPhotoUrl={athlete.actionPhotoUrl ?? null}
          actionPhotoHasAlpha={athlete.actionPhotoHasAlpha}
        />
      </Card>
    </div>
  );

  const tabs: ProfileTabDef[] = [
    { id: "overview", label: "Visão Geral", icon: "overview", content: overviewTab },
    { id: "games", label: `Jogo a Jogo (${history.length})`, icon: "games", content: gamesTab },
    { id: "analysis", label: "Análise Tática", icon: "analysis", content: analysisTab },
    { id: "videos", label: "Vídeos", icon: "videos", content: videosTab },
    ...(isAnalystOrClub
      ? [{ id: "admin", label: "Cadastro", icon: "admin" as const, content: adminTab }]
      : []),
  ];

  return (
    <>
      {/* ─── Web Interactive View (Hidden during Print) ───────────────────── */}
      <div className="w-full space-y-4 print:hidden">
        {/* ─── Breadcrumb & Action Toolbar ──────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {isAnalystOrClub ? (
            <Link
              href="/athletes"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
              Voltar para lista de atletas
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              Painel do Atleta &bull; Meu Perfil Oficial
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <AthleteRaioXExportButton athleteName={athlete.name} />
            <AthleteRaioXModal athlete={raioXData} />

            {isAnalystOrClub && (
              <>
                <CompareButton
                  athlete={{
                    id: athlete.id,
                    name: athlete.name,
                    position: positionLabel,
                    photoUrl: athlete.photoUrl,
                    teamName: athlete.team?.name,
                  }}
                  variant="button"
                />
                <AddToPortfolioDialog
                  athleteId={athlete.id}
                  athleteName={athlete.name}
                  athletePosition={positionLabel}
                  athleteClub={athlete.team?.name ?? undefined}
                  variant="button"
                />
                <AthleteTelemetryModal
                  athleteId={athlete.id}
                  athleteName={athlete.name}
                  athletePosition={positionLabel}
                  teamName={athlete.team?.name ?? "Sem Clube"}
                  rawData={rawTelemetryData}
                  teammates={teammateList}
                  triggerVariant="button"
                />
              </>
            )}
          </div>
        </div>

        {/* ─── Cabeçalho do atleta: cor e escudo do clube, foto PNG, dados e números ─── */}
        <AthleteHero
          name={athlete.name}
          initials={initials}
          positionLabel={positionLabel}
          teamName={athlete.team?.name ?? null}
          teamLogoUrl={athlete.team?.logoUrl ?? null}
          photoUrl={athlete.photoUrl ?? null}
          photoHasAlpha={Boolean(athlete.photoHasAlpha)}
          info={[
            ...(athlete.nationality ? [{ label: "Nacionalidade", value: athlete.nationality }] : []),
            ...(athlete.birthDate
              ? [{ label: "Idade", value: `${formatAge(athlete.birthDate)} • ${formatDate(athlete.birthDate)}` }]
              : []),
            { label: "Altura", value: formatHeight(athlete.height) },
            ...(athlete.weight ? [{ label: "Peso", value: formatWeight(athlete.weight) }] : []),
            { label: "Pé", value: formatFootPreference(athlete.footPreference) },
          ]}
          kpis={kpis}
          badges={
            (athlete.idgScore !== undefined && athlete.idgScore !== null) || athlete.stabilityCategory ? (
              <StabilityBadge idgScore={athlete.idgScore} category={athlete.stabilityCategory} size="sm" />
            ) : null
          }
          actions={
            isAnalystOrClub ? (
              <>
                <EditAthleteButton athlete={athlete} teams={teamList} />
                <DeleteAthleteButton id={athlete.id} name={athlete.name} />
              </>
            ) : null
          }
        />

        <AthleteProfileTabs tabs={tabs} />
      </div>

      {/* ─── A4 Executive One-Pager Dossier Container (Visible strictly on Print) ─── */}
      <div className="hidden print:block print:h-[297mm] print:max-h-[297mm] print:w-[210mm] print:overflow-hidden print:bg-white print:p-0 print:text-black print:mx-auto">
        <AthleteRaioXPrintSheet athlete={raioXData} />
      </div>
    </>
  );
}
