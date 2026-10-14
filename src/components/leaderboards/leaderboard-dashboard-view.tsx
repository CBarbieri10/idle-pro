"use client";

import React, { useState } from "react";
import {
  Trophy,
  Layers,
  Flame,
  Shield,
  Sparkles,
  Filter,
  BarChart3,
  Clock,
  ArrowUpRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LeaderboardCard } from "./leaderboard-card";
import type { LeaderboardCardData } from "@/lib/actions/leaderboards";

export type LeaderboardTabKey = "geral" | "ofensiva" | "defensiva";

interface LeaderboardDashboardViewProps {
  geral: LeaderboardCardData[];
  ofensiva: LeaderboardCardData[];
  defensiva: LeaderboardCardData[];
}

export function LeaderboardDashboardView({
  geral,
  ofensiva,
  defensiva,
}: LeaderboardDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardTabKey>("geral");

  const tabs: Array<{
    id: LeaderboardTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    description: string;
  }> = [
    {
      id: "geral",
      label: "Visão Geral",
      icon: Layers,
      accentColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40",
      description: "Os 4 rankings vitais da liga: Decisão, Criação, Soberania Defensiva e Domínio Aéreo",
    },
    {
      id: "ofensiva",
      label: "Fase Ofensiva",
      icon: Flame,
      accentColor: "from-rose-500/20 to-amber-500/20 text-rose-400 border-rose-500/40",
      description: "Artilharia, xG acumulado, desequilíbrio no 1v1 e passes decisivos no terço final",
    },
    {
      id: "defensiva",
      label: "Fase Defensiva",
      icon: Shield,
      accentColor: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/40",
      description: "Desarmes PAdj, interceptações por antecipação, pressão pós-perda e duelos no chão",
    },
  ];

  const currentCards =
    activeTab === "geral" ? geral : activeTab === "ofensiva" ? ofensiva : defensiva;

  return (
    <div className="space-y-6 w-full">
      {/* ─── Passo 2: Menu Centralizado em Pills (Geral, Ofensiva, Defensiva) ── */}
      <div className="flex flex-col items-center justify-center gap-2 py-2">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#0c101d]/90 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 ${
                  isActive
                    ? `bg-gradient-to-r ${tab.accentColor} border shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]`
                    : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                <span>{tab.label}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Subtitle */}
        <p className="text-xs text-zinc-400 font-medium text-center max-w-xl animate-in fade-in duration-200">
          {tabs.find((t) => t.id === activeTab)?.description}
        </p>
      </div>

      {/* ─── 4 Leaderboard Cards Grid (2x2 Layout) ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
        {currentCards.map((card) => (
          <LeaderboardCard key={card.key} card={card} />
        ))}
      </div>

      {/* ─── Methodological Disclaimer Bar ─────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="font-bold text-white text-[11px]">
              Metodologia de Ajuste Estatístico (PAdj & Viés de Wald)
            </p>
            <p className="text-[10px] text-zinc-400">
              Métricas defensivas ajustadas pela posse de bola adversária. Amostragem calibrada para atletas com minutagem representativa na competição.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="border-white/10 text-zinc-400 text-[10px] font-mono shrink-0">
          Série A 2026 &bull; Wyscout Canonical
        </Badge>
      </div>
    </div>
  );
}
