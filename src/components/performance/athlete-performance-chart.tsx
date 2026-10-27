"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Activity,
  TrendingUp,
  Shield,
  Target,
  Sparkles,
  Clock,
  Calendar,
} from "lucide-react";
import { STABILITY_CONFIG, type StabilityCategory } from "@/lib/math-engine";
import { Badge } from "@/components/ui/badge";

export interface ChronologicalMatchPoint {
  matchId: string;
  label: string; // e.g. "R12 vs FLA" or "15/Ago"
  date: string;
  opponent: string;
  minutes: number;
  rating: number;
  goals: number;
  xg: number;
  passes: number;
  progressivePasses: number;
  tackles: number;
  interceptions: number;
  rawTelemetry?: Record<string, unknown> | null;
}

interface AthletePerformanceChartProps {
  athlete: {
    id: string;
    name: string;
    position: string;
    positionLabel: string;
    teamName: string;
    idgScore?: number | null;
    stabilityCategory?: string | null;
  };
  matchPoints: ChronologicalMatchPoint[];
}

type MetricOption = "rating" | "offensive" | "passing" | "defensive" | "minutes";

export function AthletePerformanceChart({
  athlete,
  matchPoints,
}: AthletePerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricOption>("rating");

  const stabilityCat: StabilityCategory =
    (athlete.stabilityCategory as StabilityCategory) ||
    (athlete.idgScore != null
      ? athlete.idgScore > 30
        ? "LOW"
        : athlete.idgScore >= 15
        ? "MODERATE"
        : "HIGH"
      : "MODERATE");

  const config = STABILITY_CONFIG[stabilityCat];

  // Calculate rolling averages for each metric
  const chartData = useMemo(() => {
    return matchPoints.map((pt, idx, arr) => {
      // 3-match rolling window
      const windowStart = Math.max(0, idx - 2);
      const windowItems = arr.slice(windowStart, idx + 1);

      const avgRating =
        windowItems.reduce((s, item) => s + item.rating, 0) / windowItems.length;
      const avgMinutes =
        windowItems.reduce((s, item) => s + item.minutes, 0) / windowItems.length;
      const avgXg =
        windowItems.reduce((s, item) => s + item.xg, 0) / windowItems.length;
      const avgPasses =
        windowItems.reduce((s, item) => s + item.passes, 0) / windowItems.length;
      const avgTackles =
        windowItems.reduce((s, item) => s + item.tackles, 0) / windowItems.length;

      return {
        ...pt,
        rollingRating: Number(avgRating.toFixed(2)),
        rollingMinutes: Number(avgMinutes.toFixed(1)),
        rollingXg: Number(avgXg.toFixed(2)),
        rollingPasses: Number(avgPasses.toFixed(1)),
        rollingTackles: Number(avgTackles.toFixed(1)),
      };
    });
  }, [matchPoints]);

  if (matchPoints.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-card/60 backdrop-blur-md p-8 text-center space-y-3">
        <Activity className="h-8 w-8 text-zinc-500 mx-auto" />
        <h3 className="text-base font-bold text-white">
          Amostragem em Processamento
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Nenhuma partida individual foi importada ainda para {athlete.name}. Suba planilhas na área de Importação Wyscout para ativar o Laboratório Longitudinal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metric Toggles & Stability Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-white/[0.08] bg-card/80 backdrop-blur-md">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">
            Métrica:
          </span>
          {[
            { id: "rating", label: "Nota / Rating", icon: TrendingUp },
            { id: "offensive", label: "Gols & xG", icon: Target },
            { id: "passing", label: "Passes & Construção", icon: Sparkles },
            { id: "defensive", label: "Desarmes & Interceptações", icon: Shield },
            { id: "minutes", label: "Minutagem", icon: Clock },
          ].map((m) => {
            const Icon = m.icon;
            const isSelected = selectedMetric === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMetric(m.id as MetricOption)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-white bg-white/5 border border-transparent"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {athlete.idgScore != null && (
          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${config.badgeDark}`}
            >
              <span className={`h-2 w-2 rounded-full ${config.dotClass}`} />
              IDG: {athlete.idgScore.toFixed(1)}% &bull; {config.label}
            </span>
          </div>
        )}
      </div>

      {/* Main Chart Stage */}
      <div className="p-6 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Curva Longitudinal Real (Rodada a Rodada)
              </h2>
              <p className="text-xs text-zinc-400">
                Comparativo entre a entrega real na partida e a Média Móvel (Rolling Average de 3 jogos).
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs font-mono text-zinc-400">
              {matchPoints.length} {matchPoints.length === 1 ? "partida" : "partidas analisadas"}
            </span>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(11, 16, 26, 0.95)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "14px",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                }}
                labelStyle={{
                  color: "#e4e4e7",
                  fontWeight: 700,
                  fontSize: "12px",
                  marginBottom: "4px",
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: "15px", fontSize: "11px" }}
              />

              {/* RATING */}
              {selectedMetric === "rating" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="rating"
                    name="Nota do Jogo"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#0b101a",
                      stroke: "#3b82f6",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 6, fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingRating"
                    name="Média Móvel (3J)"
                    stroke="var(--data-1)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}

              {/* OFFENSIVE */}
              {selectedMetric === "offensive" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="goals"
                    name="Gols Marcados"
                    stroke="var(--data-2)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#0b101a",
                      stroke: "var(--data-2)",
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="xg"
                    name="xG (Gols Esperados)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#0b101a",
                      stroke: "#f59e0b",
                      strokeWidth: 1.5,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingXg"
                    name="xG Médio Móvel"
                    stroke="var(--data-1)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}

              {/* PASSING */}
              {selectedMetric === "passing" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="passes"
                    name="Passes Certos"
                    stroke="var(--data-3)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#0b101a",
                      stroke: "var(--data-3)",
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progressivePasses"
                    name="Passes Progressivos"
                    stroke="var(--data-1)"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#0b101a",
                      stroke: "var(--data-1)",
                      strokeWidth: 1.5,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingPasses"
                    name="Média Móvel Passes"
                    stroke="var(--data-1)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}

              {/* DEFENSIVE */}
              {selectedMetric === "defensive" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="tackles"
                    name="Desarmes"
                    stroke="var(--data-1)"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#0b101a",
                      stroke: "var(--data-1)",
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="interceptions"
                    name="Interceptações"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#0b101a",
                      stroke: "#38bdf8",
                      strokeWidth: 1.5,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingTackles"
                    name="Média Móvel Desarmes"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}

              {/* MINUTES */}
              {selectedMetric === "minutes" && (
                <>
                  <Line
                    type="monotone"
                    dataKey="minutes"
                    name="Minutos Jogados"
                    stroke="#a855f7"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#0b101a",
                      stroke: "#a855f7",
                      strokeWidth: 2,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rollingMinutes"
                    name="Minutos Médios Móveis"
                    stroke="var(--data-1)"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
