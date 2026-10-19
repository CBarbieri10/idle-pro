"use client";

import React, { useState } from "react";
import {
  Layers,
  Flame,
  Shield,
  Target,
  Sparkles,
  BarChart3,
  Sliders,
  Brain,
  Activity,
  Compass,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AthleteContextualHighlights } from "./athlete-contextual-highlights";
import { AthleteImpactBreakdown } from "./athlete-impact-breakdown";
import { AthleteTacticalInferenceCard } from "./athlete-tactical-inference-card";
import { RadarChart } from "@/components/charts/radar-chart";
import { TacticalPitchHeatmap } from "@/components/charts/tactical-pitch-heatmap";
import { StabilityBadge } from "./stability-badge";

export type AthleteTabKey =
  | "visao-360"
  | "fase-ofensiva"
  | "fase-defensiva"
  | "construcao";

interface AthleteTabsViewProps {
  athlete: {
    id: string;
    name: string;
    position: string;
    birthDate?: Date | null;
    height?: number | null;
    weight?: number | null;
    footPreference?: string | null;
    idgScore?: number | null;
    stabilityCategory?: any | null;
  };
  metrics?: Record<string, { label: string; per90: number; total?: number }> | null;
  rawMetrics?: Record<string, unknown> | null;
  totalMatches?: number;
  totalMinutes?: number;
  totalGoals?: number;
  totalAssists?: number;
  totalYellowCards?: number;
  totalRedCards?: number;
  athleteAge?: string | null;
}

export function AthleteTabsView({
  athlete,
  metrics = {},
  rawMetrics = {},
  totalMatches = 0,
  totalMinutes = 0,
  totalGoals = 0,
  totalAssists = 0,
  totalYellowCards = 0,
  totalRedCards = 0,
  athleteAge = null,
}: AthleteTabsViewProps) {
  const [activeTab, setActiveTab] = useState<AthleteTabKey>("visao-360");

  const tabs: Array<{
    id: AthleteTabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }> = [
    {
      id: "visao-360",
      label: "Visão 360º",
      icon: Compass,
      accentColor: "from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/40",
    },
    {
      id: "fase-ofensiva",
      label: "Fase Ofensiva",
      icon: Flame,
      accentColor: "from-rose-500/20 to-amber-500/20 text-rose-400 border-rose-500/40",
    },
    {
      id: "fase-defensiva",
      label: "Fase Defensiva",
      icon: Shield,
      accentColor: "from-cyan-500/20 to-blue-500/20 text-cyan-400 border-cyan-500/40",
    },
    {
      id: "construcao",
      label: "Construção",
      icon: Target,
      accentColor: "from-indigo-500/20 to-purple-500/20 text-indigo-400 border-indigo-500/40",
    },
  ];

  return (
    <div className="space-y-6 w-full">
      {/* ─── Passo 1: Menu Centralizado de Navegação em 'Pills' ───────────── */}
      <div className="flex justify-center w-full py-2">
        <div className="inline-flex items-center gap-1.5 p-1.5 rounded-full bg-[#0c101d]/85 border border-white/10 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all duration-300 ${
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
      </div>

      {/* ─── Passo 2: Destaques Contextuais (Top 4) ────────────────────────── */}
      <AthleteContextualHighlights
        position={athlete.position}
        metrics={metrics}
        rawMetrics={rawMetrics}
      />

      {/* ─── Conteúdo Dinâmico por Aba ────────────────────────────────────── */}
      {activeTab === "visao-360" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Card Holístico de IDG & Estatística Global 360 */}
          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-r from-emerald-950/25 via-[#0c101d]/85 to-[#0c101d]/85 p-5 backdrop-blur-xl shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Compass className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    Painel Holístico 360º &bull; Estatística Pura
                  </h3>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                    Data-Driven Event Data
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Consolidação do Radar DNA, Impacto por Setor, IA Tática e Índice de Desempenho Global (IDG)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {athlete.idgScore !== undefined && athlete.idgScore !== null ? (
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Score IDG</p>
                    <p className="text-sm font-black text-emerald-400 font-mono">
                      {athlete.idgScore.toFixed(1)}
                    </p>
                  </div>
                  <StabilityBadge
                    idgScore={athlete.idgScore}
                    category={athlete.stabilityCategory}
                    size="sm"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-black/40">
                  <Activity className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="text-xs font-mono text-zinc-300">
                    Amostragem: {totalMinutes}&apos; em {totalMatches} jogos
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main 12-col Grid: Left Radar & Impact, Right Tactical Inference & Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Col (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Radar 360 */}
              <div className="rounded-3xl border border-white/[0.12] bg-[#0c101d]/75 backdrop-blur-xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Radar DNA Multidimensional (Per-90)
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Calibrado em relação aos percentis da Série A
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-[10px] font-mono">
                    360º Per-90
                  </Badge>
                </div>

                <div className="flex justify-center py-2">
                  <RadarChart
                    metrics={metrics || {}}
                    size={350}
                    showCategoryTabs={true}
                    colorVariant="emerald"
                  />
                </div>
              </div>

              {/* Barras de Impacto (Defesa, Passe, Criação) */}
              <AthleteImpactBreakdown
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>

            {/* Right Col (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Leitura Tática (Analista IA) */}
              <AthleteTacticalInferenceCard
                athleteName={athlete.name}
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />

              {/* Pitch Heatmap */}
              <TacticalPitchHeatmap
                position={athlete.position as any}
                athleteName={athlete.name}
                totalMatches={totalMatches}
                totalMinutes={totalMinutes}
                goals={totalGoals}
                assists={totalAssists}
                yellowCards={totalYellowCards}
                redCards={totalRedCards}
                age={athleteAge}
                height={athlete.height}
                weight={athlete.weight}
                footPreference={athlete.footPreference as any}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Aba 2: Fase Ofensiva ─────────────────────────────────────────── */}
      {activeTab === "fase-ofensiva" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-rose-500/20 bg-[#0c101d]/75 backdrop-blur-xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Flame className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Eficiência Ofensiva & Zona de Ouro
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Aulas 1 e 2 • Padrão Erling Haaland & Finalização sem Eliminar
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/10 text-[10px] font-mono">
                    Ofensivo
                  </Badge>
                </div>

                <div className="flex justify-center py-2">
                  <RadarChart
                    metrics={metrics || {}}
                    size={350}
                    initialCategory="ATAQUE"
                    showCategoryTabs={false}
                    colorVariant="emerald"
                  />
                </div>
              </div>

              <AthleteImpactBreakdown
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <AthleteTacticalInferenceCard
                athleteName={athlete.name}
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Aba 3: Fase Defensiva ─────────────────────────────────────────── */}
      {activeTab === "fase-defensiva" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-cyan-500/20 bg-[#0c101d]/75 backdrop-blur-xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Organização Defensiva & Duelos (1v1)
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Aula 3 • Framework dos 6 Passos do Duelo Aéreo & PAdj
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-500/10 text-[10px] font-mono">
                    Defensivo
                  </Badge>
                </div>

                <div className="flex justify-center py-2">
                  <RadarChart
                    metrics={metrics || {}}
                    size={350}
                    initialCategory="DEFESA"
                    showCategoryTabs={false}
                    colorVariant="cyan"
                  />
                </div>
              </div>

              <AthleteImpactBreakdown
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <AthleteTacticalInferenceCard
                athleteName={athlete.name}
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── Aba 4: Construção ─────────────────────────────────────────────── */}
      {activeTab === "construcao" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="rounded-3xl border border-indigo-500/20 bg-[#0c101d]/75 backdrop-blur-xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Target className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-white">
                        Construção, Circulação & Passe de Ruptura
                      </h3>
                      <p className="text-[11px] text-zinc-400">
                        Aulas 1 e 2 • Princípio do Terceiro Homem & Scanning
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-indigo-500/30 text-indigo-400 bg-indigo-500/10 text-[10px] font-mono">
                    Construção
                  </Badge>
                </div>

                <div className="flex justify-center py-2">
                  <RadarChart
                    metrics={metrics || {}}
                    size={350}
                    initialCategory="PASSE"
                    showCategoryTabs={false}
                    colorVariant="emerald"
                  />
                </div>
              </div>

              <AthleteImpactBreakdown
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>

            <div className="lg:col-span-5 space-y-6">
              <AthleteTacticalInferenceCard
                athleteName={athlete.name}
                position={athlete.position}
                metrics={metrics}
                rawMetrics={rawMetrics}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
