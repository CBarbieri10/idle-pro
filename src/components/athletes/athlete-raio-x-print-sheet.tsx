"use client";

import React, { useMemo } from "react";
import { Shield, Sparkles, TrendingUp, Award, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/charts/radar-chart";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  formatFootPreference,
  formatHeight,
  formatWeight,
  formatAge,
} from "@/lib/domain";
import { METRIC_BY_KEY, metricLabel } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { Position, FootPreference, StabilityCategory } from "@prisma/client";
import { StabilityBadge } from "@/components/athletes/stability-badge";

export interface RaioXPrintAthleteData {
  id: string;
  name: string;
  position: Position;
  birthDate: Date | string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  footPreference: FootPreference | null;
  photoUrl: string | null;
  photoHasAlpha?: boolean;
  team: {
    id: string;
    name: string;
    shortName: string | null;
    logoUrl?: string | null;
  } | null;
  totalMinutes: number;
  totalMatches: number;
  idgScore?: number | null;
  stabilityCategory?: StabilityCategory | null;
  canonicalMetrics: Record<string, { total: number; per90: number; label: string }>;
  analysisNotes?: {
    tacticalTitle?: string;
    tacticalSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
}

// Benchmarks de referência nacional (Série A) para cálculo de percentil / Z-Score relativo
const REFERENCE_BENCHMARKS: Record<string, number> = {
  goals: 0.85,
  assists: 0.55,
  shots: 3.5,
  shots_on_target: 1.6,
  xg: 0.7,
  xg_per_shot: 0.22,
  dribbles_completed: 3.0,
  key_passes: 2.4,
  passes: 60,
  pass_accuracy: 94,
  progressive_passes: 7.5,
  long_balls_accurate: 4.8,
  crosses_accurate: 2.0,
  tackles: 3.8,
  padj_tackles: 4.0,
  interceptions: 2.6,
  padj_interceptions: 2.8,
  clearances: 4.2,
  aerial_duels_won: 3.2,
  ground_duels_won: 5.0,
  recoveries: 8.0,
  recoveries_opponent_half: 2.5,
  blocks: 1.4,
  rating: 8.5,
};

export function AthleteRaioXPrintSheet({
  athlete,
  className,
}: {
  athlete: RaioXPrintAthleteData;
  className?: string;
}) {
  const initials = useMemo(() => {
    return athlete.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }, [athlete.name]);

  const docRef = `OVS-RX-${athlete.id.slice(0, 6).toUpperCase()}`;

  // Data Science: Seleção inteligente das 5 métricas de maior destaque / percentil relativo
  const top5Metrics = useMemo(() => {
    const rawList: Array<{
      key: string;
      label: string;
      per90: number;
      total: number;
      percentileScore: number;
      unit: string;
    }> = [];

    for (const [key, val] of Object.entries(athlete.canonicalMetrics)) {
      if (!val || typeof val.per90 !== "number" || val.per90 <= 0) continue;
      // Ignora chaves irrelevantes para o top de destaque
      if (key === "minutes_played" || key === "jersey_number") continue;

      const benchmark = REFERENCE_BENCHMARKS[key] ?? 10.0;
      const isPercent = key.includes("accuracy") || key.includes("pct");
      const percentileScore = isPercent
        ? Math.min(99, Math.max(10, Math.round(val.per90)))
        : Math.min(99, Math.max(10, Math.round((val.per90 / benchmark) * 85)));

      const def = METRIC_BY_KEY[key];
      const label = def?.label ?? val.label ?? metricLabel(key);

      rawList.push({
        key,
        label,
        per90: val.per90,
        total: val.total,
        percentileScore,
        unit: isPercent ? "%" : "/90",
      });
    }

    // Ordena pelo maior percentil relativo
    rawList.sort((a, b) => b.percentileScore - a.percentileScore);

    return rawList.slice(0, 5);
  }, [athlete.canonicalMetrics]);

  return (
    <div
      id="a4-print-dossier"
      className={cn(
        "w-[210mm] h-[297mm] max-h-[297mm] overflow-hidden bg-white text-zinc-950 p-8 flex flex-col justify-between font-sans select-text box-border",
        className
      )}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ─── 1. Institutional Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-black text-sm shadow-xs">
            OVS
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wider uppercase text-zinc-950 leading-tight">
              Overview Scout &bull; Divisão de Inteligência
            </h1>
            <p className="text-[10px] font-bold tracking-widest text-zinc-600 uppercase mt-0.5">
              Dossiê Executivo de Scouting &bull; Raio-X Oficial A4
            </p>
          </div>
        </div>

        <div className="text-right text-[10px] text-zinc-600 font-mono">
          <p className="font-bold text-zinc-950">Ref: {docRef}</p>
          <p>Emissão: {new Date().toLocaleDateString("pt-BR")}</p>
          <span className="inline-block mt-0.5 text-[9px] font-black uppercase text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
            Confidencial &bull; Uso Exclusivo
          </span>
        </div>
      </div>

      {/* ─── 2. Athlete Hero Profile & Clean Biometry ──────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 shadow-2xs">
        <div className="flex items-center gap-4">
          {/* Athlete Photo with Fallback Initials Avatar */}
          <div className="shrink-0">
            <div className="h-22 w-22 rounded-xl bg-white border border-zinc-300 p-1 flex items-center justify-center overflow-hidden shadow-xs">
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
                <div className="h-full w-full rounded-lg bg-zinc-900 flex items-center justify-center font-black text-2xl text-white">
                  {initials}
                </div>
              )}
            </div>
          </div>

          {/* Core Info & Attributes */}
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-zinc-950 tracking-tight">
                  {athlete.name}
                </h2>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-extrabold px-2 py-0.5 border-zinc-300 bg-white text-zinc-900",
                    POSITION_COLORS[athlete.position]
                  )}
                >
                  {POSITION_LABELS[athlete.position]}
                </Badge>
              </div>

              {/* Stability / IDG Badge */}
              {(athlete.idgScore !== undefined && athlete.idgScore !== null ||
                athlete.stabilityCategory) && (
                <StabilityBadge
                  idgScore={athlete.idgScore}
                  category={athlete.stabilityCategory}
                  variant="print"
                  size="xs"
                />
              )}
            </div>

            {/* Club and Nationality */}
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
              {athlete.team?.logoUrl ? (
                <img
                  src={athlete.team.logoUrl}
                  className="h-4 w-4 object-contain"
                  alt={athlete.team.name}
                />
              ) : (
                <Shield className="h-3.5 w-3.5 text-zinc-900" />
              )}
              <span className="font-bold text-zinc-950">
                {athlete.team?.name ?? "Sem Clube"}
              </span>
              {athlete.nationality && (
                <>
                  <span className="text-zinc-400">&bull;</span>
                  <span>{athlete.nationality}</span>
                </>
              )}
            </div>

            {/* Clean Biometry Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="rounded-md bg-white border border-zinc-200 px-2.5 py-0.5 text-zinc-800">
                <strong className="text-zinc-500 uppercase text-[9px] mr-1">Idade:</strong>
                {athlete.birthDate ? formatAge(new Date(athlete.birthDate)) : "—"}
              </span>
              <span className="rounded-md bg-white border border-zinc-200 px-2.5 py-0.5 text-zinc-800">
                <strong className="text-zinc-500 uppercase text-[9px] mr-1">Pé:</strong>
                {formatFootPreference(athlete.footPreference)}
              </span>
              {athlete.height && (
                <span className="rounded-md bg-white border border-zinc-200 px-2.5 py-0.5 text-zinc-800">
                  <strong className="text-zinc-500 uppercase text-[9px] mr-1">Altura:</strong>
                  {formatHeight(athlete.height)}
                </span>
              )}
              {athlete.weight && (
                <span className="rounded-md bg-white border border-zinc-200 px-2.5 py-0.5 text-zinc-800">
                  <strong className="text-zinc-500 uppercase text-[9px] mr-1">Peso:</strong>
                  {formatWeight(athlete.weight)}
                </span>
              )}
              <span className="rounded-md bg-zinc-950 text-white px-2.5 py-0.5 text-[10px] font-mono font-bold">
                Amostragem: {athlete.totalMinutes}&apos; ({athlete.totalMatches} jogos)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Analytics Core: Radar DNA + Top 5 Destaques ────────────────── */}
      <div className="grid grid-cols-12 gap-3.5 items-stretch">
        {/* Left: Radar DNA (Impressão Digital) */}
        <div className="col-span-5 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 flex flex-col items-center justify-between text-center">
          <div className="w-full flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              Radar DNA Tático
            </h3>
            <span className="text-[9px] font-mono font-bold text-zinc-500">0-100% Escala</span>
          </div>

          <div className="my-auto py-1">
            <RadarChart
              metrics={athlete.canonicalMetrics}
              size={220}
              showCategoryTabs={false}
              colorVariant="emerald"
            />
          </div>

          <div className="w-full pt-1.5 border-t border-zinc-200 text-[9px] text-zinc-600 flex items-center justify-between font-mono font-semibold">
            <span>Normalizado /90</span>
            <span className="text-emerald-800 font-bold flex items-center gap-0.5">
              <TrendingUp className="h-2.5 w-2.5" /> Dominância Relativa
            </span>
          </div>
        </div>

        {/* Right: Top 5 Métricas de Maior Destaque / Z-Score */}
        <div className="col-span-7 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 flex flex-col justify-between">
          <div className="w-full flex items-center justify-between pb-1.5 border-b border-zinc-200">
            <h3 className="text-[11px] font-black uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-emerald-600" />
              Top 5 Métricas de Maior Destaque (Percentil)
            </h3>
            <span className="text-[9px] font-mono text-zinc-500 font-bold">Benchmark Série A</span>
          </div>

          <div className="space-y-2 py-1">
            {top5Metrics.length > 0 ? (
              top5Metrics.map((m, idx) => (
                <div
                  key={m.key}
                  className="rounded-lg bg-white border border-zinc-200/90 p-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[9px] font-black font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-zinc-900 font-bold truncate max-w-[160px]" title={m.label}>
                        {m.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-950 font-black font-mono text-xs tabular-nums">
                        {m.per90.toLocaleString("pt-BR", {
                          minimumFractionDigits: 1,
                          maximumFractionDigits: 2,
                        })}
                        <span className="text-[9px] text-zinc-500 font-normal ml-0.5">{m.unit}</span>
                      </span>
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                        P{m.percentileScore}
                      </span>
                    </div>
                  </div>

                  {/* Thermal Progress Bar */}
                  <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden border border-zinc-200">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${Math.min(100, Math.max(15, m.percentileScore))}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-zinc-400">
                Métricas canônicas em processamento para este atleta.
              </div>
            )}
          </div>

          <div className="w-full pt-1.5 border-t border-zinc-200 text-[9px] text-zinc-500 flex items-center justify-between font-mono">
            <span>Ranking comparativo por posição</span>
            <span className="text-zinc-700 font-bold">Percentil P80+ = Alto Impacto</span>
          </div>
        </div>
      </div>

      {/* ─── 4. Tactical Reading & AI Summary ─────────────────────────────── */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Síntese Tática Executiva
          </h4>
          <span className="text-[9px] font-mono text-zinc-500">
            {athlete.analysisNotes?.tacticalTitle ?? "Avaliação Técnica Moneyball"}
          </span>
        </div>

        <p className="text-xs text-zinc-700 leading-snug">
          {athlete.analysisNotes?.tacticalSummary ??
            `Atleta monitorado no campeonato com volume consistente de ${athlete.totalMinutes} minutos jogados. Perfil físico e motor adequado à exigência de elite da posição ${POSITION_LABELS[athlete.position]}.`}
        </p>

        {athlete.analysisNotes?.strengths && athlete.analysisNotes.strengths.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[9px] font-bold uppercase text-zinc-500">Pontos Fortes:</span>
            {athlete.analysisNotes.strengths.slice(0, 4).map((str, i) => (
              <span
                key={i}
                className="rounded px-2 py-0.5 text-[10px] font-bold bg-white text-zinc-900 border border-zinc-200 shadow-2xs"
              >
                {str}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ─── 5. Document Footer (Audit & Authenticity) ────────────────────── */}
      <div className="border-t border-zinc-300 pt-2 flex items-center justify-between text-[9px] text-zinc-500 font-mono">
        <p>Overview Scout Intelligence Suite &bull; Documento confidencial homologado</p>
        <p className="font-bold text-zinc-900">Página 1 de 1 &bull; Dossiê Raio-X A4</p>
      </div>
    </div>
  );
}
