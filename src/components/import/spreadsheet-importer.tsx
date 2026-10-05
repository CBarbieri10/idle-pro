"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ExternalLink,
  Search,
  ArrowRight,
  Database,
  Info,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  type Cell,
  type Grid,
  type ColumnMapping,
  type ColumnTarget,
  detectHeaderRow,
  autoMap,
  buildStagedRows,
  templateCsv,
  IDENTITY_FIELDS,
  targetLabel,
} from "@/lib/import/mapping";
import { parseSpreadsheetFile, generateTemplateXlsx, triggerFileDownload } from "@/lib/import/excel";
import {
  resolveStagedImport,
  executeBatchImport,
  type ResolvedStagedRow,
  type StagingResolutionResult,
  type ImportExecutionResult,
} from "@/lib/actions/import";
import { METRICS, SOURCE_LABELS, VENUE_LABELS } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { MetricSource } from "@prisma/client";

interface TeamOption {
  id: string;
  name: string;
}

interface SpreadsheetImporterProps {
  teams: TeamOption[];
}

type FilterTab = "all" | "ready" | "unregistered" | "errors";

export function SpreadsheetImporter({ teams }: SpreadsheetImporterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // File & Parsing state
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawGrid, setRawGrid] = useState<Grid | null>(null);
  const [headerRow, setHeaderRow] = useState<number>(0);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showMappingPanel, setShowMappingPanel] = useState(false);

  // Configuration
  const [metricSource, setMetricSource] = useState<MetricSource>("WYSCOUT");
  const [defaultTeamId, setDefaultTeamId] = useState<string>("");
  const [defaultCompetition, setDefaultCompetition] = useState<string>("");

  // Staged & Resolved state
  const [resolution, setResolution] = useState<StagingResolutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Import Result Modal
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Handle file selection
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setResolution(null);
    setExecutionResult(null);

    try {
      const grid = await parseSpreadsheetFile(selectedFile);
      if (grid.length === 0) {
        throw new Error("O arquivo selecionado está vazio.");
      }

      const detectedHRow = detectHeaderRow(grid);
      const detectedMappings = autoMap(grid, detectedHRow);

      setRawGrid(grid);
      setHeaderRow(detectedHRow);
      setMappings(detectedMappings);

      // Initial staging build
      const staged = buildStagedRows(grid, detectedHRow, detectedMappings, {
        defaultCompetition: defaultCompetition.trim() || undefined,
      });

      // Server resolution for registered athletes/teams
      const res = await resolveStagedImport(staged, defaultTeamId || undefined);
      setResolution(res);
    } catch (err) {
      console.error(err);
      setParseError(err instanceof Error ? err.message : "Erro ao ler a planilha.");
      setRawGrid(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Re-run staging & resolution whenever mappings, default team or competition change
  const recomputeStaging = (
    currentMappings = mappings,
    currentTeamId = defaultTeamId,
    currentComp = defaultCompetition
  ) => {
    if (!rawGrid) return;
    startTransition(async () => {
      const staged = buildStagedRows(rawGrid, headerRow, currentMappings, {
        defaultCompetition: currentComp.trim() || undefined,
      });
      const res = await resolveStagedImport(staged, currentTeamId || undefined);
      setResolution(res);
    });
  };

  // Update target for a specific column
  const handleMappingChange = (columnIndex: number, newTarget: ColumnTarget) => {
    const next = mappings.map((m) => (m.index === columnIndex ? { ...m, target: newTarget } : m));
    setMappings(next);
    recomputeStaging(next, defaultTeamId, defaultCompetition);
  };

  // Handle download of CSV template
  const handleDownloadCsvTemplate = () => {
    const csvContent = templateCsv();
    triggerFileDownload(csvContent, "modelo_metricas_the_net.csv", "text/csv;charset=utf-8;");
  };

  // Handle download of Excel template
  const handleDownloadExcelTemplate = () => {
    const bytes = generateTemplateXlsx();
    triggerFileDownload(
      bytes,
      "modelo_metricas_the_net.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  };

  // Run the batch import
  const handleExecuteImport = () => {
    if (!resolution) return;

    setExecutionError(null);
    startTransition(async () => {
      const res = await executeBatchImport({
        rows: resolution.rows,
        source: metricSource,
        defaultTeamId: defaultTeamId || undefined,
      });

      if (!res.ok) {
        setExecutionError(res.error);
        return;
      }

      setExecutionResult(res.data);
      setShowResultModal(true);
    });
  };

  // Filtered rows for the staging review table
  const filteredRows = useMemo(() => {
    if (!resolution) return [];
    let list = resolution.rows;

    if (activeTab === "ready") {
      list = list.filter((r) => r.status === "READY");
    } else if (activeTab === "unregistered") {
      list = list.filter((r) => r.status === "UNREGISTERED_ATHLETE");
    } else if (activeTab === "errors") {
      list = list.filter((r) => r.status === "ERROR");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.athleteName.toLowerCase().includes(q) ||
          r.opponentName.toLowerCase().includes(q) ||
          (r.teamName && r.teamName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [resolution, activeTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importação de Métricas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Importe planilhas Excel (.xlsx, .xlsm) ou CSV com mapeamento automático de colunas e área de revisão
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadCsvTemplate}
            className="text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Modelo CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadExcelTemplate}
            className="text-xs gap-1.5"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Modelo Excel (.xlsx)
          </Button>
        </div>
      </div>

      {/* Upload & Configuration Card */}
      <Card className="p-6 border-border bg-card">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* File Dropzone */}
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
              Arquivo da Planilha
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) handleFileChange(dropped);
              }}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all",
                file
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/40 hover:bg-muted/30"
              )}
            >
              <input
                type="file"
                accept=".xlsx,.xlsm,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />

              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB · Clique ou arraste outro para substituir
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      Clique para selecionar ou arraste sua planilha aqui
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Suporta arquivos Excel (.xlsx, .xlsm) e CSV delimitados por vírgula ou ponto-e-vírgula
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isParsing && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Processando planilha e validando atletas com o banco de dados...
              </div>
            )}

            {parseError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}
          </div>

          {/* Configuration Parameters */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Fonte dos Dados
              </label>
              <Select
                value={metricSource}
                onValueChange={(v) => {
                  if (v) setMetricSource(v as MetricSource);
                }}
              >
                <SelectTrigger className="w-full bg-muted/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WYSCOUT">{SOURCE_LABELS.WYSCOUT}</SelectItem>
                  <SelectItem value="SOFASCORE">{SOURCE_LABELS.SOFASCORE}</SelectItem>
                  <SelectItem value="SPORTSBASE">{SOURCE_LABELS.SPORTSBASE}</SelectItem>
                  <SelectItem value="MANUAL">{SOURCE_LABELS.MANUAL}</SelectItem>
                  <SelectItem value="OTHER">{SOURCE_LABELS.OTHER}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Identifica a origem das métricas para histórico e rastreabilidade.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Clube Padrão (Opcional)
              </label>
              <Select
                value={defaultTeamId || "NONE"}
                onValueChange={(v) => {
                  const newTeam = !v || v === "NONE" ? "" : v;
                  setDefaultTeamId(newTeam);
                  recomputeStaging(mappings, newTeam, defaultCompetition);
                }}
              >
                <SelectTrigger className="w-full bg-muted/40">
                  <SelectValue placeholder="Selecione caso a planilha não tenha clube" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Nenhum (usar coluna da planilha)</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground mt-1">
                Usado para associar os jogos se a coluna de clube não estiver presente.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                Competição Padrão (Opcional)
              </label>
              <Input
                placeholder="Ex: Brasileirão Série A"
                value={defaultCompetition}
                onChange={(e) => {
                  const val = e.target.value;
                  setDefaultCompetition(val);
                  recomputeStaging(mappings, defaultTeamId, val);
                }}
                className="bg-muted/40 text-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Staging & Review Area (if parsed) */}
      {resolution && (
        <div className="space-y-6">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card className="p-4 border-border bg-card">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Total de Linhas
              </p>
              <p className="text-2xl font-bold mt-1 tabular-nums">
                {resolution.summary.total}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {resolution.summary.uniqueMatchesCount} partidas identificadas
              </p>
            </Card>

            <Card className="p-4 border-border bg-card">
              <p className="text-xs text-emerald-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Prontos para Inserir
              </p>
              <p className="text-2xl font-bold mt-1 text-emerald-500 tabular-nums">
                {resolution.summary.readyCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Atletas e partidas validados
              </p>
            </Card>

            <Card
              className={cn(
                "p-4 border-border bg-card",
                resolution.summary.unregisteredCount > 0 && "border-amber-500/30 bg-amber-500/5"
              )}
            >
              <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                Não Cadastrados
              </p>
              <p className="text-2xl font-bold mt-1 text-amber-500 tabular-nums">
                {resolution.summary.unregisteredCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {resolution.summary.unregisteredAthleteNames.length} atletas pendentes
              </p>
            </Card>

            <Card
              className={cn(
                "p-4 border-border bg-card",
                resolution.summary.errorCount > 0 && "border-destructive/30 bg-destructive/5"
              )}
            >
              <p className="text-xs text-destructive font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                Erros de Validação
              </p>
              <p className="text-2xl font-bold mt-1 text-destructive tabular-nums">
                {resolution.summary.errorCount}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Dados inválidos ou ausentes
              </p>
            </Card>
          </div>

          {/* Prominent Warning Alert for Unregistered Players */}
          {resolution.summary.unregisteredCount > 0 && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-5 text-amber-600 dark:text-amber-400">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-500" />
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">
                      Alerta: {resolution.summary.unregisteredAthleteNames.length}{" "}
                      {resolution.summary.unregisteredAthleteNames.length === 1
                        ? "jogador não está cadastrado no sistema"
                        : "jogadores não estão cadastrados no sistema"}
                    </h3>
                    <p className="text-xs text-amber-600/90 dark:text-amber-400/90 mt-0.5">
                      Para manter a integridade dos dados, as métricas só são vinculadas a atletas
                      previamente cadastrados. As linhas destes jogadores serão ignoradas durante a importação.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {resolution.summary.unregisteredAthleteNames.map((name) => (
                      <span
                        key={name}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/30"
                      >
                        {name}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <Link
                      href="/athletes"
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
                    >
                      Cadastrar atletas agora em nova aba
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <span className="text-xs text-muted-foreground">·</span>
                    <button
                      type="button"
                      onClick={() => recomputeStaging()}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Revalidar após cadastrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Column Mapping Collapsible Panel */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <button
              type="button"
              onClick={() => setShowMappingPanel(!showMappingPanel)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold">Mapeamento de Colunas (De-Para)</h4>
                  <p className="text-xs text-muted-foreground">
                    {mappings.filter((m) => m.target !== "ignore").length} colunas mapeadas
                    automaticamente. Clique para revisar ou ajustar.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {showMappingPanel ? "Recolher" : "Personalizar"}
                </Badge>
                {showMappingPanel ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </button>

            {showMappingPanel && (
              <div className="border-t border-border p-4 bg-muted/10 space-y-4">
                <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center text-xs">#</TableHead>
                        <TableHead className="text-xs">Cabeçalho na Planilha</TableHead>
                        <TableHead className="text-xs">Destino no Sistema</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((m) => (
                        <TableRow key={m.index}>
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {m.index + 1}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {m.header || <span className="italic text-muted-foreground">Vazio</span>}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={m.target}
                              onValueChange={(val) => {
                                if (val) handleMappingChange(m.index, val as ColumnTarget);
                              }}
                            >
                              <SelectTrigger className="h-7 w-64 text-xs bg-muted/30">
                                <SelectValue>{targetLabel(m.target)}</SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                <SelectItem value="ignore">❌ Ignorar Coluna</SelectItem>
                                <SelectItem value="raw">📦 Manter como Métrica Bruta</SelectItem>
                                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Campos de Identificação
                                </div>
                                {Object.entries(IDENTITY_FIELDS).map(([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                ))}
                                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Métricas Canônicas
                                </div>
                                {METRICS.map((metric) => (
                                  <SelectItem key={metric.key} value={`metric:${metric.key}`}>
                                    {metric.label} ({metric.short})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>

          {/* Staging Table & Filters */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  variant={activeTab === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className="text-xs h-8"
                >
                  Todos ({resolution.summary.total})
                </Button>
                <Button
                  variant={activeTab === "ready" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("ready")}
                  className={cn(
                    "text-xs h-8",
                    activeTab === "ready"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "text-emerald-600 border-emerald-600/30"
                  )}
                >
                  Prontos ({resolution.summary.readyCount})
                </Button>
                <Button
                  variant={activeTab === "unregistered" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("unregistered")}
                  className={cn(
                    "text-xs h-8",
                    activeTab === "unregistered"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "text-amber-600 border-amber-600/30"
                  )}
                >
                  Não Cadastrados ({resolution.summary.unregisteredCount})
                </Button>
                {resolution.summary.errorCount > 0 && (
                  <Button
                    variant={activeTab === "errors" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("errors")}
                    className={cn(
                      "text-xs h-8",
                      activeTab === "errors"
                        ? "bg-destructive hover:bg-destructive/90 text-white"
                        : "text-destructive border-destructive/30"
                    )}
                  >
                    Erros ({resolution.summary.errorCount})
                  </Button>
                )}
              </div>

              {/* Search filter */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar atleta ou rival..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 text-xs h-8 bg-muted/40"
                />
              </div>
            </div>

            {/* Preview Grid Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs">Linha</TableHead>
                      <TableHead className="w-32 text-xs">Status</TableHead>
                      <TableHead className="text-xs">Atleta</TableHead>
                      <TableHead className="text-xs">Clube</TableHead>
                      <TableHead className="text-xs">Data & Partida</TableHead>
                      <TableHead className="text-xs text-center">Minutos</TableHead>
                      <TableHead className="text-xs">Métricas Lidas</TableHead>
                      <TableHead className="text-xs">Validações / Mensagens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                          Nenhum registro encontrado para este filtro.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredRows.map((row) => {
                        const metricCount = Object.keys(row.data).length;
                        return (
                          <TableRow
                            key={row.line}
                            className={cn(
                              row.status === "UNREGISTERED_ATHLETE" && "bg-amber-500/5",
                              row.status === "ERROR" && "bg-destructive/5"
                            )}
                          >
                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                              {row.line}
                            </TableCell>

                            {/* Status */}
                            <TableCell>
                              {row.status === "READY" && (
                                <Badge
                                  variant="outline"
                                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] gap-1"
                                >
                                  <CheckCircle2 className="h-3 w-3" />
                                  Pronto
                                </Badge>
                              )}
                              {row.status === "UNREGISTERED_ATHLETE" && (
                                <Badge
                                  variant="outline"
                                  className="border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] gap-1"
                                >
                                  <AlertTriangle className="h-3 w-3" />
                                  Não Cadastrado
                                </Badge>
                              )}
                              {row.status === "ERROR" && (
                                <Badge
                                  variant="outline"
                                  className="border-destructive/40 bg-destructive/10 text-destructive text-[11px] gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Erro
                                </Badge>
                              )}
                            </TableCell>

                            {/* Athlete */}
                            <TableCell>
                              <div className="font-semibold text-xs text-foreground">
                                {row.athleteName}
                              </div>
                              {row.resolvedAthleteName &&
                                row.resolvedAthleteName !== row.athleteName && (
                                  <div className="text-[10px] text-muted-foreground">
                                    → {row.resolvedAthleteName}
                                  </div>
                                )}
                            </TableCell>

                            {/* Club */}
                            <TableCell className="text-xs">
                              {row.resolvedTeamName || row.teamName || (
                                <span className="italic text-muted-foreground">Não definido</span>
                              )}
                            </TableCell>

                            {/* Match */}
                            <TableCell className="text-xs">
                              <div className="font-medium">
                                vs {row.opponentName}{" "}
                                {row.goalsFor !== null && row.goalsAgainst !== null && (
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    ({row.goalsFor}×{row.goalsAgainst})
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                {row.date} · {VENUE_LABELS[row.venue]} · {row.competition}
                              </div>
                            </TableCell>

                            {/* Minutes */}
                            <TableCell className="text-center text-xs font-mono">
                              {row.minutesPlayed !== null ? `${row.minutesPlayed}'` : "—"}
                            </TableCell>

                            {/* Metrics parsed */}
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="font-mono text-[10px]">
                                  {metricCount} {metricCount === 1 ? "métrica" : "métricas"}
                                </Badge>
                              </div>
                            </TableCell>

                            {/* Errors / Warnings */}
                            <TableCell className="text-xs">
                              {row.errors.length > 0 ? (
                                <div className="space-y-0.5 text-destructive text-[11px]">
                                  {row.errors.map((err, i) => (
                                    <div key={i} className="flex items-center gap-1">
                                      <span>•</span> {err}
                                    </div>
                                  ))}
                                </div>
                              ) : row.status === "UNREGISTERED_ATHLETE" ? (
                                <div className="text-amber-600 dark:text-amber-400 text-[11px]">
                                  Atleta não encontrado no banco
                                </div>
                              ) : (
                                <span className="text-muted-foreground/60 text-[11px]">Válido</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {resolution.summary.readyCount}
                </span>{" "}
                linhas prontas para serem inseridas no banco como{" "}
                <span className="font-semibold text-foreground">
                  {SOURCE_LABELS[metricSource]}
                </span>
                .
                {resolution.summary.unregisteredCount > 0 && (
                  <span className="ml-1 text-amber-500 font-medium">
                    ({resolution.summary.unregisteredCount} atletas não cadastrados serão ignorados)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFile(null);
                    setResolution(null);
                    setRawGrid(null);
                  }}
                  disabled={isPending}
                  className="text-xs"
                >
                  Descartar Planilha
                </Button>
                <Button
                  onClick={handleExecuteImport}
                  disabled={resolution.summary.readyCount === 0 || isPending}
                  className="gap-2 text-xs"
                >
                  {isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Gravando no Banco...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Confirmar e Inserir {resolution.summary.readyCount} Linhas
                    </>
                  )}
                </Button>
              </div>
            </div>

            {executionError && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {executionError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success / Result Feedback Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-2">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold">
              Importação Concluída com Sucesso!
            </DialogTitle>
            <DialogDescription className="text-center text-xs">
              As métricas foram gravadas no banco e já estão disponíveis no sistema.
            </DialogDescription>
          </DialogHeader>

          {executionResult && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Métricas inseridas/atualizadas:</span>
                  <span className="font-bold tabular-nums text-emerald-500">
                    {executionResult.importedCount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Novas partidas criadas:</span>
                  <span className="font-bold tabular-nums">{executionResult.matchesCreated}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partidas existentes vinculadas:</span>
                  <span className="font-bold tabular-nums">{executionResult.matchesLinked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Linhas ignoradas:</span>
                  <span className="font-bold tabular-nums text-amber-500">
                    {executionResult.skippedCount}
                  </span>
                </div>
              </div>

              {executionResult.unregisteredAthletes.length > 0 && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                  <p className="font-semibold mb-1">Atletas que não foram importados:</p>
                  <p className="text-[11px] opacity-90">
                    {executionResult.unregisteredAthletes.join(", ")}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowResultModal(false);
                setFile(null);
                setResolution(null);
                setRawGrid(null);
              }}
              className="w-full sm:w-auto text-xs"
            >
              Importar Outra Planilha
            </Button>
            <Button
              onClick={() => {
                setShowResultModal(false);
                router.push("/matches");
              }}
              className="w-full sm:w-auto text-xs gap-1"
            >
              Ver Jogos Cadastrados
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
