"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type CatalogAthlete } from "@/lib/actions/catalog";
import { POSITION_LABELS, POSITION_COLORS, FOOT_LABELS, formatHeight, formatWeight } from "@/lib/domain";
import { METRICS, formatMetric } from "@/lib/metrics";
import { ExternalLink, Trophy, X, Shield, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AthleteComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: CatalogAthlete[];
  onRemoveAthlete: (id: string) => void;
}

export function AthleteComparisonModal({
  isOpen,
  onClose,
  athletes,
  onRemoveAthlete,
}: AthleteComparisonModalProps) {
  if (athletes.length === 0) return null;

  // Filter metrics that at least one of the compared athletes has data for
  const comparedMetrics = METRICS.filter((m) =>
    athletes.some((a) => a.metrics[m.key] && (a.metrics[m.key].total > 0 || a.metrics[m.key].per90 > 0))
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="h-5 w-5" />
            <DialogTitle className="text-lg font-bold">
              Comparação Lado a Lado ({athletes.length} atletas)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs">
            Benchmarking de atributos físicos e métricas normalizadas por 90 minutos (Per-90).
          </DialogDescription>
        </DialogHeader>

        {/* Athletes Header Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y border-border">
          {athletes.map((athlete) => {
            const initials = athlete.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            return (
              <div
                key={athlete.id}
                className="relative flex flex-col items-center text-center p-3 rounded-xl border border-border bg-muted/20"
              >
                <button
                  type="button"
                  onClick={() => onRemoveAthlete(athlete.id)}
                  className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
                  title="Remover da comparação"
                >
                  <X className="h-3.5 w-3.5" />
                </button>

                <Avatar className="h-14 w-14 mb-2 border border-border">
                  <AvatarImage src={athlete.photoUrl ?? undefined} alt={athlete.name} />
                  <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>

                <h4 className="text-xs font-bold truncate max-w-full">{athlete.name}</h4>
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                  {athlete.team.logoUrl ? (
                    <img src={athlete.team.logoUrl} alt={athlete.team.name} className="h-3 w-3 object-contain" />
                  ) : (
                    <Shield className="h-3 w-3" />
                  )}
                  <span className="truncate">{athlete.team.shortName ?? athlete.team.name}</span>
                </div>

                <Badge
                  variant="outline"
                  className={cn("mt-2 text-[10px] px-2 py-0.5", POSITION_COLORS[athlete.position])}
                >
                  {POSITION_LABELS[athlete.position]}
                </Badge>

                <Link
                  href={`/athletes/${athlete.id}`}
                  target="_blank"
                  className="mt-2 text-[10px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  Ver Perfil
                  <ArrowUpRight className="h-2.5 w-2.5" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Physical & General Attributes Table */}
        <div className="space-y-4 pt-2">
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Atributos Físicos e Gerais
            </h5>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="text-xs font-semibold w-40 bg-muted/30">Idade</TableCell>
                    {athletes.map((a) => (
                      <TableCell key={a.id} className="text-xs text-center">
                        {a.age != null ? `${a.age} anos` : "—"}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold bg-muted/30">Pé Dominante</TableCell>
                    {athletes.map((a) => (
                      <TableCell key={a.id} className="text-xs text-center">
                        {FOOT_LABELS[a.footPreference]}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold bg-muted/30">Altura / Peso</TableCell>
                    {athletes.map((a) => (
                      <TableCell key={a.id} className="text-xs text-center">
                        {formatHeight(a.height)} · {formatWeight(a.weight)}
                      </TableCell>
                    ))}
                  </TableRow>
                  <TableRow>
                    <TableCell className="text-xs font-semibold bg-muted/30">Minutos em Campo</TableCell>
                    {athletes.map((a) => (
                      <TableCell key={a.id} className="text-xs text-center font-mono font-medium">
                        {a.totalMinutes > 0 ? `${a.totalMinutes}' (${a.totalMatches} jogos)` : "0'"}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Canonical Metrics Per-90 Comparison */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Métricas Canônicas (Por 90 Minutos)
            </h5>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="text-xs w-48">Métrica</TableHead>
                    {athletes.map((a) => (
                      <TableHead key={a.id} className="text-xs text-center">
                        {a.name.split(" ")[0]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparedMetrics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={athletes.length + 1} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhuma métrica lançada para os atletas selecionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    comparedMetrics.map((m) => {
                      const isRate = m.unit === "percent" || m.key === "rating";
                      // Find best value
                      const values = athletes.map((a) => a.metrics[m.key]?.per90 ?? 0);
                      const maxValue = Math.max(...values);

                      return (
                        <TableRow key={m.key}>
                          <TableCell className="text-xs font-medium">
                            {m.label}{" "}
                            <span className="text-[10px] text-muted-foreground font-mono">
                              ({isRate ? m.short : `${m.short}/90`})
                            </span>
                          </TableCell>

                          {athletes.map((a) => {
                            const val = a.metrics[m.key]?.per90 ?? 0;
                            const isLeader = maxValue > 0 && val === maxValue && athletes.length > 1;

                            return (
                              <TableCell
                                key={a.id}
                                className={cn(
                                  "text-xs text-center font-mono tabular-nums",
                                  isLeader && "font-bold text-emerald-500 bg-emerald-500/10"
                                )}
                              >
                                {val > 0 ? (
                                  isRate ? (
                                    formatMetric(m.key, val)
                                  ) : (
                                    `${val.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/90`
                                  )
                                ) : (
                                  <span className="text-muted-foreground/40 font-normal">0</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
