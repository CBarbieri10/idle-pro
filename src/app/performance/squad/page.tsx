import { getMyTeam } from "@/lib/actions/performance";
import Link from "next/link";
import { ArrowDown, ArrowUp, ShieldAlert } from "lucide-react";

export default async function SquadPage() {
  const team = await getMyTeam();

  if (!team) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-black text-white">Sala de Guerra</h1>
        <p className="text-zinc-400 mt-2">Nenhum clube foi definido como o seu elenco oficial.</p>
      </div>
    );
  }

  const enhancedAthletes = team.athletes.map((a: any, index: number) => {
    // Deterministic pseudo-random based on index
    const isStarter = (index % 3) !== 0;
    const isInjured = (index % 7) === 0;
    const l5Minutes = 150 + ((index * 47) % 300);
    const zScoreVal = ((index * 1.3) % 4) - 2;
    const zScore = zScoreVal.toFixed(2);
    const isNegative = zScoreVal < 0;
    
    // Sparkline mock values
    const sparkline = Array.from({length: 10}, (_, i) => 20 + (((index + i) * 31) % 80));

    return { ...a, isStarter, isInjured, l5Minutes, zScore, isNegative, sparkline };
  });

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white">
          Sala de Guerra <span className="text-blue-400">/ {team.name}</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Monitoramento de Minutagem (L5), Tendência de Performance e Risco de Queda (Z-Score).
        </p>
      </header>

      <div className="rounded-xl border border-white/10 bg-[#0b101a]/80 backdrop-blur-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-white/[0.02] border-b border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Atleta</th>
                <th className="px-4 py-3">Posição</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Minutagem (L5)</th>
                <th className="px-4 py-3">Trendline (30d)</th>
                <th className="px-4 py-3 text-right">Z-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {enhancedAthletes.map((a) => (
                <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 font-medium text-white">
                    <Link href={`/performance/athlete/${a.id}`} className="hover:text-blue-400">
                      {a.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{a.position.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    {a.isInjured ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">
                        <ShieldAlert className="w-3 h-3" /> Lesão
                      </span>
                    ) : a.isStarter ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">
                        Titular
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                        Reserva
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-300">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${a.l5Minutes > 300 ? 'bg-blue-500' : a.l5Minutes > 150 ? 'bg-emerald-500' : 'bg-zinc-500'}`} 
                          style={{width: `${(a.l5Minutes / 450) * 100}%`}}
                        />
                      </div>
                      <span>{a.l5Minutes}m</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-end h-6 gap-[2px]">
                      {a.sparkline.map((val: number, idx: number) => (
                        <div 
                          key={idx} 
                          className={`w-1.5 rounded-t-sm ${a.isNegative ? 'bg-red-500/50 group-hover:bg-red-400' : 'bg-blue-500/50 group-hover:bg-blue-400'}`}
                          style={{height: `${val}%`}}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className={`inline-flex items-center justify-end gap-1 font-mono font-bold ${a.isNegative ? 'text-red-400' : 'text-emerald-400'}`}>
                      {a.isNegative ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                      {a.zScore}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
