"use client";

import React from "react";
import { ReportCover } from "@/components/reports/report-cover";
import { AthleteRaioXSheet, type RaioXAthleteSheetData } from "@/components/reports/athlete-raio-x-sheet";
import { cn } from "@/lib/utils";

export type AthleteDossierData = RaioXAthleteSheetData;

interface AthleteDossierProps {
  athlete: AthleteDossierData;
  className?: string;
  showCover?: boolean;
}

export function AthleteDossier({
  athlete,
  className,
  showCover = true,
}: AthleteDossierProps) {
  return (
    <div
      id="executive-dossier-container"
      className={cn("w-full mx-auto select-text space-y-8 print:space-y-0", className)}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ─── PÁGINA 1: Capa Institucional de Alto Impacto (Full Bleed A4) ─── */}
      {showCover && (
        <section
          className="dossier-page-sheet print-page-break"
          style={{
            pageBreakAfter: "always",
            breakAfter: "page",
          }}
        >
          <ReportCover athlete={athlete} />
        </section>
      )}

      {/* ─── PÁGINA 2: Dossiê Raio-X & Análise Tática ────────────────────────── */}
      <section className="dossier-page-sheet print-avoid-break">
        <AthleteRaioXSheet athlete={athlete} />
      </section>
    </div>
  );
}
