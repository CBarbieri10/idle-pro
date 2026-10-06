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

export interface DossierPageSelection {
  cover: boolean;
  xray: boolean;
  analysis: boolean;
  goals: boolean;
}

export const DEFAULT_PAGE_SELECTION: DossierPageSelection = {
  cover: true,
  xray: true,
  analysis: true,
  goals: true,
};

export interface AthleteDossierProps {
  athlete: AthleteDossierData;
  className?: string;
  showCover?: boolean;
  pageSelection?: DossierPageSelection;
}

export function AthleteDossier({
  athlete,
  className,
  showCover = true,
  pageSelection = DEFAULT_PAGE_SELECTION,
}: AthleteDossierProps) {
  // Merge showCover if provided as false
  const effectiveSelection: DossierPageSelection = {
    cover: pageSelection.cover && showCover,
    xray: pageSelection.xray,
    analysis: pageSelection.analysis,
    goals: pageSelection.goals,
  };

  // Build the list of active pages in order with their calculated pageIndex
  type PageKey = "cover" | "xray" | "analysis" | "goals";
  const activePages: Array<{ key: PageKey; index: number }> = [];

  let nextIndex = 1;
  if (effectiveSelection.cover) activePages.push({ key: "cover", index: nextIndex++ });
  if (effectiveSelection.xray) activePages.push({ key: "xray", index: nextIndex++ });
  if (effectiveSelection.analysis) activePages.push({ key: "analysis", index: nextIndex++ });
  if (effectiveSelection.goals) activePages.push({ key: "goals", index: nextIndex++ });

  const totalPages = activePages.length;

  if (totalPages === 0) {
    return (
      <div className="p-12 text-center text-zinc-500 font-mono text-xs bg-zinc-100 rounded-xl border border-dashed border-zinc-300">
        Nenhuma página selecionada para compor o Dossiê. Marque ao menos uma página acima.
      </div>
    );
  }

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
      {activePages.map((page, idx) => {
        const isLastPage = idx === activePages.length - 1;
        const pageBreakClass = isLastPage ? "print-avoid-break" : "print-page-break";
        const pageBreakStyle = isLastPage
          ? undefined
          : { pageBreakAfter: "always" as const, breakAfter: "page" as const };

        switch (page.key) {
          case "cover":
            return (
              <section
                key="cover"
                className={cn("dossier-page-sheet", pageBreakClass)}
                style={pageBreakStyle}
              >
                <ReportCover
                  athlete={athlete}
                  pageIndex={page.index}
                  totalPages={totalPages}
                />
              </section>
            );
          case "xray":
            return (
              <section
                key="xray"
                className={cn("dossier-page-sheet", pageBreakClass)}
                style={pageBreakStyle}
              >
                <AthleteRaioXSheet
                  athlete={athlete}
                  pageIndex={page.index}
                  totalPages={totalPages}
                />
              </section>
            );
          case "analysis":
            return (
              <section
                key="analysis"
                className={cn("dossier-page-sheet", pageBreakClass)}
                style={pageBreakStyle}
              >
                <DossierAnalysisPage
                  athlete={athlete}
                  pageIndex={page.index}
                  totalPages={totalPages}
                />
              </section>
            );
          case "goals":
            return (
              <section
                key="goals"
                className={cn("dossier-page-sheet", pageBreakClass)}
                style={pageBreakStyle}
              >
                <DossierGoalsPage
                  athlete={athlete}
                  pageIndex={page.index}
                  totalPages={totalPages}
                />
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
