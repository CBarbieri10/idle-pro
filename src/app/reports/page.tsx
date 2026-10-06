import { getPortfolioAthletes } from "@/lib/actions/portfolio";
import { getCatalogAthletes } from "@/lib/actions/catalog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AthleteRaioXModal, type RaioXAthleteData } from "@/components/reports/athlete-raio-x-modal";
import { PortfolioToggleButton } from "@/components/portfolio/portfolio-toggle-button";
import {
  FileText,
  Printer,
  Bookmark,
  Shield,
  Clock,
  Sparkles,
  Search,
  ExternalLink,
} from "lucide-react";
import { POSITION_LABELS, POSITION_COLORS } from "@/lib/domain";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Relatórios & Raio-X | The Net Scouting",
  description: "Emissão de relatórios executivos em PDF (Raio-X) dos atletas e gestão do portfólio",
};

export default async function ReportsPage() {
  const [portfolioItems, catalogData] = await Promise.all([
    getPortfolioAthletes(),
    getCatalogAthletes(),
  ]);

  return (
    <div className="space-y-8 w-full">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="border-b border-border/60 pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Central de Relatórios & Raio-X
              </h1>
              <Badge className="bg-primary/15 text-primary border-primary/30 text-xs">
                A4 Executive PDF
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Gere dossiês técnicos, Raio-X tático e relatórios executivos em alta definição prontos para impressão ou exportação em PDF.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Informational Banner ────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/20 p-2 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Como funciona o Relatório Raio-X?
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              O Raio-X sintetiza as métricas normalizadas Per-90 do atleta, seu gráfico de teia de aranha (Radar DNA), dados biográficos, fotos tratadas e histórico de scouts. O layout utiliza folhas de estilo <code className="text-primary font-mono text-[11px]">@media print</code> para gerar um documento A4 limpo, sem barras de navegação ou elementos de UI desnecessários.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Portfólio de Atletas ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-amber-400 fill-amber-400/20" />
            <h2 className="text-lg font-bold text-foreground">
              Atletas no seu Portfólio ({portfolioItems.length})
            </h2>
          </div>
        </div>

        {portfolioItems.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-8 text-center border-dashed border-border/80 bg-card/50">
            <Bookmark className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-foreground">
              Nenhum atleta marcado no portfólio
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Utilize o Catálogo da Liga para selecionar atletas e gerar seus relatórios Raio-X.
            </p>
            <Link href="/league" className="mt-3">
              <Button size="sm" variant="outline" className="text-xs">
                Ir para o Catálogo da Liga
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {portfolioItems.map((item) => {
              const a = item.athlete;
              const initials = a.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();

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
                <div
                  key={item.portfolioAthleteId}
                  className="group relative flex flex-col justify-between p-4.5 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 backdrop-blur-md shadow-xl hover:border-emerald-500/40 hover:shadow-emerald-500/5 transition-all duration-300"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${POSITION_COLORS[a.position]}`}
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

                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-emerald-500/30 ring-2 ring-emerald-500/10 shrink-0">
                        <AvatarImage src={a.photoUrl ?? undefined} alt={a.name} className="object-cover" />
                        <AvatarFallback className="bg-emerald-950 text-emerald-300 text-xs font-black">{initials}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/athletes/${a.id}`}
                          className="font-black text-sm text-white hover:text-emerald-400 transition-colors block truncate"
                        >
                          {a.name}
                        </Link>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400 truncate mt-0.5">
                          <Shield className="h-3.5 w-3.5 text-emerald-400/70 shrink-0" />
                          <span className="truncate font-medium">{a.team.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-zinc-400 inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-emerald-400" />
                      {a.totalMinutes}&apos;
                    </span>

                    <AthleteRaioXModal
                      athlete={raioXData}
                      triggerButton={
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Raio-X (PDF)
                        </Button>
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ─── Todos os Atletas Cadastrados (Emissão Rápida) ─────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              Emissão sob Demanda (Todos os Atletas)
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {catalogData.athletes.slice(0, 15).map((a) => {
            const initials = a.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            const raioXData: RaioXAthleteData = {
              id: a.id,
              name: a.name,
              position: a.position,
              birthDate: a.birthDate,
              nationality: a.nationality,
              height: a.height,
              weight: a.weight,
              footPreference: a.footPreference,
              photoUrl: a.photoUrl,
              photoHasAlpha: a.photoHasAlpha,
              actionPhotoUrl: null,
              team: a.team,
              totalMinutes: a.totalMinutes,
              totalMatches: a.totalMatches,
              canonicalMetrics: a.metrics,
            };

            return (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-white/[0.08] bg-[#0c1017]/75 backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#121722]/80 transition-all duration-200"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar className="h-9 w-9 shrink-0 border border-emerald-500/30">
                    <AvatarImage src={a.photoUrl ?? undefined} />
                    <AvatarFallback className="bg-emerald-950 text-emerald-300 text-xs font-black">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {a.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {a.team.name} · {POSITION_LABELS[a.position]}
                    </p>
                  </div>
                </div>

                <AthleteRaioXModal
                  athlete={raioXData}
                  triggerButton={
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs font-bold gap-1 px-2.5 border-white/[0.12] bg-white/[0.04] hover:bg-emerald-500/10 hover:border-emerald-500/40 hover:text-emerald-400"
                    >
                      <FileText className="h-3 w-3 text-emerald-400" />
                      Raio-X
                    </Button>
                  }
                />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
