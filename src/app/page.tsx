import { prisma } from "@/lib/prisma";
import {
  getAnalystDashboardData,
  getAnalystHighlights,
} from "@/lib/actions/portfolio";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AthleteRaioXModal, type RaioXAthleteData } from "@/components/reports/athlete-raio-x-modal";
import { PortfolioToggleButton } from "@/components/portfolio/portfolio-toggle-button";
import {
  Users,
  Shield,
  Trophy,
  Activity,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Bookmark,
  CalendarDays,
  Sparkles,
  FileText,
  Target,
  Flame,
  Award,
  UploadCloud,
} from "lucide-react";
import { POSITION_LABELS, POSITION_COLORS } from "@/lib/domain";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard do Analista | The Net Scouting",
  description: "Painel de operações, portfólio de atletas e destaques de métricas Per-90",
};

export default async function DashboardPage() {
  const [dashboardData, highlights] = await Promise.all([
    getAnalystDashboardData(),
    getAnalystHighlights(),
  ]);

  const {
    totalAthletes,
    totalMatches,
    totalCanonicalMetrics,
    portfolioCount,
    portfolioAthletes,
  } = dashboardData;

  const stats = [
    {
      label: "Meu Portfólio",
      value: String(portfolioCount),
      subtext: "Atletas sob observação",
      icon: Bookmark,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      href: "#meu-portfolio",
    },
    {
      label: "Jogos Mapeados",
      value: String(totalMatches),
      subtext: "Partidas com scouts",
      icon: CalendarDays,
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
      href: "/matches",
    },
    {
      label: "Métricas Processadas",
      value: String(totalCanonicalMetrics),
      subtext: "Indicadores Per-90 gerados",
      icon: Activity,
      color: "text-chart-2",
      bg: "bg-chart-2/10 border-chart-2/20",
      href: "/league",
    },
    {
      label: "Atletas na Base",
      value: String(totalAthletes),
      subtext: "Elencos cadastrados",
      icon: Users,
      color: "text-chart-3",
      bg: "bg-chart-3/10 border-chart-3/20",
      href: "/athletes",
    },
  ];

  const quickLinks = [
    {
      label: "Catálogo da Liga",
      href: "/league",
      icon: Trophy,
      description: "Buscar atletas com filtros Per-90 e comparação",
    },
    {
      label: "Importar Scouts (Excel/CSV)",
      href: "/matches",
      icon: UploadCloud,
      description: "Inserção em lote com normalização automática",
    },
    {
      label: "Novo Atleta",
      href: "/athletes",
      icon: Users,
      description: "Adicionar jogador ao banco de dados",
    },
    {
      label: "Cadastrar Jogo",
      href: "/matches",
      icon: CalendarDays,
      description: "Registrar partida e scouts",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Dashboard do Analista
            </h1>
            <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
              Pro v2.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Visão consolidada da operação de scouting, portfólio de atletas e inteligência de mercado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/league">
            <Button size="sm" className="gap-1.5 text-xs font-semibold">
              <Trophy className="h-4 w-4" />
              Explorar Catálogo da Liga
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Operational Stats Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card
              className={`p-5 border bg-card transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group ${stat.bg}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-extrabold mt-1 text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {stat.subtext}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-background/50 border border-border/50">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* ─── Portfólio do Analista (Watchlist) ────────────────────────────── */}
      <section id="meu-portfolio" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-amber-400 fill-amber-400/20" />
              <h2 className="text-lg font-bold text-foreground">
                Meu Portfólio de Observação
              </h2>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs">
                {portfolioCount} {portfolioCount === 1 ? "atleta" : "atletas"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atletas pinados para acompanhamento prioritário e geração de relatórios Raio-X
            </p>
          </div>

          <Link
            href="/league"
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Adicionar mais atletas
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {portfolioAthletes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-border/80 bg-card/50">
            <Bookmark className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <h3 className="text-sm font-semibold text-foreground">
              Seu portfólio de observação está vazio
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              Marque atletas no Catálogo da Liga ou no perfil individual para fixá-los aqui e gerar seus relatórios Raio-X com 1 clique.
            </p>
            <Link href="/league" className="mt-4">
              <Button variant="outline" size="sm" className="text-xs gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" />
                Explorar Catálogo de Jogadores
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {portfolioAthletes.map((item) => {
              const a = item.athlete;
              const initials = a.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

              const topMetrics = Object.entries(a.metrics)
                .filter(([, m]) => m.per90 > 0)
                .slice(0, 3);

              const raioXData: RaioXAthleteData = {
                id: a.id,
                name: a.name,
                position: a.position,
                birthDate: a.birthDate,
                nationality: a.nationality,
                height: null,
                weight: null,
                footPreference: a.footPreference,
                photoUrl: a.photoUrl,
                photoHasAlpha: a.photoHasAlpha,
                team: a.team,
                totalMinutes: a.totalMinutes,
                totalMatches: a.totalMatches,
                canonicalMetrics: a.metrics,
              };

              return (
                <Card
                  key={item.portfolioAthleteId}
                  className="flex flex-col justify-between p-4 border-border bg-card transition-all hover:border-amber-500/40"
                >
                  <div>
                    {/* Header: Team & Pin */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${POSITION_COLORS[a.position]}`}
                      >
                        {POSITION_LABELS[a.position]}
                      </Badge>

                      <PortfolioToggleButton
                        athleteId={a.id}
                        athleteName={a.name}
                        initialInPortfolio={true}
                        variant="icon"
                      />
                    </div>

                    {/* Athlete Info */}
                    <div className="mt-3 flex items-center gap-3">
                      <Avatar className="h-12 w-12 border border-border shrink-0">
                        <AvatarImage src={a.photoUrl ?? undefined} alt={a.name} />
                        <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/athletes/${a.id}`}
                          className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                        >
                          {a.name}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
                          <Shield className="h-3 w-3 shrink-0" />
                          <span className="truncate">{a.team.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Per-90 Metrics Badges */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {topMetrics.length > 0 ? (
                        topMetrics.map(([k, m]) => (
                          <span
                            key={k}
                            className="inline-flex items-center gap-1 rounded bg-muted/70 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground"
                          >
                            <span>{m.label.split(" ")[0]}:</span>
                            <span className="font-bold text-foreground">{m.per90}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">
                          Métricas pendentes de scout
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.totalMinutes}&apos; ({a.totalMatches}j)
                    </span>

                    <div className="flex items-center gap-2">
                      <AthleteRaioXModal
                        athlete={raioXData}
                        triggerButton={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] gap-1 px-2 border-primary/30 text-primary hover:bg-primary/10"
                          >
                            <FileText className="h-3 w-3" />
                            Raio-X
                          </Button>
                        }
                      />
                      <Link href={`/athletes/${a.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] px-2">
                          Perfil
                          <ChevronRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Destaques da Liga (Líderes Per-90) ────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Destaques da Liga (Líderes Per-90)
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Atalhos rápidos para os jogadores com maior produção normalizada por 90 minutos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Gols / 90 */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <Target className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Goleadores (/90)
              </p>
            </div>
            <div className="space-y-2.5">
              {highlights.goals && highlights.goals.length > 0 ? (
                highlights.goals.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-muted/40 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>

          {/* Assistências / 90 */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <Award className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Garçons (/90)
              </p>
            </div>
            <div className="space-y-2.5">
              {highlights.assists && highlights.assists.length > 0 ? (
                highlights.assists.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-muted/40 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sky-400 shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>

          {/* Passes / 90 */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <Flame className="h-4 w-4 text-primary" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Passes (/90)
              </p>
            </div>
            <div className="space-y-2.5">
              {highlights.passes && highlights.passes.length > 0 ? (
                highlights.passes.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-muted/40 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-primary shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>

          {/* Desarmes / 90 */}
          <Card className="p-4 border-border bg-card">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
              <Shield className="h-4 w-4 text-chart-4" />
              <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                Desarmes (/90)
              </p>
            </div>
            <div className="space-y-2.5">
              {highlights.tackles && highlights.tackles.length > 0 ? (
                highlights.tackles.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-muted/40 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-muted-foreground w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate group-hover:text-primary">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-chart-4 shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-muted-foreground py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Ações Rápidas da Operação ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Ações Operacionais de Scouting
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex flex-col justify-between p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition-all group"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <link.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.label}
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {link.description}
                </p>
              </div>
              <div className="flex items-center gap-1 mt-4 text-xs font-medium text-primary">
                <span>Acessar</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
