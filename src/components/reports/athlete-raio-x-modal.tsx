"use client";

import { useState } from "react";
import {
  FileText,
  Printer,
  Download,
  Shield,
  Trophy,
  Sparkles,
  Clock,
  Calendar,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { RadarChart } from "@/components/charts/radar-chart";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  FOOT_LABELS,
  formatHeight,
  formatWeight,
  formatAge,
} from "@/lib/domain";
import { METRIC_BY_KEY, formatMetric } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { Position, FootPreference } from "@prisma/client";

export interface RaioXAthleteData {
  id: string;
  name: string;
  position: Position;
  birthDate: Date | string | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  footPreference: FootPreference;
  photoUrl: string | null;
  photoHasAlpha: boolean;
  actionPhotoUrl?: string | null;
  team: {
    id: string;
    name: string;
    shortName: string | null;
  };
  totalMinutes: number;
  totalMatches: number;
  canonicalMetrics: Record<string, { total: number; per90: number; label: string }>;
  recentMatches?: Array<{
    date: Date | string;
    opponentName: string;
    goalsFor: number | null;
    goalsAgainst: number | null;
    minutesPlayed: number | null;
  }>;
}

interface AthleteRaioXModalProps {
  athlete: RaioXAthleteData;
  triggerButton?: React.ReactNode;
}

export function AthleteRaioXModal({ athlete, triggerButton }: AthleteRaioXModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const metrics = athlete.canonicalMetrics;

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)}>{triggerButton}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 text-xs font-semibold"
        >
          <FileText className="h-3.5 w-3.5 text-primary" />
          Gerar Relatório Raio-X (PDF)
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 print:border-none print:shadow-none print:max-w-none print:h-auto print:overflow-visible">
          {/* Top modal action bar (hidden during print) */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-muted/40 print:hidden">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <DialogTitle className="text-sm font-bold">Relatório Executivo — Raio-X do Atleta</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handlePrint} className="h-8 gap-1.5 text-xs font-bold">
                <Printer className="h-3.5 w-3.5" />
                Imprimir / Salvar em PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Printable Sheet (Standard A4 layout for print) */}
          <div
            id="raio-x-report-sheet"
            className="p-6 bg-background text-foreground space-y-4 print:p-0 print:bg-white print:text-black print:space-y-3"
            style={{
              WebkitPrintColorAdjust: "exact",
              printColorAdjust: "exact",
            }}
          >
            <style>{`
              @media print {
                @page {
                  size: A4 portrait;
                  margin: 8mm 10mm 8mm 10mm;
                }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                .print-avoid-break {
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
                }
              }
            `}</style>

            {/* Document Header */}
            <div className="flex items-center justify-between border-b-2 border-primary pb-2.5 print-avoid-break">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs print:bg-indigo-600 print:text-white">
                  TNS
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight uppercase leading-none print:text-black">
                    The Net Scouting
                  </h1>
                  <p className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase mt-0.5 print:text-zinc-600">
                    Divisão de Inteligência Esportiva &bull; Dossiê Raio-X
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground print:text-zinc-600">
                <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
                <p className="font-bold text-primary print:text-indigo-600 uppercase text-[9px]">
                  Confidencial &bull; Scouting Pro
                </p>
              </div>
            </div>

            {/* Hero Profile Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-4 text-white border border-zinc-800 shadow-md print:bg-zinc-100 print:text-black print:border-zinc-300 print-avoid-break">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 print:flex-row print:gap-4">
                {/* Photo with alpha backdrop */}
                <div className="relative shrink-0">
                  <div className="h-24 w-24 rounded-xl bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent p-1 border border-primary/40 flex items-center justify-center overflow-hidden print:border-zinc-300 print:bg-white">
                    {athlete.photoUrl ? (
                      <img
                        src={athlete.photoUrl}
                        alt={athlete.name}
                        className={cn(
                          "h-full w-full object-cover rounded-lg",
                          athlete.photoHasAlpha && "object-contain"
                        )}
                      />
                    ) : (
                      <div className="h-full w-full rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xl text-primary">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio & Key Attributes */}
                <div className="flex-1 text-center md:text-left print:text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-center md:justify-start print:justify-start gap-2">
                    <h2 className="text-xl font-black tracking-tight print:text-black">
                      {athlete.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold px-2 py-0.5", POSITION_COLORS[athlete.position])}
                    >
                      {POSITION_LABELS[athlete.position]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center md:justify-start print:justify-start gap-1.5 text-xs text-zinc-400 print:text-zinc-700">
                    <Shield className="h-3.5 w-3.5 text-primary print:text-indigo-600" />
                    <span className="font-semibold text-white print:text-black">{athlete.team.name}</span>
                    {athlete.nationality && (
                      <>
                        <span>&bull;</span>
                        <span>{athlete.nationality}</span>
                      </>
                    )}
                  </div>

                  {/* Physical pills */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start print:justify-start gap-1.5 pt-1 text-[11px]">
                    <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 print:bg-zinc-200 print:text-black">
                      <strong>Idade:</strong> {athlete.birthDate ? formatAge(new Date(athlete.birthDate)) : "—"}
                    </span>
                    <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 print:bg-zinc-200 print:text-black">
                      <strong>Pé:</strong> {FOOT_LABELS[athlete.footPreference]}
                    </span>
                    {athlete.height && (
                      <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 print:bg-zinc-200 print:text-black">
                        <strong>Altura:</strong> {formatHeight(athlete.height)}
                      </span>
                    )}
                    {athlete.weight && (
                      <span className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-zinc-300 print:bg-zinc-200 print:text-black">
                        <strong>Peso:</strong> {formatWeight(athlete.weight)}
                      </span>
                    )}
                    <span className="rounded-md bg-primary/20 px-2 py-0.5 text-primary-foreground print:bg-zinc-300 print:text-black font-semibold">
                      <strong>Amostragem:</strong> {athlete.totalMinutes}&apos; ({athlete.totalMatches} jogos)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar & Multi-Dimensional DNA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start print:grid-cols-2 print:gap-3">
              {/* Radar Section */}
              <div className="rounded-xl border border-border print:border-zinc-300 p-3.5 bg-card print:bg-white flex flex-col items-center justify-center text-center print-avoid-break">
                <div className="w-full flex items-center justify-between mb-1 pb-1 border-b border-border/40">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground print:text-zinc-700 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-primary print:text-indigo-600" />
                    Impressão Digital Tática (Radar)
                  </h3>
                  <span className="text-[9px] text-muted-foreground print:text-zinc-500 font-mono">0-100% ref</span>
                </div>
                <RadarChart metrics={metrics} size={270} showCategoryTabs={false} />
              </div>

              {/* Categorized Metrics Grid */}
              <div className="space-y-2.5 print:space-y-2">
                {/* Ataque */}
                <div className="rounded-xl border border-border print:border-zinc-300 p-2.5 print:p-2 bg-card print:bg-zinc-50 print-avoid-break">
                  <h4 className="text-[11px] font-black text-rose-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Ataque &bull; Produção Ofensiva</span>
                    <span className="text-[9px] font-mono text-muted-foreground print:text-zinc-500 font-normal">Per-90</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 print:gap-1">
                    <MetricMiniTile label="Gols" per90={metrics["goals"]?.per90} total={metrics["goals"]?.total} />
                    <MetricMiniTile label="Assistências" per90={metrics["assists"]?.per90} total={metrics["assists"]?.total} />
                    <MetricMiniTile label="xG" per90={metrics["xg"]?.per90} total={metrics["xg"]?.total} />
                    <MetricMiniTile label="Finalizações" per90={metrics["shots"]?.per90} total={metrics["shots"]?.total} />
                    <MetricMiniTile label="No Alvo" per90={metrics["shots_on_target"]?.per90} total={metrics["shots_on_target"]?.total} />
                    <MetricMiniTile label="Dribles Certos" per90={metrics["dribbles_completed"]?.per90} total={metrics["dribbles_completed"]?.total} />
                  </div>
                </div>

                {/* Construção & Passe */}
                <div className="rounded-xl border border-border print:border-zinc-300 p-2.5 print:p-2 bg-card print:bg-zinc-50 print-avoid-break">
                  <h4 className="text-[11px] font-black text-blue-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Construção &bull; Passe e Posse</span>
                    <span className="text-[9px] font-mono text-muted-foreground print:text-zinc-500 font-normal">Per-90</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 print:gap-1">
                    <MetricMiniTile label="Passes Certos" per90={metrics["passes"]?.per90} total={metrics["passes"]?.total} />
                    <MetricMiniTile label="Precisão %" per90={metrics["pass_accuracy"]?.per90} isPercent />
                    <MetricMiniTile label="Passes Decisivos" per90={metrics["key_passes"]?.per90} total={metrics["key_passes"]?.total} />
                    <MetricMiniTile label="Progressivos" per90={metrics["progressive_passes"]?.per90} total={metrics["progressive_passes"]?.total} />
                    <MetricMiniTile label="Bolas Longas" per90={metrics["long_balls_accurate"]?.per90} total={metrics["long_balls_accurate"]?.total} />
                    <MetricMiniTile label="Cruzamentos" per90={metrics["crosses_accurate"]?.per90} total={metrics["crosses_accurate"]?.total} />
                  </div>
                </div>

                {/* Defesa */}
                <div className="rounded-xl border border-border print:border-zinc-300 p-2.5 print:p-2 bg-card print:bg-zinc-50 print-avoid-break">
                  <h4 className="text-[11px] font-black text-emerald-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Defesa &bull; Combate e Desarmes</span>
                    <span className="text-[9px] font-mono text-muted-foreground print:text-zinc-500 font-normal">Per-90</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 print:gap-1">
                    <MetricMiniTile label="Desarmes" per90={metrics["tackles"]?.per90} total={metrics["tackles"]?.total} />
                    <MetricMiniTile label="Interceptações" per90={metrics["interceptions"]?.per90} total={metrics["interceptions"]?.total} />
                    <MetricMiniTile label="Cortes" per90={metrics["clearances"]?.per90} total={metrics["clearances"]?.total} />
                    <MetricMiniTile label="Duelos Aéreos" per90={metrics["aerial_duels_won"]?.per90} total={metrics["aerial_duels_won"]?.total} />
                    <MetricMiniTile label="Duelos Chão" per90={metrics["ground_duels_won"]?.per90} total={metrics["ground_duels_won"]?.total} />
                    <MetricMiniTile label="Recuperações" per90={metrics["recoveries"]?.per90} total={metrics["recoveries"]?.total} />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground print-avoid-break">
              <p>Relatório gerado automaticamente pela plataforma The Net Scouting</p>
              <p className="font-mono">Página 1 de 1</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricMiniTile({
  label,
  per90,
  total,
  isPercent,
}: {
  label: string;
  per90?: number;
  total?: number;
  isPercent?: boolean;
}) {
  const formattedValue = isPercent
    ? `${per90 ?? 0}%`
    : per90 != null
    ? per90.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : "—";

  return (
    <div className="rounded-lg bg-muted/40 print:bg-white p-1.5 text-center border border-border/50 print:border-zinc-200 print-avoid-break">
      <p className="text-[10px] print:text-[9px] font-medium text-muted-foreground print:text-zinc-600 truncate" title={label}>
        {label}
      </p>
      <p className="text-xs print:text-[11px] font-black font-mono tabular-nums text-foreground print:text-zinc-950 mt-0.5 leading-none">
        {formattedValue}
        {!isPercent && per90 != null && (
          <span className="text-[9px] font-bold text-muted-foreground print:text-zinc-500 ml-0.5">/90</span>
        )}
      </p>
      {total != null && !isPercent && (
        <p className="text-[9px] print:text-[8px] text-muted-foreground/70 print:text-zinc-400 font-mono mt-0.5">
          tot: {total}
        </p>
      )}
    </div>
  );
}
