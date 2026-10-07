import { Suspense } from "react";
import { getAthletes } from "@/lib/actions/athletes";
import { getTeams } from "@/lib/actions/teams";
import { CreateAthleteButton, EditAthleteButton, DeleteAthleteButton } from "@/components/athletes/athlete-dialogs";
import { AthleteFilters } from "@/components/athletes/athlete-filters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, ChevronRight, Shield, Sparkles, UserPlus } from "lucide-react";
import { POSITION_LABELS, POSITION_COLORS, FOOT_LABELS, formatAge, formatHeight } from "@/lib/domain";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atletas | The Net Scouting",
  description: "Gerencie e monitore os atletas cadastrados na plataforma",
};

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    position?: string;
    teamId?: string;
    scope?: "registered" | "all";
  }>;
}) {
  const params = await searchParams;
  const currentScope = params.scope || "registered";

  const [athletes, teams] = await Promise.all([
    getAthletes({
      search: params.search,
      position: params.position,
      teamId: params.teamId,
      scope: currentScope,
    }),
    getTeams(),
  ]);

  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00e676]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00e676] border border-[#00e676]/30 uppercase tracking-wider font-mono">
              <Users className="h-3 w-3" /> Gestão de Elenco &bull; Atletas
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {athletes.length} {athletes.length === 1 ? "atleta" : "atletas"}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">
            {currentScope === "all" ? "Todos os Atletas da Liga" : "Atletas Cadastrados"}
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            {currentScope === "all"
              ? "Base completa de jogadores registrados no campeonato."
              : "Jogadores cadastrados e sob monitoramento ativo pelo analista."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2 text-xs font-bold text-cyan-300 transition-all shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Catálogo da Liga (671 Atletas) &rarr;</span>
          </Link>
          <CreateAthleteButton teams={teamList} />
        </div>
      </div>

      {/* Scope Toggle & Catalog Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-white/[0.08] bg-[#0c1220]/80">
        <div className="flex items-center gap-2">
          <Link
            href={`/athletes${params.teamId ? `?teamId=${params.teamId}` : ""}`}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              currentScope === "registered"
                ? "bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Cadastrados pelo Analista
          </Link>
          <Link
            href={`/athletes?scope=all${params.teamId ? `&teamId=${params.teamId}` : ""}`}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
              currentScope === "all"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            Todos do Campeonato
          </Link>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span>Para análise estatística Moneyball e filtros multidimensionais, acerte o</span>
          <Link href="/catalog" className="text-cyan-300 font-bold hover:underline">
            Catálogo da Liga
          </Link>
        </div>
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <Suspense>
        <AthleteFilters teams={teamList} />
      </Suspense>

      {/* ─── Athletes Grid ───────────────────────────────────────────────── */}
      {athletes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-white/15 bg-[#0d121d]/75 backdrop-blur-md text-center rounded-2xl">
          <div className="h-12 w-12 rounded-full bg-black/40 border border-white/10 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-zinc-500" />
          </div>
          <h3 className="text-sm font-bold text-white">
            {params.search || params.position || params.teamId
              ? "Nenhum atleta encontrado com esses filtros"
              : "Nenhum atleta cadastrado"}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            {params.search || params.position || params.teamId
              ? "Experimente redefinir os parâmetros de pesquisa."
              : "Cadastre seu primeiro atleta com dados físicos e foto recortada para iniciar a análise."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {athletes.map((athlete) => {
            const initials = athlete.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={athlete.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md p-4.5 transition-all duration-200 hover:shadow-2xl hover:border-[#00e676]/50 hover:bg-[#121927]/95"
              >
                <div>
                  {/* Top Bar: Position & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold px-2 py-0.5 border-0", POSITION_COLORS[athlete.position])}
                    >
                      {POSITION_LABELS[athlete.position]}
                    </Badge>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <EditAthleteButton athlete={athlete} teams={teamList} />
                      <DeleteAthleteButton id={athlete.id} name={athlete.name} />
                    </div>
                  </div>

                  {/* Portrait + Name */}
                  <div className="mt-3.5 flex items-center gap-3">
                    <div className="relative h-13 w-13 rounded-full border-2 border-[#00e676]/60 p-0.5 bg-black/50 overflow-hidden shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)] flex items-center justify-center">
                      {athlete.photoUrl ? (
                        <img
                          src={athlete.photoUrl}
                          alt={athlete.name}
                          className={cn(
                            "h-full w-full object-cover rounded-full",
                            athlete.photoHasAlpha && "object-contain"
                          )}
                        />
                      ) : (
                        <span className="text-xs font-black text-[#00e676] font-mono">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="font-black text-sm text-white hover:text-[#00e676] transition-colors block truncate"
                      >
                        {athlete.name}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 truncate mt-0.5">
                        <Shield className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span className="truncate font-semibold">{athlete.team.name}</span>
                        {athlete.nationality && (
                          <span className="text-[10px] opacity-70">&bull; {athlete.nationality}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Physical attributes */}
                  <div className="mt-3.5 rounded-xl bg-black/40 border border-white/5 p-2 text-center">
                    <div className="flex items-center justify-around text-xs font-mono">
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Idade</p>
                        <p className="font-bold text-white mt-0.5">
                          {athlete.birthDate ? formatAge(athlete.birthDate) : "—"}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Pé</p>
                        <p className="font-bold text-white mt-0.5">
                          {FOOT_LABELS[athlete.footPreference]}
                        </p>
                      </div>
                      <div className="h-6 w-px bg-white/10" />
                      <div>
                        <p className="text-[9px] text-zinc-500 uppercase">Altura</p>
                        <p className="font-bold text-white mt-0.5">
                          {formatHeight(athlete.height)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {athlete.nationality ?? "Brasil"}
                  </span>
                  <Link
                    href={`/athletes/${athlete.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-[#00e676] hover:underline transition-colors"
                  >
                    Ver perfil <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
