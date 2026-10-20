"use client";

import React from "react";
import { Scale, Check } from "lucide-react";
import { useCompareStore, type CompareAthleteItem } from "@/lib/stores/compare-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CompareButtonProps {
  athlete: CompareAthleteItem;
  variant?: "icon" | "button" | "table";
  className?: string;
}

export function CompareButton({
  athlete,
  variant = "icon",
  className,
}: CompareButtonProps) {
  const { toggleAthlete, isSelected } = useCompareStore();
  const selected = isSelected(athlete.id);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggleAthlete(athlete);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border",
          selected
            ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)] hover:bg-emerald-500/30"
            : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10",
          className
        )}
        title={
          selected
            ? `Remover ${athlete.name} da comparação`
            : `Comparar ${athlete.name} (Head-to-Head)`
        }
      >
        <Scale className={cn("h-4 w-4", selected && "stroke-[2.5]")} />
      </button>
    );
  }

  if (variant === "table") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          "h-8 px-2 rounded-lg border flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer",
          selected
            ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
            : "bg-black/40 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10",
          className
        )}
        title={
          selected
            ? `Remover ${athlete.name} do dock`
            : `Adicionar ${athlete.name} à batalha`
        }
      >
        <Scale className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{selected ? "No Dock" : "Comparar"}</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={cn(
        "rounded-xl border font-bold text-xs gap-1.5 transition-all shadow-sm",
        selected
          ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
          : "bg-white/5 border-white/10 text-zinc-200 hover:text-white hover:bg-white/10",
        className
      )}
    >
      <Scale className="h-3.5 w-3.5" />
      <span>{selected ? "Na Batalha" : "Comparar Atleta"}</span>
    </Button>
  );
}
