"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Filter,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Users,
  Eye,
  LayoutGrid,
  List,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type CatalogAthlete, type CatalogFilters } from "@/lib/actions/catalog";
import { AthleteComparisonModal } from "@/components/catalog/athlete-comparison-modal";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  FOOT_LABELS,
  formatHeight,
  formatWeight,
} from "@/lib/domain";
import { METRICS, formatMetric, metricLabel } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { Position, FootPreference } from "@prisma/client";
import { PortfolioToggleButton } from "@/components/portfolio/portfolio-toggle-button";

interface TeamOption {
  id: string;
  name: string;
}

interface LeagueCatalogProps {
  initialAthletes: CatalogAthlete[];
  teams: TeamOption[];
  initialPortfolioIds?: string[];
}

export function LeagueCatalog({
  initialAthletes,
  teams,
  initialPortfolioIds = [],
}: LeagueCatalogProps) {
  // Filters state
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("ALL");
  const [teamFilter, setTeamFilter] = useState<string>("ALL");
  const [footFilter, setFootFilter] = useState<string>("ALL");
  const [minAge, setMinAge] = useState<string>("");
  const [maxAge, setMaxAge] = useState<string>("");

  // Metric filter
  const [filterMetricKey, setFilterMetricKey] = useState<string>("NONE");
  const [filterMetricMin, setFilterMetricMin] = useState<string>("");

  // Sort state
  const [sortBy, setSortBy] = useState<string>("name_asc");

  // View mode: grid vs table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Comparison selection (IDs of athletes selected)
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Toggle athlete comparison selection
  const handleToggleSelect = (athleteId: string) => {
    setSelectedAthleteIds((prev) => {
      if (prev.includes(athleteId)) {
        return prev.filter((id) => id !== athleteId);
      }
      if (prev.length >= 4) {
        alert("Você pode comparar no máximo 4 atletas simultaneamente.");
        return prev;
      }
      return [...prev, athleteId];
    });
  };

  const handleClearSelection = () => {
    setSelectedAthleteIds([]);
  };

  const handleResetFilters = () => {
    setSearch("");
    setPositionFilter("ALL");
    setTeamFilter("ALL");
    setFootFilter("ALL");
    setMinAge("");
    setMaxAge("");
    setFilterMetricKey("NONE");
    setFilterMetricMin("");
    setSortBy("name_asc");
  };

  // Filter & Sort athletes client-side for ultra-fast reactive browsing
  const filteredAthletes = useMemo(() => {
    let list = [...initialAthletes];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.team.name.toLowerCase().includes(q) ||
          (a.nationality && a.nationality.toLowerCase().includes(q))
      );
    }

    // Position
    if (positionFilter !== "ALL") {
      list = list.filter((a) => a.position === positionFilter);
    }

    // Team
    if (teamFilter !== "ALL") {
      list = list.filter((a) => a.team.id === teamFilter);
    }

    // Foot
    if (footFilter !== "ALL") {
      list = list.filter((a) => a.footPreference === footFilter);
    }

    // Age
    if (minAge) {
      const min = parseInt(minAge, 10);
      if (!isNaN(min)) list = list.filter((a) => a.age != null && a.age >= min);
    }
    if (maxAge) {
      const max = parseInt(maxAge, 10);
      if (!isNaN(max)) list = list.filter((a) => a.age != null && a.age <= max);
    }

    // Metric Per-90 filter
    if (filterMetricKey !== "NONE" && filterMetricMin) {
      const minVal = parseFloat(filterMetricMin);
      if (!isNaN(minVal)) {
        list = list.filter((a) => {
          const m = a.metrics[filterMetricKey];
          return m ? m.per90 >= minVal : false;
        });
      }
    }

    // Sorting
    const [type, key, direction] = sortBy.split("_");
    if (type === "name") {
      list.sort((a, b) =>
        key === "desc" ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
      );
    } else if (type === "age") {
      list.sort((a, b) => {
        const ageA = a.age ?? 999;
        const ageB = b.age ?? 999;
        return key === "desc" ? ageB - ageA : ageA - ageB;
      });
    } else if (type === "metric") {
      const metricKey = key;
      const isDesc = direction === "desc" || !direction;
      list.sort((a, b) => {
        const valA = a.metrics[metricKey]?.per90 ?? 0;
        const valB = b.metrics[metricKey]?.per90 ?? 0;
        return isDesc ? valB - valA : valA - valB;
      });
    }

    return list;
  }, [
    initialAthletes,
    search,
    positionFilter,
    teamFilter,
    footFilter,
    minAge,
    maxAge,
    filterMetricKey,
    filterMetricMin,
    sortBy,
  ]);

  const selectedAthletes = useMemo(() => {
    return initialAthletes.filter((a) => selectedAthleteIds.includes(a.id));
  }, [initialAthletes, selectedAthleteIds]);

  const hasActiveFilters =
    Boolean(search) ||
    positionFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    footFilter !== "ALL" ||
    Boolean(minAge) ||
    Boolean(maxAge) ||
    filterMetricKey !== "NONE";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Catálogo da Liga</h1>
            <Badge variant="outline" className="text-xs font-mono">
              {filteredAthletes.length} atletas
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Browse de atletas da liga com métricas normalizadas por 90 minutos (Per-90) e ferramenta de comparação
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/matches/import"
            className={cn(buttonVariants({ variant: "outline" }), "gap-1.5 text-xs")}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Importar Rodada (Excel)
          </Link>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <Card className="p-4 border-border bg-card space-y-3">
        {/* Row 1: Search, Position, Team, Layout Switcher */}
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por atleta, clube ou país..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-muted/30"
            />
          </div>

          {/* Position */}
          <div>
            <Select
              value={positionFilter}
              onValueChange={(v) => {
                if (v) setPositionFilter(v);
              }}
            >
              <SelectTrigger className="w-full text-xs bg-muted/30">
                <SelectValue placeholder="Posição" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todas as Posições</SelectItem>
                {Object.entries(POSITION_LABELS).map(([pos, label]) => (
                  <SelectItem key={pos} value={pos}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Club */}
          <div>
            <Select
              value={teamFilter}
              onValueChange={(v) => {
                if (v) setTeamFilter(v);
              }}
            >
              <SelectTrigger className="w-full text-xs bg-muted/30">
                <SelectValue placeholder="Clube" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os Clubes</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div>
            <Select
              value={sortBy}
              onValueChange={(v) => {
                if (v) setSortBy(v);
              }}
            >
              <SelectTrigger className="w-full text-xs bg-muted/30">
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name_asc">Nome (A - Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z - A)</SelectItem>
                <SelectItem value="age_asc">Idade (Mais jovem)</SelectItem>
                <SelectItem value="age_desc">Idade (Mais experiente)</SelectItem>
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ordenar por Métrica / 90
                </div>
                <SelectItem value="metric_goals_desc">Gols / 90 min (Maior)</SelectItem>
                <SelectItem value="metric_assists_desc">Assistências / 90 min (Maior)</SelectItem>
                <SelectItem value="metric_xg_desc">xG / 90 min (Maior)</SelectItem>
                <SelectItem value="metric_passes_desc">Passes / 90 min (Maior)</SelectItem>
                <SelectItem value="metric_tackles_desc">Desarmes / 90 min (Maior)</SelectItem>
                <SelectItem value="metric_rating_desc">Nota Média (Maior)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Foot, Age range, Metric Per-90 filter, Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            {/* Foot */}
            <div className="w-32">
              <Select
                value={footFilter}
                onValueChange={(v) => {
                  if (v) setFootFilter(v);
                }}
              >
                <SelectTrigger className="h-7 text-xs bg-muted/30">
                  <SelectValue placeholder="Pé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Qualquer pé</SelectItem>
                  <SelectItem value="RIGHT">Destro</SelectItem>
                  <SelectItem value="LEFT">Canhoto</SelectItem>
                  <SelectItem value="BOTH">Ambidestro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range */}
            <div className="flex items-center gap-1 text-xs">
              <Input
                placeholder="Idade mín."
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="h-7 w-20 text-xs bg-muted/30 px-2"
              />
              <span className="text-muted-foreground">—</span>
              <Input
                placeholder="Idade máx."
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="h-7 w-20 text-xs bg-muted/30 px-2"
              />
            </div>

            {/* Mathematical Per-90 Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-2 py-0.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[11px] font-medium text-foreground">Filtro Per-90:</span>
              <Select
                value={filterMetricKey}
                onValueChange={(v) => {
                  if (v) setFilterMetricKey(v);
                }}
              >
                <SelectTrigger className="h-6 w-36 text-[11px] bg-background border-none">
                  <SelectValue placeholder="Escolher métrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Nenhuma</SelectItem>
                  {METRICS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label} ({m.short})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filterMetricKey !== "NONE" && (
                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono text-muted-foreground">&gt;=</span>
                  <Input
                    placeholder="ex: 0.5"
                    type="number"
                    step="0.1"
                    value={filterMetricMin}
                    onChange={(e) => setFilterMetricMin(e.target.value)}
                    className="h-6 w-16 text-xs bg-background px-1.5 font-mono"
                  />
                </div>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1 rounded text-xs transition-colors",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1 rounded text-xs transition-colors",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-xs font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Visualização em Tabela"
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </Card>

      {/* Athletes List / Grid */}
      {filteredAthletes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 border-dashed border-border/60 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Nenhum atleta encontrado</p>
          <p className="text-xs text-muted-foreground/60 mt-1 mb-4">
            Tente ajustar ou limpar os filtros de busca e métricas
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs">
            Limpar Filtros
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAthletes.map((athlete) => {
            const isSelected = selectedAthleteIds.includes(athlete.id);
            const initials = athlete.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")
              .toUpperCase();

            // Select 3 top metrics to showcase
            const topMetrics = Object.values(athlete.metrics)
              .filter((m) => m.per90 > 0)
              .slice(0, 3);

            return (
              <Card
                key={athlete.id}
                className={cn(
                  "group relative flex flex-col justify-between p-4 border-border bg-card transition-all hover:border-primary/40",
                  isSelected && "ring-2 ring-primary border-primary/60 bg-primary/5"
                )}
              >
                {/* Card Top: Checkbox & Position Badge */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(athlete.id)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      title={isSelected ? "Desmarcar para comparação" : "Selecionar para comparar"}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 opacity-40 group-hover:opacity-100" />
                      )}
                      <span className="text-[11px] font-medium">Comparar</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <PortfolioToggleButton
                        athleteId={athlete.id}
                        athleteName={athlete.name}
                        initialInPortfolio={initialPortfolioIds.includes(athlete.id)}
                        variant="icon"
                      />
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] px-2 py-0.5", POSITION_COLORS[athlete.position])}
                      >
                        {POSITION_LABELS[athlete.position]}
                      </Badge>
                    </div>
                  </div>

                  {/* Athlete Info */}
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar className="h-12 w-12 border border-border shrink-0">
                      <AvatarImage src={athlete.photoUrl ?? undefined} alt={athlete.name} />
                      <AvatarFallback className="text-xs font-bold">{initials}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="font-bold text-sm text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {athlete.name}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground truncate mt-0.5">
                        <Shield className="h-3 w-3 shrink-0" />
                        <span className="truncate">{athlete.team.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Attributes Bar */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground border-t border-border/40 pt-2">
                    <span>{athlete.age ? `${athlete.age} anos` : "—"}</span>
                    <span>·</span>
                    <span>{FOOT_LABELS[athlete.footPreference]}</span>
                    {athlete.height && (
                      <>
                        <span>·</span>
                        <span>{athlete.height}cm</span>
                      </>
                    )}
                  </div>

                  {/* Top Canonical Metrics Badges */}
                  <div className="mt-3 space-y-1.5">
                    {topMetrics.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground/60 italic">Sem métricas registradas</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {topMetrics.map((m) => (
                          <span
                            key={m.metricName}
                            className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground"
                          >
                            <span className="text-muted-foreground">{m.label}:</span>
                            <span className="font-bold font-mono text-primary">{m.per90}/90</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Minutes & Link */}
                <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    {athlete.totalMinutes}&apos; ({athlete.totalMatches}j)
                  </span>

                  <Link
                    href={`/athletes/${athlete.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    Ver Raio-X
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="w-10 text-center"></TableHead>
                  <TableHead className="text-xs">Atleta</TableHead>
                  <TableHead className="text-xs">Clube</TableHead>
                  <TableHead className="text-xs">Posição</TableHead>
                  <TableHead className="text-xs text-center">Idade</TableHead>
                  <TableHead className="text-xs text-center">Pé</TableHead>
                  <TableHead className="text-xs text-center">Minutos</TableHead>
                  <TableHead className="text-xs text-center">Gols / 90</TableHead>
                  <TableHead className="text-xs text-center">Assists / 90</TableHead>
                  <TableHead className="text-xs text-center">Passes / 90</TableHead>
                  <TableHead className="text-xs text-center">Desarmes / 90</TableHead>
                  <TableHead className="text-xs text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAthletes.map((athlete) => {
                  const isSelected = selectedAthleteIds.includes(athlete.id);
                  const initials = athlete.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <TableRow key={athlete.id} className={cn(isSelected && "bg-primary/5")}>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(athlete.id)}
                          className="text-muted-foreground hover:text-foreground"
                          title="Comparar"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4 opacity-40 hover:opacity-100" />
                          )}
                        </button>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border border-border">
                            <AvatarImage src={athlete.photoUrl ?? undefined} alt={athlete.name} />
                            <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
                          </Avatar>
                          <Link
                            href={`/athletes/${athlete.id}`}
                            className="font-bold text-xs hover:text-primary transition-colors"
                          >
                            {athlete.name}
                          </Link>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs">{athlete.team.shortName ?? athlete.team.name}</TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] px-1.5 py-0.5", POSITION_COLORS[athlete.position])}
                        >
                          {POSITION_LABELS[athlete.position]}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-center text-xs">{athlete.age ?? "—"}</TableCell>
                      <TableCell className="text-center text-xs">{FOOT_LABELS[athlete.footPreference]}</TableCell>
                      <TableCell className="text-center font-mono text-xs">{athlete.totalMinutes}&apos;</TableCell>

                      <TableCell className="text-center font-mono text-xs font-semibold">
                        {athlete.metrics["goals"]?.per90 ?? 0}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs font-semibold">
                        {athlete.metrics["assists"]?.per90 ?? 0}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs font-semibold">
                        {athlete.metrics["passes"]?.per90 ?? 0}
                      </TableCell>

                      <TableCell className="text-center font-mono text-xs font-semibold">
                        {athlete.metrics["tackles"]?.per90 ?? 0}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <PortfolioToggleButton
                            athleteId={athlete.id}
                            athleteName={athlete.name}
                            initialInPortfolio={initialPortfolioIds.includes(athlete.id)}
                            variant="icon"
                          />
                          <Link
                            href={`/athletes/${athlete.id}`}
                            className="text-xs font-semibold text-primary hover:underline px-1.5"
                          >
                            Perfil
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Floating Comparison Dock (when 1+ athletes selected) */}
      {selectedAthleteIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-md px-5 py-3 shadow-2xl ring-1 ring-black/10">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 overflow-hidden">
              {selectedAthletes.map((a) => (
                <Avatar key={a.id} className="h-8 w-8 ring-2 ring-background border border-border">
                  <AvatarImage src={a.photoUrl ?? undefined} />
                  <AvatarFallback className="text-[10px] font-bold">{a.name[0]}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="text-xs">
              <span className="font-bold text-foreground">{selectedAthleteIds.length}</span>{" "}
              {selectedAthleteIds.length === 1 ? "atleta selecionado" : "atletas selecionados"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              className="text-xs h-8"
            >
              Limpar
            </Button>
            <Button
              size="sm"
              disabled={selectedAthleteIds.length < 2}
              onClick={() => setIsCompareModalOpen(true)}
              className="text-xs h-8 gap-1.5 font-bold"
            >
              <Trophy className="h-3.5 w-3.5" />
              Comparar Lado a Lado ({selectedAthleteIds.length})
            </Button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      <AthleteComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        athletes={selectedAthletes}
        onRemoveAthlete={handleToggleSelect}
      />
    </div>
  );
}
