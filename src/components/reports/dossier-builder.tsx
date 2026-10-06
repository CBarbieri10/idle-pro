"use client";

import React from "react";
import { ReportCover } from "@/components/reports/report-cover";
import {
  AthleteRaioXSheet,
  type RaioXAthleteSheetData,
} from "@/components/reports/athlete-raio-x-sheet";
import {
  DossierAnalysisPage,
  type DossierAnalysisPageProps,
} from "@/components/reports/dossier-analysis-page";
import {
  DossierGoalsPage,
  type DossierGoalItem,
} from "@/components/reports/dossier-goals-page";
import { cn } from "@/lib/utils";

export type AthleteDossierData = RaioXAthleteSheetData & {
  goals?: DossierGoalItem[];
  videoLinks?: Array<{
    id?: string;
    title?: string | null;
    url: string;
    category?: string;
    notes?: string | null;
    matchDate?: string | Date | null;
  }>;
  analysisNotes?: {
    tacticalTitle?: string;
    tacticalSummary?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
};

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
      className={cn(
        "w-full mx-auto select-text space-y-8 print:space-y-0",
        className
      )}
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

      {/* ─── PÁGINA 2: Dossiê Raio-X & Análise Tática Per-90 ─────────────────── */}
      <section
        className="dossier-page-sheet print-page-break"
        style={{
          pageBreakAfter: "always",
          breakAfter: "page",
        }}
      >
        <AthleteRaioXSheet athlete={athlete} />
      </section>

      {/* ─── PÁGINA 3: Análise Qualitativa & Espacial (Estilo Prodigy) ───────── */}
      <section
        className="dossier-page-sheet print-page-break"
        style={{
          pageBreakAfter: "always",
          breakAfter: "page",
        }}
      >
        <DossierAnalysisPage athlete={athlete} />
      </section>

      {/* ─── PÁGINA 4: Metas de Desenvolvimento & PDI (Issue #15) ───────────── */}
      <section className="dossier-page-sheet print-avoid-break">
        <DossierGoalsPage athlete={athlete} />
      </section>
    </div>
  );
}
