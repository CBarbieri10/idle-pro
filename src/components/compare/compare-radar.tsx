"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from "recharts";
import { type RadarDataPoint, type CompareAthleteDetailed } from "@/lib/actions/compare";
import { Dna } from "lucide-react";

export interface CompareRadarProps {
  radarData: RadarDataPoint[];
  athletes: CompareAthleteDetailed[];
}

export function CompareRadar({ radarData, athletes }: CompareRadarProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0c101d]/90 backdrop-blur-xl p-5 shadow-2xl space-y-4">
      {/* ─── Header do Gráfico ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <Dna className="h-3 w-3" /> Radar DNA Sobreposto
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              Normalizado (0 a 100% de benchmark da elite)
            </span>
          </div>
          <h3 className="text-base font-black text-white mt-1">
            Mapeamento de Competências &amp; Dominância Tática
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Visualize instantaneamente quem &quot;engole&quot; quem no espectro das métricas vitais
            ajustadas por 90 minutos.
          </p>
        </div>

        {/* Legenda com Cores Neon */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {athletes.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold"
              style={{
                borderColor: `${a.color}50`,
                backgroundColor: `${a.color}15`,
                color: a.color,
              }}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: a.color }}
              />
              <span className="truncate max-w-[120px]">{a.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Gráfico Recharts ──────────────────────────────────────────────── */}
      <div className="h-[360px] sm:h-[420px] w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart
            data={radarData}
            margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          >
            {/* Grade Polar Cibernética */}
            <PolarGrid stroke="#ffffff18" strokeDasharray="3 3" />

            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#d4d4d8", fontSize: 11, fontWeight: 700 }}
            />

            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: "#71717a", fontSize: 9 }}
              stroke="#ffffff15"
            />

            {/* Radars Sobrepostos com Linhas de Contorno em Neon e Preenchimento de Baixíssima Opacidade */}
            {athletes.map((a, idx) => (
              <Radar
                key={a.id}
                name={a.name}
                dataKey={`athlete_${idx}`}
                stroke={a.color}
                strokeWidth={2.5}
                fill={a.color}
                fillOpacity={0.08}
                dot={{
                  r: 3.5,
                  fill: a.color,
                  strokeWidth: 1.5,
                  stroke: "#0c101d",
                }}
                activeDot={{
                  r: 6,
                  fill: a.color,
                  strokeWidth: 2,
                  stroke: "#ffffff",
                }}
              />
            ))}

            {/* Tooltip Customizado com Leitura Real */}
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const point = payload[0].payload as RadarDataPoint;

                return (
                  <div className="rounded-xl border border-white/15 bg-[#0a0e1a]/95 backdrop-blur-xl p-3 shadow-2xl text-xs space-y-1.5 min-w-[180px]">
                    <div className="font-mono font-bold text-emerald-400 border-b border-white/10 pb-1 flex items-center justify-between">
                      <span>{point.metric}</span>
                      <span className="text-[10px] text-zinc-400">
                        Max: {point.maxBenchmark}/90
                      </span>
                    </div>

                    <div className="space-y-1">
                      {athletes.map((a, idx) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between gap-3 text-[11px]"
                        >
                          <span
                            className="font-semibold truncate max-w-[100px]"
                            style={{ color: a.color }}
                          >
                            {a.name}:
                          </span>
                          <span className="font-mono font-bold text-white">
                            {point[`raw_${idx}`]}/90{" "}
                            <span className="text-zinc-500 font-normal">
                              ({point[`athlete_${idx}`]}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Alias de retrocompatibilidade
export { CompareRadar as OverlaidRadarChart };
