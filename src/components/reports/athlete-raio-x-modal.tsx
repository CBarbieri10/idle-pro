"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Printer,
  Shield,
  Sparkles,
  X,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

// Elite threshold reference for tactical highlighting
function isEliteMetric(key: string, value?: number): boolean {
  if (value == null) return false;
  switch (key) {
    case "goals":
      return value >= 0.35;
    case "assists":
      return value >= 0.25;
    case "xg":
      return value >= 0.3;
    case "shots":
      return value >= 2.5;
    case "shots_on_target":
      return value >= 1.2;
    case "dribbles_completed":
      return value >= 2.2;
    case "passes":
      return value >= 35;
    case "pass_accuracy":
      return value >= 82;
    case "key_passes":
      return value >= 1.5;
    case "progressive_passes":
      return value >= 4.0;
    case "long_balls_accurate":
      return value >= 2.5;
    case "crosses_accurate":
      return value >= 1.0;
    case "tackles":
      return value >= 2.0;
    case "interceptions":
      return value >= 1.4;
    case "clearances":
      return value >= 2.5;
    case "aerial_duels_won":
      return value >= 2.0;
    case "ground_duels_won":
      return value >= 3.0;
    case "recoveries":
      return value >= 4.5;
    default:
      return false;
  }
}

export function AthleteRaioXModal({ athlete, triggerButton }: AthleteRaioXModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-raio-x-open");
    } else {
      document.body.classList.remove("modal-raio-x-open");
    }
    return () => {
      document.body.classList.remove("modal-raio-x-open");
    };
  }, [isOpen]);

  const handlePrint = () => {
    document.body.classList.add("modal-raio-x-open");
    window.print();
  };

  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const metrics = athlete.canonicalMetrics;
  const docRef = `TNS-RX-${athlete.id.slice(0, 6).toUpperCase()}`;

  return (
    <>
      {triggerButton ? (
        <span onClick={() => setIsOpen(true)}>{triggerButton}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="gap-1.5 text-xs font-semibold bg-surface-elevated hover:bg-surface-highlight border-border-strong text-foreground"
        >
          <FileText className="h-3.5 w-3.5 text-indigo-400" />
          Gerar Relatório Raio-X (PDF)
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 border-border-strong bg-bg-surface text-foreground print:border-none print:shadow-none print:max-w-none print:h-auto print:overflow-visible print:bg-white print:text-black">
          {/* Top modal action bar (hidden during print) */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/80 bg-bg-surface-elevated print:hidden">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-indigo-600 flex items-center justify-center text-[10px] font-black text-white">
                TNS
              </div>
              <DialogTitle className="text-sm font-bold tracking-tight">
                Dossiê Executivo &bull; Raio-X do Atleta ({docRef})
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" />
                Imprimir / Salvar em PDF
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Printable Sheet (Standard A4 layout for print) */}
          <div
            id="raio-x-report-sheet"
            className="p-6 bg-bg-surface text-foreground space-y-3.5 print:p-0 print:bg-white print:text-black print:space-y-2.5 print-avoid-break"
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
                #app-shell,
                [data-slot="dialog-overlay"],
                [data-slot="dialog-close"] {
                  display: none !important;
                }
                .print-avoid-break {
                  break-inside: avoid !important;
                  page-break-inside: avoid !important;
                }
              }
            `}</style>

            {/* Document Header */}
            <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-2 print-avoid-break">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-xs print:bg-indigo-600 print:text-white">
                  TNS
                </div>
                <div>
                  <h1 className="text-sm font-black tracking-tight uppercase leading-none text-foreground print:text-black">
                    The Net Scouting
                  </h1>
                  <p className="text-[9px] font-bold tracking-wider text-muted-foreground uppercase mt-0.5 print:text-zinc-600">
                    Divisão de Inteligência Esportiva &bull; Dossiê Executivo Raio-X
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground print:text-zinc-600">
                <p className="font-mono text-[9px]">Ref: {docRef}</p>
                <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
                <p className="font-bold text-indigo-400 print:text-indigo-600 uppercase text-[9px]">
                  Confidencial &bull; Pro Scouting
                </p>
              </div>
            </div>

            {/* Hero Profile Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-bg-surface-elevated via-bg-surface-elevated to-bg-base p-3.5 text-white border border-border-strong shadow-md print:bg-zinc-100 print:text-black print:border-zinc-300 print-avoid-break">
              <div className="relative z-10 flex flex-row items-center gap-4">
                {/* Photo with alpha backdrop */}
                <div className="relative shrink-0">
                  <div className="h-20 w-20 rounded-xl bg-gradient-to-tr from-indigo-500/20 via-indigo-500/10 to-transparent p-1 border border-indigo-500/30 flex items-center justify-center overflow-hidden print:border-zinc-300 print:bg-white">
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
                      <div className="h-full w-full rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xl text-indigo-400 print:text-indigo-600">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio & Key Attributes */}
                <div className="flex-1 text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-start gap-2">
                    <h2 className="text-lg font-black tracking-tight text-foreground print:text-black">
                      {athlete.name}
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold px-2 py-0.5", POSITION_COLORS[athlete.position])}
                    >
                      {POSITION_LABELS[athlete.position]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-start gap-1.5 text-xs text-zinc-400 print:text-zinc-700">
                    <Shield className="h-3.5 w-3.5 text-indigo-400 print:text-indigo-600" />
                    <span className="font-semibold text-foreground print:text-black">{athlete.team.name}</span>
                    {athlete.nationality && (
                      <>
                        <span>&bull;</span>
                        <span>{athlete.nationality}</span>
                      </>
                    )}
                  </div>

                  {/* Physical pills */}
                  <div className="flex flex-wrap items-center justify-start gap-1.5 pt-0.5 text-[11px]">
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
                    <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-indigo-300 print:bg-zinc-300 print:text-black font-semibold">
                      <strong>Amostragem:</strong> {athlete.totalMinutes}&apos; ({athlete.totalMatches} jogos)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Side-by-Side: Radar (Left) + 3 Tactical Groups (Right) */}
            <div className="flex flex-col md:flex-row print:flex-row gap-3.5 print:gap-3 items-stretch print-avoid-break">
              {/* Radar Section (Left Column) */}
              <div className="w-full md:w-[46%] print:w-[45%] shrink-0 rounded-xl border border-border-strong print:border-zinc-300 p-3 bg-bg-surface-elevated print:bg-white flex flex-col items-center justify-between text-center print-avoid-break">
                <div className="w-full flex items-center justify-between pb-1 mb-1 border-b border-border/40">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground print:text-zinc-700 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-indigo-400 print:text-indigo-600" />
                    Impressão Digital Tática (Radar)
                  </h3>
                  <span className="text-[9px] text-muted-foreground print:text-zinc-500 font-mono">0-100% ref</span>
                </div>

                <div className="my-auto py-1">
                  <RadarChart metrics={metrics} size={250} showCategoryTabs={false} />
                </div>

                <div className="w-full pt-1.5 border-t border-border/30 text-[9px] text-muted-foreground print:text-zinc-500 flex items-center justify-between font-mono">
                  <span>Métricas normalizadas /90</span>
                  <span className="text-emerald-400 print:text-emerald-700 font-bold flex items-center gap-0.5">
                    <TrendingUp className="h-2.5 w-2.5" /> Destaques &ge; 75%
                  </span>
                </div>
              </div>

              {/* Categorized Metrics Grid (Right Column) */}
              <div className="w-full md:w-[54%] print:w-[55%] flex flex-col justify-between space-y-2 print:space-y-2">
                {/* Ataque */}
                <div className="rounded-xl border border-border-strong print:border-zinc-300 p-2.5 print:p-2 bg-bg-surface-elevated print:bg-zinc-50 print-avoid-break">
                  <h4 className="text-[11px] font-black text-rose-400 print:text-rose-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Ataque &bull; Produção Ofensiva</span>
                    <span className="text-[9px] font-mono text-muted-foreground print:text-zinc-500 font-normal">Per-90</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 print:gap-1">
                    <MetricMiniTile metricKey="goals" label="Gols" per90={metrics["goals"]?.per90} total={metrics["goals"]?.total} />
                    <MetricMiniTile metricKey="assists" label="Assistências" per90={metrics["assists"]?.per90} total={metrics["assists"]?.total} />
                    <MetricMiniTile metricKey="xg" label="xG" per90={metrics["xg"]?.per90} total={metrics["xg"]?.total} />
                    <MetricMiniTile metricKey="shots" label="Finalizações" per90={metrics["shots"]?.per90} total={metrics["shots"]?.total} />
                    <MetricMiniTile metricKey="shots_on_target" label="No Alvo" per90={metrics["shots_on_target"]?.per90} total={metrics["shots_on_target"]?.total} />
                    <MetricMiniTile metricKey="dribbles_completed" label="Dribles Certos" per90={metrics["dribbles_completed"]?.per90} total={metrics["dribbles_completed"]?.total} />
                  </div>
                </div>

                {/* Construção & Passe */}
                <div className="rounded-xl border border-border-strong print:border-zinc-300 p-2.5 print:p-2 bg-bg-surface-elevated print:bg-zinc-50 print-avoid-break">
                  <h4 className="text-[11px] font-black text-blue-400 print:text-blue-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Construção &bull; Passe e Posse</span>
                    <span className="text-[9px] font-mono text-muted-foreground print:text-zinc-500 font-normal">Per-90</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 print:gap-1">
                    <MetricMiniTile metricKey="passes" label="Passes Certos" per90={metrics["passes"]?.per90} total={metrics["passes"]?.total} />
                    <MetricMiniTile metricKey="pass_accuracy" label="Precisão %" per90={metrics["pass_accuracy"]?.per90} isPercent />
                    <MetricMiniTile metricKey="key_passes" label="Passes Decisivos" per90={metrics["key_passes"]?.per90} total={metrics["key_passes"]?.total} />
                    <MetricMiniTile metricKey="progressive_passes" label="Progressivos" per90={metrics["progressive_passes"]?.per90} total={metrics["progressive_passes"]?.total} />
                    <MetricMiniTile metricKey="long_balls_accurate" label="Bolas Longas" per90={metrics["long_balls_accurate"]?.per90} total={metrics["long_balls_accurate"]?.total} />
                    <MetricMiniTile metricKey="crosses_accurate" label="Cruzamentos" per90={metrics["crosses_accurate"]?.per90} total={metrics["crosses_accurate"]?.total} />
                  </div>
                </div>

                {/* Defesa */}
                <div className="rounded-xl border border-border-strong print:border-zinc-300 p-2.5 print:p-2 bg-bg-surface-elevated print:bg-zinc-50 print-avoid-break">
                  <h4 className="text-[11px] font-black text-emerald-400 print:text-emerald-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Defesa &bull; Combate e Desarmes</span>
                    <span className="text-[9px] font-mono text-muted-foreground print:text-zinc-500 font-normal">Per-90</span>
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5 print:gap-1">
                    <MetricMiniTile metricKey="tackles" label="Desarmes" per90={metrics["tackles"]?.per90} total={metrics["tackles"]?.total} />
                    <MetricMiniTile metricKey="interceptions" label="Interceptações" per90={metrics["interceptions"]?.per90} total={metrics["interceptions"]?.total} />
                    <MetricMiniTile metricKey="clearances" label="Cortes" per90={metrics["clearances"]?.per90} total={metrics["clearances"]?.total} />
                    <MetricMiniTile metricKey="aerial_duels_won" label="Duelos Aéreos" per90={metrics["aerial_duels_won"]?.per90} total={metrics["aerial_duels_won"]?.total} />
                    <MetricMiniTile metricKey="ground_duels_won" label="Duelos Chão" per90={metrics["ground_duels_won"]?.per90} total={metrics["ground_duels_won"]?.total} />
                    <MetricMiniTile metricKey="recoveries" label="Recuperações" per90={metrics["recoveries"]?.per90} total={metrics["recoveries"]?.total} />
                  </div>
                </div>
              </div>
            </div>

            {/* Document Footer */}
            <div className="pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground print:text-zinc-600 print-avoid-break">
              <p>Relatório oficial gerado pela Divisão de Inteligência The Net Scouting &bull; Uso exclusivo confidencial</p>
              <p className="font-mono font-bold text-foreground print:text-black">Página 1 de 1</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MetricMiniTile({
  metricKey,
  label,
  per90,
  total,
  isPercent,
}: {
  metricKey: string;
  label: string;
  per90?: number;
  total?: number;
  isPercent?: boolean;
}) {
  const isElite = isEliteMetric(metricKey, per90);

  const formattedValue = isPercent
    ? `${per90 ?? 0}%`
    : per90 != null
    ? per90.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })
    : "—";

  return (
    <div
      className={cn(
        "rounded-lg p-1.5 text-center border transition-colors print-avoid-break",
        isElite
          ? "bg-emerald-950/20 border-emerald-500/40 print:bg-emerald-50/60 print:border-emerald-300"
          : "bg-bg-surface border-border-subtle print:bg-white print:border-zinc-200"
      )}
    >
      <p className="text-[10px] print:text-[9px] font-medium text-muted-foreground print:text-zinc-600 truncate" title={label}>
        {label}
      </p>
      <p
        className={cn(
          "text-xs print:text-[11px] font-black font-mono tabular-nums mt-0.5 leading-none",
          isElite
            ? "text-emerald-400 print:text-emerald-700"
            : "text-foreground print:text-zinc-950"
        )}
      >
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
