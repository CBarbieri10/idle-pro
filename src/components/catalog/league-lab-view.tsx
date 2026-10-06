"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  ArrowLeft,
  SlidersHorizontal,
  Target,
  ExternalLink,
  Award,
  Filter,
} from "lucide-react";
import { type CatalogAthlete } from "@/lib/actions/catalog";
import { METRICS, METRIC_GROUPS, METRIC_BY_KEY } from "@/lib/metrics";
import { POSITION_LABELS, POSITION_COLORS } from "@/lib/domain";
import { ScatterPlotMatrix } from "@/components/charts/scatter-plot-matrix";
import { StabilityBadge } from "@/components/athletes/stability-badge";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { StabilityCategory } from "@/lib/math-engine";

interface LeagueLabViewProps {
  athletes: CatalogAthlete[];
}

const MONEYBALL_PRESETS = [
  {
    title: "Volantes de Transição & Combate",
    desc: "Passes verticais combinados com proteção defensiva ajustada por posse.",
    x: "progressive_passes",
    y: "padj_tackles",
    tag: "Meio-Campo",
  },
  {
    title: "Eficiência Letal de Artilheiros",
    desc: "Volume de finalizações cruzado com a qualidade do chute (xG/Fin).",
    x: "shots",
    y: "xg_per_shot",
    tag: "Ataque",
  },
  {
    title: "Extremos Desequilibrantes",
    desc: "1v1 em velocidade associado à criação de gols esperados.",
    x: "dribbles_completed",
    y: "xg",
    tag: "Pontas",
  },
  {
    title: "Armadores Verticais",
    desc: "Quebra de linhas e passes decisivos para finalização.",
    x: "key_passes",
    y: "progressive_passes",
    tag: "Criação",
  },
  {
    title: "Segurança & Leitura Defensiva",
    desc: "Duelos defensivos e interceptações ponderadas por posse.",
    x: "ground_duels_won",
    y: "padj_interceptions",
    tag: "Defesa",
  },
];

export function LeagueLabView({ athletes }: LeagueLabViewProps) {
  const [xMetric, setXMetric] = useState<string>("progressive_passes");
  const [yMetric, setYMetric] = useState<string>("padj_tackles");
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [minMinutes, setMinMinutes] = useState<number>(0);

  // Filtra atletas
  const filteredAthletes = useMemo(() => {
    return athletes.filter((a) => {
      if (positionFilter !== "ALL" && a.position !== positionFilter) return false;
      if (minMinutes > 0 && a.totalMinutes < minMinutes) return false;
      return true;
    });
  }, [athletes, positionFilter, minMinutes]);

  // Métricas disponíveis organizadas por grupo
  const metricsByGroup = useMemo(() => {
    const groups: Record<string, typeof METRICS> = {};
    for (const g of METRIC_GROUPS) {
      groups[g] = METRICS.filter((m) => m.group === g);
    }
    return groups;
  }, []);

  return (
    <div className="space-y-6 w-full select-none">
      {/* ─── Breadcrumb & Top Bar ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/league"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors mr-2"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-indigo-400" />
              Voltar ao Catálogo
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00e676]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00e676] border border-[#00e676]/30 uppercase tracking-wider font-mono">
              <Sparkles className="h-3 w-3" /> Laboratório Analítico 2D
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1.5">
            Matrizes de Dispersão & Detecção Moneyball
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cruze quaisquer métricas canônicas nos eixos X e Y para identificar anomalias estatísticas e talentos fora do radar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/league"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong bg-bg-surface-elevated px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-bg-surface-highlight transition-all"
          >
            Ver Grade do Catálogo
          </Link>
        </div>
      </div>

      {/* ─── Quick Presets Row ───────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 font-mono flex items-center gap-1.5">
          <Target className="h-3.5 w-3.5 text-emerald-400" />
          Cenários de Prospecção Pré-configurados (Moneyball Shortcuts):
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {MONEYBALL_PRESETS.map((p, i) => {
            const isSelected = xMetric === p.x && yMetric === p.y;
            return (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setXMetric(p.x);
                  setYMetric(p.y);
                }}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-150 backdrop-blur-md",
                  isSelected
                    ? "bg-emerald-500/15 border-emerald-500/40 ring-1 ring-emerald-500/30 text-white shadow-lg"
                    : "bg-bg-surface border-border-strong hover:bg-bg-surface-elevated text-zinc-300 hover:text-white"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
                    {p.tag}
                  </span>
                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>
                <h4 className="text-xs font-black truncate">{p.title}</h4>
                <p className="text-[10px] text-zinc-400 line-clamp-1 mt-0.5">
                  {p.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── Metric Selectors & Filters Bar ──────────────────────────────── */}
      <Card className="rounded-2xl border border-white/10 bg-bg-surface p-4 shadow-xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Eixo X Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Métrica do Eixo X (Horizontal)
            </label>
            <Select value={xMetric} onValueChange={(v) => v && setXMetric(v)}>
              <SelectTrigger className="w-full bg-bg-surface-elevated border-border-strong text-xs font-semibold">
                <SelectValue placeholder="Selecione o Eixo X" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {METRIC_GROUPS.map((group) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-[10px] font-mono text-zinc-400 uppercase">
                      {group}
                    </SelectLabel>
                    {metricsByGroup[group]?.map((m) => (
                      <SelectItem key={m.key} value={m.key} className="text-xs">
                        {m.label} {m.unit === "percent" ? "(%)" : "/90"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Eixo Y Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              Métrica do Eixo Y (Vertical)
            </label>
            <Select value={yMetric} onValueChange={(v) => v && setYMetric(v)}>
              <SelectTrigger className="w-full bg-bg-surface-elevated border-border-strong text-xs font-semibold">
                <SelectValue placeholder="Selecione o Eixo Y" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {METRIC_GROUPS.map((group) => (
                  <SelectGroup key={group}>
                    <SelectLabel className="text-[10px] font-mono text-zinc-400 uppercase">
                      {group}
                    </SelectLabel>
                    {metricsByGroup[group]?.map((m) => (
                      <SelectItem key={m.key} value={m.key} className="text-xs">
                        {m.label} {m.unit === "percent" ? "(%)" : "/90"}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Posição */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Filter className="h-3 w-3 text-zinc-400" />
              Recorte por Posição
            </label>
            <Select value={positionFilter} onValueChange={(v) => v && setPositionFilter(v)}>
              <SelectTrigger className="w-full bg-bg-surface-elevated border-border-strong text-xs font-semibold">
                <SelectValue placeholder="Todas as posições" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Posições</SelectItem>
                {Object.entries(POSITION_LABELS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Minutagem */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3 text-zinc-400" />
              Amostragem Mínima
            </label>
            <Select
              value={String(minMinutes)}
              onValueChange={(v) => v && setMinMinutes(Number(v))}
            >
              <SelectTrigger className="w-full bg-bg-surface-elevated border-border-strong text-xs font-semibold">
                <SelectValue placeholder="Sem filtro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Qualquer minutagem</SelectItem>
                <SelectItem value="45">&ge; 45 minutos jogados</SelectItem>
                <SelectItem value="80">&ge; 80 minutos jogados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* ─── Scatter Plot Matrix 2D Canvas ───────────────────────────────── */}
      <ScatterPlotMatrix
        athletes={filteredAthletes}
        xMetric={xMetric}
        yMetric={yMetric}
      />

      {/* ─── Elite Target Cards Spotlight ────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Award className="h-4 w-4 text-emerald-400" />
            Radar de Oportunidades &bull; Jogadores em Destaque
          </h3>
          <span className="text-xs text-muted-foreground font-mono">
            {filteredAthletes.length} atletas analisados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {filteredAthletes.slice(0, 4).map((a) => (
            <div
              key={a.id}
              className="rounded-xl border border-white/10 bg-bg-surface p-3.5 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-xl bg-zinc-900 border border-white/10 overflow-hidden shrink-0">
                  {a.photoUrl ? (
                    <Image
                      src={a.photoUrl}
                      alt={a.name}
                      fill
                      className={cn(
                        "object-cover",
                        a.photoHasAlpha && "object-contain"
                      )}
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center font-black text-indigo-400 text-sm">
                      {a.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0 border-0",
                        POSITION_COLORS[a.position]
                      )}
                    >
                      {POSITION_LABELS[a.position]}
                    </Badge>
                    {a.idgScore != null && (
                      <StabilityBadge
                        idgScore={a.idgScore}
                        category={a.stabilityCategory as StabilityCategory | null}
                        size="xs"
                        showScore={false}
                      />
                    )}
                  </div>
                  <h4 className="font-black text-sm text-white truncate mt-1">
                    {a.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {a.team.name}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                <span className="text-zinc-400 text-[10px]">
                  {METRIC_BY_KEY[xMetric]?.short ?? xMetric}:{" "}
                  <strong className="text-white">
                    {(a.metrics[xMetric]?.per90 ?? 0).toFixed(1)}
                  </strong>
                </span>
                <span className="text-zinc-400 text-[10px]">
                  {METRIC_BY_KEY[yMetric]?.short ?? yMetric}:{" "}
                  <strong className="text-emerald-400">
                    {(a.metrics[yMetric]?.per90 ?? 0).toFixed(1)}
                  </strong>
                </span>
                <Link
                  href={`/athletes/${a.id}`}
                  className="text-indigo-400 hover:text-indigo-300"
                >
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
