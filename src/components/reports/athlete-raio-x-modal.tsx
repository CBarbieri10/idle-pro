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
            className="p-8 bg-background text-foreground space-y-6 print:p-0 print:bg-white print:text-black"
          >
            {/* Document Header */}
            <div className="flex items-center justify-between border-b-2 border-primary pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-xs">
                  TNS
                </div>
                <div>
                  <h1 className="text-sm font-extrabold tracking-tight uppercase">The Net Scouting</h1>
                  <p className="text-[9px] tracking-widest text-muted-foreground uppercase">
                    Divisão de Inteligência Esportiva &bull; Raio-X Técnico
                  </p>
                </div>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <p>Data: {new Date().toLocaleDateString("pt-BR")}</p>
                <p className="font-semibold text-primary uppercase">Confidencial &bull; Uso Interno</p>
              </div>
            </div>

            {/* Hero Profile Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 p-6 text-white border border-zinc-800 shadow-xl print:bg-zinc-100 print:text-black print:border-zinc-300">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                {/* Photo with alpha backdrop */}
                <div className="relative shrink-0">
                  <div className="h-28 w-28 rounded-2xl bg-gradient-to-tr from-primary/30 via-primary/10 to-transparent p-1 border border-primary/40 flex items-center justify-center overflow-hidden">
                    {athlete.photoUrl ? (
                      <img
                        src={athlete.photoUrl}
                        alt={athlete.name}
                        className={cn(
                          "h-full w-full object-cover rounded-xl",
                          athlete.photoHasAlpha && "object-contain"
                        )}
                      />
                    ) : (
                      <div className="h-full w-full rounded-xl bg-zinc-800 flex items-center justify-center font-bold text-xl text-primary">
                        {initials}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bio & Key Attributes */}
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h2 className="text-2xl font-black tracking-tight">{athlete.name}</h2>
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-bold", POSITION_COLORS[athlete.position])}
                    >
                      {POSITION_LABELS[athlete.position]}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs text-zinc-400 print:text-zinc-700">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="font-semibold text-white print:text-black">{athlete.team.name}</span>
                    {athlete.nationality && (
                      <>
                        <span>&bull;</span>
                        <span>{athlete.nationality}</span>
                      </>
                    )}
                  </div>

                  {/* Physical pills */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
                    <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-zinc-300 print:bg-zinc-200 print:text-black">
                      <strong>Idade:</strong> {athlete.birthDate ? formatAge(new Date(athlete.birthDate)) : "—"}
                    </span>
                    <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-zinc-300 print:bg-zinc-200 print:text-black">
                      <strong>Pé:</strong> {FOOT_LABELS[athlete.footPreference]}
                    </span>
                    {athlete.height && (
                      <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-zinc-300 print:bg-zinc-200 print:text-black">
                        <strong>Altura:</strong> {formatHeight(athlete.height)}
                      </span>
                    )}
                    {athlete.weight && (
                      <span className="rounded-md bg-zinc-800/80 px-2.5 py-1 text-zinc-300 print:bg-zinc-200 print:text-black">
                        <strong>Peso:</strong> {formatWeight(athlete.weight)}
                      </span>
                    )}
                    <span className="rounded-md bg-primary/20 px-2.5 py-1 text-primary-foreground print:bg-zinc-300 print:text-black font-semibold">
                      <strong>Amostragem:</strong> {athlete.totalMinutes}&apos; ({athlete.totalMatches} jogos)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar & Multi-Dimensional DNA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Radar Section */}
              <div className="rounded-xl border border-border p-5 bg-card flex flex-col items-center justify-center text-center">
                <div className="w-full flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Impressão Digital Tática (Radar)
                  </h3>
                  <span className="text-[10px] text-muted-foreground font-mono">Escala 0-100% ref</span>
                </div>
                <RadarChart metrics={metrics} size={280} showCategoryTabs={false} />
              </div>

              {/* Categorized Metrics Grid */}
              <div className="space-y-4">
                {/* Ataque */}
                <div className="rounded-xl border border-border p-3.5 bg-card">
                  <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider mb-2">
                    Ataque &bull; Produção Ofensiva
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <MetricMiniTile label="Gols" per90={metrics["goals"]?.per90} total={metrics["goals"]?.total} />
                    <MetricMiniTile label="Assistências" per90={metrics["assists"]?.per90} total={metrics["assists"]?.total} />
                    <MetricMiniTile label="xG" per90={metrics["xg"]?.per90} total={metrics["xg"]?.total} />
                    <MetricMiniTile label="Finalizações" per90={metrics["shots"]?.per90} total={metrics["shots"]?.total} />
                    <MetricMiniTile label="No Alvo" per90={metrics["shots_on_target"]?.per90} total={metrics["shots_on_target"]?.total} />
                    <MetricMiniTile label="Dribles" per90={metrics["dribbles_completed"]?.per90} total={metrics["dribbles_completed"]?.total} />
                  </div>
                </div>

                {/* Construção & Passe */}
                <div className="rounded-xl border border-border p-3.5 bg-card">
                  <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-2">
                    Construção &bull; Passe e Posse
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    <MetricMiniTile label="Passes Certos" per90={metrics["passes"]?.per90} total={metrics["passes"]?.total} />
                    <MetricMiniTile label="Precisão %" per90={metrics["pass_accuracy"]?.per90} isPercent />
                    <MetricMiniTile label="Passes Decisivos" per90={metrics["key_passes"]?.per90} total={metrics["key_passes"]?.total} />
                    <MetricMiniTile label="Progressivos" per90={metrics["progressive_passes"]?.per90} total={metrics["progressive_passes"]?.total} />
                    <MetricMiniTile label="Bolas Longas" per90={metrics["long_balls_accurate"]?.per90} total={metrics["long_balls_accurate"]?.total} />
                    <MetricMiniTile label="Cruzamentos" per90={metrics["crosses_accurate"]?.per90} total={metrics["crosses_accurate"]?.total} />
                  </div>
                </div>

                {/* Defesa */}
                <div className="rounded-xl border border-border p-3.5 bg-card">
                  <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                    Defesa &bull; Combate e Desarmes
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
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
            <div className="pt-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
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
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-center border border-border/40">
      <p className="text-[10px] text-muted-foreground truncate" title={label}>
        {label}
      </p>
      <p className="text-xs font-extrabold font-mono tabular-nums text-foreground mt-0.5">
        {isPercent
          ? `${per90 ?? 0}%`
          : per90 != null
          ? `${per90.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/90`
          : "—"}
      </p>
      {total != null && !isPercent && (
        <p className="text-[9px] text-muted-foreground font-mono">tot: {total}</p>
      )}
    </div>
  );
}
