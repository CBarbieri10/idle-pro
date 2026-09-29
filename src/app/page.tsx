import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Shield,
  Trophy,
  TrendingUp,
  Activity,
  FileText,
  ArrowUpRight,
  Clock,
} from "lucide-react";

const stats = [
  {
    label: "Atletas Cadastrados",
    value: "0",
    icon: Users,
    trend: null,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Clubes Cadastrados",
    value: "0",
    icon: Shield,
    trend: null,
    color: "text-chart-2",
    bg: "bg-chart-2/10",
  },
  {
    label: "Ligas no Catálogo",
    value: "0",
    icon: Trophy,
    trend: null,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  },
  {
    label: "Métricas Coletadas",
    value: "0",
    icon: Activity,
    trend: null,
    color: "text-chart-4",
    bg: "bg-chart-4/10",
  },
];

const quickLinks = [
  {
    label: "Cadastrar Atleta",
    href: "/athletes/new",
    icon: Users,
    description: "Adicionar novo atleta ao sistema",
  },
  {
    label: "Novo Relatório",
    href: "/reports/new",
    icon: FileText,
    description: "Gerar relatório de performance",
  },
  {
    label: "Ver Catálogo de Ligas",
    href: "/league",
    icon: Trophy,
    description: "Consultar ligas e competições",
  },
  {
    label: "Análise de Métricas",
    href: "/metrics",
    icon: TrendingUp,
    description: "Visualizar dados de performance",
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bem-vindo ao Portal de Inteligência Esportiva — The Net Scouting
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
          <Card
            key={stat.label}
            className="p-5 border-border bg-card hover:border-border/80 transition-colors"
          >
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
            {stat.trend && (
              <div className="flex items-center gap-1 mt-3">
                <ArrowUpRight className="h-3 w-3 text-chart-2" />
                <span className="text-xs text-muted-foreground">{stat.trend}</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Quick Links */}
        <Card className="p-6 border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Ações Rápidas
          </h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 group"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <link.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {link.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {link.description}
                  </p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </Card>

        {/* Recent Activity placeholder */}
        <Card className="p-6 border-border bg-card">
          <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Atividade Recente
          </h2>
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Activity className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma atividade ainda
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Comece cadastrando atletas e clubes
            </p>
          </div>
        </Card>
      </div>

      {/* Setup banner */}
      <Card className="p-5 border-dashed border-primary/30 bg-primary/5">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-2.5 shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-foreground">
              Configuração do Banco de Dados
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Para utilizar o sistema, configure sua conexão PostgreSQL (Neon) no arquivo{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                .env
              </code>{" "}
              com a variável{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                DATABASE_URL
              </code>{" "}
              e execute{" "}
              <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
                npx prisma db push
              </code>
              .
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
