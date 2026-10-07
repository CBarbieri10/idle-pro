"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Search,
  X,
  Target,
  Shield,
  Flame,
  Clock,
  Sparkles,
  Layers,
  Filter,
  CheckCircle2,
  ExternalLink,
  User,
  Zap,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AthleteTelemetryModalProps {
  athleteName: string;
  athletePosition?: string;
  teamName?: string;
  rawData: Record<string, unknown> | null | undefined;
  triggerVariant?: "button" | "banner";
  children?: React.ReactNode;
}

type CategoryKey = "all" | "passe" | "duelos" | "defesa" | "ataque" | "volume";

interface MetricItem {
  key: string;
  label: string;
  rawValue: unknown;
  formattedValue: string;
  category: CategoryKey;
  isPercent: boolean;
}

const CATEGORIES: Array<{
  key: CategoryKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { key: "all", label: "Todas as Métricas", icon: Layers },
  { key: "passe", label: "🎯 Construção & Passe", icon: Target },
  { key: "duelos", label: "⚔️ Duelos & 1v1", icon: Activity },
  { key: "defesa", label: "🛡️ Defesa & Recuperação", icon: Shield },
  { key: "ataque", label: "⚡ Ataque & Criação", icon: Flame },
  { key: "volume", label: "⏱️ Volume & Minutagem", icon: Clock },
];

const METRIC_CATEGORY_MAP: Record<string, CategoryKey> = {
  // Construção & Passe
  Passes: "passe",
  "Passes precisos, %": "passe",
  "Passes progressivos": "passe",
  "Passes progressivos precisos, %": "passe",
  "Passes progressivos limpos": "passe",
  "Passes curtos": "passe",
  "Passes curtos precisos, %": "passe",
  "Passes longos": "passe",
  "Passes longos precisos, %": "passe",
  "Passes para a frente no terço final": "passe",
  "Passes para a frente no terço final precisos, %": "passe",
  "Passes para a área": "passe",
  "Passes para a área precisos, %": "passe",
  "Passes para chute": "passe",
  "Passes muito longos": "passe",
  "Passes muito longos precisos, %": "passe",
  "Passes-chave": "passe",
  "Passes-chave precisos": "passe",
  "Passes-chave precisos, %": "passe",
  Cruzamentos: "passe",
  "Cruzamentos precisos": "passe",
  "Cruzamentos precisos, %": "passe",
  Condução: "passe",
  "Passes para a frente precisos": "passe",
  "Passes para a frente precisos, %": "passe",
  "Passes para a área precisos": "passe",
  "Passes progressivos precisos": "passe",

  // Duelos & 1v1
  Duelos: "duelos",
  "Duelos ganhos": "duelos",
  "Duelos ganhos, %": "duelos",
  "Duelos defensivos": "duelos",
  "Duelos defensivos ganhos": "duelos",
  "Duelos defensivos ganhos, %": "duelos",
  "Duelos ofensivos": "duelos",
  "Duelos ofensivos ganhos": "duelos",
  "Duelos ofensivos ganhos, %": "duelos",
  "Duelos aéreos": "duelos",
  "Duelos aéreos ganhos": "duelos",
  "Duelos aéreos ganhos, %": "duelos",
  "Duelos perdidos": "duelos",
  Dribles: "duelos",
  "Dribles bem-sucedidos": "duelos",
  "Dribles bem-sucedidos, %": "duelos",
  "Dribles no terço final": "duelos",
  "Dribles no terço final bem-sucedidos": "duelos",
  "Dribles no terço final bem-sucedidos, %": "duelos",
  Cabeceios: "duelos",

  // Defesa & Recuperação
  Desarmes: "defesa",
  "Desarmes bem-sucedidos": "defesa",
  "Desarmes bem-sucedidos, %": "defesa",
  Interceptações: "defesa",
  "Recuperações de bola solta": "defesa",
  "Recuperações da bola": "defesa",
  "Recuperações da bola no campo adversário": "defesa",
  "Recuperações da bola após perdas em até 10 segundos": "defesa",
  "Recuperações da bola após perdas em até 10 segundos no campo adversário": "defesa",
  "Recuperações da bola após perdas em até 5 segundos": "defesa",
  "Recuperações da bola após perdas em até 5 segundos no campo adversário": "defesa",
  Faltas: "defesa",
  "Cartões amarelos": "defesa",
  "Cartões vermelhos": "defesa",
  "Erros que geram chances de gol": "defesa",

  // Ataque & Criação
  "xG (Gols esperados)": "ataque",
  Gols: "ataque",
  Assistências: "ataque",
  "Chances de gol": "ataque",
  "Chances de gol bem-sucedidas": "ataque",
  "Chances de gol bem-sucedidas, %": "ataque",
  "Chances de gol criadas": "ataque",
  "Participação em ataques com gol": "ataque",
  Chutes: "ataque",
  "Chutes no alvo": "ataque",
  "Chutes no alvo, %": "ataque",
  "Chutes para fora": "ataque",
  "Chutes bloqueados": "ataque",
  "Chutes na trave / no travessão": "ataque",
  "Gols de cabeça": "ataque",
  "Chutes de tiro livre": "ataque",
  "Gols de tiro livre": "ataque",
  "Faltas sofridas": "ataque",
  "Entradas no terço final": "ataque",
  "Entradas no terço final por passe": "ataque",
  "Entradas no terço final por passe, % do total": "ataque",
  "Entradas no terço final por condução": "ataque",
  "Entradas no terço final por condução, % do total": "ataque",
  "Ações na área adversária": "ataque",
  "Ações na área adversária bem-sucedidas": "ataque",
  "Ações na área adversária bem-sucedidas, %": "ataque",

  // Volume & Minutagem
  "Minutos jogados": "volume",
  "Partidas jogadas": "volume",
  "Aparições na escalação inicial": "volume",
  Ações: "volume",
  "Ações bem-sucedidas": "volume",
  "Ações bem-sucedidas, %": "volume",
  Índice: "volume",
  Idade: "volume",
  Altura: "volume",
  Peso: "volume",
  Nacionalidade: "volume",
  Posição: "volume",
  Time: "volume",
  Jogador: "volume",
  "№": "volume",
};

function formatTelemetryValue(
  key: string,
  val: unknown
): { formatted: string; isPercent: boolean } {
  if (val == null || val === "-" || val === "") {
    return { formatted: "—", isPercent: false };
  }

  const isPercent =
    key.includes("%") ||
    key.toLowerCase().includes("precisos, %") ||
    key.toLowerCase().includes("ganhos, %") ||
    key.toLowerCase().includes("bem-sucedidos, %");

  if (typeof val === "number") {
    if (isPercent) {
      const pct = val <= 1 && val >= 0 ? val * 100 : val;
      return { formatted: `${pct.toFixed(1)}%`, isPercent: true };
    }
    if (Number.isInteger(val)) {
      return { formatted: val.toLocaleString("pt-BR"), isPercent: false };
    }
    return {
      formatted: val.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      }),
      isPercent: false,
    };
  }

  if (typeof val === "string") {
    const cleaned = val.replace("%", "").replace(",", ".").trim();
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      if (isPercent || val.includes("%")) {
        const pct = num <= 1 && num >= 0 && !val.includes("%") ? num * 100 : num;
        return { formatted: `${pct.toFixed(1)}%`, isPercent: true };
      }
      return { formatted: num.toLocaleString("pt-BR"), isPercent: false };
    }
    return { formatted: val, isPercent: false };
  }

  return { formatted: String(val), isPercent: false };
}

export function AthleteTelemetryModal({
  athleteName,
  athletePosition,
  teamName,
  rawData,
  triggerVariant = "button",
  children,
}: AthleteTelemetryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const items: MetricItem[] = useMemo(() => {
    if (!rawData || typeof rawData !== "object") return [];

    return Object.entries(rawData)
      .filter(([key]) => key !== "id" && key !== "athleteId" && key !== "matchId")
      .map(([key, rawValue]) => {
        const { formatted, isPercent } = formatTelemetryValue(key, rawValue);
        const category = METRIC_CATEGORY_MAP[key] || "volume";

        return {
          key,
          label: key,
          rawValue,
          formattedValue: formatted,
          category,
          isPercent,
        };
      });
  }, [rawData]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        activeCategory === "all" || item.category === activeCategory;

      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.formattedValue.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [items, activeCategory, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryKey, number> = {
      all: items.length,
      passe: 0,
      duelos: 0,
      defesa: 0,
      ataque: 0,
      volume: 0,
    };
    for (const item of items) {
      if (counts[item.category] !== undefined) {
        counts[item.category]++;
      }
    }
    return counts;
  }, [items]);

  // Extract biometrics for the 3D card
  const age = rawData?.["Idade"] ? String(rawData["Idade"]) : null;
  const height = rawData?.["Altura"] ? `${rawData["Altura"]} cm` : null;
  const weight = rawData?.["Peso"] ? `${rawData["Peso"]} kg` : null;
  const nationality = rawData?.["Nacionalidade"] ? String(rawData["Nacionalidade"]) : null;
  const ratingIndex = rawData?.["Índice"] ? String(rawData["Índice"]) : null;
  const matchesPlayed = rawData?.["Partidas jogadas"] ? String(rawData["Partidas jogadas"]) : null;
  const minutesPlayed = rawData?.["Minutos jogados"] ? String(rawData["Minutos jogados"]) : null;

  const initials = athleteName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const modalOverlay = isOpen && mounted ? (
    createPortal(
      <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
        <div
          className="fixed inset-0 bg-black/60"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* 3D Holographic Poster Container */}
        <div className="relative w-full max-w-6xl bg-[#080d18] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden flex flex-col max-h-[92vh] z-10 animate-in zoom-in-95 duration-200">
          {/* Top Holographic Navigation Bar */}
          <div className="border-b border-white/[0.08] px-5 py-4 bg-[#0a1122]/90 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Dossiê 3D &bull; Telemetria Integral Wyscout
                  </h2>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] font-mono py-0 h-4">
                    75 Métricas Oficiais
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {athleteName} &bull; {teamName ?? "Série A 2026"} &bull; Camada JSONB Raw
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl"
              title="Fechar (ESC)"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Modal Main Body (2 Columns: 3D Poster Card on left, Metrics Explorer on right) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0 bg-[#060a14]">
            {/* ─── LEFT: Cartaz 3D do Atleta (Holographic Executive Poster) ───── */}
            <div className="lg:col-span-4 p-5 sm:p-6 bg-gradient-to-b from-[#0c1426] via-[#090f1d] to-[#070b16] border-b lg:border-b-0 lg:border-r border-white/[0.08] flex flex-col justify-between gap-5">
              {/* 3D Card Shell */}
              <div className="relative rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-[#111c34]/90 to-[#0c1324]/90 p-5 shadow-2xl backdrop-blur-xl overflow-hidden group">
                {/* Holographic light effect */}
                <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-cyan-500/15 blur-2xl" />
                <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-indigo-500/15 blur-2xl" />

                {/* Avatar / Monogram Header */}
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="relative mb-3">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/25 via-[#13203c] to-indigo-500/25 border-2 border-cyan-400/50 flex items-center justify-center text-cyan-200 text-2xl font-black font-mono shadow-[0_0_25px_rgba(6,182,212,0.35)]">
                      {initials}
                    </div>
                    {athletePosition && (
                      <span className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-cyan-500 text-black font-black text-[10px] uppercase font-mono shadow-md">
                        {athletePosition}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-black text-white tracking-tight mt-1">
                    {athleteName}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    {teamName ?? "Brasileirão Série A"}
                  </p>
                </div>

                {/* Biometrics 3D Tiles */}
                <div className="relative z-10 mt-5 pt-4 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-xs font-mono">
                  {age && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        Idade
                      </span>
                      <span className="text-white font-bold">{age} anos</span>
                    </div>
                  )}

                  {height && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        Altura
                      </span>
                      <span className="text-white font-bold">{height}</span>
                    </div>
                  )}

                  {weight && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        Peso
                      </span>
                      <span className="text-white font-bold">{weight}</span>
                    </div>
                  )}

                  {nationality && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        País
                      </span>
                      <span className="text-white font-bold truncate block" title={nationality}>
                        {nationality}
                      </span>
                    </div>
                  )}

                  {matchesPlayed && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        Partidas
                      </span>
                      <span className="text-emerald-400 font-bold">{matchesPlayed} jogos</span>
                    </div>
                  )}

                  {minutesPlayed && (
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <span className="text-[9px] uppercase font-bold text-zinc-400 block">
                        Minutagem
                      </span>
                      <span className="text-cyan-300 font-bold">{minutesPlayed}&apos;</span>
                    </div>
                  )}
                </div>

                {/* Rating / Index Seal */}
                {ratingIndex && (
                  <div className="relative z-10 mt-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-black">
                      <Award className="h-4 w-4 text-cyan-400" />
                      <span>Índice Wyscout:</span>
                    </div>
                    <span className="font-mono text-base font-black text-cyan-200">
                      {ratingIndex}
                    </span>
                  </div>
                )}
              </div>

              {/* Technical Cert Seal */}
              <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 text-[11px] text-zinc-400 space-y-1">
                <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Base Canônica Auditada</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Os 75 indicadores alimentam diretamente os motores matemáticos de IDG, PAdj Defensivo e xG/Shot.
                </p>
              </div>
            </div>

            {/* ─── RIGHT: Painel de Indicadores & Busca Rápida ─────────────────── */}
            <div className="lg:col-span-8 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="p-4 sm:px-6 bg-[#090f1d] border-b border-white/[0.06] flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrar por métrica (ex: 'Passes', 'Duelos', 'Recuperações', 'xG')..."
                    className="w-full bg-[#11192e] border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/60 shadow-inner"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-[11px] font-mono text-zinc-400 shrink-0 hidden sm:block">
                  <span className="font-bold text-white">{filteredItems.length}</span> de {items.length}
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="px-4 sm:px-6 py-2.5 bg-[#080d1a] border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.key];
                  const isActive = activeCategory === cat.key;
                  const Icon = cat.icon;

                  return (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0",
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{cat.label}</span>
                      <span className="text-[10px] font-mono opacity-60">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Metric Grid */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#060a14]">
                {filteredItems.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <div className="mx-auto w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400">
                      <Filter className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-zinc-300">
                      Nenhum indicador encontrado para o filtro
                    </p>
                    <p className="text-xs text-zinc-500">
                      Tente outro termo na busca ou selecione outra categoria temática.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {filteredItems.map((item) => {
                      const isHighPercent =
                        item.isPercent && parseFloat(item.formattedValue) >= 70;

                      return (
                        <div
                          key={item.key}
                          className="group flex items-center justify-between p-3 rounded-xl border border-white/[0.07] bg-gradient-to-b from-[#111726]/90 to-[#0b0f19]/90 hover:border-cyan-500/40 hover:bg-[#131b2c] transition-all shadow-sm"
                        >
                          <div className="min-w-0 pr-2">
                            <p
                              className="text-xs font-semibold text-zinc-300 group-hover:text-white truncate"
                              title={item.label}
                            >
                              {item.label}
                            </p>
                            <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">
                              {item.category}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={cn(
                                "font-mono font-black text-sm",
                                item.formattedValue === "—"
                                  ? "text-zinc-600"
                                  : isHighPercent
                                  ? "text-emerald-400 drop-shadow-sm"
                                  : item.isPercent
                                  ? "text-cyan-300"
                                  : "text-white"
                              )}
                            >
                              {item.formattedValue}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      {/* ─── Executive Trigger Variants ────────────────────────────────────── */}
      {triggerVariant === "banner" ? (
        <div className="relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-[#0d1322] to-indigo-950/30 p-5 shadow-2xl backdrop-blur-xl group">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                    Telemetria Oficial Completa &bull; {items.length || 75} Indicadores Wyscout
                  </h3>
                  <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-[10px] font-mono py-0 h-4">
                    JSONB Raw
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Explore todos os dados brutos em cartaz 3D com busca instantânea.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 text-xs font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              <span>🔬 Abrir Cartaz 3D &bull; 75 Indicadores</span>
            </button>
          </div>
        </div>
      ) : children ? (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {children}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center gap-2.5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-500/15 via-teal-500/10 to-indigo-500/15 px-4 py-2 text-xs font-black text-cyan-300 hover:text-white hover:border-cyan-400/60 hover:bg-cyan-500/25 transition-all shadow-[0_0_20px_rgba(6,182,212,0.15)] active:scale-95"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <Activity className="h-4 w-4 text-cyan-400 group-hover:rotate-45 transition-transform" />
          <span>🔬 Cartaz 3D &bull; 75 Indicadores</span>
        </button>
      )}

      {/* Render via Portal to document.body */}
      {modalOverlay}
    </>
  );
}
