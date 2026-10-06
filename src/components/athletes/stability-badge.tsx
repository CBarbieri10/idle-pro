"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StabilityCategory } from "@/lib/math-engine";

export interface StabilityBadgeProps {
  idgScore?: number | null;
  category?: StabilityCategory | null;
  showScore?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  variant?: "default" | "print";
  className?: string;
}

export function StabilityBadge({
  idgScore,
  category,
  showScore = true,
  size = "md",
  variant = "default",
  className,
}: StabilityBadgeProps) {
  // Se nem idgScore nem category foram informados, não renderiza nada
  if (idgScore === undefined && category === undefined) {
    return null;
  }
  if (idgScore === null && category === null) {
    return null;
  }

  // Dedução da categoria com base no valor de IDG se categoria não vier explícita
  let resolvedCategory: StabilityCategory = "HIGH";
  if (category) {
    resolvedCategory = category;
  } else if (typeof idgScore === "number") {
    if (idgScore > 30) {
      resolvedCategory = "LOW";
    } else if (idgScore >= 15) {
      resolvedCategory = "MODERATE";
    } else {
      resolvedCategory = "HIGH";
    }
  }

  // Configurações visuais por categoria
  const configs = {
    HIGH: {
      label: "Estável (Elite)",
      shortLabel: "Estável",
      tooltip: "IDG < 15%: Regularidade de elite. Baixíssima dispersão métrica.",
      dotClass: "bg-emerald-400 animate-pulse",
      printDotClass: "bg-emerald-600",
      icon: ShieldCheck,
      // Dark mode / App screen
      darkClasses:
        "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      // Light mode / PDF Print
      printClasses:
        "bg-emerald-50 text-emerald-950 border-emerald-300 print:bg-emerald-100 print:text-emerald-950 print:border-emerald-400",
    },
    MODERATE: {
      label: "Moderado",
      shortLabel: "Moderado",
      tooltip: "IDG entre 15% e 30%: Regularidade aceitável com oscilação pontual.",
      dotClass: "bg-amber-400",
      printDotClass: "bg-amber-600",
      icon: AlertCircle,
      // Dark mode / App screen
      darkClasses:
        "bg-amber-950/40 text-amber-300 border-amber-500/30 hover:bg-amber-900/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      // Light mode / PDF Print
      printClasses:
        "bg-amber-50 text-amber-950 border-amber-300 print:bg-amber-100 print:text-amber-950 print:border-amber-400",
    },
    LOW: {
      label: "Alerta de Risco",
      shortLabel: "Instável",
      tooltip: "IDG > 30%: Instabilidade crítica. Alta dispersão de rendimento.",
      dotClass: "bg-rose-400 animate-pulse",
      printDotClass: "bg-rose-600",
      icon: AlertTriangle,
      // Dark mode / App screen
      darkClasses:
        "bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/40 shadow-[0_0_12px_rgba(244,63,94,0.15)]",
      // Light mode / PDF Print
      printClasses:
        "bg-rose-50 text-rose-950 border-rose-300 print:bg-rose-100 print:text-rose-950 print:border-rose-400",
    },
  };

  const cfg = configs[resolvedCategory];
  const IconComponent = cfg.icon;

  const sizeClasses = {
    xs: "text-[10px] px-1.5 py-0.5 gap-1",
    sm: "text-[11px] px-2 py-0.5 gap-1.5",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3.5 py-1.5 gap-2",
  }[size];

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-3.5 w-3.5",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  }[size];

  const dotSizes = {
    xs: "h-1.5 w-1.5",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  }[size];

  const isPrint = variant === "print";

  return (
    <div
      title={cfg.tooltip}
      className={cn(
        "inline-flex items-center font-bold rounded-full border transition-all select-none backdrop-blur-xs",
        sizeClasses,
        isPrint ? cfg.printClasses : cn(cfg.darkClasses, "print:" + cfg.printClasses),
        className
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          dotSizes,
          isPrint ? cfg.printDotClass : cfg.dotClass
        )}
      />

      <IconComponent className={cn(iconSizes, "shrink-0 opacity-85")} />

      <span className="font-semibold tracking-tight uppercase text-[9px] sm:text-[10px]">
        {size === "xs" ? cfg.shortLabel : cfg.label}
      </span>

      {showScore && typeof idgScore === "number" && (
        <span
          className={cn(
            "font-mono font-bold ml-0.5 px-1 rounded-sm text-[9px] sm:text-[10px]",
            isPrint
              ? "bg-black/5 text-zinc-900 print:bg-black/10"
              : "bg-white/10 text-white print:bg-black/10 print:text-black"
          )}
        >
          {idgScore.toFixed(1)}% IDG
        </span>
      )}
    </div>
  );
}
