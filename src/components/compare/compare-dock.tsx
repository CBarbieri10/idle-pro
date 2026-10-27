"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Scale,
  X,
  Swords,
  ChevronRight,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useCompareStore } from "@/lib/stores/compare-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CompareDock() {
  const pathname = usePathname();
  const { athletes, selectedIds, removeAthlete, clearCompare, count } =
    useCompareStore();

  // Se não houver atletas selecionados ou se já estiver na página de comparação, pode esconder ou manter minimizado
  if (count === 0) return null;

  const isComparePage = pathname === "/market/compare" || pathname === "/athletes/compare";
  const compareUrl = `/market/compare?ids=${selectedIds.join(",")}`;

  return (
    <div className="fixed bottom-0 sm:bottom-3 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-2xl animate-in fade-in slide-in-from-bottom-5 duration-300 pb-2 sm:pb-0">
      <div className="rounded-2xl border border-emerald-500/40 bg-card/95 backdrop-blur-2xl p-2.5 sm:p-3 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_24px_rgba(16,185,129,0.2)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* ─── Lado Esquerdo: Badge & Slots de Atletas ────────────────────── */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          <div className="hidden md:flex flex-col items-center justify-center pl-1 pr-2 border-r border-white/10 shrink-0">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Scale className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-mono font-bold text-zinc-400 mt-0.5">
              {count}/3
            </span>
          </div>

          {/* Slots de Atletas (Até 3) */}
          <div className="flex items-center gap-2">
            {athletes.map((a) => (
              <div
                key={a.id}
                className="group relative flex items-center gap-2 bg-white/5 border border-white/10 hover:border-emerald-500/40 rounded-xl py-1 px-2 shrink-0 transition-colors"
              >
                <div className="relative h-7 w-7 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
                  {a.photoUrl ? (
                    <Image
                      src={a.photoUrl}
                      alt={a.name}
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {a.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0 max-w-[90px] text-left">
                  <p className="text-[11px] font-bold text-white truncate leading-tight">
                    {a.name}
                  </p>
                  <p className="text-[9px] text-zinc-400 truncate">
                    {a.position || a.teamName || "Atleta"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeAthlete(a.id)}
                  className="h-4 w-4 rounded-full bg-black/60 hover:bg-rose-500 text-zinc-400 hover:text-white flex items-center justify-center transition-colors ml-0.5"
                  title={`Remover ${a.name}`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}

            {/* Slots vazios informativos */}
            {Array.from({ length: Math.max(0, 3 - count) }).map((_, idx) => (
              <div
                key={`empty-slot-${idx}`}
                className="hidden sm:flex items-center justify-center h-9 px-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] text-[10px] text-zinc-500 font-mono"
              >
                + Slot
              </div>
            ))}
          </div>
        </div>

        {/* ─── Lado Direito: Ações (Iniciar Batalha & Limpar) ─────────────── */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={clearCompare}
            className="text-[10px] font-mono text-zinc-500 hover:text-rose-400 transition-colors px-2 py-1"
            title="Limpar todos"
          >
            Limpar
          </button>

          <Link
            href={compareUrl}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all",
              isComparePage
                ? "bg-white/10 text-emerald-300 border border-emerald-500/30"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_16px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
            )}
          >
            <Swords className="h-3.5 w-3.5" />
            <span>{isComparePage ? "Atualizar Batalha" : "Iniciar Batalha"}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
