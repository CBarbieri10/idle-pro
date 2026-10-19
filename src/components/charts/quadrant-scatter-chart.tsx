"use client";

import React, { useState, useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Shield,
  Flame,
  Crown,
  AlertTriangle,
  Compass,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamQuadrantPoint, LeagueQuadrantsPayload } from "@/lib/actions/leaderboards";

interface QuadrantScatterChartProps {
  data: LeagueQuadrantsPayload;
  className?: string;
}

const QUADRANT_COLORS = {
  DOMINANCE: {
    fill: "#10b981", // Emerald
    stroke: "#34d399",
    bg: "rgba(16, 185, 129, 0.12)",
    label: "Dominância (Elite)",
    sub: "Alta Eficiência & Alta Solidez",
    badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  DEFENSIVE_RESILIENCE: {
    fill: "#06b6d4", // Cyan
    stroke: "#22d3ee",
    bg: "rgba(6, 182, 212, 0.10)",
    label: "Resiliência Defensiva",
    sub: "Defesa Sólida • Baixa Criação",
    badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  OFFENSIVE_IMBALANCE: {
    fill: "#f59e0b", // Amber
    stroke: "#fbbf24",
    bg: "rgba(245, 158, 11, 0.10)",
    label: "Desequilíbrio Ofensivo",
    sub: "Alto Volume • Defesa Exposta",
    badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  VULNERABILITY: {
    fill: "#f43f5e", // Rose
    stroke: "#fb7185",
    bg: "rgba(244, 63, 94, 0.14)",
    label: "Vulnerabilidade (Risco)",
    sub: "Baixa Eficiência & Defesa Frágil",
    badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
};

export function QuadrantScatterChart({ data, className }: QuadrantScatterChartProps) {
  const [selectedQuadrant, setSelectedQuadrant] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredTeams = useMemo(() => {
    return data.teams.filter((t) => {
      const matchesQuad = selectedQuadrant === "ALL" || t.quadrant === selectedQuadrant;
      const matchesSearch =
        searchTerm.trim() === "" ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.shortName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesQuad && matchesSearch;
    });
  }, [data.teams, selectedQuadrant, searchTerm]);

  // Contagem por quadrante
  const counts = useMemo(() => {
    const c = { DOMINANCE: 0, DEFENSIVE_RESILIENCE: 0, OFFENSIVE_IMBALANCE: 0, VULNERABILITY: 0 };
    data.teams.forEach((t) => {
      c[t.quadrant]++;
    });
    return c;
  }, [data.teams]);

  return (
    <Card
      className={cn(
        "rounded-3xl border border-white/10 bg-[#0c101d]/90 p-6 backdrop-blur-2xl shadow-2xl relative overflow-hidden",
        className
      )}
    >
      {/* ─── Header & Metadados do Gráfico ───────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Matriz Cartesiana de Ofensividade & Controle dos Clubes
                </h3>
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 text-[10px] font-mono py-0 h-4">
                  2D Quadrants
                </Badge>
              </div>
              <p className="text-xs text-zinc-400">
                Dispersão da Série A dividida pelas medianas: Eixo X (Chances de gol • Ofensividade) vs Eixo Y (Recuperações da bola no campo adversário • Controle)
              </p>
            </div>
          </div>
        </div>

        {/* Indicadores das Medianas */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-zinc-400">Mediana Chances de Gol (X):</span>
            <strong className="text-white">{data.medianX.toFixed(1)}</strong>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-zinc-400">Mediana Recuperações Campo Adv. (Y):</span>
            <strong className="text-white">{data.medianY.toFixed(1)}</strong>
          </div>
        </div>
      </div>

      {/* ─── Filtros Rápidos dos Quadrantes ──────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedQuadrant("ALL")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              selectedQuadrant === "ALL"
                ? "bg-white text-black shadow-md"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]"
            )}
          >
            Todos ({data.teams.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("DOMINANCE")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              selectedQuadrant === "DOMINANCE"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]"
            )}
          >
            <Crown className="h-3.5 w-3.5 text-emerald-400" />
            <span>Dominância ({counts.DOMINANCE})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("DEFENSIVE_RESILIENCE")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              selectedQuadrant === "DEFENSIVE_RESILIENCE"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]"
            )}
          >
            <Shield className="h-3.5 w-3.5 text-cyan-400" />
            <span>Resiliência ({counts.DEFENSIVE_RESILIENCE})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("OFFENSIVE_IMBALANCE")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              selectedQuadrant === "OFFENSIVE_IMBALANCE"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]"
            )}
          >
            <Flame className="h-3.5 w-3.5 text-amber-400" />
            <span>Desequilíbrio ({counts.OFFENSIVE_IMBALANCE})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedQuadrant("VULNERABILITY")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              selectedQuadrant === "VULNERABILITY"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-white/[0.06]"
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span>Vulnerabilidade ({counts.VULNERABILITY})</span>
          </button>
        </div>

        {/* Input de Busca Rápida */}
        <div className="relative min-w-[180px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filtrar clube..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-white/10 bg-black/40 text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
      </div>

      {/* ─── Área do Gráfico Cartesiano com Paleta Térmica de Fundo (Restrições Rígidas) ─── */}
      <div className="relative w-full h-[60vh] max-h-[600px] min-h-[400px] mt-4 rounded-2xl border border-white/10 bg-[#080d1a] overflow-hidden">
        {/* Camadas Térmicas nos 4 Quadrantes */}
        <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2">
          {/* Q2: Top-Left (Resiliência Defensiva - Ciano) */}
          <div className="border-r border-b border-white/[0.08] p-3 flex flex-col justify-between bg-gradient-to-br from-cyan-950/20 via-transparent to-transparent">
            <span className="text-[10px] font-mono font-bold text-cyan-400/80 uppercase tracking-wider flex items-center gap-1">
              <Shield className="h-3 w-3" /> Q2: Resiliência Defensiva
            </span>
          </div>

          {/* Q1: Top-Right (Dominância de Elite - Verde Térmico) */}
          <div className="border-b border-white/[0.08] p-3 flex flex-col justify-between bg-gradient-to-bl from-emerald-950/35 via-emerald-950/10 to-transparent">
            <span className="text-[10px] font-mono font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1 self-end">
              <Crown className="h-3.5 w-3.5" /> Q1: DOMINÂNCIA (ELITE)
            </span>
          </div>

          {/* Q4: Bottom-Left (Vulnerabilidade / Risco - Vermelho Térmico) */}
          <div className="border-r border-white/[0.08] p-3 flex flex-col justify-between bg-gradient-to-tr from-rose-950/35 via-rose-950/10 to-transparent">
            <div />
            <span className="text-[10px] font-mono font-black text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> Q4: VULNERABILIDADE (RISCO)
            </span>
          </div>

          {/* Q3: Bottom-Right (Desequilíbrio Ofensivo - Âmbar) */}
          <div className="p-3 flex flex-col justify-between bg-gradient-to-tl from-amber-950/20 via-transparent to-transparent">
            <div />
            <span className="text-[10px] font-mono font-bold text-amber-400/80 uppercase tracking-wider flex items-center gap-1 self-end">
              <Flame className="h-3 w-3" /> Q3: Desequilíbrio Ofensivo
            </span>
          </div>
        </div>

        {/* Recharts Scatter Component */}
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 25, right: 35, bottom: 35, left: 20 }}>
            <XAxis
              type="number"
              dataKey="offensiveEfficiency"
              name="Chances de gol"
              domain={[data.minX, data.maxX]}
              tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              label={{
                value: "Chances de gol → (Eixo X • Ofensividade)",
                position: "insideBottom",
                offset: -18,
                fill: "#d4d4d8",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <YAxis
              type="number"
              dataKey="defensiveSolidity"
              name="Recuperações da bola no campo adversário"
              domain={[data.minY, data.maxY]}
              tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.15)" }}
              label={{
                value: "Recuperações da bola no campo adversário ↑ (Eixo Y • Controle)",
                angle: -90,
                position: "insideLeft",
                offset: 5,
                fill: "#d4d4d8",
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <ZAxis range={[220, 220]} />

            {/* Linhas de Referência da Mediana */}
            <ReferenceLine
              x={data.medianX}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <ReferenceLine
              y={data.medianY}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            {/* Tooltip Interativo */}
            <Tooltip
              cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.3)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as TeamQuadrantPoint;
                  const config = QUADRANT_COLORS[pt.quadrant];

                  return (
                    <div className="rounded-2xl border border-white/15 bg-[#0a0f1d]/95 p-4 shadow-2xl backdrop-blur-2xl text-white min-w-[240px]">
                      <div className="flex items-center gap-3 pb-2.5 mb-2.5 border-b border-white/10">
                        {pt.logoUrl ? (
                          <img
                            src={pt.logoUrl}
                            alt={pt.name}
                            className="h-7 w-7 object-contain drop-shadow"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs">
                            {pt.shortName}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-black">{pt.name}</h4>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {pt.matches} partidas monitoradas
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Chances de gol (X):</span>
                          <strong className="text-white">{pt.goalChances ?? pt.offensiveEfficiency}</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400">Recuperações Campo Adv. (Y):</span>
                          <strong className="text-white">{pt.recoveriesOpponentHalf ?? pt.defensiveSolidity}</strong>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                          <span className="text-zinc-400">Gols Pró / Sofridos:</span>
                          <span className="text-emerald-400 font-bold">{pt.goalsFor}</span>
                          <span className="text-zinc-500">/</span>
                          <span className="text-rose-400 font-bold">{pt.goalsAgainst}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-white/10">
                        <Badge className={cn("w-full justify-center text-[10px] font-mono py-1", config.badge)}>
                          {config.label}
                        </Badge>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Plot dos Clubes com Render Customizado */}
            <Scatter
              data={filteredTeams}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const config = QUADRANT_COLORS[payload.quadrant as keyof typeof QUADRANT_COLORS] || QUADRANT_COLORS.DOMINANCE;

                return (
                  <g transform={`translate(${cx},${cy})`} className="cursor-pointer transition-transform duration-200 hover:scale-125">
                    {/* Anel Externo Brilhante */}
                    <circle
                      r={14}
                      fill={config.fill}
                      fillOpacity={0.25}
                      stroke={config.stroke}
                      strokeWidth={1.5}
                      className="transition-all"
                    />

                    {/* Logo do Clube se disponível ou Monograma */}
                    {payload.logoUrl ? (
                      <image
                        href={payload.logoUrl}
                        x={-9}
                        y={-9}
                        height={18}
                        width={18}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    ) : (
                      <text
                        x={0}
                        y={3}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize={8}
                        fontWeight={900}
                        fontFamily="monospace"
                      >
                        {payload.shortName}
                      </text>
                    )}
                  </g>
                );
              }}
            >
              {filteredTeams.map((entry) => (
                <Cell
                  key={`cell-${entry.teamId}`}
                  fill={QUADRANT_COLORS[entry.quadrant].fill}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Legenda Conceitual dos 4 Quadrantes (Aulas 1, 2 e 3) ──────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
            <Crown className="h-4 w-4" />
            <span>Q1: Dominância (Elite)</span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-1 leading-tight">
            Chances de gol e recuperações no campo adversário acima da média da Série A. Pressão alta e finalizações constantes.
          </p>
        </div>

        <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
            <Shield className="h-4 w-4" />
            <span>Q2: Resiliência Defensiva</span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-1 leading-tight">
            Alta recuperação e contenção no campo adversário, porém com criação de chances de gol abaixo da média.
          </p>
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
            <Flame className="h-4 w-4" />
            <span>Q3: Desequilíbrio Ofensivo</span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-1 leading-tight">
            Alto volume de chances de gol com menor número de recuperações em campo alto. Transições e ataques diretos.
          </p>
        </div>

        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>Q4: Vulnerabilidade (Risco)</span>
          </div>
          <p className="text-[11px] text-zinc-300 mt-1 leading-tight">
            Baixa taxa de recuperação de posse ofensiva e carência na geração de chances de gol. Zona de risco.
          </p>
        </div>
      </div>
    </Card>
  );
}
