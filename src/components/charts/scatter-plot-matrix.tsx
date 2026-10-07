"use client";

import React, { useState, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { type CatalogAthlete } from "@/lib/actions/catalog";
import { METRIC_BY_KEY, metricLabel } from "@/lib/metrics";
import { calculateMedian, type StabilityCategory } from "@/lib/math-engine";
import { POSITION_LABELS, POSITION_COLORS } from "@/lib/domain";
import { StabilityBadge } from "@/components/athletes/stability-badge";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface ScatterPlotMatrixProps {
  athletes: CatalogAthlete[];
  xMetric: string;
  yMetric: string;
  className?: string;
}

export function ScatterPlotMatrix({
  athletes,
  xMetric,
  yMetric,
  className,
}: ScatterPlotMatrixProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const xDef = METRIC_BY_KEY[xMetric];
  const yDef = METRIC_BY_KEY[yMetric];
  const xLabel = xDef?.label ?? metricLabel(xMetric);
  const yLabel = yDef?.label ?? metricLabel(yMetric);

  // 1. Extração dos pontos de dados dos atletas
  const dataPoints = useMemo(() => {
    return athletes.map((athlete) => {
      const xVal = athlete.metrics[xMetric]?.per90 ?? 0;
      const yVal = athlete.metrics[yMetric]?.per90 ?? 0;
      return {
        athlete,
        x: xVal,
        y: yVal,
      };
    });
  }, [athletes, xMetric, yMetric]);

  // 2. Cálculo das Medianas (Divisão em Quadrantes Moneyball)
  const xValues = useMemo(() => dataPoints.map((d) => d.x), [dataPoints]);
  const yValues = useMemo(() => dataPoints.map((d) => d.y), [dataPoints]);

  const xMedian = useMemo(() => calculateMedian(xValues), [xValues]);
  const yMedian = useMemo(() => calculateMedian(yValues), [yValues]);

  // 3. Limites dos Eixos (com margem de 15% para visualização fluida)
  const maxX = Math.max(...xValues, 1);
  const maxY = Math.max(...yValues, 1);
  const xDomainMax = Math.round(maxX * 1.18 * 100) / 100;
  const yDomainMax = Math.round(maxY * 1.18 * 100) / 100;

  // Dimensões do Canvas SVG
  const width = 860;
  const height = 540;
  const padding = { top: 40, right: 40, bottom: 65, left: 75 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Funções de escala linear para SVG
  const scaleX = (val: number) => {
    return padding.left + (Math.max(0, val) / xDomainMax) * plotWidth;
  };

  const scaleY = (val: number) => {
    return height - padding.bottom - (Math.max(0, val) / yDomainMax) * plotHeight;
  };

  const medianXPos = scaleX(xMedian);
  const medianYPos = scaleY(yMedian);

  // Atleta hovered atual
  const activePoint = useMemo(
    () => dataPoints.find((d) => d.athlete.id === hoveredId),
    [dataPoints, hoveredId]
  );

  // Contagem de atletas por quadrante
  const quadrantCounts = useMemo(() => {
    let elite = 0;
    let focusY = 0;
    let focusX = 0;
    let low = 0;

    dataPoints.forEach((d) => {
      if (d.x >= xMedian && d.y >= yMedian) elite++;
      else if (d.x < xMedian && d.y >= yMedian) focusY++;
      else if (d.x >= xMedian && d.y < yMedian) focusX++;
      else low++;
    });

    return { elite, focusY, focusX, low };
  }, [dataPoints, xMedian, yMedian]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative rounded-2xl border border-white/10 bg-[#0c101a] p-4 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-xl select-none",
        className
      )}
    >
      {/* ─── Header & Metadata ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-3 w-3" /> Moneyball 2D
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {athletes.length} atletas mapeados
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white mt-1">
            Matriz de Dispersão: {xLabel} vs {yLabel}
          </h3>
        </div>

        {/* Quadrant Quick Stats Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
            👑 Elite: {quadrantCounts.elite}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
            Foco Y: {quadrantCounts.focusY}
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300">
            Foco X: {quadrantCounts.focusX}
          </span>
        </div>
      </div>

      {/* ─── SVG Scatter Canvas ───────────────────────────────────────────── */}
      <div className="relative w-full aspect-[860/540]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Gradiente sutil para o quadrante de Elite */}
            <radialGradient id="eliteGlow" cx="100%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </radialGradient>
            <radialGradient id="lowGlow" cx="0%" cy="100%" r="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </radialGradient>
            <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Áreas dos Quadrantes */}
          {/* Top-Right (Elite) */}
          <rect
            x={medianXPos}
            y={padding.top}
            width={width - padding.right - medianXPos}
            height={medianYPos - padding.top}
            fill="url(#eliteGlow)"
          />
          {/* Bottom-Left (Baixo Volume) */}
          <rect
            x={padding.left}
            y={medianYPos}
            width={medianXPos - padding.left}
            height={height - padding.bottom - medianYPos}
            fill="url(#lowGlow)"
          />

          {/* 2. Rótulos Marca d'água dos Quadrantes */}
          <text
            x={width - padding.right - 12}
            y={padding.top + 24}
            textAnchor="end"
            className="fill-emerald-400/30 font-black text-xs uppercase tracking-widest font-mono select-none"
          >
            ★ ALVOS DE ELITE (MONEYBALL)
          </text>

          <text
            x={padding.left + 14}
            y={padding.top + 24}
            textAnchor="start"
            className="fill-indigo-400/25 font-bold text-[10px] uppercase tracking-wider font-mono select-none"
          >
            ▲ FOCO ESPECÍFICO (ALTO {yDef?.short ?? "Y"})
          </text>

          <text
            x={width - padding.right - 12}
            y={height - padding.bottom - 16}
            textAnchor="end"
            className="fill-amber-400/25 font-bold text-[10px] uppercase tracking-wider font-mono select-none"
          >
            ► FOCO ESPECÍFICO (ALTO {xDef?.short ?? "X"})
          </text>

          <text
            x={padding.left + 14}
            y={height - padding.bottom - 16}
            textAnchor="start"
            className="fill-zinc-600/30 font-bold text-[10px] uppercase tracking-wider font-mono select-none"
          >
            ✖ DESCARTE / BAIXO VOLUME
          </text>

          {/* 3. Grid Lines Discretas */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => {
            const x = padding.left + frac * plotWidth;
            const y = height - padding.bottom - frac * plotHeight;
            return (
              <g key={frac} className="stroke-white/5">
                <line x1={x} y1={padding.top} x2={x} y2={height - padding.bottom} />
                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} />
              </g>
            );
          })}

          {/* 4. Linhas de Mediana (Cruzeta Moneyball) */}
          {/* Mediana Vertical (Eixo X) */}
          <line
            x1={medianXPos}
            y1={padding.top}
            x2={medianXPos}
            y2={height - padding.bottom}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.65"
          />
          {/* Mediana Horizontal (Eixo Y) */}
          <line
            x1={padding.left}
            y1={medianYPos}
            x2={width - padding.right}
            y2={medianYPos}
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            opacity="0.65"
          />

          {/* Rótulo da Mediana X */}
          <text
            x={medianXPos}
            y={height - padding.bottom + 16}
            textAnchor="middle"
            className="fill-emerald-400 font-mono text-[9px] font-bold select-none"
          >
            Med: {xMedian.toFixed(2)}
          </text>

          {/* Rótulo da Mediana Y */}
          <text
            x={padding.left - 8}
            y={medianYPos + 3}
            textAnchor="end"
            className="fill-emerald-400 font-mono text-[9px] font-bold select-none"
          >
            Med: {yMedian.toFixed(2)}
          </text>

          {/* 5. Eixos Principais */}
          {/* Eixo X */}
          <line
            x1={padding.left}
            y1={height - padding.bottom}
            x2={width - padding.right}
            y2={height - padding.bottom}
            stroke="#272f45"
            strokeWidth="2"
          />
          {/* Eixo Y */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - padding.bottom}
            stroke="#272f45"
            strokeWidth="2"
          />

          {/* Títulos dos Eixos */}
          <text
            x={width / 2}
            y={height - 16}
            textAnchor="middle"
            className="fill-zinc-300 font-bold text-xs uppercase tracking-wider font-sans select-none"
          >
            Eixo X: {xLabel} {xDef?.unit === "percent" ? "(%)" : "/90"}
          </text>

          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${height / 2})`}
            className="fill-zinc-300 font-bold text-xs uppercase tracking-wider font-sans select-none"
          >
            Eixo Y: {yLabel} {yDef?.unit === "percent" ? "(%)" : "/90"}
          </text>

          {/* 6. Pontos dos Atletas */}
          {dataPoints.map((d) => {
            const cx = scaleX(d.x);
            const cy = scaleY(d.y);
            const isHovered = d.athlete.id === hoveredId;
            const isElite = d.x >= xMedian && d.y >= yMedian;

            // Cor semântica por quadrante
            let fillColor = "#71717a"; // Low
            if (isElite) {
              fillColor = "#00e676";
            } else if (d.y >= yMedian) {
              fillColor = "#818cf8";
            } else if (d.x >= xMedian) {
              fillColor = "#fbbf24";
            }

            return (
              <g
                key={d.athlete.id}
                className="cursor-pointer transition-transform duration-150"
                onMouseEnter={() => setHoveredId(d.athlete.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                {/* Halo de destaque em hover ou para atletas de Elite */}
                {(isHovered || isElite) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 14 : 9}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={isHovered ? 2 : 1}
                    opacity={isHovered ? 0.9 : 0.4}
                    strokeDasharray={isHovered ? "none" : "2 2"}
                    className={isHovered ? "animate-ping" : ""}
                  />
                )}

                {/* Círculo Principal */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 7.5 : isElite ? 6 : 5}
                  fill={fillColor}
                  stroke="#0c101a"
                  strokeWidth="2"
                  filter={isElite || isHovered ? "url(#pointGlow)" : undefined}
                />

                {/* Rótulo de texto focado exclusivamente no atleta em hover para evitar colisões */}
                {isHovered && (
                  <text
                    x={cx + 11}
                    y={cy + 4}
                    className="font-sans text-xs font-black fill-white select-none pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                  >
                    {d.athlete.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* ─── Floating Tooltip Premium ───────────────────────────────────── */}
        {activePoint && (
          <div
            className="absolute pointer-events-auto z-40 w-72 rounded-xl border border-white/15 bg-zinc-950/95 p-3.5 shadow-2xl backdrop-blur-xl text-left transition-all duration-75"
            style={{
              left: `${Math.min(
                Math.max(12, (scaleX(activePoint.x) / width) * 100),
                68
              )}%`,
              top: `${Math.min(
                Math.max(8, (scaleY(activePoint.y) / height) * 100 - 15),
                60
              )}%`,
            }}
          >
            <div className="flex items-center gap-3 pb-2.5 mb-2.5 border-b border-white/10">
              <div className="relative h-12 w-12 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                {activePoint.athlete.photoUrl ? (
                  <Image
                    src={activePoint.athlete.photoUrl}
                    alt={activePoint.athlete.name}
                    fill
                    className={cn(
                      "object-cover",
                      activePoint.athlete.photoHasAlpha && "object-contain"
                    )}
                    sizes="48px"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center font-black text-indigo-400 text-sm">
                    {activePoint.athlete.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    className={cn(
                      "text-[9px] font-bold px-1.5 py-0 border-0",
                      POSITION_COLORS[activePoint.athlete.position]
                    )}
                  >
                    {POSITION_LABELS[activePoint.athlete.position]}
                  </Badge>
                  {activePoint.athlete.idgScore != null && (
                    <StabilityBadge
                      idgScore={activePoint.athlete.idgScore}
                      category={activePoint.athlete.stabilityCategory as StabilityCategory | null}
                      size="xs"
                      showScore={false}
                    />
                  )}
                </div>
                <h4 className="font-black text-sm text-white truncate mt-0.5">
                  {activePoint.athlete.name}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate">
                  {activePoint.athlete.team.name}
                </p>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block truncate">
                  {xLabel}
                </span>
                <span className="font-black text-base text-white">
                  {activePoint.x.toFixed(2)}
                </span>
                <span className="text-[9px] text-zinc-500 ml-1">/90</span>
              </div>

              <div className="rounded-lg bg-white/5 p-2 border border-white/5">
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block truncate">
                  {yLabel}
                </span>
                <span className="font-black text-base text-emerald-400">
                  {activePoint.y.toFixed(2)}
                </span>
                <span className="text-[9px] text-zinc-500 ml-1">/90</span>
              </div>
            </div>

            {/* Quadrant Badge */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">
                {activePoint.x >= xMedian && activePoint.y >= yMedian ? (
                  <span className="text-emerald-400 font-black">
                    ★ Quadrante de Elite
                  </span>
                ) : activePoint.y >= yMedian ? (
                  <span className="text-indigo-400">Foco {yLabel}</span>
                ) : activePoint.x >= xMedian ? (
                  <span className="text-amber-400">Foco {xLabel}</span>
                ) : (
                  <span className="text-zinc-500">Baixo Volume</span>
                )}
              </span>

              <Link
                href={`/athletes/${activePoint.athlete.id}`}
                className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Ver Perfil <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ─── Footer Legend & Guide ────────────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <strong className="text-white">Alvo de Elite:</strong> Acima da mediana em ambos os eixos
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" />
            Especialista Vertical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Especialista Horizontal
          </span>
        </div>

        <span className="text-[11px] text-zinc-500">
          Cruzeta verde tracejada = Ponto de Equilíbrio Mediano da Liga
        </span>
      </div>
    </div>
  );
}
