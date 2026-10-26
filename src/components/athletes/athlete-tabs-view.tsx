"use client";

import React, { useState } from "react";
import { Flame, Shield, Target } from "lucide-react";
import { AthleteImpactBreakdown } from "./athlete-impact-breakdown";
import { RadarChart } from "@/components/charts/radar-chart";

type PhaseKey = "fase-ofensiva" | "fase-defensiva" | "construcao";

interface AthleteTabsViewProps {
  athlete: {
    position: string;
  };
  metrics?: Record<string, { label: string; per90: number; total?: number }> | null;
  rawMetrics?: Record<string, unknown> | null;
}

const PHASES: Array<{
  id: PhaseKey;
  label: string;
  category: "ATAQUE" | "DEFESA" | "PASSE";
  icon: React.ComponentType<{ className?: string }>;
  active: string;
  ring: string;
  variant: "emerald" | "cyan";
}> = [
  {
    id: "fase-ofensiva",
    label: "Ofensiva",
    category: "ATAQUE",
    icon: Flame,
    active: "bg-rose-500/15 text-rose-300 border-rose-500/40",
    ring: "border-rose-500/20",
    variant: "emerald",
  },
  {
    id: "fase-defensiva",
    label: "Defensiva",
    category: "DEFESA",
    icon: Shield,
    active: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
    ring: "border-cyan-500/20",
    variant: "cyan",
  },
  {
    id: "construcao",
    label: "Construção",
    category: "PASSE",
    icon: Target,
    active: "bg-indigo-500/15 text-indigo-300 border-indigo-500/40",
    ring: "border-indigo-500/20",
    variant: "emerald",
  },
];

/**
 * Análise por fase de jogo. Um único painel (radar + barras de impacto) alterna
 * entre Ofensiva / Defensiva / Construção — sem repetir os mesmos cards em cada aba.
 */
export function AthleteTabsView({ athlete, metrics = {}, rawMetrics = {} }: AthleteTabsViewProps) {
  const [phaseId, setPhaseId] = useState<PhaseKey>("fase-ofensiva");
  const phase = PHASES.find((p) => p.id === phaseId) ?? PHASES[0];

  return (
    <div className="space-y-4 w-full">
      <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#0c101d]/85 p-1">
        {PHASES.map((p) => {
          const Icon = p.icon;
          const isActive = p.id === phaseId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setPhaseId(p.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                isActive
                  ? p.active
                  : "border-transparent text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {p.label}
            </button>
          );
        })}
      </div>

      <div key={phase.id} className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2 animate-in fade-in duration-300">
        <div className={`rounded-2xl border ${phase.ring} bg-[#0c101d]/75 p-4 backdrop-blur-xl`}>
          <div className="flex justify-center">
            <RadarChart
              metrics={metrics || {}}
              size={320}
              initialCategory={phase.category}
              showCategoryTabs={false}
              colorVariant={phase.variant}
            />
          </div>
        </div>

        <AthleteImpactBreakdown
          position={athlete.position}
          metrics={metrics}
          rawMetrics={rawMetrics}
        />
      </div>
    </div>
  );
}
