import { getTeams } from "@/lib/actions/teams";
import { getLeagues } from "@/lib/actions/teams";
import { CreateTeamButton, EditTeamButton, DeleteTeamButton } from "@/components/teams/team-dialogs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubes | The Net Scouting",
  description: "Gerencie os clubes cadastrados no sistema",
};

export default async function TeamsPage() {
  const [teams, leagues] = await Promise.all([getTeams(), getLeagues()]);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00e676]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00e676] border border-[#00e676]/30 uppercase tracking-wider font-mono">
              <Shield className="h-3 w-3" /> Gestão de Clubes &bull; Equipes
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {teams.length} {teams.length === 1 ? "clube cadastrado" : "clubes cadastrados"}
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5">Clubes</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Gerencie os clubes cadastrados e suas federações/ligas no sistema.
          </p>
        </div>
        <CreateTeamButton leagues={leagues} />
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-white/15 bg-[#0d121d]/75 backdrop-blur-md text-center rounded-2xl">
          <Shield className="h-10 w-10 text-zinc-600 mb-3" />
          <p className="text-sm font-bold text-white">Nenhum clube cadastrado</p>
          <p className="text-xs text-zinc-400 mt-1">
            Comece criando o primeiro clube
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="p-5 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md hover:border-[#00e676]/50 hover:bg-[#121927]/95 transition-all shadow-xl group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors overflow-hidden">
                      {team.logoUrl ? (
                        <img src={team.logoUrl} alt={team.name} className="h-full w-full object-contain" />
                      ) : (
                        <Shield className="h-5 w-5 text-[#00e676]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm text-white group-hover:text-[#00e676] transition-colors truncate">
                        {team.name}
                      </p>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">
                        {team.city ? `${team.city}, ` : ""}{team.country}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                    <EditTeamButton team={team} leagues={leagues} />
                    <DeleteTeamButton id={team.id} name={team.name} />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  {team.shortName && (
                    <Badge variant="outline" className="text-[10px] font-mono border-white/10 text-zinc-300">
                      {team.shortName}
                    </Badge>
                  )}
                  {team.league && (
                    <Badge variant="outline" className="text-[10px] text-[#00e676] border-[#00e676]/30 bg-[#00e676]/10 font-bold">
                      {team.league.name}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-zinc-400 font-mono">
                  <Users className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="font-bold text-white">{team._count.athletes}</span> atletas
                </div>
                <Link
                  href={`/athletes?teamId=${team.id}`}
                  className="font-bold text-[#00e676] hover:underline"
                >
                  Ver elenco &rarr;
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
