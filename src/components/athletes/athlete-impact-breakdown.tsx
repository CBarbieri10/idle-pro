"use client";

import React from "react";
import {
  Shield,
  Target,
  Sparkles,
  Flame,
  Activity,
  Sliders,
  Layers,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricDataShape {
  label: string;
  per90: number;
  total?: number;
}

interface AthleteImpactBreakdownProps {
  position?: string;
  metrics?: Record<string, MetricDataShape> | null;
  rawMetrics?: Record<string, unknown> | null;
}

interface ImpactCategory {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number; // 0 a 100
  tier: string;
  tierColor: string;
  barGradient: string;
  subMetrics: Array<{ label: string; value: string }>;
}

export function AthleteImpactBreakdown({
  position = "",
  metrics = {},
  rawMetrics = {},
}: AthleteImpactBreakdownProps) {
  const getPer90 = (key: string, fallback = 0): number => {
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

  // 1. Defesa: Tackles, Interceptions, Aerial, Recoveries
  const padjTackles = getPer90("padj_tackles", getPer90("tackles", 2.2));
  const padjInterceptions = getPer90("padj_interceptions", getPer90("interceptions", 1.8));
  const aerialDuels = getPer90("aerial_duels_won", 2.4);
  const recoveries = getPer90("recoveries", 5.2);

  const defScore = Math.min(
    99,
    Math.max(
      20,
      Math.round(
        (padjTackles / 3.8) * 35 +
          (padjInterceptions / 2.6) * 30 +
          (aerialDuels / 3.2) * 20 +
          (recoveries / 7.5) * 15
      )
    )
  );

  // 2. Passe: Passes, Pass Accuracy %, Progressive passes
  const passes = getPer90("passes", 42);
  const passAcc = getPer90("pass_accuracy", 84);
  const progPasses = getPer90("progressive_passes", 4.4);

  const passScore = Math.min(
    99,
    Math.max(
      20,
      Math.round(
        (passAcc / 94) * 45 +
          (progPasses / 6.5) * 35 +
          (Math.min(65, passes) / 60) * 20
      )
    )
  );

  // 3. Criação: Key passes, Crosses, Dribbles
  const keyPasses = getPer90("key_passes", 1.3);
  const crosses = getPer90("crosses_accurate", getPer90("crosses", 1.8));
  const dribbles = getPer90("dribbles_completed", 1.6);

  const creationScore = Math.min(
    99,
    Math.max(
      20,
      Math.round(
        (keyPasses / 2.2) * 45 +
          (dribbles / 2.8) * 35 +
          (crosses / 2.5) * 20
      )
    )
  );

  // 4. Finalização: Goals, Shots, xG/Shot, xG
  const goals = getPer90("goals", 0.35);
  const xg = getPer90("xg", 0.38);
  const xgPerShot = getPer90("xg_per_shot", 0.16);
  const shots = getPer90("shots", 2.1);

  const finishScore = Math.min(
    99,
    Math.max(
      20,
      Math.round(
        (goals / 0.75) * 40 +
          (xgPerShot / 0.20) * 35 +
          (xg / 0.65) * 15 +
          (Math.min(4, shots) / 3.5) * 10
      )
    )
  );

  const getTier = (score: number) => {
    if (score >= 90) return { label: "Elite (P90+)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    if (score >= 75) return { label: "Acima da Média (P75)", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
    if (score >= 50) return { label: "Média da Liga (P50)", color: "text-indigo-300 bg-indigo-500/10 border-indigo-500/30" };
    return { label: "Em Desenvolvimento", color: "text-zinc-400 bg-white/5 border-white/10" };
  };

  const categories: ImpactCategory[] = [
    {
      id: "defesa",
      name: "Defesa & Recuperação",
      icon: Shield,
      score: defScore,
      tier: getTier(defScore).label,
      tierColor: getTier(defScore).color,
      barGradient: "from-emerald-500 to-teal-400",
      subMetrics: [
        { label: "PAdj Desarmes", value: `${padjTackles.toFixed(1)}/90` },
        { label: "Interceptações", value: `${padjInterceptions.toFixed(1)}/90` },
        { label: "Duelos Aéreos", value: `${aerialDuels.toFixed(1)}/90` },
      ],
    },
    {
      id: "passe",
      name: "Passe & Construção",
      icon: Target,
      score: passScore,
      tier: getTier(passScore).label,
      tierColor: getTier(passScore).color,
      barGradient: "from-cyan-500 to-sky-400",
      subMetrics: [
        { label: "Precisão", value: `${passAcc.toFixed(1)}%` },
        { label: "Progressivos", value: `${progPasses.toFixed(1)}/90` },
        { label: "Volume", value: `${passes.toFixed(0)}/90` },
      ],
    },
    {
      id: "criacao",
      name: "Criação & 1v1",
      icon: Sparkles,
      score: creationScore,
      tier: getTier(creationScore).label,
      tierColor: getTier(creationScore).color,
      barGradient: "from-indigo-500 to-purple-400",
      subMetrics: [
        { label: "Passes-Chave", value: `${keyPasses.toFixed(1)}/90` },
        { label: "Dribles Certos", value: `${dribbles.toFixed(1)}/90` },
        { label: "Cruzamentos", value: `${crosses.toFixed(1)}/90` },
      ],
    },
    {
      id: "finalizacao",
      name: "Finalização & Letalidade",
      icon: Flame,
      score: finishScore,
      tier: getTier(finishScore).label,
      tierColor: getTier(finishScore).color,
      barGradient: "from-rose-500 to-amber-400",
      subMetrics: [
        { label: "Gols P90", value: goals.toFixed(2) },
        { label: "xG/Shot", value: `${xgPerShot.toFixed(2)}` },
        { label: "Finalizações", value: `${shots.toFixed(1)}/90` },
      ],
    },
  ];

  return (
    <Card className="rounded-3xl border border-white/[0.12] bg-card/75 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Detalhamento de Impacto (Percentis da Liga)
              </h3>
              <Badge className="bg-cyan-500/15 text-cyan-300 border-cyan-500/30 text-[10px] font-mono py-0 h-4">
                Canonical P90
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Posicionamento estatístico normalizado em relação aos padrões de referência da Série A
            </p>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="space-y-5 relative z-10">
        {categories.map((cat) => {
          const Icon = cat.icon;

          return (
            <div
              key={cat.id}
              className="p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-300">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wide">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${cat.tierColor}`}>
                    {cat.tier}
                  </Badge>
                  <span className="text-sm font-mono font-black text-white">
                    P{cat.score}
                  </span>
                </div>
              </div>

              {/* Minimalist Horizontal Slider Bar */}
              <div className="relative flex items-center w-full py-1">
                <div className="h-2.5 w-full rounded-full bg-black/40 border border-white/[0.08] p-0.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${cat.barGradient} transition-all duration-700 shadow-sm`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>

              {/* Sub-metrics Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] font-mono">
                {cat.subMetrics.map((sm, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/30 border border-white/[0.06] text-zinc-400"
                  >
                    <span>{sm.label}:</span>
                    <span className="text-white font-bold">{sm.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
