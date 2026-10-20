import { Suspense } from "react";
import { getScoutingAthletes } from "@/lib/actions/athletes";
import { getTeams } from "@/lib/actions/teams";
import { CreateAthleteButton } from "@/components/athletes/athlete-dialogs";
import { ScoutingFiltersSidebar } from "@/components/athletes/scouting-filters-sidebar";
import { ScoutingPlayerCard } from "@/components/athletes/scouting-player-card";
import { ScoutingPagination } from "@/components/athletes/scouting-pagination";
import { Card } from "@/components/ui/card";
import { Users, Sparkles, FilterX, Compass } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Motor de Busca Avançada • Catálogo da Liga | Overview Scout",
  description:
    "Filtros multidimensionais, térmicos e biométricos para recrutamento de atletas na Série A.",
};

export default async function AthletesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();

  // Usuário ATHLETE é redirecionado diretamente ao seu próprio perfil
  if (session?.user?.role === "ATHLETE") {
    if (session.user.athleteId) {
      redirect(`/athletes/${session.user.athleteId}`);
    }
    redirect("/");
  }

  const rawParams = await searchParams;
  const getString = (val: string | string[] | undefined) =>
    Array.isArray(val) ? val[0] : val;

  const currentScope = (getString(rawParams.scope) as "registered" | "all") || "all";
  const search = getString(rawParams.search) || getString(rawParams.q);
  const pos = getString(rawParams.pos);
  const foot = getString(rawParams.foot);
  const minAge = getString(rawParams.minAge);
  const maxAge = getString(rawParams.maxAge);
  const minHeight = getString(rawParams.minHeight);
  const maxHeight = getString(rawParams.maxHeight);
  const stable = getString(rawParams.stable);
  const minZ = getString(rawParams.minZ);
  const teamId = getString(rawParams.teamId);
  const page = getString(rawParams.page) ? parseInt(getString(rawParams.page)!, 10) : 1;

  const [scoutingResult, teams] = await Promise.all([
    getScoutingAthletes({
      search,
      pos,
      foot,
      minAge,
      maxAge,
      minHeight,
      maxHeight,
      stable,
      minZ,
      teamId: teamId === "ALL" ? undefined : teamId,
      scope: currentScope,
      page,
      pageSize: 20,
    }),
    getTeams(),
  ]);

  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));
  const activeTeam = teams.find((t) => t.id === teamId);

  // Verificação de filtros ativos para badge de cabeçalho
  const hasActiveFilters = Boolean(
    search ||
      pos ||
      foot ||
      minAge ||
      maxAge ||
      minHeight ||
      maxHeight ||
      stable ||
      minZ ||
      (teamId && teamId !== "ALL")
  );

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header Principal do Motor de Busca ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
              <Compass className="h-3 w-3" /> Motor de Busca Avançada &bull; Catálogo da Liga
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {scoutingResult.totalCount}{" "}
              {scoutingResult.totalCount === 1 ? "atleta no radar" : "atletas no radar"}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            {activeTeam
              ? `Radar de Scouting • ${activeTeam.name}`
              : currentScope === "registered"
              ? "Atletas Monitorados pelo Analista"
              : "Catálogo Completo da Série A"}
          </h1>

          <p className="text-xs text-zinc-400 mt-0.5">
            Descubra jogadores subvalorizados utilizando matrizes multidimensionais de Z-Score,
            estabilidade IDG e biometria posicional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CreateAthleteButton teams={teamList} />
        </div>
      </div>

      {/* ─── Alternador de Escopo (Liga Completa vs Portfólio) ───────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-white/[0.08] bg-[#0c1220]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Link
            href={`/athletes?scope=all${teamId ? `&teamId=${teamId}` : ""}`}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              currentScope === "all"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Toda a Série A (537 Atletas)</span>
          </Link>

          <Link
            href={`/athletes?scope=registered${teamId ? `&teamId=${teamId}` : ""}`}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              currentScope === "registered"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-zinc-400 hover:text-white"
            )}
          >
            <Users className="h-3 w-3 text-cyan-400" />
            <span>Cadastrados pelo Analista</span>
          </Link>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Filtros sincronizados com a URL para compartilhamento omnichannel</span>
        </div>
      </div>

      {/* ─── Layout Principal: Sidebar Retrátil de Filtros + Grid de Atletas ─── */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Sidebar Retrátil com Sincronização via Next.js searchParams */}
        <Suspense fallback={<div className="w-80 h-96 rounded-2xl bg-white/5 animate-pulse" />}>
          <ScoutingFiltersSidebar
            teams={teamList}
            totalCount={scoutingResult.totalCount}
          />
        </Suspense>

        {/* Coluna da Direita: Grid de Resultados e Paginação */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {scoutingResult.athletes.length === 0 ? (
            /* Estado Vazio */
            <Card className="flex flex-col items-center justify-center py-20 border-dashed border-white/15 bg-[#0c101d]/75 backdrop-blur-md text-center rounded-2xl p-6">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
                <FilterX className="h-7 w-7" />
              </div>

              <h3 className="text-base font-bold text-white">
                Nenhum atleta corresponde aos filtros de scouting
              </h3>

              <p className="text-xs text-zinc-400 mt-1.5 max-w-md">
                Tente afrouxar os critérios de Z-Score mínimo, ampliar a faixa etária ou desmarcar o
                filtro de estabilidade térmica restrita.
              </p>

              {hasActiveFilters && (
                <Link
                  href="/athletes"
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all"
                >
                  <span>Limpar Todos os Filtros</span>
                </Link>
              )}
            </Card>
          ) : (
            /* Grid de Cards dos Atletas com Badges Térmicas */
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {scoutingResult.athletes.map((athlete) => (
                  <ScoutingPlayerCard key={athlete.id} athlete={athlete} />
                ))}
              </div>

              {/* Paginação Dinâmica (20 atletas/página) */}
              <ScoutingPagination
                page={scoutingResult.page}
                totalPages={scoutingResult.totalPages}
                totalCount={scoutingResult.totalCount}
                pageSize={scoutingResult.pageSize}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
