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
  searchParams: Promise<{ search?: string; position?: string; teamId?: string }>;
}) {
  const params = await searchParams;
  const [athletes, teams] = await Promise.all([
    getAthletes({
      search: params.search,
      position: params.position,
      teamId: params.teamId,
    }),
    getTeams(),
  ]);

  const teamList = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-500/10 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider">
              <Users className="h-3 w-3" /> Gestão de Elenco &bull; Atletas
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {athletes.length} {athletes.length === 1 ? "atleta" : "atletas"}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1.5">
            Atletas Cadastrados
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gerencie dados biométricos, fotos recortadas e histórico de atletas do sistema.
          </p>
        </div>

        <CreateAthleteButton teams={teamList} />
      </div>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <Suspense>
        <AthleteFilters teams={teamList} />
      </Suspense>

      {/* ─── Athletes Grid ───────────────────────────────────────────────── */}
      {athletes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-border-strong bg-bg-surface text-center rounded-xl">
          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <h3 className="text-sm font-bold text-foreground">
            {params.search || params.position || params.teamId
              ? "Nenhum atleta encontrado com esses filtros"
              : "Nenhum atleta cadastrado"}
          </h3>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-sm">
            {params.search || params.position || params.teamId
              ? "Experimente redefinir os parâmetros de pesquisa."
              : "Cadastre seu primeiro atleta com dados físicos e foto recortada para iniciar a análise."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                className="group relative flex flex-col justify-between rounded-xl border border-border-strong bg-bg-surface p-4 transition-all duration-200 hover:shadow-xl hover:border-indigo-500/40"
              >
                <div>
                  {/* Top Bar: Position & Actions */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold px-2 py-0.5", POSITION_COLORS[athlete.position])}
                    >
                      {POSITION_LABELS[athlete.position]}
                    </Badge>

                    {/* Quick action buttons on hover */}
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <EditAthleteButton athlete={athlete} teams={teamList} />
                      <DeleteAthleteButton id={athlete.id} name={athlete.name} />
                    </div>
                  </div>

                  {/* Portrait + Name */}
                  <div className="mt-3.5 flex items-center gap-3">
                    <div className="relative h-14 w-14 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-indigo-500/10 to-transparent p-0.5 border border-indigo-500/30 shrink-0 overflow-hidden flex items-center justify-center">
                      {athlete.photoUrl ? (
                        <img
                          src={athlete.photoUrl}
                          alt={athlete.name}
                          className={cn(
                            "h-full w-full object-cover rounded-lg",
                            athlete.photoHasAlpha && "object-contain"
                          )}
                        />
                      ) : (
                        <span className="text-sm font-black text-indigo-400 font-mono">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="font-black text-sm text-foreground hover:text-indigo-400 transition-colors block truncate"
                      >
                        {athlete.name}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
                        <Shield className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span className="truncate font-semibold">{athlete.team.name}</span>
                        {athlete.nationality && (
                          <span className="text-[10px] opacity-70">&bull; {athlete.nationality}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Physical attributes */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border-subtle pt-2 font-mono">
                    <span>{athlete.birthDate ? formatAge(athlete.birthDate) : "—"}</span>
                    <span>&bull;</span>
                    <span>{FOOT_LABELS[athlete.footPreference]}</span>
                    {athlete.height && (
                      <>
                        <span>&bull;</span>
                        <span>{formatHeight(athlete.height)}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-2.5 text-xs">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    ID: {athlete.id.slice(0, 8)}
                  </span>
                  <Link
                    href={`/athletes/${athlete.id}`}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
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
