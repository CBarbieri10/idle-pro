"use client";

import React from "react";
import {
  Shield,
  Target,
  Zap,
  TrendingUp,
  Crosshair,
  Award,
  Sparkles,
  Flame,
  Activity,
  Wind,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatPopoverChart } from "@/components/charts/stat-popover-chart";

interface MetricDataShape {
  label: string;
  per90: number;
  total?: number;
}

interface AthleteContextualHighlightsProps {
  position: string;
  metrics?: Record<string, MetricDataShape> | null;
  rawMetrics?: Record<string, unknown> | null;
}

interface HighlightCardConfig {
  id: string;
  label: string;
  value: string;
  unit: string;
  lessonTag: string;
  percentile: number;
  percentileLabel: string;
  colorScheme: "emerald" | "cyan" | "indigo" | "rose" | "amber";
  icon: React.ComponentType<{ className?: string }>;
}

export function AthleteContextualHighlights({
  position,
  metrics = {},
  rawMetrics = {},
}: AthleteContextualHighlightsProps) {
  const pos = (position || "").toUpperCase();

  const isDefenderOrVolante =
    pos.includes("CENTER_BACK") ||
    pos.includes("DEFENSIVE_MID") ||
    pos.includes("ZAG") ||
    pos.includes("VOL") ||
    pos.includes("CB") ||
    pos.includes("DM");

  const isAttacker =
    pos.includes("STRIKER") ||
    pos.includes("FORWARD") ||
    pos.includes("WING") ||
    pos.includes("ATA") ||
    pos.includes("PONTA") ||
    pos.includes("CENTROAVANTE");

  const isLateral =
    pos.includes("BACK") ||
    pos.includes("LATERAL") ||
    pos.includes("ALA") ||
    pos.includes("LB") ||
    pos.includes("RB");

  const isMidfielder =
    pos.includes("MID") ||
    pos.includes("MEIA") ||
    pos.includes("MÉDIO") ||
    pos.includes("CM") ||
    pos.includes("AM");

  const isGoalkeeper = pos.includes("GOALKEEPER") || pos.includes("GOL");

  const getNum = (key: string, fallback = 0): number => {
    if (metrics && metrics[key]?.per90 !== undefined) {
      return metrics[key].per90;
    }
    if (rawMetrics && typeof rawMetrics === "object") {
      const v = rawMetrics[key];
      if (typeof v === "number") return v;
      if (typeof v === "string") {
        const p = parseFloat(v.replace("%", "").replace(",", "."));
        if (!isNaN(p)) return p;
      }
    }
    return fallback;
  };

  let cards: HighlightCardConfig[] = [];

  if (isDefenderOrVolante) {
    const padjTackles = getNum("padj_tackles", getNum("tackles", 2.8));
    const aerialWon = getNum("aerial_duels_won", 3.2);
    const padjInterceptions = getNum("padj_interceptions", getNum("interceptions", 2.1));
    const recoveries = getNum("recoveries", 6.4);

    cards = [
      {
        id: "padj-tackles",
        label: "Desarmes PAdj",
        value: padjTackles.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • 1x1 Def",
        percentile: Math.min(99, Math.round((padjTackles / 4.2) * 100)),
        percentileLabel: "Pressão & Combate",
        colorScheme: "emerald",
        icon: Shield,
      },
      {
        id: "aerial-duels",
        label: "Duelos Aéreos",
        value: aerialWon.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • 6 Passos",
        percentile: Math.min(99, Math.round((aerialWon / 3.8) * 100)),
        percentileLabel: "Impulsão & Passada",
        colorScheme: "cyan",
        icon: Wind,
      },
      {
        id: "interceptions",
        label: "Interceptações",
        value: padjInterceptions.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • Linha de Passe",
        percentile: Math.min(99, Math.round((padjInterceptions / 2.8) * 100)),
        percentileLabel: "Leitura Espacial",
        colorScheme: "indigo",
        icon: Crosshair,
      },
      {
        id: "recoveries",
        label: "Recuperações",
        value: recoveries.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • Sobras de Bola",
        percentile: Math.min(99, Math.round((recoveries / 8.5) * 100)),
        percentileLabel: "Defesa de Funil",
        colorScheme: "amber",
        icon: Zap,
      },
    ];
  } else if (isAttacker) {
    const goals = getNum("goals", 0.52);
    const xgPerShot = getNum("xg_per_shot", 0.18);
    const shotsOnTarget = getNum("shots_on_target", 1.4);
    const dribbles = getNum("dribbles_completed", 2.4);

    cards = [
      {
        id: "goals",
        label: "Gols",
        value: goals.toFixed(2),
        unit: "/90min",
        lessonTag: "Aula 01 • Zona de Ouro",
        percentile: Math.min(99, Math.round((goals / 0.85) * 100)),
        percentileLabel: "Eficácia de Conversão",
        colorScheme: "rose",
        icon: Flame,
      },
      {
        id: "xg-per-shot",
        label: "xG por Chute",
        value: xgPerShot.toFixed(2),
        unit: "xG/Fin",
        lessonTag: "Aula 01 • Blind Side",
        percentile: Math.min(99, Math.round((xgPerShot / 0.22) * 100)),
        percentileLabel: "Qualidade de Disparo",
        colorScheme: "emerald",
        icon: Target,
      },
      {
        id: "shots-target",
        label: "Chutes no Alvo",
        value: shotsOnTarget.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 02 • Sem Eliminar",
        percentile: Math.min(99, Math.round((shotsOnTarget / 2.0) * 100)),
        percentileLabel: "Pontaria no Gol",
        colorScheme: "cyan",
        icon: Crosshair,
      },
      {
        id: "dribbles",
        label: "Dribles Certos",
        value: dribbles.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 02 • Drible Velocidade",
        percentile: Math.min(99, Math.round((dribbles / 3.2) * 100)),
        percentileLabel: "1x1 Ofensivo",
        colorScheme: "indigo",
        icon: Zap,
      },
    ];
  } else if (isLateral) {
    const crosses = getNum("crosses_accurate", getNum("crosses", 2.4));
    const progPasses = getNum("progressive_passes", 4.8);
    const padjTackles = getNum("padj_tackles", getNum("tackles", 2.6));
    const recoveries = getNum("recoveries", 5.8);

    cards = [
      {
        id: "crosses",
        label: "Cruzamentos",
        value: crosses.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 02 • Amplitude",
        percentile: Math.min(99, Math.round((crosses / 3.2) * 100)),
        percentileLabel: "Alimentação de Área",
        colorScheme: "cyan",
        icon: Wind,
      },
      {
        id: "progressive-passes",
        label: "Passes Progressivos",
        value: progPasses.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 02 • Desmarque",
        percentile: Math.min(99, Math.round((progPasses / 6.5) * 100)),
        percentileLabel: "Aceleração no Corredor",
        colorScheme: "indigo",
        icon: TrendingUp,
      },
      {
        id: "padj-tackles",
        label: "Desarmes PAdj",
        value: padjTackles.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • 1x1 Lateral",
        percentile: Math.min(99, Math.round((padjTackles / 3.8) * 100)),
        percentileLabel: "Contenção de Asa",
        colorScheme: "emerald",
        icon: Shield,
      },
      {
        id: "recoveries",
        label: "Recomposição",
        value: recoveries.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • Linha de 4",
        percentile: Math.min(99, Math.round((recoveries / 7.5) * 100)),
        percentileLabel: "Cobertura de Espaço",
        colorScheme: "amber",
        icon: Zap,
      },
    ];
  } else if (isGoalkeeper) {
    const saves = getNum("saves", 3.8);
    const savesInsideBox = getNum("saves_inside_box", 2.2);
    const passAcc = getNum("pass_accuracy", 82.5);
    const highClaims = getNum("high_claims", 1.8);

    cards = [
      {
        id: "saves",
        label: "Defesas Totais",
        value: saves.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • Área de Gol",
        percentile: Math.min(99, Math.round((saves / 4.8) * 100)),
        percentileLabel: "Segurança de Linha",
        colorScheme: "emerald",
        icon: Shield,
      },
      {
        id: "saves-box",
        label: "Defesas na Área",
        value: savesInsideBox.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • 1x1 Reflexo",
        percentile: Math.min(99, Math.round((savesInsideBox / 3.0) * 100)),
        percentileLabel: "Intervenção Crítica",
        colorScheme: "cyan",
        icon: Crosshair,
      },
      {
        id: "pass-accuracy",
        label: "Precisão de Saída",
        value: `${passAcc.toFixed(1)}%`,
        unit: "acerto",
        lessonTag: "Aula 01 • Construção",
        percentile: Math.min(99, Math.round(passAcc)),
        percentileLabel: "Saída de Bola com Pés",
        colorScheme: "indigo",
        icon: Target,
      },
      {
        id: "high-claims",
        label: "Saídas Aéreas",
        value: highClaims.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 03 • Cruzamentos",
        percentile: Math.min(99, Math.round((highClaims / 2.5) * 100)),
        percentileLabel: "Domínio Aéreo",
        colorScheme: "amber",
        icon: Wind,
      },
    ];
  } else {
    // Meio-Campista (Padrão)
    const progPasses = getNum("progressive_passes", 5.2);
    const keyPasses = getNum("key_passes", 1.6);
    const passAcc = getNum("pass_accuracy", 86.4);
    const recoveries = getNum("recoveries", 5.5);

    cards = [
      {
        id: "prog-passes",
        label: "Passes Progressivos",
        value: progPasses.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 01 • Quebra de Linhas",
        percentile: Math.min(99, Math.round((progPasses / 7.5) * 100)),
        percentileLabel: "Verticalidade Tática",
        colorScheme: "cyan",
        icon: TrendingUp,
      },
      {
        id: "key-passes",
        label: "Passes Decisivos",
        value: keyPasses.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 02 • Passe Vencedor",
        percentile: Math.min(99, Math.round((keyPasses / 2.5) * 100)),
        percentileLabel: "Criação de Oportunidades",
        colorScheme: "indigo",
        icon: Target,
      },
      {
        id: "pass-accuracy",
        label: "Precisão de Passe",
        value: `${passAcc.toFixed(1)}%`,
        unit: "acerto",
        lessonTag: "Aula 01 • Scanning",
        percentile: Math.min(99, Math.round(passAcc)),
        percentileLabel: "Controle de Ritmo",
        colorScheme: "emerald",
        icon: Activity,
      },
      {
        id: "recoveries",
        label: "Recuperações",
        value: recoveries.toFixed(1),
        unit: "/90min",
        lessonTag: "Aula 02 • Pós-Perda",
        percentile: Math.min(99, Math.round((recoveries / 8.0) * 100)),
        percentileLabel: "Ocupação do Miolo",
        colorScheme: "amber",
        icon: Zap,
      },
    ];
  }

  const getColorClasses = (scheme: HighlightCardConfig["colorScheme"]) => {
    switch (scheme) {
      case "emerald":
        return {
          bgGlow: "from-emerald-500/10 via-transparent to-transparent",
          border: "border-emerald-500/20 hover:border-emerald-500/50",
          iconBox: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30",
          textVal: "text-emerald-400",
          badge: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
          progressBar: "from-emerald-500 to-teal-400",
        };
      case "cyan":
        return {
          bgGlow: "from-cyan-500/10 via-transparent to-transparent",
          border: "border-cyan-500/20 hover:border-cyan-500/50",
          iconBox: "text-cyan-400 bg-cyan-500/15 border-cyan-500/30",
          textVal: "text-cyan-400",
          badge: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
          progressBar: "from-cyan-500 to-sky-400",
        };
      case "rose":
        return {
          bgGlow: "from-rose-500/10 via-transparent to-transparent",
          border: "border-rose-500/20 hover:border-rose-500/50",
          iconBox: "text-rose-400 bg-rose-500/15 border-rose-500/30",
          textVal: "text-rose-400",
          badge: "bg-rose-500/10 text-rose-300 border-rose-500/20",
          progressBar: "from-rose-500 to-amber-400",
        };
      case "amber":
        return {
          bgGlow: "from-amber-500/10 via-transparent to-transparent",
          border: "border-amber-500/20 hover:border-amber-500/50",
          iconBox: "text-amber-400 bg-amber-500/15 border-amber-500/30",
          textVal: "text-amber-400",
          badge: "bg-amber-500/10 text-amber-300 border-amber-500/20",
          progressBar: "from-amber-500 to-yellow-400",
        };
      case "indigo":
      default:
        return {
          bgGlow: "from-indigo-500/10 via-transparent to-transparent",
          border: "border-indigo-500/20 hover:border-indigo-500/50",
          iconBox: "text-indigo-400 bg-indigo-500/15 border-indigo-500/30",
          textVal: "text-indigo-300",
          badge: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
          progressBar: "from-indigo-500 to-cyan-400",
        };
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 w-full">
      {cards.map((c) => {
        const colors = getColorClasses(c.colorScheme);
        const Icon = c.icon;

        return (
          <div
            key={c.id}
            className={`rounded-2xl border ${colors.border} bg-card/80 backdrop-blur-xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.4)] relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 flex flex-col justify-between`}
          >
            {/* Ambient subtle glow */}
            <div
              className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${colors.bgGlow} rounded-full blur-2xl pointer-events-none`}
            />

            {/* Header info */}
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <div
                  className={`h-7 w-7 rounded-lg border flex items-center justify-center shrink-0 ${colors.iconBox}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <Badge
                  variant="outline"
                  className={`text-[9px] font-mono py-0 h-4 px-1.5 ${colors.badge}`}
                >
                  {c.lessonTag}
                </Badge>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 line-clamp-1">
                {c.label}
              </p>

              {/* Big value display with StatPopoverChart */}
              <StatPopoverChart
                label={c.label}
                value={c.value}
                unit={c.unit}
                colorVariant={c.colorScheme}
                triggerClassName="inline-block mt-1"
              >
                <div className="flex items-baseline gap-1.5 cursor-pointer hover:opacity-85 transition-opacity">
                  <span className={`text-2xl font-black font-mono tracking-tight ${colors.textVal}`}>
                    {c.value}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">{c.unit}</span>
                </div>
              </StatPopoverChart>
            </div>

            {/* Bottom Percentile Bar */}
            <div className="mt-3 pt-2.5 border-t border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-zinc-400 truncate">{c.percentileLabel}</span>
                <span className="font-mono font-bold text-white">P{c.percentile}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${colors.progressBar} transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(10, c.percentile))}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
