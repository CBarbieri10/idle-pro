"use client";

import React from "react";
import {
  Target,
  Trophy,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Award,
  Shield,
  Layers,
} from "lucide-react";
import { calculateGoalProgress } from "@/lib/goals";
import { POSITION_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { RaioXAthleteSheetData } from "@/components/reports/athlete-raio-x-sheet";

export interface DossierGoalItem {
  id: string;
  title: string;
  metric?: string | null;
  currentValue: number;
  targetValue: number;
  unit: string;
  category: string;
  objective?: string | null;
  isCompleted: boolean;
}

export interface DossierGoalsPageProps {
  athlete: RaioXAthleteSheetData & {
    goals?: DossierGoalItem[];
  };
  className?: string;
  pageIndex?: number;
  totalPages?: number;
}

export function DossierGoalsPage({
  athlete,
  className,
  pageIndex = 4,
  totalPages = 4,
}: DossierGoalsPageProps) {
  const docRef = `TNS-DOSSIER-${athlete.id.slice(0, 6).toUpperCase()}`;

  // Default projected development goals if none are configured in database
  const isAttacker =
    athlete.position === "STRIKER" ||
    athlete.position === "FORWARD" ||
    athlete.position === "RIGHT_WING" ||
    athlete.position === "LEFT_WING";
  const isMidfielder =
    athlete.position === "CENTRAL_MID" ||
    athlete.position === "DEFENSIVE_MID" ||
    athlete.position === "ATTACKING_MID";

  const defaultGoals: DossierGoalItem[] = isAttacker
    ? [
        {
          id: "def-goal-1",
          title: "Produção de Gols e Assistências (G+A)",
          metric: "goals",
          currentValue: (athlete.canonicalMetrics?.["goals"]?.total ?? 0) + (athlete.canonicalMetrics?.["assists"]?.total ?? 0),
          targetValue: 15,
          unit: "absoluto",
          category: "Técnica",
          objective: "Atingir duplo dígito de participações diretas na temporada regular.",
          isCompleted: ((athlete.canonicalMetrics?.["goals"]?.total ?? 0) + (athlete.canonicalMetrics?.["assists"]?.total ?? 0)) >= 15,
        },
        {
          id: "def-goal-2",
          title: "Índice de Conversão de Finalizações no Alvo",
          metric: "shots_on_target",
          currentValue: athlete.canonicalMetrics?.["shots_on_target"]?.per90 != null ? Math.round((athlete.canonicalMetrics?.["shots_on_target"]?.per90 / Math.max(1, athlete.canonicalMetrics?.["shots"]?.per90 ?? 1)) * 100) : 48,
          targetValue: 55,
          unit: "%",
          category: "Tática",
          objective: "Manter precisão acima de 50% de finalizações na meta por partida.",
          isCompleted: false,
        },
        {
          id: "def-goal-3",
          title: "Minutagem Oficial em Campo",
          metric: "minutes",
          currentValue: athlete.totalMinutes,
          targetValue: 2000,
          unit: "minutos",
          category: "Física",
          objective: "Consolidar titularidade atingindo mais de 2.000 minutos competitivos.",
          isCompleted: athlete.totalMinutes >= 2000,
        },
      ]
    : isMidfielder
    ? [
        {
          id: "def-goal-1",
          title: "Volume e Precisão em Passes Certos",
          metric: "passes",
          currentValue: Math.round(athlete.canonicalMetrics?.["pass_accuracy"]?.per90 ?? 82),
          targetValue: 88,
          unit: "%",
          category: "Técnica",
          objective: "Sustentar precisão de passes curtos e médios acima de 88% sob pressão.",
          isCompleted: (athlete.canonicalMetrics?.["pass_accuracy"]?.per90 ?? 0) >= 88,
        },
        {
          id: "def-goal-2",
          title: "Passes Progressivos que Quebram Linhas",
          metric: "progressive_passes",
          currentValue: Math.round(athlete.canonicalMetrics?.["progressive_passes"]?.total ?? 32),
          targetValue: 60,
          unit: "absoluto",
          category: "Tática",
          objective: "Aumentar a verticalidade de construção no terço médio.",
          isCompleted: (athlete.canonicalMetrics?.["progressive_passes"]?.total ?? 0) >= 60,
        },
        {
          id: "def-goal-3",
          title: "Recuperações e Desarmes no Meio-Campo",
          metric: "recoveries",
          currentValue: Math.round((athlete.canonicalMetrics?.["tackles"]?.total ?? 0) + (athlete.canonicalMetrics?.["recoveries"]?.total ?? 0)),
          targetValue: 50,
          unit: "absoluto",
          category: "Física",
          objective: "Garantir média de 5+ recuperações de posse por 90 minutos.",
          isCompleted: false,
        },
      ]
    : [
        {
          id: "def-goal-1",
          title: "Taxa de Sucesso em Duelos Defensivos",
          metric: "ground_duels_won",
          currentValue: 68,
          targetValue: 75,
          unit: "%",
          category: "Tática",
          objective: "Dominar combates individuais pelo chão mantendo índice superior a 75%.",
          isCompleted: false,
        },
        {
          id: "def-goal-2",
          title: "Eficácia em Duelos Aéreos na Área",
          metric: "aerial_duels_won",
          currentValue: 70,
          targetValue: 80,
          unit: "%",
          category: "Física",
          objective: "Soberania em disputas de bolas cruzadas na área defensiva.",
          isCompleted: false,
        },
        {
          id: "def-goal-3",
          title: "Minutagem Oficial Acumulada",
          metric: "minutes",
          currentValue: athlete.totalMinutes,
          targetValue: 1800,
          unit: "minutos",
          category: "Física",
          objective: "Manter regularidade como titular no eixo defensivo.",
          isCompleted: athlete.totalMinutes >= 1800,
        },
      ];

  const goalsList =
    athlete.goals && athlete.goals.length > 0 ? athlete.goals : defaultGoals;

  // Calculate high-level KPIs
  const totalGoalsCount = goalsList.length;
  const completedGoalsCount = goalsList.filter((g) => {
    const prog = calculateGoalProgress(g.currentValue, g.targetValue);
    return g.isCompleted || prog.isCompleted;
  }).length;
  const avgProgress =
    totalGoalsCount > 0
      ? Math.round(
          goalsList.reduce((acc, g) => {
            const prog = calculateGoalProgress(g.currentValue, g.targetValue);
            return acc + prog.percent;
          }, 0) / totalGoalsCount
        )
      : 0;

  const photo = athlete.actionPhotoUrl || athlete.photoUrl;

  return (
    <div
      className={cn(
        "relative w-full h-[280mm] max-h-[280mm] bg-[#fdfcf8] text-zinc-950 flex flex-col justify-between p-8 print:p-6 print:m-0 print:h-[280mm] print:max-h-[280mm] overflow-hidden select-text border border-zinc-200 shadow-2xl print:shadow-none print:border-none",
        className
      )}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ─── Top Header (Editorial TNS Minimalist) ─────────────────────────── */}
      <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-black text-xs print:bg-black print:text-white">
            TNS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Página {pageIndex < 10 ? `0${pageIndex}` : pageIndex} &bull; Plano de Desenvolvimento
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">&bull;</span>
              <span className="text-xs font-black uppercase text-zinc-900 font-sans">
                {athlete.name}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">
              Metas de Desempenho &amp; Acompanhamento de Metas Canônicas
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-[9px] text-zinc-500">
          <p className="font-bold text-zinc-900 uppercase">
            {POSITION_LABELS[athlete.position]} &bull;{" "}
            {athlete.team.logoUrl ? (
              <span className="inline-flex items-center gap-1">
                <img src={athlete.team.logoUrl} className="h-3 w-3 object-contain inline" alt={athlete.team.name} />
                {athlete.team.name}
              </span>
            ) : (
              athlete.team.name
            )}
          </p>
          <p>Ref: {docRef}</p>
        </div>
      </div>

      {/* ─── Main Content Canvas ───────────────────────────────────────────── */}
      <div className="flex-1 my-3 flex flex-col justify-between space-y-3 overflow-hidden">
        {/* Top Feature Banner: Label METAS com destaque + Foto à Direita + KPIs */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-2xs print:border-zinc-300 print-avoid-break">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Highlight Title & Overview */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-block px-3 py-1 rounded-md bg-zinc-950 text-white font-mono text-xs font-black tracking-widest uppercase shadow-xs print:bg-black print:text-white">
                  METAS DE CARREIRA
                </span>
                <span className="text-xs font-black uppercase text-zinc-600 font-sans">
                  PDI 2024 / 2025
                </span>
              </div>

              <p className="text-xs text-zinc-700 leading-relaxed font-sans mt-2">
                Painel individual de metas quantitativas e marcos táticos definidos pelo comitê técnico. Os indicadores são auditados jogo a jogo e normalizados por 90 minutos para medir evolução real de rendimento.
              </p>

              {/* 3 KPI Summary Blocks */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-zinc-100">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-2 text-center">
                  <p className="text-[9px] font-mono text-zinc-500 uppercase font-bold">Total de Metas</p>
                  <p className="text-lg font-black font-mono text-zinc-950 mt-0.5 leading-none">
                    {totalGoalsCount}
                  </p>
                </div>

                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2 text-center">
                  <p className="text-[9px] font-mono text-emerald-800 uppercase font-bold">Atingidas</p>
                  <p className="text-lg font-black font-mono text-emerald-700 mt-0.5 leading-none">
                    {completedGoalsCount}
                  </p>
                </div>

                <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-2 text-center">
                  <p className="text-[9px] font-mono text-indigo-800 uppercase font-bold">Progresso Médio</p>
                  <p className="text-lg font-black font-mono text-indigo-700 mt-0.5 leading-none">
                    {avgProgress}%
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Athlete Portrait Cutout Thumbnail (Issue #15 Acceptance Criteria) */}
            <div className="shrink-0 w-28 h-32 rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 flex items-center justify-center relative shadow-inner">
              {photo ? (
                <img
                  src={photo}
                  alt={athlete.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-400">
                  <Shield className="h-8 w-8 text-zinc-300 mb-1" />
                  <span className="text-[9px] font-mono font-bold uppercase">{athlete.team.shortName}</span>
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-zinc-950 text-white text-[8px] font-mono font-bold px-1.5 py-0.5 rounded print:bg-black">
                {POSITION_LABELS[athlete.position]}
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress Stack */}
        <div className="flex-1 flex flex-col justify-between space-y-2.5">
          {goalsList.map((goal, idx) => {
            const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);
            const isFinished = goal.isCompleted || progress.isCompleted;

            // Semantic Color Mapping
            const isEmerald = isFinished || progress.percent >= 80;
            const isAmber = !isEmerald && progress.percent >= 50;

            const barColor = isEmerald
              ? "bg-emerald-500"
              : isAmber
              ? "bg-amber-500"
              : "bg-indigo-600";

            const badgeBg = isEmerald
              ? "bg-emerald-100 text-emerald-950 border-emerald-300"
              : isAmber
              ? "bg-amber-100 text-amber-950 border-amber-300"
              : "bg-indigo-100 text-indigo-950 border-indigo-300";

            return (
              <div
                key={goal.id || idx}
                className={cn(
                  "rounded-xl border p-3.5 bg-white shadow-2xs print-avoid-break transition-colors",
                  isFinished
                    ? "border-emerald-300 bg-emerald-50/20"
                    : "border-zinc-200"
                )}
                style={{
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              >
                {/* Line 1: Header + Number Badge + Category */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded bg-zinc-950 text-white flex items-center justify-center text-[10px] font-black font-mono print:bg-black print:text-white">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-black text-zinc-950 uppercase font-sans">
                      {goal.title}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase px-1.5 py-0.5 rounded bg-zinc-100 border border-zinc-200">
                      {goal.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isFinished ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                        Atingida
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-zinc-600">
                        Em Andamento
                      </span>
                    )}

                    <span
                      className={cn(
                        "text-[10px] font-mono font-black px-2 py-0.5 rounded border",
                        badgeBg
                      )}
                    >
                      {progress.percent}%
                    </span>
                  </div>
                </div>

                {/* Line 2: Giant Numbers Comparison & Dynamic Progress Bar */}
                <div className="my-2">
                  <div className="flex items-baseline justify-between mb-1">
                    <div className="flex items-baseline gap-1.5 font-mono">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold">Atual:</span>
                      <span className="text-xl font-black text-zinc-950 tabular-nums">
                        {goal.currentValue.toLocaleString("pt-BR")}
                      </span>
                      <span className="text-xs text-zinc-400 font-bold">/</span>
                      <span className="text-sm font-bold text-zinc-600 tabular-nums">
                        {goal.targetValue.toLocaleString("pt-BR")} {goal.unit}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-500">
                      Falta:{" "}
                      <strong className="text-zinc-900">
                        {Math.max(0, goal.targetValue - goal.currentValue).toLocaleString("pt-BR")}{" "}
                        {goal.unit}
                      </strong>
                    </span>
                  </div>

                  {/* Dynamic Progress Bar (print-color-adjust exact) */}
                  <div className="h-3 w-full rounded-full bg-zinc-200 overflow-hidden p-0.5 border border-zinc-300/80">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor)}
                      style={{
                        width: `${Math.min(100, Math.max(3, progress.percent))}%`,
                        WebkitPrintColorAdjust: "exact",
                        printColorAdjust: "exact",
                      }}
                    />
                  </div>
                </div>

                {/* Line 3: Textual Objective / Rationale */}
                {goal.objective && (
                  <p className="text-[11px] text-zinc-600 font-sans leading-snug pt-1.5 border-t border-zinc-100">
                    <strong className="text-zinc-900 font-medium">Objetivo Tático:</strong>{" "}
                    {goal.objective}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Note & Methodology */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2.5 flex items-center justify-between text-[10px] font-sans text-zinc-600 print-avoid-break">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-600" />
            <span>
              <strong>Ciclo de Revisão:</strong> Metas recalculadas a cada 5 partidas oficiais ou ao final do turno da competição.
            </span>
          </div>
          <span className="font-mono text-[9px] text-zinc-500 uppercase font-bold">
            Auditado por The Net Scouting Engine
          </span>
        </div>
      </div>

      {/* ─── Bottom Footer ─────────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 print-avoid-break">
        <span>The Net Scouting &bull; Sistema Integrado de Inteligência do Futebol</span>
        <span className="font-mono font-bold text-zinc-950">
          Página {pageIndex} de {totalPages} &bull; Metas &amp; Plano de Desenvolvimento (PDI)
        </span>
      </div>
    </div>
  );
}
