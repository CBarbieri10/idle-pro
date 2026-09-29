import { Suspense } from "react";
import { getAthletes } from "@/lib/actions/athletes";
import { getTeams } from "@/lib/actions/teams";
import { CreateAthleteButton, EditAthleteButton, DeleteAthleteButton } from "@/components/athletes/athlete-dialogs";
import { AthleteFilters } from "@/components/athletes/athlete-filters";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, ChevronRight } from "lucide-react";
import { POSITION_LABELS, POSITION_COLORS, formatAge } from "@/lib/domain";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atletas | The Net Scouting",
  description: "Gerencie os atletas do seu portfólio de scouting",
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Atletas</h1>
          <p className="text-muted-foreground mt-1">
            {athletes.length} {athletes.length === 1 ? "atleta encontrado" : "atletas encontrados"}
          </p>
        </div>
        <CreateAthleteButton teams={teamList} />
      </div>

      {/* Filters */}
      <Suspense>
        <AthleteFilters teams={teamList} />
      </Suspense>

      {/* Athletes list */}
      {athletes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/60">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {params.search || params.position || params.teamId
              ? "Nenhum atleta encontrado com esses filtros"
              : "Nenhum atleta cadastrado"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            {!(params.search || params.position || params.teamId) &&
              "Comece cadastrando o primeiro atleta"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {athletes.map((athlete) => (
            <Card
              key={athlete.id}
              className="group relative p-4 border-border bg-card hover:border-primary/20 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-base font-bold text-muted-foreground">
                  {athlete.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="font-semibold text-foreground hover:text-primary transition-colors truncate"
                    >
                      {athlete.name}
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {athlete.team.name}
                    {athlete.nationality ? ` · ${athlete.nationality}` : ""}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <EditAthleteButton athlete={athlete} teams={teamList} />
                  <DeleteAthleteButton id={athlete.id} name={athlete.name} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <Badge
                  className={`text-[10px] font-medium border-0 ${POSITION_COLORS[athlete.position]}`}
                >
                  {POSITION_LABELS[athlete.position]}
                </Badge>
                {athlete.birthDate && (
                  <span className="text-[10px] text-muted-foreground">
                    {formatAge(athlete.birthDate)}
                  </span>
                )}
                <Link
                  href={`/athletes/${athlete.id}`}
                  className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground/50 hover:text-primary transition-colors"
                >
                  Ver perfil <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
