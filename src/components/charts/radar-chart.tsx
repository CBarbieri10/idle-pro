"use client";

import React, { useState, useMemo } from "react";
import { METRIC_BY_KEY, metricLabel } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export interface RadarMetricPoint {
  key: string;
  label: string;
  short: string;
  value: number;
  benchmarkMax: number;
  unit: string;
}

// Typical elite football reference benchmarks for Per-90 metrics (0 - 100% scale)
const BENCHMARKS: Record<string, number> = {
  goals: 0.9,
  assists: 0.6,
  shots: 3.8,
  shots_on_target: 1.8,
  xg: 0.75,
  dribbles_completed: 3.2,
  key_passes: 2.5,
  passes: 65,
  pass_accuracy: 95,
  progressive_passes: 8.0,
  long_balls_accurate: 5.0,
  crosses_accurate: 2.2,
  tackles: 4.0,
  interceptions: 2.8,
  clearances: 4.5,
  aerial_duels_won: 3.5,
  ground_duels_won: 5.5,
  recoveries: 8.5,
  blocks: 1.5,
  fouls_committed: 2.5,
  saves: 4.5,
  saves_inside_box: 3.0,
  rating: 8.5,
};

const RADAR_PRESETS = {
  GERAL: [
    "goals",
    "xg",
    "key_passes",
    "passes",
    "progressive_passes",
    "tackles",
    "interceptions",
    "aerial_duels_won",
  ],
  ATAQUE: [
    "goals",
    "shots",
    "shots_on_target",
    "xg",
    "dribbles_completed",
    "key_passes",
    "assists",
  ],
  PASSE: [
    "passes",
    "pass_accuracy",
    "progressive_passes",
    "key_passes",
    "long_balls_accurate",
    "crosses_accurate",
  ],
  DEFESA: [
    "tackles",
    "interceptions",
    "clearances",
    "blocks",
    "aerial_duels_won",
    "ground_duels_won",
    "recoveries",
  ],
};

type RadarCategory = keyof typeof RADAR_PRESETS;

interface RadarChartProps {
  metrics: Record<string, { label?: string; total?: number; per90: number }>;
  size?: number;
  className?: string;
  showCategoryTabs?: boolean;
  colorVariant?: "emerald" | "indigo";
}

export function RadarChart({
  metrics,
  size = 320,
  className,
  showCategoryTabs = true,
  colorVariant = "emerald",
}: RadarChartProps) {
  const [activeCategory, setActiveCategory] = useState<RadarCategory>("GERAL");
  const [hoveredPoint, setHoveredPoint] = useState<RadarMetricPoint | null>(null);

  const radius = size * 0.35;
  const center = size / 2;

  const selectedKeys = RADAR_PRESETS[activeCategory];

  const pointsData: RadarMetricPoint[] = useMemo(() => {
    return selectedKeys.map((key) => {
      const def = METRIC_BY_KEY[key];
      const benchmark = BENCHMARKS[key] ?? 5;
      const m = metrics[key];
      const val = m?.per90 ?? 0;

      return {
        key,
        label: def?.label ?? metricLabel(key),
        short: def?.short ?? key,
        value: val,
        benchmarkMax: benchmark,
        unit: def?.unit === "percent" ? "%" : def?.key === "rating" ? "nota" : "/90",
      };
    });
  }, [metrics, selectedKeys]);

  const numPoints = pointsData.length;
  const angleStep = (Math.PI * 2) / numPoints;

  const getCoordinates = (fraction: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = Math.min(Math.max(fraction, 0.05), 1.05) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const webLevels = [0.25, 0.5, 0.75, 1.0];

  const polygonPoints = pointsData
    .map((p, i) => {
      const fraction = Math.min(p.value / p.benchmarkMax, 1.0);
      const coord = getCoordinates(fraction, i);
      return `${coord.x},${coord.y}`;
    })
    .join(" ");

  const isEmerald = colorVariant === "emerald";
  const strokeColor = isEmerald ? "#00e676" : "#6366f1";
  const fillColor = isEmerald ? "url(#radarFillEmerald)" : "url(#radarFillIndigo)";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Category Tabs */}
      {showCategoryTabs && (
        <div className="flex flex-wrap items-center justify-center gap-1 mb-2 bg-[#0d111a] p-1 rounded-xl border border-[#1e2638]">
          {(["GERAL", "ATAQUE", "PASSE", "DEFESA"] as RadarCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all",
                activeCategory === cat
                  ? isEmerald
                    ? "bg-[#00e676] text-black shadow-xs font-black"
                    : "bg-indigo-600 text-white shadow-xs"
                  : "text-zinc-400 hover:text-white"
              )}
            >
              {cat === "GERAL" ? "Geral" : cat[0] + cat.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      )}

      {/* SVG Spider / Radar */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none"
        >
          <defs>
            <radialGradient id="radarFillEmerald" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00e676" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#00e676" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#00b0ff" stopOpacity="0.12" />
            </radialGradient>
            <radialGradient id="radarFillIndigo" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.25" />
            </radialGradient>
          </defs>

          {/* Concentric Grid Webs */}
          {webLevels.map((lvl) => {
            const pts = pointsData
              .map((_, i) => {
                const c = getCoordinates(lvl, i);
                return `${c.x},${c.y}`;
              })
              .join(" ");

            return (
              <polygon
                key={lvl}
                points={pts}
                fill="none"
                stroke="currentColor"
                strokeOpacity={lvl === 1.0 ? 0.45 : 0.20}
                strokeWidth={lvl === 1.0 ? 1.5 : 1}
                className="text-zinc-600 print:stroke-zinc-300 print:stroke-opacity-100"
                style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
              />
            );
          })}

          {/* Radial Spokes from Center */}
          {pointsData.map((_, i) => {
            const edge = getCoordinates(1.0, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={edge.x}
                y2={edge.y}
                stroke="currentColor"
                strokeOpacity={0.25}
                strokeWidth={1}
                className="text-zinc-600 print:stroke-zinc-300 print:stroke-opacity-100"
                style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
              />
            );
          })}

          {/* Athlete Data Polygon */}
          <polygon
            points={polygonPoints}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
            className="transition-all duration-300 print:stroke-emerald-600 print:fill-emerald-500/40"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          />

          {/* Vertex Nodes, Percentile Badges & Interactive Dots */}
          {pointsData.map((p, i) => {
            const fraction = Math.min(p.value / p.benchmarkMax, 1.0);
            const coord = getCoordinates(fraction, i);
            const labelCoord = getCoordinates(1.26, i);
            const percentile = Math.round(fraction * 100);

            return (
              <g key={p.key} className="group cursor-pointer">
                {/* Vertex dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={hoveredPoint?.key === p.key ? 5.5 : 3.5}
                  fill={strokeColor}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="transition-all print:fill-emerald-600 print:stroke-white"
                  style={{ WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" }}
                />

                {/* Percentile number badge at vertex (BeSoccer Pro Model) */}
                <text
                  x={coord.x}
                  y={coord.y - 8}
                  textAnchor="middle"
                  className={cn(
                    "text-[9px] font-black font-mono select-none drop-shadow-sm",
                    isEmerald ? "fill-[#00e676]" : "fill-indigo-400"
                  )}
                  style={{
                    fontSize: "9px",
                    fontWeight: 900,
                  }}
                >
                  {percentile}
                </text>

                {/* Metric label at edge */}
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={size < 300 ? 10 : 11}
                  fontWeight="700"
                  className={cn(
                    "fill-zinc-400 print:fill-zinc-950 group-hover:fill-white transition-colors",
                    hoveredPoint?.key === p.key && "fill-white font-black"
                  )}
                  style={{
                    fontSize: size < 300 ? "10px" : "11px",
                    fontWeight: 700,
                    WebkitPrintColorAdjust: "exact",
                    printColorAdjust: "exact",
                  }}
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  {p.short}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip if vertex hovered */}
        {hoveredPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-zinc-950/95 border border-[#00e676]/60 rounded-lg px-2.5 py-1 text-xs shadow-xl backdrop-blur-xs text-center pointer-events-none z-10">
            <p className="font-bold text-white text-[11px]">{hoveredPoint.label}</p>
            <p className="text-[#00e676] font-mono text-[11px]">
              {hoveredPoint.value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{" "}
              {hoveredPoint.unit}
              <span className="text-zinc-400 text-[10px] ml-1">
                ({Math.round((hoveredPoint.value / hoveredPoint.benchmarkMax) * 100)}% ref)
              </span>
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-zinc-500 font-mono text-center mt-1">
        *Métricas normalizadas por percentil da liga profissional
      </p>
    </div>
  );
}
