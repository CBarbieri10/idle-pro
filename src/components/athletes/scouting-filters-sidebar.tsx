"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Filter,
  SlidersHorizontal,
  Flame,
  Shield,
  Search,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  TrendingUp,
  UserCheck,
  Activity,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeamOption {
  id: string;
  name: string;
}

interface ScoutingFiltersSidebarProps {
  teams: TeamOption[];
  totalCount?: number;
}

const POSITION_OPTIONS = [
  { id: "Zagueiro", label: "Zagueiro", role: "Defesa" },
  { id: "Lateral", label: "Lateral", role: "Laterais" },
  { id: "Volante", label: "Volante", role: "Meio-Campo" },
  { id: "Meia Central", label: "Meia Central", role: "Meio-Campo" },
  { id: "Ponta", label: "Ponta", role: "Ataque" },
  { id: "Centroavante", label: "Centroavante", role: "Ataque" },
  { id: "Goleiro", label: "Goleiro", role: "Goleiro" },
];

const FOOT_OPTIONS = [
  { id: "Canhoto", label: "Canhoto (Esquerdo)" },
  { id: "Destro", label: "Destro (Direito)" },
  { id: "Ambidestro", label: "Ambidestro" },
];

export function ScoutingFiltersSidebar({
  teams,
  totalCount,
}: ScoutingFiltersSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Estado de recolhimento da Sidebar (desktop & mobile)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Parâmetros extraídos da URL
  const search = searchParams.get("search") || searchParams.get("q") || "";
  const posParam = searchParams.get("pos") || "";
  const selectedPositions = posParam ? posParam.split(",").filter(Boolean) : [];

  const footParam = searchParams.get("foot") || "";
  const selectedFoots = footParam ? footParam.split(",").filter(Boolean) : [];

  const minAgeParam = searchParams.get("minAge");
  const maxAgeParam = searchParams.get("maxAge");
  const minAge = minAgeParam ? parseInt(minAgeParam, 10) : 16;
  const maxAge = maxAgeParam ? parseInt(maxAgeParam, 10) : 40;

  const minHeightParam = searchParams.get("minHeight");
  const maxHeightParam = searchParams.get("maxHeight");
  const minHeight = minHeightParam ? parseInt(minHeightParam, 10) : 160;
  const maxHeight = maxHeightParam ? parseInt(maxHeightParam, 10) : 205;

  const isStable =
    searchParams.get("stable") === "true" || searchParams.get("stable") === "1";

  const minZParam = searchParams.get("minZ");
  const minZ = minZParam ? parseFloat(minZParam) : null;

  const selectedTeamId = searchParams.get("teamId") || "ALL";

  // Contagem de filtros ativos
  let activeFiltersCount = 0;
  if (search) activeFiltersCount++;
  if (selectedPositions.length > 0) activeFiltersCount++;
  if (selectedFoots.length > 0) activeFiltersCount++;
  if (minAgeParam || maxAgeParam) activeFiltersCount++;
  if (minHeightParam || maxHeightParam) activeFiltersCount++;
  if (isStable) activeFiltersCount++;
  if (minZParam) activeFiltersCount++;
  if (selectedTeamId !== "ALL") activeFiltersCount++;

  // Função central de atualização de parâmetros na URL
  function applyParams(updates: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());

    // Qualquer alteração nos filtros redefine a página para 1
    params.delete("page");

    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === "" || val === "ALL") {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }

  // Toggle de Posição
  function togglePosition(pos: string) {
    const current = new Set(selectedPositions);
    if (current.has(pos)) {
      current.delete(pos);
    } else {
      current.add(pos);
    }
    const arr = Array.from(current);
    applyParams({ pos: arr.length > 0 ? arr.join(",") : null });
  }

  // Toggle de Pé
  function toggleFoot(foot: string) {
    const current = new Set(selectedFoots);
    if (current.has(foot)) {
      current.delete(foot);
    } else {
      current.add(foot);
    }
    const arr = Array.from(current);
    applyParams({ foot: arr.length > 0 ? arr.join(",") : null });
  }

  // Limpar Todos os Filtros
  function clearAllFilters() {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }

  // Presets Rápidos de Idade
  function applyAgePreset(min: number, max: number) {
    applyParams({
      minAge: min === 16 ? null : String(min),
      maxAge: max === 40 ? null : String(max),
    });
  }

  return (
    <aside
      className={cn(
        "relative transition-all duration-300 ease-in-out shrink-0",
        isCollapsed ? "w-14" : "w-full lg:w-80"
      )}
    >
      {/* ─── Botão de Recolher / Expandir ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 px-1">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-black tracking-wider uppercase text-white font-mono flex items-center gap-1.5">
                Filtros de Scouting
                {activeFiltersCount > 0 && (
                  <Badge className="bg-emerald-500 text-black font-extrabold text-[10px] px-1.5 py-0 h-4">
                    {activeFiltersCount}
                  </Badge>
                )}
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Radar Multidimensional
              </span>
            </div>
          </div>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "h-8 rounded-lg bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors",
            isCollapsed ? "w-full p-0 flex justify-center" : "px-2.5 text-[11px]"
          )}
          title={isCollapsed ? "Expandir Filtros" : "Recolher Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-emerald-400" />
          ) : (
            <div className="flex items-center gap-1">
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">
                Recolher
              </span>
            </div>
          )}
        </Button>
      </div>

      {/* ─── Conteúdo Compacto Quando Recolhido ─────────────────────────────── */}
      {isCollapsed ? (
        <div className="rounded-2xl border border-white/10 bg-[#0c101d]/90 p-2 flex flex-col items-center gap-3 py-4 shadow-xl">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="h-9 w-9 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-zinc-300 hover:text-emerald-300"
            title="Expandir barra de filtros"
          >
            <Filter className="h-4 w-4" />
          </Button>

          {activeFiltersCount > 0 && (
            <div className="flex flex-col items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-emerald-400">
                {activeFiltersCount}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={clearAllFilters}
            disabled={activeFiltersCount === 0 || isPending}
            className="h-8 w-8 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 disabled:opacity-20"
            title="Limpar todos os filtros"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        /* ─── Painel Completo de Filtros ────────────────────────────────────── */
        <div className="rounded-2xl border border-white/10 bg-[#0c101d]/85 backdrop-blur-xl p-4 shadow-2xl space-y-5 text-white">
          {/* Header com Reset */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="text-[11px] text-zinc-400 font-mono">
              {totalCount !== undefined ? (
                <span>
                  <strong className="text-emerald-400">{totalCount}</strong>{" "}
                  atletas no radar
                </span>
              ) : (
                <span>Parâmetros de busca</span>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                disabled={isPending}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline transition-colors disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Limpar filtros</span>
              </button>
            )}
          </div>

          {/* ─── Busca por Nome ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase font-mono flex items-center gap-1.5">
              <Search className="h-3 w-3 text-emerald-400" />
              Nome do Atleta
            </label>
            <div className="relative">
              <Input
                placeholder="Ex: Pedro, Estêvão, Raphael..."
                defaultValue={search}
                onChange={(e) => {
                  const val = e.target.value;
                  // debounce suave simples via timeout
                  const t = setTimeout(() => {
                    applyParams({ search: val.trim() ? val.trim() : null });
                  }, 350);
                  return () => clearTimeout(t);
                }}
                className="h-9 text-xs bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-emerald-500"
              />
            </div>
          </div>

          {/* ─── Clube Canônico ──────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase font-mono flex items-center gap-1.5">
              <Shield className="h-3 w-3 text-cyan-400" />
              Clube Canônico
            </label>
            <select
              value={selectedTeamId}
              onChange={(e) => applyParams({ teamId: e.target.value })}
              className="w-full h-9 px-3 text-xs bg-black/50 border border-white/10 text-zinc-200 rounded-xl focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">Todos os Clubes da Série A</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* ─── FILTROS TÁTICOS: Posição (Multi-select / Checkboxes) ─────────── */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase font-mono flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-violet-400" />
                Posição Tática
              </label>
              {selectedPositions.length > 0 && (
                <button
                  type="button"
                  onClick={() => applyParams({ pos: null })}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  Limpar
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {POSITION_OPTIONS.map((opt) => {
                const isSelected = selectedPositions.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => togglePosition(opt.id)}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-xl border text-left text-xs font-medium transition-all",
                      isSelected
                        ? "bg-violet-500/20 border-violet-500/50 text-violet-200 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
                        : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="h-3 w-3 text-violet-400 shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── FILTROS BIOMÉTRICOS: Idade ──────────────────────────────────── */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase font-mono flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-emerald-400" />
                Faixa Etária (Idade)
              </label>
              <span className="text-[11px] font-mono font-bold text-emerald-400">
                {minAge} a {maxAge} anos
              </span>
            </div>

            {/* Presets de Idade */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => applyAgePreset(16, 20)}
                className={cn(
                  "flex-1 py-1 px-1 text-[10px] font-mono rounded-lg border text-center transition-colors",
                  minAge === 16 && maxAge === 20
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                Sub-20
              </button>
              <button
                type="button"
                onClick={() => applyAgePreset(16, 23)}
                className={cn(
                  "flex-1 py-1 px-1 text-[10px] font-mono rounded-lg border text-center transition-colors",
                  minAge === 16 && maxAge === 23
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                Sub-23
              </button>
              <button
                type="button"
                onClick={() => applyAgePreset(24, 29)}
                className={cn(
                  "flex-1 py-1 px-1 text-[10px] font-mono rounded-lg border text-center transition-colors",
                  minAge === 24 && maxAge === 29
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                Pico (24-29)
              </button>
              <button
                type="button"
                onClick={() => applyAgePreset(16, 40)}
                className={cn(
                  "flex-1 py-1 px-1 text-[10px] font-mono rounded-lg border text-center transition-colors",
                  minAge === 16 && maxAge === 40
                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold"
                    : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                )}
              >
                Todas
              </button>
            </div>

            {/* Slider Min e Max de Idade */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>Idade Mínima: {minAge}</span>
                <span>Idade Máxima: {maxAge}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={16}
                  max={35}
                  value={minAge}
                  onChange={(e) => {
                    const newMin = parseInt(e.target.value, 10);
                    if (newMin <= maxAge) {
                      applyParams({ minAge: newMin === 16 ? null : String(newMin) });
                    }
                  }}
                  className="w-full accent-emerald-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
                <input
                  type="range"
                  min={20}
                  max={40}
                  value={maxAge}
                  onChange={(e) => {
                    const newMax = parseInt(e.target.value, 10);
                    if (newMax >= minAge) {
                      applyParams({ maxAge: newMax === 40 ? null : String(newMax) });
                    }
                  }}
                  className="w-full accent-emerald-500 bg-white/10 h-1.5 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* ─── FILTROS BIOMÉTRICOS: Altura (cm) ─────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase font-mono flex items-center gap-1.5">
                <TrendingUp className="h-3 w-3 text-cyan-400" />
                Altura (cm)
              </label>
              <span className="text-[11px] font-mono font-bold text-cyan-400">
                {minHeight}cm a {maxHeight}cm
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="range"
                min={160}
                max={195}
                value={minHeight}
                onChange={(e) => {
                  const newMin = parseInt(e.target.value, 10);
                  if (newMin <= maxHeight) {
                    applyParams({
                      minHeight: newMin === 160 ? null : String(newMin),
                    });
                  }
                }}
                className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
              <input
                type="range"
                min={175}
                max={205}
                value={maxHeight}
                onChange={(e) => {
                  const newMax = parseInt(e.target.value, 10);
                  if (newMax >= minHeight) {
                    applyParams({
                      maxHeight: newMax === 205 ? null : String(newMax),
                    });
                  }
                }}
                className="w-full accent-cyan-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* ─── FILTROS TÁTICOS: Pé Preferencial ─────────────────────────────── */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <label className="text-[11px] font-bold text-zinc-300 tracking-wide uppercase font-mono flex items-center gap-1.5">
              <UserCheck className="h-3 w-3 text-amber-400" />
              Pé Preferencial
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {FOOT_OPTIONS.map((f) => {
                const isSelected = selectedFoots.includes(f.id);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFoot(f.id)}
                    className={cn(
                      "py-1.5 px-1 rounded-xl border text-center text-xs font-semibold transition-all",
                      isSelected
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                        : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white"
                    )}
                  >
                    {f.id}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── FILTROS TÉRMICOS (O Diferencial Moneyball) ───────────────────── */}
          <div className="space-y-3 pt-3 border-t border-white/[0.08] rounded-xl bg-gradient-to-b from-emerald-500/[0.05] to-transparent p-3 border border-emerald-500/20">
            <div className="flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 font-mono">
                Filtros Térmicos (Moneyball)
              </span>
            </div>

            {/* Toggle/Switch: Apenas Jogadores Estáveis (IDG < 20%) */}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
              <div className="min-w-0 pr-1">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Jogadores Estáveis</span>
                  {isStable && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono">
                  IDG &lt; 20% de oscilação competitiva
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={isStable}
                onClick={() => applyParams({ stable: isStable ? null : "true" })}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isStable
                    ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                    : "bg-zinc-800"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    isStable ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Slider de Corte: Z-Score Geral Mínimo */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-bold text-zinc-300 font-mono">
                  Z-Score Mínimo:
                </span>
                <div className="flex items-center gap-1.5">
                  {minZ !== null ? (
                    <Badge
                      className={cn(
                        "font-mono font-bold text-xs px-2 py-0.5",
                        minZ >= 0
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      )}
                    >
                      {minZ >= 0 ? `+${minZ.toFixed(2)}` : minZ.toFixed(2)}
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Qualquer
                    </span>
                  )}
                  {minZ !== null && (
                    <button
                      type="button"
                      onClick={() => applyParams({ minZ: null })}
                      className="text-[10px] text-zinc-400 hover:text-white"
                      title="Resetar Z-Score"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              <input
                type="range"
                min={-2.0}
                max={2.5}
                step={0.1}
                value={minZ !== null ? minZ : -2.0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  applyParams({ minZ: val === -2.0 ? null : String(val) });
                }}
                className="w-full accent-emerald-400 bg-white/10 h-1.5 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                <span>-2.0 (Todos)</span>
                <span className="text-zinc-400">0.0 (Média)</span>
                <span className="text-emerald-400 font-bold">+2.5 (Elite)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
