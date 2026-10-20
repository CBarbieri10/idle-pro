"use client";

import React from "react";
import { Trophy, Crown } from "lucide-react";
import { type MetricRowData, type CompareAthleteDetailed } from "@/lib/actions/compare";
import { getClubColors } from "@/lib/club-colors";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface CompareMetricsTableProps {
  tableRows: MetricRowData[];
  athletes: CompareAthleteDetailed[];
  scores: Record<string, number>;
}

export function CompareMetricsTable({
  tableRows,
  athletes,
  scores,
}: CompareMetricsTableProps) {
  // Encontra o atleta com maior pontuação geral
  let maxScore = -1;
  let overallWinnerId: string | null = null;
  athletes.forEach((a) => {
    const s = scores[a.id] || 0;
    if (s > maxScore) {
      maxScore = s;
      overallWinnerId = a.id;
    }
  });

  return (
    <div className="space-y-4">
      {/* ─── Placar de Confronto Geral (Scoreboard) ─────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c101d]/90 backdrop-blur-xl p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Trophy className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
              Placar Geral do Confronto (Métricas Vencidas)
            </span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            Total de {tableRows.length} métricas confrontadas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-3">
          {athletes.map((a) => {
            const score = scores[a.id] || 0;
            const isOverallWinner = a.id === overallWinnerId && maxScore > 0;

            return (
              <div
                key={a.id}
                className={cn(
                  "p-3 rounded-xl border flex items-center justify-between gap-3 transition-all",
                  isOverallWinner
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_16px_rgba(16,185,129,0.15)]"
                    : "bg-white/[0.03] border-white/10"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: a.color }}
                  />
                  <div className="min-w-0">
                    <p className="font-black text-xs text-white truncate flex items-center gap-1.5">
                      <span>{a.name}</span>
                      {isOverallWinner && (
                        <Crown className="h-3 w-3 text-amber-400 fill-amber-400/20" />
                      )}
                    </p>
                    <p className="text-[10px] text-zinc-400 truncate">
                      {a.team?.shortName || a.team?.name || a.positionLabel}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={cn(
                      "font-mono font-black text-lg",
                      isOverallWinner ? "text-emerald-400" : "text-zinc-300"
                    )}
                  >
                    {score}
                  </span>
                  <span className="text-[10px] text-zinc-500 block -mt-1 font-mono">
                    vitórias
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Tabela Head-to-Head Detalhada com Coluna Fixa e Célula Vencedora ─ */}
      <div className="rounded-2xl border border-white/10 bg-[#0c101d]/90 backdrop-blur-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-[#0c101d] z-10 border-r border-white/5 shadow-sm">
                  Métrica Analisada
                </th>
                {athletes.map((a) => {
                  const clubColors = getClubColors(a.team?.name);
                  return (
                    <th key={a.id} className="py-3 px-4 text-center min-w-[140px]">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: a.color }}
                          />
                          <span className="font-black text-white text-xs truncate max-w-[120px]">
                            {a.name}
                          </span>
                        </div>
                        <span
                          className="text-[10px] font-bold"
                          style={{
                            color:
                              clubColors.primaryColor === "#ffffff"
                                ? "#ffffff"
                                : clubColors.primaryColor,
                          }}
                        >
                          {a.team?.shortName || a.team?.name || "Sem Clube"}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.04] text-xs">
              {tableRows.map((row) => (
                <tr key={row.key} className="hover:bg-white/[0.02] transition-colors">
                  {/* Primeira Coluna Fixa: Nome da Métrica & Categoria */}
                  <td className="py-3 px-4 sticky left-0 bg-[#0c101d] z-10 border-r border-white/5">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold px-1.5 py-0 h-4 bg-white/5 border-white/10 text-zinc-400 shrink-0"
                      >
                        {row.category}
                      </Badge>
                      <span className="font-bold text-white text-xs truncate">{row.label}</span>
                      <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                        ({row.unit})
                      </span>
                    </div>
                  </td>

                  {/* Células de Cada Atleta com Efeito Térmico no Vencedor */}
                  {athletes.map((a) => {
                    const isWinner = row.winnerId === a.id;
                    const metricData = row.values[a.id];

                    return (
                      <td key={a.id} className="py-2.5 px-3 text-center">
                        <div
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-300 font-mono",
                            isWinner
                              ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-black shadow-[0_0_12px_rgba(16,185,129,0.35)] scale-[1.03]"
                              : row.isTie
                              ? "bg-white/5 border border-white/10 text-zinc-300 font-bold"
                              : "bg-black/30 border border-white/5 text-muted-foreground opacity-60"
                          )}
                        >
                          <span>{metricData?.formatted ?? "—"}</span>
                          {isWinner && (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Alias de retrocompatibilidade
export { CompareMetricsTable as HeadToHeadTable };
