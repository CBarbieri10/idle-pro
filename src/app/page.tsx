import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  Trophy,
  Activity,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from "lucide-react";
import { POSITION_LABELS, POSITION_COLORS } from "@/lib/domain";
import Link from "next/link";

async function getDashboardData() {
  const [athleteCount, teamCount, leagueCount, recentAthletes] =
    await Promise.all([
      prisma.athlete.count(),
      prisma.team.count(),
      prisma.league.count(),
      prisma.athlete.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { team: { select: { name: true } } },
      }),
    ]);
  return { athleteCount, teamCount, leagueCount, recentAthletes };
}

export default async function DashboardPage() {
  const { athleteCount, teamCount, leagueCount, recentAthletes } =
    await getDashboardData();

  const stats = [
    {
      label: "Atletas Cadastrados",
      value: String(athleteCount),
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/athletes",
    },
    {
      label: "Clubes Cadastrados",
      value: String(teamCount),
      icon: Shield,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
      href: "/teams",
    },
    {
      label: "Ligas no Catálogo",
      value: String(leagueCount),
      icon: Trophy,
      color: "text-chart-3",
      bg: "bg-chart-3/10",
      href: "/league",
    },
    {
      label: "Métricas Coletadas",
      value: "0",
      icon: Activity,
      color: "text-chart-4",
      bg: "bg-chart-4/10",
      href: "/metrics",
    },
  ];

  const quickLinks = [
    {
      label: "Cadastrar Atleta",
      href: "/athletes",
      icon: Users,
      description: "Adicionar novo atleta ao portfólio",
    },
    {
      label: "Gerenciar Clubes",
      href: "/teams",
      icon: Shield,
      description: "Criar e editar clubes",
    },
    {
      label: "Catálogo de Ligas",
      href: "/league",
      icon: Trophy,
      description: "Consultar ligas e competições",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao Portal de Inteligência Esportiva
          </p>
        </div>
        <Badge
          variant="outline"
          className="hidden sm:flex items-center gap-1.5 border-primary/30 text-primary"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          MVP v1.0
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-5 border-border bg-card hover:border-primary/20 transition-all cursor-pointer group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold mt-1 text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                <span className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                  Ver detalhes
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent + Quick Links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Links */}
        <Card className="p-6 border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Ações Rápidas
          </h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{link.label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.description}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Athletes */}
        <Card className="p-6 border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Atletas Recentes
          </h2>
          {recentAthletes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum atleta ainda</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Comece cadastrando atletas e clubes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAthletes.map((athlete) => (
                <Link
                  key={athlete.id}
                  href={`/athletes/${athlete.id}`}
                  className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                    {athlete.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {athlete.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {athlete.team.name}
                    </p>
                  </div>
                  <Badge
                    className={`text-[10px] border-0 shrink-0 ${POSITION_COLORS[athlete.position]}`}
                  >
                    {POSITION_LABELS[athlete.position]}
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
              {athleteCount > 5 && (
                <Link
                  href="/athletes"
                  className="flex items-center justify-center gap-1 pt-2 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Ver todos os {athleteCount} atletas
                  <ChevronRight className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
