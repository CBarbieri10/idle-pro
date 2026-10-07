"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, ChevronRight, Star, ChevronDown, 
  ChevronUp, Trophy, Search, Activity, PieChart, Shield
} from "lucide-react";
import Image from "next/image";

// --- MOCK DATA ---
const LEAGUES = [
  {
    id: "br-a",
    name: "Campeonato Brasileiro Série A",
    country: "Brasil",
    flag: "🇧🇷",
    matches: [
      // Upcoming
      { id: "m1", time: "19:30", home: "Internacional", away: "Corinthians", status: "upcoming" },
      { id: "m2", time: "19:30", home: "RB Bragantino", away: "Mirassol", status: "upcoming" },
      { id: "m3", time: "19:30", home: "Remo", away: "Grêmio", status: "upcoming" },
      
      // Finished
      { 
        id: "f1", time: "Ontem", home: "Flamengo", away: "Vasco", homeScore: 2, awayScore: 1, status: "finished",
        stats: { possession: [62, 38], shots: [14, 7], shotsOnTarget: [6, 3], corners: [8, 4], fouls: [12, 18] }
      },
      { 
        id: "f2", time: "Ontem", home: "Palmeiras", away: "São Paulo", homeScore: 0, awayScore: 0, status: "finished",
        stats: { possession: [50, 50], shots: [10, 9], shotsOnTarget: [3, 4], corners: [5, 6], fouls: [20, 22] }
      },
    ]
  },
  {
    id: "br-b",
    name: "Brasileirão Série B",
    country: "Brasil",
    flag: "🇧🇷",
    matches: [
      { id: "m7", time: "19:30", home: "Avaí", away: "Londrina", status: "upcoming" },
      { id: "m8", time: "19:30", home: "Operário-PR", away: "Botafogo-SP", status: "upcoming" },
    ]
  }
];

const STANDINGS_SERIE_A = [
  { pos: 1, team: "Flamengo", p: 28, w: 18, d: 6, l: 4, diff: "+32", gls: "55:23", pts: 60, form: ["W", "W", "W", "W", "W"], zone: "libertadores" },
  { pos: 2, team: "Palmeiras", p: 28, w: 16, d: 9, l: 3, diff: "+26", gls: "47:21", pts: 57, form: ["W", "D", "D", "W", "D"], zone: "libertadores" },
  { pos: 3, team: "Athletico", p: 28, w: 14, d: 7, l: 7, diff: "+11", gls: "43:32", pts: 49, form: ["W", "D", "L", "D", "W"], zone: "libertadores" },
  { pos: 4, team: "Fluminense", p: 28, w: 13, d: 9, l: 6, diff: "+8", gls: "44:36", pts: 48, form: ["W", "D", "W", "L", "W"], zone: "libertadores" },
  { pos: 5, team: "Bahia", p: 28, w: 12, d: 10, l: 6, diff: "+8", gls: "43:35", pts: 46, form: ["W", "W", "W", "W", "L"], zone: "pre-libertadores" },
  { pos: 6, team: "Cruzeiro", p: 28, w: 13, d: 6, l: 9, diff: "+2", gls: "42:40", pts: 45, form: ["W", "L", "W", "L", "W"], zone: "sul-americana" },
  { pos: 7, team: "Atlético-MG", p: 28, w: 12, d: 7, l: 9, diff: "+5", gls: "37:32", pts: 43, form: ["W", "L", "W", "D", "W"], zone: "sul-americana" },
  { pos: 17, team: "Grêmio", p: 28, w: 7, d: 8, l: 13, diff: "-8", gls: "30:38", pts: 29, form: ["W", "L", "L", "L", "D"], zone: "rebaixamento" },
  { pos: 18, team: "Internacional", p: 28, w: 6, d: 10, l: 12, diff: "-6", gls: "30:36", pts: 28, form: ["D", "L", "L", "W", "L"], zone: "rebaixamento" },
  { pos: 19, team: "Remo", p: 28, w: 5, d: 8, l: 15, diff: "-15", gls: "32:47", pts: 23, form: ["L", "L", "L", "L", "L"], zone: "rebaixamento" },
  { pos: 20, team: "Chapecoense", p: 27, w: 3, d: 9, l: 15, diff: "-24", gls: "29:53", pts: 18, form: ["W", "L", "W", "L", "D"], zone: "rebaixamento" },
];

export default function MatchesPage() {
  const [expandedLeagues, setExpandedLeagues] = useState<Record<string, boolean>>({ "br-a": true, "br-b": true });
  const [activeTab, setActiveTab] = useState<"todos" | "favoritos" | "competicoes">("todos");
  const [matchFilter, setMatchFilter] = useState<"aovivo" | "finalizado" | "proximos">("proximos");
  const [selectedMatchStats, setSelectedMatchStats] = useState<any | null>(null);

  const toggleLeague = (id: string) => {
    setExpandedLeagues(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getFormColor = (result: string) => {
    if (result === "W") return "bg-emerald-500 text-black";
    if (result === "D") return "bg-zinc-500 text-white";
    if (result === "L") return "bg-red-500 text-white";
    return "bg-zinc-700 text-zinc-300";
  };

  const getZoneBorder = (zone: string) => {
    if (zone === "libertadores") return "border-l-4 border-l-emerald-500";
    if (zone === "pre-libertadores") return "border-l-4 border-l-blue-400";
    if (zone === "sul-americana") return "border-l-4 border-l-blue-600";
    if (zone === "rebaixamento") return "border-l-4 border-l-red-500";
    return "border-l-4 border-l-transparent";
  };

  // Helper to generate a placeholder team logo URL using ui-avatars
  const getTeamLogo = (teamName: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName)}&background=random&color=fff&rounded=true&bold=true&font-size=0.4`;
  };

  return (
    <div className="w-full h-[calc(100vh-6rem)] flex flex-col font-sans overflow-hidden bg-[#0a0e17]">
      
      {/* Top Navigation Bar - Keeping it translucent */}
      <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex gap-4 text-sm font-bold">
            <button 
              onClick={() => setActiveTab("todos")}
              className={`pb-1 border-b-2 transition-colors ${activeTab === "todos" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setActiveTab("favoritos")}
              className={`pb-1 border-b-2 transition-colors ${activeTab === "favoritos" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              Favoritos
            </button>
            <button 
              onClick={() => setActiveTab("competicoes")}
              className={`pb-1 border-b-2 transition-colors ${activeTab === "competicoes" ? "border-emerald-500 text-emerald-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
            >
              Competições
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 px-1 py-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-zinc-400 hover:text-white"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="text-sm font-bold text-white px-4">Hoje</span>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full text-zinc-400 hover:text-white"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Match List (Transparent Style) */}
        <div className="w-[380px] flex flex-col border-r border-white/5 bg-black/10 backdrop-blur-lg shrink-0 z-10">
          
          {/* Filters */}
          <div className="p-3 flex gap-2 border-b border-white/5">
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 text-xs border-white/10 transition-colors ${matchFilter === "aovivo" ? "bg-red-500/20 text-red-400 border-red-500/30" : "text-zinc-400 hover:bg-white/5"}`}
              onClick={() => setMatchFilter("aovivo")}
            >
              Ao Vivo (0)
            </Badge>
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 text-xs border-white/10 transition-colors ${matchFilter === "finalizado" ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5"}`}
              onClick={() => setMatchFilter("finalizado")}
            >
              Finalizados
            </Badge>
            <Badge 
              variant="outline" 
              className={`cursor-pointer px-3 py-1 text-xs border-white/10 transition-colors ${matchFilter === "proximos" ? "bg-white/10 text-white" : "text-zinc-400 hover:bg-white/5"}`}
              onClick={() => setMatchFilter("proximos")}
            >
              Próximos
            </Badge>
          </div>

          {/* Matches List */}
          <div className="flex-1 overflow-y-auto hidden-scrollbar">
            {LEAGUES.map((league) => {
              const filteredMatches = league.matches.filter(m => matchFilter === "todos" || m.status === matchFilter);
              if (filteredMatches.length === 0) return null;

              return (
                <div key={league.id} className="mb-2">
                  {/* League Header */}
                  <div 
                    className="flex items-center justify-between p-3 bg-black/20 hover:bg-white/5 cursor-pointer transition-colors border-y border-white/5"
                    onClick={() => toggleLeague(league.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-white/5 rounded-full flex items-center justify-center text-xs border border-white/10">
                        <Trophy className="h-4 w-4 text-zinc-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white leading-tight drop-shadow-md">{league.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[10px]">{league.flag}</span>
                          <span className="text-[11px] font-medium text-zinc-400">{league.country}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] bg-black/40 text-zinc-400 border-white/10">{filteredMatches.length}</Badge>
                      {expandedLeagues[league.id] ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
                    </div>
                  </div>

                  {/* Matches */}
                  {expandedLeagues[league.id] && (
                    <div className="flex flex-col">
                      {filteredMatches.map((match) => (
                        <div 
                          key={match.id} 
                          className={`flex items-center group hover:bg-white/[0.04] p-2.5 border-b border-white/[0.02] transition-colors cursor-pointer ${selectedMatchStats?.id === match.id ? 'bg-white/5' : ''}`}
                          onClick={() => match.status === "finished" && setSelectedMatchStats(match)}
                        >
                          <div className="w-14 flex flex-col items-center justify-center text-zinc-400 border-r border-white/5 mr-3 shrink-0">
                            {match.status === "finished" ? (
                              <span className="text-[10px] font-bold text-zinc-500 uppercase">FT</span>
                            ) : (
                              <>
                                <span className="text-[11px] font-bold">{match.time}</span>
                                <span className="text-[10px]">-</span>
                              </>
                            )}
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={getTeamLogo(match.home)} alt={match.home} className="h-4 w-4 rounded-full shadow-sm" />
                                <span className={`text-sm font-medium ${match.status === "finished" && match.homeScore! > match.awayScore! ? 'text-white font-bold' : 'text-zinc-300'}`}>{match.home}</span>
                              </div>
                              {match.status === "finished" && (
                                <span className={`text-sm font-bold ${match.homeScore! > match.awayScore! ? 'text-emerald-400' : 'text-zinc-400'}`}>{match.homeScore}</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <img src={getTeamLogo(match.away)} alt={match.away} className="h-4 w-4 rounded-full shadow-sm" />
                                <span className={`text-sm font-medium ${match.status === "finished" && match.awayScore! > match.homeScore! ? 'text-white font-bold' : 'text-zinc-300'}`}>{match.away}</span>
                              </div>
                              {match.status === "finished" && (
                                <span className={`text-sm font-bold ${match.awayScore! > match.homeScore! ? 'text-emerald-400' : 'text-zinc-400'}`}>{match.awayScore}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-yellow-500 hover:bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-all rounded-full">
                              <Star className="h-4 w-4" />
                            </Button>
                            {match.status === "finished" && (
                              <Badge className="bg-emerald-500/10 text-emerald-400 border-transparent text-[8px] px-1 py-0 h-4">Stats</Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Transparent Dashboards */}
        <div className="flex-1 flex flex-col overflow-y-auto hidden-scrollbar p-6 gap-6 relative">
          
          {selectedMatchStats ? (
            /* --- MATCH STATS VIEW --- */
            <Card className="bg-black/30 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col w-full max-w-3xl mx-auto rounded-3xl animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-emerald-400" /> Estatísticas da Partida
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedMatchStats(null)} className="text-zinc-400 hover:text-white">Voltar</Button>
              </div>
              
              <div className="p-8">
                {/* Scoreboard Header */}
                <div className="flex items-center justify-center gap-12 mb-12">
                  <div className="flex flex-col items-center gap-3 w-32">
                    <img src={getTeamLogo(selectedMatchStats.home)} className="h-20 w-20 shadow-2xl rounded-full border-2 border-white/10" />
                    <span className="text-lg font-bold text-white text-center">{selectedMatchStats.home}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">FINALIZADO</Badge>
                    <div className="text-5xl font-black text-white tracking-tighter">
                      {selectedMatchStats.homeScore} <span className="text-zinc-600">-</span> {selectedMatchStats.awayScore}
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 w-32">
                    <img src={getTeamLogo(selectedMatchStats.away)} className="h-20 w-20 shadow-2xl rounded-full border-2 border-white/10" />
                    <span className="text-lg font-bold text-white text-center">{selectedMatchStats.away}</span>
                  </div>
                </div>

                {/* Stats Bars */}
                <div className="space-y-6 px-10">
                  {Object.entries({
                    "Posse de Bola (%)": selectedMatchStats.stats.possession,
                    "Chutes a Gol": selectedMatchStats.stats.shots,
                    "Chutes no Alvo": selectedMatchStats.stats.shotsOnTarget,
                    "Escanteios": selectedMatchStats.stats.corners,
                    "Faltas": selectedMatchStats.stats.fouls,
                  }).map(([label, values]: [string, any], idx) => {
                    const total = values[0] + values[1] || 1;
                    const homePercent = (values[0] / total) * 100;
                    return (
                      <div key={idx} className="flex flex-col gap-2">
                        <div className="flex justify-between text-sm font-bold text-white">
                          <span className={values[0] > values[1] ? "text-emerald-400" : ""}>{values[0]}</span>
                          <span className="text-zinc-500 uppercase text-[10px] tracking-widest">{label}</span>
                          <span className={values[1] > values[0] ? "text-emerald-400" : ""}>{values[1]}</span>
                        </div>
                        <div className="flex h-2 w-full rounded-full overflow-hidden bg-white/5">
                          <div className={`h-full ${values[0] >= values[1] ? "bg-emerald-500" : "bg-zinc-600"} transition-all duration-1000`} style={{ width: `${homePercent}%` }} />
                          <div className={`h-full ${values[1] >= values[0] ? "bg-emerald-500" : "bg-zinc-600"} transition-all duration-1000`} style={{ width: `${100 - homePercent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          ) : (
            /* --- DEFAULT VIEW --- */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">
              
              {/* Classificação Window - Transparent */}
              <Card className="bg-black/20 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden flex flex-col rounded-3xl">
                <div className="flex items-center gap-4 px-6 pt-6 border-b border-white/5 bg-white/[0.01]">
                  <button className="pb-4 border-b-2 border-emerald-500 text-emerald-400 text-sm font-black uppercase tracking-wider">Classificação</button>
                  <button className="pb-4 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 text-sm font-bold uppercase tracking-wider">Estatísticas</button>
                  <button className="pb-4 border-b-2 border-transparent text-zinc-500 hover:text-zinc-300 text-sm font-bold uppercase tracking-wider">Mídia</button>
                </div>

                <div className="p-6 flex flex-col">
                  {/* Standings Table */}
                  <div className="w-full overflow-x-auto hidden-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="text-zinc-500 text-[10px] uppercase font-bold border-b border-white/5">
                          <th className="pb-3 pl-2 w-8">#</th>
                          <th className="pb-3 min-w-[140px]">Equipe</th>
                          <th className="pb-3 w-8 text-center">P</th>
                          <th className="pb-3 w-8 text-center">W</th>
                          <th className="pb-3 w-8 text-center">D</th>
                          <th className="pb-3 w-8 text-center">L</th>
                          <th className="pb-3 w-10 text-center">DIFF</th>
                          <th className="pb-3 w-12 text-center">GLS</th>
                          <th className="pb-3 w-28 text-center">Últimos 5</th>
                          <th className="pb-3 w-8 text-center font-black text-white">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-300">
                        {STANDINGS_SERIE_A.map((row) => (
                          <tr key={row.pos} className="border-b border-white/[0.02] hover:bg-white/[0.04] group transition-colors">
                            <td className={`py-3 pl-2 text-[11px] font-bold text-zinc-500 ${getZoneBorder(row.zone)}`}>{row.pos}</td>
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <img src={getTeamLogo(row.team)} className="h-6 w-6 rounded-full shadow-sm" alt={row.team} />
                                <span className="font-bold text-zinc-200 group-hover:text-white transition-colors drop-shadow-sm">{row.team}</span>
                              </div>
                            </td>
                            <td className="py-3 text-center font-medium text-zinc-400">{row.p}</td>
                            <td className="py-3 text-center font-medium text-zinc-400">{row.w}</td>
                            <td className="py-3 text-center font-medium text-zinc-400">{row.d}</td>
                            <td className="py-3 text-center font-medium text-zinc-400">{row.l}</td>
                            <td className="py-3 text-center font-bold text-zinc-300">{row.diff}</td>
                            <td className="py-3 text-center text-[11px] font-medium">{row.gls}</td>
                            <td className="py-3">
                              <div className="flex items-center justify-center gap-1">
                                {row.form.map((f, i) => (
                                  <div key={i} className={`h-4 w-4 rounded-[3px] flex items-center justify-center text-[9px] font-black shadow-sm ${getFormColor(f)}`}>
                                    {f}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 text-center font-black text-emerald-400">{row.pts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              {/* Jogos da Rodada Window - Transparent */}
              <Card className="bg-black/20 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col overflow-hidden max-h-[800px] rounded-3xl">
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white/5 rounded-full flex items-center justify-center border border-white/10 shadow-lg">
                      <Trophy className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight drop-shadow-md">Jogos da Rodada</h3>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Série A</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-transparent">Rodada 29</Badge>
                </div>

                <div className="flex-1 overflow-y-auto hidden-scrollbar p-4 space-y-2">
                  {LEAGUES[0].matches.map((match) => (
                    <div key={match.id} className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.05] rounded-2xl transition-colors border border-white/5 shadow-sm">
                      <div className="flex flex-col text-center w-12 shrink-0">
                        <span className="text-sm font-black text-emerald-400">{match.time}</span>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase mt-0.5">Hoje</span>
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-2.5 ml-4 border-l border-white/10 pl-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={getTeamLogo(match.home)} className="h-6 w-6 rounded-full shadow-sm" alt={match.home} />
                            <span className="text-sm font-bold text-white drop-shadow-sm">{match.home}</span>
                          </div>
                          <span className="text-sm font-black text-zinc-600">-</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <img src={getTeamLogo(match.away)} className="h-6 w-6 rounded-full shadow-sm" alt={match.away} />
                            <span className="text-sm font-bold text-white drop-shadow-sm">{match.away}</span>
                          </div>
                          <span className="text-sm font-black text-zinc-600">-</span>
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-1.5 items-end shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-yellow-400">
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
