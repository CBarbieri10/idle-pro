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
    <div className="space-y-8 w-full">
      {/* ─── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Dashboard do Analista
            </h1>
            <Badge className="bg-[#00e676]/15 text-[#00e676] border-[#00e676]/30 text-xs font-bold font-mono">
              Pro v2.0
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Visão consolidada da operação de scouting, portfólio de atletas e inteligência de mercado
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/league">
            <Button size="sm" className="gap-2 text-xs font-bold bg-[#00e676] text-black hover:bg-[#00e676]/90 shadow-lg shadow-[#00e676]/20">
              <Trophy className="h-4 w-4" />
              Explorar Catálogo da Liga
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── Operational Stats Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card
              className="p-5.5 rounded-2xl border border-white/[0.14] bg-gradient-to-br from-[#0e1524]/95 via-[#0a0f1a]/95 to-[#060a12]/98 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all duration-300 hover:border-[#00e676]/60 hover:shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(0,230,118,0.18)] hover:-translate-y-0.5 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[13px] font-extrabold text-zinc-300 uppercase tracking-widest leading-none">
                    {stat.label}
                  </p>
                  <p className="text-4xl font-black mt-2 text-white font-mono tracking-tight drop-shadow-sm">
                    {stat.value}
                  </p>
                  <p className="text-[13px] text-zinc-400 mt-1.5 font-medium">
                    {stat.subtext}
                  </p>
                </div>
                <div className="rounded-2xl p-3.5 bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.12] shadow-inner group-hover:border-[#00e676]/50 group-hover:bg-[#00e676]/10 transition-all duration-300">
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
              <h2 className="text-lg font-black text-white">
                Meu Portfólio de Observação
              </h2>
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-xs font-bold">
                {portfolioCount} {portfolioCount === 1 ? "atleta" : "atletas"}
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Atletas pinados para acompanhamento prioritário e geração de relatórios Raio-X
            </p>
          </div>

          <Link
            href="/league"
            className="text-xs font-bold text-[#00e676] hover:underline inline-flex items-center gap-1"
          >
            Adicionar mais atletas
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {portfolioAthletes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border-dashed border-white/15 bg-[#0d121d]/70 backdrop-blur-md">
            <Bookmark className="h-10 w-10 text-zinc-600 mb-3" />
            <h3 className="text-sm font-bold text-white">
              Seu portfólio de observação está vazio
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md">
              Marque atletas no Catálogo da Liga ou no perfil individual para fixá-los aqui e gerar seus relatórios Raio-X com 1 clique.
            </p>
            <Link href="/league" className="mt-4">
              <Button variant="outline" size="sm" className="text-xs gap-1.5 border-white/20 hover:border-[#00e676]/50">
                <Trophy className="h-3.5 w-3.5 text-[#00e676]" />
                Explorar Catálogo de Jogadores
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
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
                  className="flex flex-col justify-between p-4.5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md shadow-xl transition-all hover:border-[#00e676]/50 hover:bg-[#121927]/95"
                >
                  <div>
                    {/* Header: Position & Pin */}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.5 border-0 ${POSITION_COLORS[a.position]}`}
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
                    <div className="mt-3.5 flex items-center gap-3">
                      <div className="relative h-12 w-12 rounded-full border-2 border-[#00e676]/60 p-0.5 bg-black/50 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(0,230,118,0.2)] flex items-center justify-center">
                        {a.photoUrl ? (
                          <img
                            src={a.photoUrl}
                            alt={a.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-black text-[#00e676] font-mono">
                            {initials}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/athletes/${a.id}`}
                          className="font-black text-sm text-white hover:text-[#00e676] transition-colors block truncate"
                        >
                          {a.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                          {a.team.logoUrl ? (
                            <img src={a.team.logoUrl} alt={a.team.name} className="h-4 w-4 rounded-full object-contain shrink-0" />
                          ) : (
                            <Shield className="h-3 w-3 shrink-0 text-indigo-400" />
                          )}
                          <span className="truncate">{a.team.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Top Per-90 Metrics Tiles */}
                    <div className="mt-3.5 grid grid-cols-3 gap-2">
                      {topMetrics.length > 0 ? (
                        topMetrics.map(([k, m]) => (
                          <div
                            key={k}
                            className="rounded-xl bg-gradient-to-b from-[#131b2a]/95 to-[#080e18]/95 border border-white/[0.12] px-2 py-2 text-center shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)] hover:border-[#00e676]/40 transition-all"
                          >
                            <p
                              className="text-[11px] uppercase tracking-wider text-zinc-300 font-extrabold truncate block"
                              title={m.label}
                            >
                              {m.label.length > 9 ? m.label.slice(0, 8) + ".." : m.label}
                            </p>
                            <p className="text-[15px] font-mono font-black text-[#00e676] mt-1 leading-none drop-shadow-sm">
                              {m.per90}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-3 text-center py-2 rounded-xl bg-black/40 border border-white/5">
                          <span className="text-xs text-zinc-400 italic">
                            Aguardando scouts
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-zinc-400 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3 text-indigo-400" />
                      {a.totalMinutes}&apos; ({a.totalMatches}j)
                    </span>

                    <div className="flex items-center gap-2">
                      <AthleteRaioXModal
                        athlete={raioXData}
                        triggerButton={
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-[11px] font-bold gap-1 px-2.5 border-[#00e676]/40 text-[#00e676] bg-[#00e676]/10 hover:bg-[#00e676]/20"
                          >
                            <FileText className="h-3 w-3" />
                            Raio-X
                          </Button>
                        }
                      />
                      <Link href={`/athletes/${a.id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-[11px] font-semibold text-zinc-300 hover:text-white px-2">
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
              <Sparkles className="h-5 w-5 text-[#00e676]" />
              <h2 className="text-lg font-black text-white">
                Destaques da Liga (Líderes Per-90)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Atalhos rápidos para os jogadores com maior produção normalizada por 90 minutos
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Gols / 90 */}
          <Card className="p-4.5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <Target className="h-4 w-4 text-emerald-400" />
              <p className="text-xs font-black text-white uppercase tracking-wider">
                Goleadores (/90)
              </p>
            </div>
            <div className="space-y-2">
              {highlights.goals && highlights.goals.length > 0 ? (
                highlights.goals.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate group-hover:text-[#00e676] transition-colors">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                          {item.teamLogo && <img src={item.teamLogo} className="h-3 w-3 rounded-full object-contain shrink-0" />}
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-400 shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-zinc-500 py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>

          {/* Assistências / 90 */}
          <Card className="p-4.5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <Award className="h-4 w-4 text-sky-400" />
              <p className="text-xs font-black text-white uppercase tracking-wider">
                Garçons (/90)
              </p>
            </div>
            <div className="space-y-2">
              {highlights.assists && highlights.assists.length > 0 ? (
                highlights.assists.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate group-hover:text-sky-400 transition-colors">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                          {item.teamLogo && <img src={item.teamLogo} className="h-3 w-3 rounded-full object-contain shrink-0" />}
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sky-400 shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-zinc-500 py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>

          {/* Passes / 90 */}
          <Card className="p-4.5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <Flame className="h-4 w-4 text-[#00e676]" />
              <p className="text-xs font-black text-white uppercase tracking-wider">
                Passes (/90)
              </p>
            </div>
            <div className="space-y-2">
              {highlights.passes && highlights.passes.length > 0 ? (
                highlights.passes.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate group-hover:text-[#00e676] transition-colors">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                          {item.teamLogo && <img src={item.teamLogo} className="h-3 w-3 rounded-full object-contain shrink-0" />}
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-[#00e676] shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-zinc-500 py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>

          {/* Desarmes / 90 */}
          <Card className="p-4.5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
              <Shield className="h-4 w-4 text-indigo-400" />
              <p className="text-xs font-black text-white uppercase tracking-wider">
                Desarmes (/90)
              </p>
            </div>
            <div className="space-y-2">
              {highlights.tackles && highlights.tackles.length > 0 ? (
                highlights.tackles.map((item, idx) => (
                  <Link
                    key={item.athleteId}
                    href={`/athletes/${item.athleteId}`}
                    className="flex items-center justify-between gap-2 text-xs group hover:bg-white/5 p-1.5 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-xs font-bold text-zinc-400 w-4 text-center">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                          {item.athleteName}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate flex items-center gap-1">
                          {item.teamLogo && <img src={item.teamLogo} className="h-3 w-3 rounded-full object-contain shrink-0" />}
                          {item.teamName}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-indigo-400 shrink-0">
                      {item.value}
                    </span>
                  </Link>
                ))
              ) : (
                <p className="text-xs text-zinc-500 py-2 text-center">
                  Sem dados registrados
                </p>
              )}
            </div>
          </Card>
        </div>
      </section>

      {/* ─── Ações Rápidas da Operação ────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#00e676]" />
          Ações Operacionais de Scouting
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="flex flex-col justify-between p-4.5 rounded-2xl border border-white/10 bg-[#0d121d]/80 backdrop-blur-md hover:border-[#00e676]/40 hover:bg-[#121927]/90 transition-all group shadow-xl"
            >
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-[#00e676] border border-white/10 mb-3 group-hover:bg-[#00e676] group-hover:text-black transition-colors">
                  <link.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-black text-white group-hover:text-[#00e676] transition-colors">
                  {link.label}
                </p>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  {link.description}
                </p>
              </div>
              <div className="flex items-center gap-1 mt-4 text-xs font-bold text-[#00e676]">
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
