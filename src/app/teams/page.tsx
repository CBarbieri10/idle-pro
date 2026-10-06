import { getTeams } from "@/lib/actions/teams";
import { getLeagues } from "@/lib/actions/teams";
import { CreateTeamButton, EditTeamButton, DeleteTeamButton } from "@/components/teams/team-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubes | The Net Scouting",
  description: "Gerencie os clubes cadastrados no sistema",
};

export default async function TeamsPage() {
  const [teams, leagues] = await Promise.all([getTeams(), getLeagues()]);

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clubes</h1>
          <p className="text-muted-foreground mt-1">
            {teams.length} {teams.length === 1 ? "clube cadastrado" : "clubes cadastrados"}
          </p>
        </div>
        <CreateTeamButton leagues={leagues} />
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/60">
          <Shield className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum clube cadastrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Comece criando o primeiro clube
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="p-5 border-border bg-card hover:border-primary/20 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{team.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {team.city ? `${team.city}, ` : ""}{team.country}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                  <EditTeamButton team={team} leagues={leagues} />
                  <DeleteTeamButton id={team.id} name={team.name} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 flex-wrap">
                {team.shortName && (
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {team.shortName}
                  </Badge>
                )}
                {team.league && (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    {team.league.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{team._count.athletes}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
