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
}

export function RadarChart({
  metrics,
  size = 320,
  className,
  showCategoryTabs = true,
}: RadarChartProps) {
  const [activeCategory, setActiveCategory] = useState<RadarCategory>("GERAL");
  const [hoveredPoint, setHoveredPoint] = useState<RadarMetricPoint | null>(null);

  const radius = size * 0.36;
  const center = size / 2;

  // Selected metric keys for active category
  const selectedKeys = RADAR_PRESETS[activeCategory];

  // Points computed for current category
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

  // Compute (x, y) coordinates for a given fraction (0 to 1) at index i
  const getCoordinates = (fraction: number, index: number) => {
    // Start from top (- PI / 2)
    const angle = index * angleStep - Math.PI / 2;
    const r = Math.min(Math.max(fraction, 0.05), 1.05) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Concentric web polygons (25%, 50%, 75%, 100%)
  const webLevels = [0.25, 0.5, 0.75, 1.0];

  // Data polygon points string
  const polygonPoints = pointsData
    .map((p, i) => {
      const fraction = Math.min(p.value / p.benchmarkMax, 1.0);
      const coord = getCoordinates(fraction, i);
      return `${coord.x},${coord.y}`;
    })
    .join(" ");

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Category Tabs */}
      {showCategoryTabs && (
        <div className="flex flex-wrap items-center justify-center gap-1 mb-2 bg-muted/40 p-1 rounded-xl border border-border">
          {(["GERAL", "ATAQUE", "PASSE", "DEFESA"] as RadarCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cat === "GERAL" ? "DNA Geral" : cat[0] + cat.slice(1).toLowerCase()}
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
            <radialGradient id="radarFillGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.65" />
              <stop offset="60%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.25" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
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
                strokeOpacity={lvl === 1.0 ? 0.45 : 0.25}
                strokeWidth={lvl === 1.0 ? 1.5 : 1}
                className="text-border print:text-zinc-400"
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
                strokeOpacity={0.3}
                strokeWidth={1}
                className="text-border print:text-zinc-400"
              />
            );
          })}

          {/* Athlete Data Polygon */}
          <polygon
            points={polygonPoints}
            fill="url(#radarFillGrad)"
            stroke="#6366f1"
            strokeWidth="2.5"
            strokeLinejoin="round"
            filter="url(#glow)"
            className="transition-all duration-300"
          />

          {/* Vertex Nodes & Interactive Dots */}
          {pointsData.map((p, i) => {
            const fraction = Math.min(p.value / p.benchmarkMax, 1.0);
            const coord = getCoordinates(fraction, i);
            const labelCoord = getCoordinates(1.24, i);

            return (
              <g key={p.key} className="group cursor-pointer">
                {/* Vertex dot */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={hoveredPoint?.key === p.key ? 5.5 : 4}
                  fill="#6366f1"
                  stroke="#ffffff"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="transition-all"
                />

                {/* Metric label at edge (larger, bold typography) */}
                <text
                  x={labelCoord.x}
                  y={labelCoord.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={size < 300 ? 11 : 12}
                  fontWeight="700"
                  className={cn(
                    "fill-muted-foreground print:fill-zinc-900 group-hover:fill-primary transition-colors",
                    hoveredPoint?.key === p.key && "fill-primary font-bold"
                  )}
                  style={{
                    fontSize: size < 300 ? "11px" : "12px",
                    fontWeight: 700,
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
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-background/95 border border-primary/40 rounded-lg px-2.5 py-1 text-xs shadow-lg backdrop-blur-xs text-center pointer-events-none">
            <p className="font-bold text-foreground text-[11px]">{hoveredPoint.label}</p>
            <p className="text-primary font-mono text-[11px]">
              {hoveredPoint.value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{" "}
              {hoveredPoint.unit}
              <span className="text-muted-foreground text-[10px] ml-1">
                ({Math.round((hoveredPoint.value / hoveredPoint.benchmarkMax) * 100)}% ref)
              </span>
            </p>
          </div>
        )}
      </div>

      <p className="text-[10px] text-muted-foreground/60 text-center mt-1">
        Normalizado sobre percentis de referência da liga profissional
      </p>
    </div>
  );
}
