"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Trophy,
  Search,
  Filter,
  SlidersHorizontal,
  CheckSquare,
  Square,
  Users,
  LayoutGrid,
  List,
  RotateCcw,
  Sparkles,
  ArrowUpDown,
  Shield,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  X,
  Compass,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { type CatalogAthlete } from "@/lib/actions/catalog";
import { AthleteComparisonModal } from "@/components/catalog/athlete-comparison-modal";
import {
  POSITION_LABELS,
  POSITION_COLORS,
  FOOT_LABELS,
  formatHeight,
  formatWeight,
} from "@/lib/domain";
import { METRICS, formatMetric } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { PortfolioToggleButton } from "@/components/portfolio/portfolio-toggle-button";
import { AthleteRaioXModal, type RaioXAthleteData } from "@/components/reports/athlete-raio-x-modal";

interface TeamOption {
  id: string;
  name: string;
}

interface LeagueCatalogProps {
  initialAthletes: CatalogAthlete[];
  teams: TeamOption[];
  initialPortfolioIds?: string[];
}

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
    case "tackles":
      return value >= 2.0;
    case "interceptions":
      return value >= 1.4;
    case "recoveries":
      return value >= 4.5;
    default:
      return false;
  }
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

  // View mode
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Comparison selection
  const [selectedAthleteIds, setSelectedAthleteIds] = useState<string[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

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

  const hasActiveFilters =
    search ||
    positionFilter !== "ALL" ||
    teamFilter !== "ALL" ||
    footFilter !== "ALL" ||
    minAge ||
    maxAge ||
    filterMetricKey !== "NONE" ||
    filterMetricMin;

  // Filter & Sort
  const filteredAthletes = useMemo(() => {
    let list = [...initialAthletes];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.team.name.toLowerCase().includes(q) ||
          (a.nationality && a.nationality.toLowerCase().includes(q))
      );
    }

    if (positionFilter !== "ALL") {
      list = list.filter((a) => a.position === positionFilter);
    }

    if (teamFilter !== "ALL") {
      list = list.filter((a) => a.team.id === teamFilter);
    }

    if (footFilter !== "ALL") {
      list = list.filter((a) => a.footPreference === footFilter);
    }

    if (minAge) {
      const min = parseInt(minAge, 10);
      if (!isNaN(min)) list = list.filter((a) => a.age != null && a.age >= min);
    }
    if (maxAge) {
      const max = parseInt(maxAge, 10);
      if (!isNaN(max)) list = list.filter((a) => a.age != null && a.age <= max);
    }

    if (filterMetricKey !== "NONE" && filterMetricMin) {
      const minVal = parseFloat(filterMetricMin);
      if (!isNaN(minVal)) {
        list = list.filter((a) => {
          const m = a.metrics[filterMetricKey];
          return m ? m.per90 >= minVal : false;
        });
      }
    }

    const [type, key, direction] = sortBy.split("_");
    if (type === "name") {
      list.sort((a, b) =>
        direction === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      );
    } else if (type === "age") {
      list.sort((a, b) => {
        const aVal = a.age ?? 0;
        const bVal = b.age ?? 0;
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      });
    } else if (type === "minutes") {
      list.sort((a, b) =>
        direction === "asc" ? a.totalMinutes - b.totalMinutes : b.totalMinutes - a.totalMinutes
      );
    } else if (type === "metric" && key) {
      list.sort((a, b) => {
        const aVal = a.metrics[key]?.per90 ?? 0;
        const bVal = b.metrics[key]?.per90 ?? 0;
        return direction === "asc" ? aVal - bVal : bVal - aVal;
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

  return (
    <div className="space-y-6 w-full">
      {/* ─── Top Executive Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#00e676]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#00e676] border border-[#00e676]/30 uppercase tracking-wider font-mono">
              <Compass className="h-3 w-3" /> Scouting Pro &bull; Série A
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              {filteredAthletes.length} atletas mapeados
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1.5">
            Catálogo & Inteligência da Liga
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Filtre por atributos biométricos, minutagem e métricas canônicas normalizadas por 90 minutos.
          </p>
        </div>

        {/* View Switcher & Action */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/league/lab"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold transition-all shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Laboratório 2D (Moneyball)
          </Link>

          <div className="flex items-center bg-bg-surface-elevated p-1 rounded-lg border border-border-strong">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                viewMode === "grid"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Grade
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all",
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-3.5 w-3.5" />
              Tabela
            </button>
          </div>
        </div>
      </div>

      {/* ─── Search & Advanced Filter Suite ──────────────────────────────── */}
      <div className="rounded-xl border border-border-strong bg-bg-surface p-4 shadow-lg space-y-3.5">
        {/* Row 1: Search, Position, Team, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por atleta, clube ou nacionalidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs bg-bg-surface-elevated border-border-strong text-foreground placeholder:text-muted-foreground/60 rounded-lg focus-visible:ring-indigo-500"
            />
          </div>

          {/* Position */}
          <div>
            <Select value={positionFilter} onValueChange={(v) => v && setPositionFilter(v)}>
              <SelectTrigger className="h-9 text-xs bg-bg-surface-elevated border-border-strong text-foreground rounded-lg">
                <SelectValue placeholder="Todas as posições" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-elevated border-border-strong">
                <SelectItem value="ALL">Todas as posições</SelectItem>
                {Object.entries(POSITION_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team */}
          <div>
            <Select value={teamFilter} onValueChange={(v) => v && setTeamFilter(v)}>
              <SelectTrigger className="h-9 text-xs bg-bg-surface-elevated border-border-strong text-foreground rounded-lg">
                <SelectValue placeholder="Todos os clubes" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-elevated border-border-strong">
                <SelectItem value="ALL">Todos os clubes</SelectItem>
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
            <Select value={sortBy} onValueChange={(v) => v && setSortBy(v)}>
              <SelectTrigger className="h-9 text-xs bg-bg-surface-elevated border-border-strong text-foreground rounded-lg">
                <div className="flex items-center gap-1.5">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar por..." />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-bg-surface-elevated border-border-strong">
                <SelectItem value="name_asc">Nome (A - Z)</SelectItem>
                <SelectItem value="name_desc">Nome (Z - A)</SelectItem>
                <SelectItem value="age_asc">Idade (Mais jovem primeiro)</SelectItem>
                <SelectItem value="age_desc">Idade (Mais experiente)</SelectItem>
                <SelectItem value="minutes_desc">Minutagem jogada (Maior)</SelectItem>
                <SelectItem value="metric_goals_desc">Gols / 90 (Maior)</SelectItem>
                <SelectItem value="metric_xg_desc">xG / 90 (Maior)</SelectItem>
                <SelectItem value="metric_key_passes_desc">Passes Decisivos / 90</SelectItem>
                <SelectItem value="metric_passes_desc">Volume de Passes / 90</SelectItem>
                <SelectItem value="metric_tackles_desc">Desarmes / 90</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Secondary Bio Filters + Metric Slider + Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border-subtle">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Dominant Foot */}
            <div className="w-36">
              <Select value={footFilter} onValueChange={(v) => v && setFootFilter(v)}>
                <SelectTrigger className="h-8 text-xs bg-bg-surface-elevated border-border-strong text-foreground rounded-lg">
                  <SelectValue placeholder="Pé dominante" />
                </SelectTrigger>
                <SelectContent className="bg-bg-surface-elevated border-border-strong">
                  <SelectItem value="ALL">Qualquer pé</SelectItem>
                  <SelectItem value="RIGHT">Destro</SelectItem>
                  <SelectItem value="LEFT">Canhoto</SelectItem>
                  <SelectItem value="BOTH">Ambidestro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Age Range */}
            <div className="flex items-center gap-1 text-xs bg-bg-surface-elevated px-2 py-1 rounded-lg border border-border-strong">
              <span className="text-[11px] text-muted-foreground">Idade:</span>
              <Input
                placeholder="Mín."
                type="number"
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="h-6 w-14 text-xs bg-bg-base border-none px-1 text-center font-mono"
              />
              <span className="text-muted-foreground">&ndash;</span>
              <Input
                placeholder="Máx."
                type="number"
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="h-6 w-14 text-xs bg-bg-base border-none px-1 text-center font-mono"
              />
            </div>

            {/* Per-90 Advanced Math Filter */}
            <div className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold text-indigo-300">Filtro Per-90:</span>
              <Select value={filterMetricKey} onValueChange={(v) => v && setFilterMetricKey(v)}>
                <SelectTrigger className="h-6 text-[11px] bg-bg-surface-elevated border-none text-foreground font-semibold">
                  <SelectValue placeholder="Métrica" />
                </SelectTrigger>
                <SelectContent className="bg-bg-surface-elevated border-border-strong max-h-60">
                  <SelectItem value="NONE">Nenhuma</SelectItem>
                  {METRICS.map((m) => (
                    <SelectItem key={m.key} value={m.key}>
                      {m.label} ({m.short})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {filterMetricKey !== "NONE" && (
                <div className="flex items-center gap-1 ml-1">
                  <span className="text-xs font-mono text-indigo-400">&ge;</span>
                  <Input
                    placeholder="0.0"
                    type="number"
                    step="0.1"
                    value={filterMetricMin}
                    onChange={(e) => setFilterMetricMin(e.target.value)}
                    className="h-6 w-16 text-xs bg-bg-surface-elevated px-1.5 font-mono text-center font-bold text-white border-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs gap-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* ─── Athlete Catalog Listing ─────────────────────────────────────── */}
      {filteredAthletes.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 border-dashed border-border-strong bg-bg-surface text-center rounded-xl">
          <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-muted-foreground/60" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Nenhum atleta encontrado</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Não encontramos atletas que atendam a todos os critérios e filtros numéricos Per-90 selecionados.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            className="mt-4 text-xs font-semibold border-border-strong"
          >
            Limpar Filtros
          </Button>
        </Card>
      ) : viewMode === "grid" ? (
        /* ─── Grid View ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
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

            // Construct RaioX athlete data for instant modal popup
            const raioXData: RaioXAthleteData = {
              id: athlete.id,
              name: athlete.name,
              position: athlete.position,
              birthDate: athlete.birthDate,
              nationality: athlete.nationality,
              height: athlete.height,
              weight: athlete.weight,
              footPreference: athlete.footPreference,
              photoUrl: athlete.photoUrl,
              photoHasAlpha: athlete.photoHasAlpha,
              team: {
                id: athlete.team.id,
                name: athlete.team.name,
                shortName: null,
              },
              totalMinutes: athlete.totalMinutes,
              totalMatches: athlete.totalMatches,
              canonicalMetrics: athlete.metrics,
            };

            return (
              <div
                key={athlete.id}
                className={cn(
                  "group relative flex flex-col justify-between rounded-2xl border p-4.5 transition-all duration-200 bg-[#0d121d]/85 backdrop-blur-md hover:shadow-2xl hover:border-[#00e676]/50 hover:bg-[#121927]/95",
                  isSelected
                    ? "border-[#00e676] bg-[#00e676]/10 ring-1 ring-[#00e676]/60"
                    : "border-white/10"
                )}
              >
                {/* Card Top: Checkbox, Portfolio & Position */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(athlete.id)}
                      className={cn(
                        "flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 transition-colors",
                        isSelected
                          ? "bg-[#00e676]/20 text-[#00e676] font-bold"
                          : "text-zinc-400 hover:text-white"
                      )}
                      title={isSelected ? "Desmarcar para comparação" : "Selecionar para comparar"}
                    >
                      {isSelected ? (
                        <CheckSquare className="h-4 w-4 text-[#00e676]" />
                      ) : (
                        <Square className="h-4 w-4 opacity-50 group-hover:opacity-100" />
                      )}
                      <span className="text-[11px] font-semibold">Comparar</span>
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
                        className={cn("text-[10px] font-bold px-2 py-0.5 border-0", POSITION_COLORS[athlete.position])}
                      >
                        {POSITION_LABELS[athlete.position]}
                      </Badge>
                    </div>
                  </div>

                  {/* Athlete Portrait & Info */}
                  <div className="mt-3.5 flex items-center gap-3">
                    {/* Photo Stage Avatar */}
                    <div className="relative h-13 w-13 rounded-full border-2 border-[#00e676]/60 p-0.5 bg-black/50 overflow-hidden shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)] flex items-center justify-center">
                      {athlete.photoUrl ? (
                        <img
                          src={athlete.photoUrl}
                          alt={athlete.name}
                          className={cn(
                            "h-full w-full object-cover rounded-full",
                            athlete.photoHasAlpha && "object-contain"
                          )}
                        />
                      ) : (
                        <span className="text-xs font-black text-[#00e676] font-mono">
                          {initials}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/athletes/${athlete.id}`}
                        className="font-black text-sm text-white hover:text-[#00e676] transition-colors block truncate"
                      >
                        {athlete.name}
                      </Link>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 truncate mt-0.5">
                        <Shield className="h-3 w-3 shrink-0 text-indigo-400" />
                        <span className="truncate font-semibold">{athlete.team.name}</span>
                        {athlete.nationality && (
                          <span className="text-[10px] opacity-70">&bull; {athlete.nationality}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Physical Bio Bar */}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-300 border-t border-white/10 pt-2 font-mono">
                    <span>{athlete.age ? `${athlete.age} anos` : "—"}</span>
                    <span className="text-zinc-600">&bull;</span>
                    <span>{FOOT_LABELS[athlete.footPreference]}</span>
                    {athlete.height && (
                      <>
                        <span className="text-zinc-600">&bull;</span>
                        <span>{athlete.height}cm</span>
                      </>
                    )}
                  </div>

                  {/* Top Canonical Metrics Standouts */}
                  <div className="mt-3 space-y-1.5">
                    {topMetrics.length === 0 ? (
                      <p className="text-[11px] text-zinc-500 italic font-mono py-1">
                        Sem métricas registradas
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {topMetrics.map((m) => {
                          const isElite = isEliteMetric(m.metricName, m.per90);
                          return (
                            <div
                              key={m.metricName}
                              className={cn(
                                "rounded-xl p-2 text-center border shadow-[0_4px_12px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all",
                                isElite
                                  ? "border-emerald-500/60 bg-gradient-to-b from-emerald-950/60 to-emerald-950/30"
                                  : "border-white/[0.12] bg-gradient-to-b from-[#131b2a]/95 to-[#080e18]/95"
                              )}
                            >
                              <p
                                className="text-[11px] uppercase tracking-wider text-zinc-300 font-extrabold truncate block"
                                title={m.label}
                              >
                                {m.label.length > 9 ? m.label.slice(0, 8) + ".." : m.label}
                              </p>
                              <p
                                className={cn(
                                  "font-black font-mono tabular-nums text-sm sm:text-[15px] mt-1 leading-none drop-shadow-sm",
                                  isElite ? "text-[#00e676]" : "text-white"
                                )}
                              >
                                {m.per90}
                                <span className="text-[9px] opacity-60 ml-0.5">/90</span>
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer: Minutes & Raio-X Button */}
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    {athlete.totalMinutes}&apos; ({athlete.totalMatches}j)
                  </span>

                  <div className="flex items-center gap-2">
                    <AthleteRaioXModal
                      athlete={raioXData}
                      triggerButton={
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00e676] hover:underline cursor-pointer"
                        >
                          <FileText className="h-3 w-3" />
                          Raio-X
                        </button>
                      }
                    />
                    <Link
                      href={`/athletes/${athlete.id}`}
                      className="inline-flex items-center gap-0.5 text-[11px] font-bold text-zinc-300 hover:text-white transition-colors ml-1"
                    >
                      Perfil <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── Table View ────────────────────────────────────────────────── */
        <div className="rounded-xl border border-border-strong bg-bg-surface overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-bg-surface-elevated border-b border-border-strong">
                <TableRow>
                  <TableHead className="w-10 text-center"></TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Atleta</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Clube</TableHead>
                  <TableHead className="text-xs font-bold text-foreground">Posição</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Idade</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Pé</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Minutos</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Gols /90</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Assist /90</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Passes /90</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-center">Desarmes /90</TableHead>
                  <TableHead className="text-xs font-bold text-foreground text-right">Ações</TableHead>
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

                  const goals90 = athlete.metrics["goals"]?.per90;
                  const assists90 = athlete.metrics["assists"]?.per90;
                  const passes90 = athlete.metrics["passes"]?.per90;
                  const tackles90 = athlete.metrics["tackles"]?.per90;

                  const raioXData: RaioXAthleteData = {
                    id: athlete.id,
                    name: athlete.name,
                    position: athlete.position,
                    birthDate: athlete.birthDate,
                    nationality: athlete.nationality,
                    height: athlete.height,
                    weight: athlete.weight,
                    footPreference: athlete.footPreference,
                    photoUrl: athlete.photoUrl,
                    photoHasAlpha: athlete.photoHasAlpha,
                    team: {
                      id: athlete.team.id,
                      name: athlete.team.name,
                      shortName: null,
                    },
                    totalMinutes: athlete.totalMinutes,
                    totalMatches: athlete.totalMatches,
                    canonicalMetrics: athlete.metrics,
                  };

                  return (
                    <TableRow
                      key={athlete.id}
                      className={cn(
                        "border-b border-border-subtle transition-colors hover:bg-bg-surface-highlight",
                        isSelected && "bg-indigo-500/10"
                      )}
                    >
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(athlete.id)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-indigo-400" />
                          ) : (
                            <Square className="h-4 w-4 opacity-40 hover:opacity-100" />
                          )}
                        </button>
                      </TableCell>

                      {/* Name & Photo */}
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0">
                            {athlete.photoUrl ? (
                              <img
                                src={athlete.photoUrl}
                                alt={athlete.name}
                                className={cn(
                                  "h-full w-full object-cover",
                                  athlete.photoHasAlpha && "object-contain"
                                )}
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-indigo-400 font-mono">
                                {initials}
                              </span>
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/athletes/${athlete.id}`}
                              className="font-bold text-xs text-foreground hover:text-indigo-400 block truncate"
                            >
                              {athlete.name}
                            </Link>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {athlete.team.name}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[9px] font-bold px-1.5 py-0", POSITION_COLORS[athlete.position])}
                        >
                          {POSITION_LABELS[athlete.position]}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-center font-mono">
                        {athlete.age ?? "—"}
                      </TableCell>

                      <TableCell className="text-xs text-center text-muted-foreground">
                        {FOOT_LABELS[athlete.footPreference]}
                      </TableCell>

                      <TableCell className="text-xs text-center font-mono font-semibold">
                        {athlete.totalMinutes}&apos;
                      </TableCell>

                      {/* Metric Per-90 Columns with Emerald Highlights */}
                      <TableCell
                        className={cn(
                          "text-xs text-center font-mono tabular-nums font-bold",
                          isEliteMetric("goals", goals90) ? "text-emerald-400" : "text-foreground"
                        )}
                      >
                        {goals90 != null ? goals90.toFixed(2) : "—"}
                      </TableCell>

                      <TableCell
                        className={cn(
                          "text-xs text-center font-mono tabular-nums font-bold",
                          isEliteMetric("assists", assists90) ? "text-emerald-400" : "text-foreground"
                        )}
                      >
                        {assists90 != null ? assists90.toFixed(2) : "—"}
                      </TableCell>

                      <TableCell
                        className={cn(
                          "text-xs text-center font-mono tabular-nums font-bold",
                          isEliteMetric("passes", passes90) ? "text-emerald-400" : "text-foreground"
                        )}
                      >
                        {passes90 != null ? passes90.toFixed(1) : "—"}
                      </TableCell>

                      <TableCell
                        className={cn(
                          "text-xs text-center font-mono tabular-nums font-bold",
                          isEliteMetric("tackles", tackles90) ? "text-emerald-400" : "text-foreground"
                        )}
                      >
                        {tackles90 != null ? tackles90.toFixed(2) : "—"}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <AthleteRaioXModal
                            athlete={raioXData}
                            triggerButton={
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-indigo-400">
                                Raio-X
                              </Button>
                            }
                          />
                          <Link
                            href={`/athletes/${athlete.id}`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "h-7 px-2 text-[10px]"
                            )}
                          >
                            Ver Perfil
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

      {/* ─── Floating Side-by-Side Comparison Drawer ─────────────────────── */}
      {selectedAthleteIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 border border-indigo-500/50 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-4 text-white animate-in fade-in-0 slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black">
              {selectedAthleteIds.length}
            </span>
            <span className="text-xs font-bold text-zinc-200">
              {selectedAthleteIds.length === 1 ? "Atleta selecionado" : "Atletas selecionados"}
            </span>
          </div>

          <div className="flex items-center -space-x-2">
            {selectedAthletes.map((a) => (
              <div
                key={a.id}
                className="h-8 w-8 rounded-full border-2 border-zinc-900 bg-indigo-600/30 overflow-hidden flex items-center justify-center text-[10px] font-bold"
                title={a.name}
              >
                {a.photoUrl ? (
                  <img src={a.photoUrl} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  a.name.slice(0, 2).toUpperCase()
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setIsCompareModalOpen(true)}
              className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
            >
              Comparar Lado a Lado ({selectedAthleteIds.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-8 text-xs text-zinc-400 hover:text-white"
            >
              Limpar
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
