"use client";

import React from "react";
import { Shield, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/charts/radar-chart";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  FOOT_LABELS,
  formatHeight,
  formatWeight,
  formatAge,
} from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { Position, FootPreference, StabilityCategory } from "@prisma/client";
import { StabilityBadge } from "@/components/athletes/stability-badge";

export interface RaioXAthleteSheetData {
  id: string;
  name: string;
  position: Position;
  birthDate: Date | string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  footPreference: FootPreference;
  photoUrl: string | null;
  photoHasAlpha: boolean;
  actionPhotoUrl?: string | null;
  idgScore?: number | null;
  stabilityCategory?: StabilityCategory | null;
  team: {
    id: string;
    name: string;
    shortName: string | null;
  };
  totalMinutes: number;
  totalMatches: number;
  canonicalMetrics: Record<string, { total: number; per90: number; label: string }>;
  recentMatches?: Array<{
    date: Date | string;
    opponentName: string;
    goalsFor: number | null;
    goalsAgainst: number | null;
    minutesPlayed: number | null;
  }>;
  goals?: Array<{
    id: string;
    title: string;
    metric?: string | null;
    currentValue: number;
    targetValue: number;
    unit: string;
    category: string;
    objective?: string | null;
    isCompleted: boolean;
  }>;
  videoLinks?: Array<{
    id?: string;
    title?: string | null;
    url: string;
    category?: string;
    notes?: string | null;
    matchDate?: string | Date | null;
  }>;
  analysisNotes?: {
    tacticalTitle?: string;
    tacticalSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
}

function isEliteMetric(key: string, value?: number): boolean {
  if (value == null) return false;
  switch (key) {
    case "goals":
      return value >= 0.35;
    case "assists":
      return value >= 0.25;
    case "xg":
      return value >= 0.3;
    case "shots":
      return value >= 2.5;
    case "shots_on_target":
      return value >= 1.2;
    case "dribbles_completed":
      return value >= 2.2;
    case "passes":
      return value >= 35;
    case "pass_accuracy":
      return value >= 82;
    case "key_passes":
      return value >= 1.5;
    case "progressive_passes":
      return value >= 4.0;
    case "long_balls_accurate":
      return value >= 2.5;
    case "crosses_accurate":
      return value >= 1.0;
    case "tackles":
      return value >= 2.0;
    case "interceptions":
      return value >= 1.4;
    case "clearances":
      return value >= 2.5;
    case "aerial_duels_won":
      return value >= 2.0;
    case "ground_duels_won":
      return value >= 3.0;
    case "recoveries":
      return value >= 4.5;
    case "xg_per_shot":
      return value >= 0.16;
    case "padj_tackles":
      return value >= 2.0;
    case "padj_interceptions":
      return value >= 1.4;
    default:
      return false;
  }
}

export function AthleteRaioXSheet({
  athlete,
  className,
  pageIndex = 2,
  totalPages = 4,
}: {
  athlete: RaioXAthleteSheetData;
  className?: string;
  pageIndex?: number;
  totalPages?: number;
}) {
  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const metrics = athlete.canonicalMetrics;
  const docRef = `TNS-RX-${athlete.id.slice(0, 6).toUpperCase()}`;

  return (
    <div
      id="raio-x-report-sheet"
      className={cn(
        "w-full bg-[#fdfcf8] text-zinc-950 p-8 sm:p-10 space-y-4 print:p-8 print:m-0 print:space-y-3 print-avoid-break select-text rounded-2xl border border-zinc-200/80 shadow-2xl print:shadow-none print:border-none",
        className
      )}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 10mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background: #fdfcf8 !important;
            color: #09090b !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          .print-avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Document Header */}
      <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2.5 print-avoid-break">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-black text-xs shadow-xs print:bg-black print:text-white">
            TNS
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase leading-none text-zinc-950 font-sans">
              The Net Scouting
            </h1>
            <p className="text-[9px] font-bold tracking-wider text-zinc-500 uppercase mt-0.5">
              Divisão de Inteligência Esportiva &bull; Dossiê Executivo Raio-X
            </p>
          </div>
        </div>
        <div className="text-right text-[10px] text-zinc-500">
          <p className="font-mono text-[9px] font-bold text-zinc-700">Ref: {docRef}</p>
          <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
          <p className="font-bold text-zinc-900 uppercase text-[9px]">
            Confidencial &bull; Pro Scouting
          </p>
        </div>
      </div>

      {/* Hero Profile Banner (Editorial Light Theme) */}
      <div className="relative overflow-hidden rounded-2xl bg-zinc-100 p-4 text-zinc-950 border border-zinc-200/90 shadow-xs print:bg-zinc-100 print:text-black print:border-zinc-300 print-avoid-break">
        <div className="relative z-10 flex flex-row items-center gap-4">
          {/* Photo with alpha backdrop */}
          <div className="relative shrink-0">
            <div className="h-20 w-20 rounded-xl bg-white p-1 border border-zinc-300 flex items-center justify-center overflow-hidden shadow-xs print:border-zinc-300 print:bg-white">
              {athlete.photoUrl ? (
                <img
                  src={athlete.photoUrl}
                  alt={athlete.name}
                  className={cn(
                    "h-full w-full object-cover rounded-lg",
                    athlete.photoHasAlpha && "object-contain"
                  )}
                />
              ) : (
                <div className="h-full w-full rounded-lg bg-zinc-950 flex items-center justify-center font-bold text-xl text-white print:text-white">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Bio & Key Attributes */}
          <div className="flex-1 text-left space-y-1">
            <div className="flex flex-wrap items-center justify-start gap-2">
              <h2 className="text-xl font-black tracking-tight text-zinc-950 font-sans">
                {athlete.name}
              </h2>
              <Badge
                variant="outline"
                className={cn("text-[10px] font-bold px-2 py-0.5 border-zinc-300 text-zinc-800 bg-white", POSITION_COLORS[athlete.position])}
              >
                {POSITION_LABELS[athlete.position]}
              </Badge>
              {(athlete.idgScore !== undefined && athlete.idgScore !== null || athlete.stabilityCategory) && (
                <StabilityBadge
                  idgScore={athlete.idgScore}
                  category={athlete.stabilityCategory}
                  variant="print"
                  size="xs"
                />
              )}
            </div>

            <div className="flex items-center justify-start gap-1.5 text-xs text-zinc-600 print:text-zinc-700">
              <Shield className="h-3.5 w-3.5 text-zinc-800" />
              <span className="font-bold text-zinc-950">{athlete.team.name}</span>
              {athlete.nationality && (
                <>
                  <span>&bull;</span>
                  <span>{athlete.nationality}</span>
                </>
              )}
            </div>

            {/* Physical pills */}
            <div className="flex flex-wrap items-center justify-start gap-1.5 pt-0.5 text-[11px]">
              <span className="rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-zinc-800">
                <strong>Idade:</strong> {athlete.birthDate ? formatAge(new Date(athlete.birthDate)) : "—"}
              </span>
              <span className="rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-zinc-800">
                <strong>Pé:</strong> {FOOT_LABELS[athlete.footPreference]}
              </span>
              {athlete.height && (
                <span className="rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-zinc-800">
                  <strong>Altura:</strong> {formatHeight(athlete.height)}
                </span>
              )}
              {athlete.weight && (
                <span className="rounded-md bg-white border border-zinc-200 px-2 py-0.5 text-zinc-800">
                  <strong>Peso:</strong> {formatWeight(athlete.weight)}
                </span>
              )}
              <span className="rounded-md bg-zinc-950 text-white px-2 py-0.5 font-semibold text-[10px] print:bg-black print:text-white">
                <strong>Amostragem:</strong> {athlete.totalMinutes}&apos; ({athlete.totalMatches} jogos)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side: Radar (Left) + 3 Tactical Groups (Right) */}
      <div className="flex flex-row gap-3 items-stretch print-avoid-break">
        {/* Radar Section (Left Column) */}
        <div className="w-[45%] shrink-0 rounded-xl border border-zinc-200 p-3 bg-zinc-50 flex flex-col items-center justify-between text-center print-avoid-break">
          <div className="w-full flex items-center justify-between pb-1 mb-1 border-b border-zinc-200">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-indigo-600" />
              Impressão Digital Tática
            </h3>
            <span className="text-[9px] text-zinc-500 font-mono">0-100% ref</span>
          </div>

          <div className="my-auto py-1">
            <RadarChart metrics={metrics} size={250} showCategoryTabs={false} />
          </div>

          <div className="w-full pt-1.5 border-t border-zinc-200 text-[9px] text-zinc-500 flex items-center justify-between font-mono">
            <span>Normalizado /90</span>
            <span className="text-emerald-700 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" /> Destaque &ge; 75%
            </span>
          </div>
        </div>

        {/* Categorized Metrics Grid (Right Column) */}
        <div className="w-[55%] flex flex-col justify-between space-y-2">
          {/* Ataque */}
          <div className="rounded-xl border border-rose-200 p-2 bg-rose-50/50 print-avoid-break">
            <h4 className="text-xs font-black text-rose-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Ataque &bull; Produção Ofensiva</span>
              <span className="text-[9px] font-mono text-zinc-500 font-normal">Per-90</span>
            </h4>
            <div className="grid grid-cols-4 gap-1.5">
              <MetricTile metricKey="goals" label="Gols" per90={metrics["goals"]?.per90} total={metrics["goals"]?.total} />
              <MetricTile metricKey="assists" label="Assistências" per90={metrics["assists"]?.per90} total={metrics["assists"]?.total} />
              <MetricTile metricKey="xg" label="xG" per90={metrics["xg"]?.per90} total={metrics["xg"]?.total} />
              <MetricTile metricKey="xg_per_shot" label="xG/Fin" per90={metrics["xg_per_shot"]?.per90} isEfficiency />
              <MetricTile metricKey="shots" label="Finalizações" per90={metrics["shots"]?.per90} total={metrics["shots"]?.total} />
              <MetricTile metricKey="shots_on_target" label="No Alvo" per90={metrics["shots_on_target"]?.per90} total={metrics["shots_on_target"]?.total} />
              <MetricTile metricKey="dribbles_completed" label="Dribles" per90={metrics["dribbles_completed"]?.per90} total={metrics["dribbles_completed"]?.total} />
              <MetricTile metricKey="key_passes" label="Decisivos" per90={metrics["key_passes"]?.per90} total={metrics["key_passes"]?.total} />
            </div>
          </div>

          {/* Construção & Passe */}
          <div className="rounded-xl border border-blue-200 p-2 bg-blue-50/50 print-avoid-break">
            <h4 className="text-xs font-black text-blue-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Construção &bull; Passe e Posse</span>
              <span className="text-[9px] font-mono text-zinc-500 font-normal">Per-90</span>
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              <MetricTile metricKey="passes" label="Passes Certos" per90={metrics["passes"]?.per90} total={metrics["passes"]?.total} />
              <MetricTile metricKey="pass_accuracy" label="Precisão %" per90={metrics["pass_accuracy"]?.per90} isPercent />
              <MetricTile metricKey="key_passes" label="Decisivos" per90={metrics["key_passes"]?.per90} total={metrics["key_passes"]?.total} />
              <MetricTile metricKey="progressive_passes" label="Progressivos" per90={metrics["progressive_passes"]?.per90} total={metrics["progressive_passes"]?.total} />
              <MetricTile metricKey="long_balls_accurate" label="Bolas Longas" per90={metrics["long_balls_accurate"]?.per90} total={metrics["long_balls_accurate"]?.total} />
              <MetricTile metricKey="crosses_accurate" label="Cruzamentos" per90={metrics["crosses_accurate"]?.per90} total={metrics["crosses_accurate"]?.total} />
            </div>
          </div>

          {/* Defesa */}
          <div className="rounded-xl border border-emerald-200 p-2 bg-emerald-50/50 print-avoid-break">
            <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Defesa &bull; Combate e Desarmes</span>
              <span className="text-[9px] font-mono text-zinc-500 font-normal">Per-90</span>
            </h4>
            <div className="grid grid-cols-3 gap-1.5">
              <MetricTile
                metricKey="padj_tackles"
                label={metrics["padj_tackles"] ? "Desarmes (PAdj)" : "Desarmes"}
                per90={metrics["padj_tackles"]?.per90 ?? metrics["tackles"]?.per90}
                total={metrics["padj_tackles"]?.total ?? metrics["tackles"]?.total}
              />
              <MetricTile
                metricKey="padj_interceptions"
                label={metrics["padj_interceptions"] ? "Intercept. (PAdj)" : "Interceptações"}
                per90={metrics["padj_interceptions"]?.per90 ?? metrics["interceptions"]?.per90}
                total={metrics["padj_interceptions"]?.total ?? metrics["interceptions"]?.total}
              />
              <MetricTile metricKey="clearances" label="Cortes" per90={metrics["clearances"]?.per90} total={metrics["clearances"]?.total} />
              <MetricTile metricKey="aerial_duels_won" label="Duelos Aéreos" per90={metrics["aerial_duels_won"]?.per90} total={metrics["aerial_duels_won"]?.total} />
              <MetricTile metricKey="ground_duels_won" label="Duelos Chão" per90={metrics["ground_duels_won"]?.per90} total={metrics["ground_duels_won"]?.total} />
              <MetricTile metricKey="recoveries" label="Recuperações" per90={metrics["recoveries"]?.per90} total={metrics["recoveries"]?.total} />
            </div>
          </div>
        </div>
      </div>

      {/* Document Footer */}
      <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 print-avoid-break">
        <p>Relatório oficial gerado pela Divisão de Inteligência The Net Scouting &bull; Uso exclusivo confidencial</p>
        <p className="font-mono font-bold text-zinc-950">Página {pageIndex} de {totalPages} &bull; Raio-X Estatístico</p>
      </div>
    </div>
  );
}

function MetricTile({
  metricKey,
  label,
  per90,
  total,
  isPercent,
  isEfficiency,
}: {
  metricKey: string;
  label: string;
  per90?: number;
  total?: number;
  isPercent?: boolean;
  isEfficiency?: boolean;
}) {
  const isElite = isEliteMetric(metricKey, per90);

  const formattedValue = isPercent
    ? `${per90 ?? 0}%`
    : per90 != null
    ? per90.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : "—";

  return (
    <div
      className={cn(
        "rounded-lg p-2 text-center border transition-colors print-avoid-break shadow-2xs",
        isElite
          ? "bg-emerald-100/90 border-emerald-400 text-emerald-950"
          : "bg-white border-zinc-200/90 text-zinc-950"
      )}
    >
      <p className="text-[9px] font-bold text-zinc-600 truncate uppercase tracking-wider" title={label}>
        {label}
      </p>
      <p
        className={cn(
          "text-lg sm:text-xl font-black font-mono tabular-nums mt-0.5 leading-none",
          isElite ? "text-emerald-900 font-black" : "text-zinc-950 font-black"
        )}
      >
        {formattedValue}
        {!isPercent && !isEfficiency && per90 != null && (
          <span className="text-[9px] font-bold text-zinc-500 ml-0.5">/90</span>
        )}
      </p>
      {total != null && !isPercent && !isEfficiency && (
        <p className="text-[8px] text-zinc-400 font-mono mt-0.5">
          tot: {total}
        </p>
      )}
    </div>
  );
}
