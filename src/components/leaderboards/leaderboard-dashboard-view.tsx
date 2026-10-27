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
  Users,
  Building2,
  Brain,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LeaderboardCard } from "./leaderboard-card";
import { TeamLeaderboardCard } from "./team-leaderboard-card";
import { QuadrantScatterChart } from "@/components/charts/quadrant-scatter-chart";
import type {
  LeaderboardCardData,
  TeamLeaderboardCardData,
  LeagueQuadrantsPayload,
} from "@/lib/actions/leaderboards";

export type LeaderboardTabKey = "geral" | "ofensiva" | "defensiva";
export type LeaderboardScope = "athletes" | "teams";

interface LeaderboardDashboardViewProps {
  geral: LeaderboardCardData[];
  ofensiva: LeaderboardCardData[];
  defensiva: LeaderboardCardData[];
  teamCards?: TeamLeaderboardCardData[];
  quadrantsData?: LeagueQuadrantsPayload;
}

export function LeaderboardDashboardView({
  geral,
  ofensiva,
  defensiva,
  teamCards = [],
  quadrantsData,
}: LeaderboardDashboardViewProps) {
  // Passo 2: Toggle entre Atletas e Clubes
  const [scope, setScope] = useState<LeaderboardScope>("athletes");
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

  const currentAthleteCards =
    activeTab === "geral" ? geral : activeTab === "ofensiva" ? ofensiva : defensiva;

  return (
    <div className="space-y-6 w-full">
      {/* ─── Passo 2: Toggle Frosted Glass (Atletas vs Clubes) ─────────────── */}
      <div className="flex flex-col items-center justify-center gap-3 pt-2">
        <div className="inline-flex p-1.5 rounded-2xl bg-card/90 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          <button
            type="button"
            onClick={() => setScope("athletes")}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300",
              scope === "athletes"
                ? "bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-indigo-500/20 text-white border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] scale-[1.02]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <Users className="h-4 w-4 text-cyan-400" />
            <span>Atletas &bull; Individual</span>
            {scope === "athletes" && (
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setScope("teams")}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-300",
              scope === "teams"
                ? "bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-rose-500/20 text-white border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
            )}
          >
            <Building2 className="h-4 w-4 text-amber-400" />
            <span>Clubes &bull; Visão Sistêmica</span>
            {scope === "teams" && (
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ─── VISÃO 1: ATLETAS (INDIVIDUAL) ────────────────────────────────── */}
      {scope === "athletes" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Menu de Navegação em Pills */}
          <div className="flex flex-col items-center justify-center gap-2 py-1">
            <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-card/90 border border-white/10 backdrop-blur-2xl shadow-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${tab.accentColor} border shadow-[0_0_20px_rgba(16,185,129,0.25)] scale-[1.02]`
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-transparent"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "opacity-100" : "opacity-70"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-zinc-400 font-medium text-center max-w-xl animate-in fade-in duration-200">
              {tabs.find((t) => t.id === activeTab)?.description}
            </p>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            {currentAthleteCards.map((card) => (
              <LeaderboardCard key={card.key} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* ─── VISÃO 2: CLUBES (SISTÊMICA - Passo 3) ─────────────────────────── */}
      {scope === "teams" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Systemic Banner (Aula 3 - Roberto Torrecilhas) */}
          <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-card to-indigo-950/20 p-5 sm:p-6 shadow-xl backdrop-blur-xl">
            <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-amber-500/10 blur-2xl" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                      Visão Sistêmica do Modelo de Jogo &bull; Comportamento Coletivo
                    </h3>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-mono py-0 h-4">
                      Aula 03
                    </Badge>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 max-w-3xl leading-relaxed">
                    Estatísticas agregadas de todos os atletas do mesmo clube. O foco não é a individualidade isolada, mas a{" "}
                    <strong className="text-white">eficiência da estrutura coletiva</strong>: pressão alta pós-perda, ocupação de terço final e compactação do bloco defensivo.
                  </p>
                </div>
              </div>

              <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs font-mono shrink-0 self-start sm:self-center">
                3 Dimensões Sistêmicas
              </Badge>
            </div>
          </div>

          {/* ─── Gráfico de Quadrantes: Dashboard de Dispersão 2D dos Clubes ─── */}
          {quadrantsData && <QuadrantScatterChart data={quadrantsData} />}

          {/* ─── Passo 3: 3 Cards Coletivos (Pressão Alta, Volume Ofensivo, Solidez de Bloco) ─ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
            {teamCards.map((card) => (
              <TeamLeaderboardCard key={card.key} card={card} />
            ))}
          </div>
        </div>
      )}

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
              Métricas defensivas ajustadas pela posse de bola adversária. Amostragem calibrada para atletas e clubes com minutagem representativa na competição.
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
