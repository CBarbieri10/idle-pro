"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Swords,
  Scale,
  Compass,
  Bookmark,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { type HeadToHeadComparisonResult } from "@/lib/actions/compare";
import { useCompareStore } from "@/lib/stores/compare-store";
import { BattleCards } from "@/components/compare/battle-cards";
import { CompareRadar } from "@/components/compare/compare-radar";
import { CompareMetricsTable } from "@/components/compare/compare-metrics-table";
import { Button } from "@/components/ui/button";

interface CompareViewClientProps {
  initialData: HeadToHeadComparisonResult | null;
  requestedIds: string[];
}

export function CompareViewClient({
  initialData,
  requestedIds,
}: CompareViewClientProps) {
  const router = useRouter();
  const { athletes: storeAthletes, selectedIds, clearCompare } = useCompareStore();

  // Se a URL não tiver IDs mas a store tiver atletas selecionados, sincroniza a URL
  useEffect(() => {
    if (requestedIds.length === 0 && selectedIds.length > 0) {
      router.replace(`/market/compare?ids=${selectedIds.join(",")}`);
    }
  }, [requestedIds, selectedIds, router]);

  // Se nenhum atleta foi encontrado ou fornecido, renderiza Empty State Elegante
  if (!initialData || initialData.athletes.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-card/60 backdrop-blur-xl p-12 text-center max-w-2xl mx-auto space-y-6 my-10 shadow-2xl">
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.15)]">
          <Swords className="h-10 w-10 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white">
            Nenhum atleta selecionado para o confronto direto
          </h2>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            O módulo Head-to-Head permite comparar até 3 atletas lado a lado com Radar DNA
            sobreposto e destaque matemático das métricas vencedoras.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/athletes"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg transition-all"
          >
            <Compass className="h-4 w-4" />
            <span>Explorar Catálogo da Liga</span>
          </Link>

          <Link
            href="/market/portfolios"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold border border-white/15 bg-white/5 hover:bg-white/10 text-white transition-all"
          >
            <Bookmark className="h-4 w-4 text-amber-400" />
            <span>Acessar Shadow Board</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ─── 1. Cards de Batalha Head-to-Head ──────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
            <Swords className="h-3.5 w-3.5 text-emerald-400" />
            Alvos em Confronto Direto ({initialData.athletes.length})
          </h2>

          <button
            type="button"
            onClick={clearCompare}
            className="text-[11px] font-mono text-zinc-500 hover:text-rose-400 transition-colors flex items-center gap-1"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Resetar Batalha</span>
          </button>
        </div>

        <BattleCards athletes={initialData.athletes} />
      </section>

      {/* ─── 2. Radar DNA Sobreposto ───────────────────────────────────────── */}
      <section>
        <CompareRadar
          radarData={initialData.radarData}
          athletes={initialData.athletes}
        />
      </section>

      {/* ─── 3. Tabela Térmica Lado a Lado ─────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h3 className="text-base font-black text-white">
            Tabela Térmica de Métricas (Head-to-Head)
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Células em verde esmeralda indicam vantagem competitiva do atleta na métrica
            correspondente.
          </p>
        </div>

        <CompareMetricsTable
          tableRows={initialData.tableRows}
          athletes={initialData.athletes}
          scores={initialData.scores}
        />
      </section>
    </div>
  );
}
