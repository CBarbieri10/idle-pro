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
  BookmarkPlus,
  Trash2,
  Sparkles,
  Check,
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
  applyTemplateToGrid,
  buildStagedRows,
  templateCsv,
  normalizeHeader,
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
import {
  saveMappingTemplate,
  deleteMappingTemplate,
  type MappingTemplateDTO,
  type StoredColumnsMap,
} from "@/lib/actions/templates";
import { METRICS, SOURCE_LABELS, VENUE_LABELS } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { MetricSource } from "@prisma/client";

interface TeamOption {
  id: string;
  name: string;
}

interface SpreadsheetImporterProps {
  teams: TeamOption[];
  initialTemplates?: MappingTemplateDTO[];
}

type FilterTab = "all" | "ready" | "unregistered" | "errors";

export function SpreadsheetImporter({
  teams,
  initialTemplates = [],
}: SpreadsheetImporterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // File & Parsing state
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [rawGrid, setRawGrid] = useState<Grid | null>(null);
  const [headerRow, setHeaderRow] = useState<number>(0);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [showMappingPanel, setShowMappingPanel] = useState(true);

  // Configuration
  const [metricSource, setMetricSource] = useState<MetricSource>("WYSCOUT");
  const [defaultTeamId, setDefaultTeamId] = useState<string>("");
  const [defaultCompetition, setDefaultCompetition] = useState<string>("");

  // Reusable Templates state (Issue #7 - T05b)
  const [templates, setTemplates] = useState<MappingTemplateDTO[]>(initialTemplates);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("auto");
  const [autoDetectedTemplate, setAutoDetectedTemplate] = useState<{
    template: MappingTemplateDTO;
    score: number;
    matchedColumns: number;
  } | null>(null);

  // Save template dialog
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDesc, setTemplateDesc] = useState("");
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [saveTemplateError, setSaveTemplateError] = useState<string | null>(null);
  const [templateSaveSuccess, setTemplateSaveSuccess] = useState<string | null>(null);

  // Staged & Resolved state
  const [resolution, setResolution] = useState<StagingResolutionResult | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Import Result Modal
  const [executionResult, setExecutionResult] = useState<ImportExecutionResult | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showResultModal, setShowResultModal] = useState(false);

  // Auto-detect matching template from list of headers
  const detectBestTemplate = (grid: Grid, hRow: number) => {
    if (templates.length === 0) return null;

    const row = grid[hRow] ?? [];
    const normalizedHeaders = new Set(
      row
        .map((c) => normalizeHeader(c !== null && c !== undefined ? String(c).trim() : ""))
        .filter(Boolean)
    );

    if (normalizedHeaders.size === 0) return null;

    let best: { template: MappingTemplateDTO; score: number; matchedColumns: number } | null = null;

    for (const t of templates) {
      const templateKeys = Object.keys(t.columns);
      if (templateKeys.length === 0) continue;

      let matched = 0;
      for (const k of templateKeys) {
        if (normalizedHeaders.has(k)) matched++;
      }

      const score = matched / templateKeys.length;
      if (matched >= 2 && score >= 0.35) {
        if (!best || score > best.score) {
          best = { template: t, score, matchedColumns: matched };
        }
      }
    }

    return best;
  };

  // Handle file selection
  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsParsing(true);
    setParseError(null);
    setResolution(null);
    setExecutionResult(null);
    setAutoDetectedTemplate(null);
    setTemplateSaveSuccess(null);

    try {
      const grid = await parseSpreadsheetFile(selectedFile);
      if (grid.length === 0) {
        throw new Error("O arquivo selecionado está vazio.");
      }

      const detectedHRow = detectHeaderRow(grid);
      setRawGrid(grid);
      setHeaderRow(detectedHRow);

      // Check if any saved template matches the headers
      const match = detectBestTemplate(grid, detectedHRow);

      let initialMappings: ColumnMapping[];
      if (match) {
        setAutoDetectedTemplate(match);
        setSelectedTemplateId(match.template.id);
        setMetricSource(match.template.source);
        initialMappings = applyTemplateToGrid(grid, detectedHRow, match.template.columns);
      } else {
        setSelectedTemplateId("auto");
        initialMappings = autoMap(grid, detectedHRow);
      }

      setMappings(initialMappings);

      // Initial staging build & server resolution
      const staged = buildStagedRows(grid, detectedHRow, initialMappings, {
        defaultCompetition: defaultCompetition.trim() || undefined,
      });

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

  // Select a template from the dropdown
  const handleSelectTemplate = (templateId: string) => {
    if (!rawGrid) return;
    setSelectedTemplateId(templateId);

    let nextMappings: ColumnMapping[];
    if (templateId === "auto") {
      nextMappings = autoMap(rawGrid, headerRow);
    } else {
      const targetTemplate = templates.find((t) => t.id === templateId);
      if (targetTemplate) {
        setMetricSource(targetTemplate.source);
        nextMappings = applyTemplateToGrid(rawGrid, headerRow, targetTemplate.columns);
      } else {
        nextMappings = autoMap(rawGrid, headerRow);
      }
    }

    setMappings(nextMappings);
    recomputeStaging(nextMappings, defaultTeamId, defaultCompetition);
  };

  // Save current mappings as a new reusable template
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveTemplateError("Nome do template é obrigatório");
      return;
    }

    setIsSavingTemplate(true);
    setSaveTemplateError(null);

    try {
      const columnsMap: StoredColumnsMap = {};
      for (const m of mappings) {
        const norm = normalizeHeader(m.header);
        if (norm) {
          columnsMap[norm] = {
            header: m.header,
            target: m.target,
          };
        }
      }

      const res = await saveMappingTemplate({
        name: templateName.trim(),
        description: templateDesc.trim() || null,
        source: metricSource,
        columns: columnsMap,
      });

      if (!res.ok) {
        setSaveTemplateError(res.error);
        return;
      }

      // Update local templates list
      setTemplates((prev) => {
        const existing = prev.filter((t) => t.id !== res.data.id && t.name !== res.data.name);
        return [res.data, ...existing].sort((a, b) => a.name.localeCompare(b.name));
      });

      setSelectedTemplateId(res.data.id);
      setIsSaveTemplateOpen(false);
      setTemplateSaveSuccess(`Template "${res.data.name}" salvo com sucesso!`);
      setTimeout(() => setTemplateSaveSuccess(null), 4000);
    } catch (err) {
      console.error(err);
      setSaveTemplateError(err instanceof Error ? err.message : "Erro ao salvar template.");
    } finally {
      setIsSavingTemplate(false);
    }
  };

  // Delete a template
  const handleDeleteTemplate = async (templateId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir este template?")) return;

    const res = await deleteMappingTemplate(templateId);
    if (res.ok) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      if (selectedTemplateId === templateId) {
        handleSelectTemplate("auto");
      }
    }
  };

  // Sample values preview for each column
  const columnSamples = useMemo(() => {
    if (!rawGrid) return [];
    const body = rawGrid.slice(headerRow + 1, headerRow + 4);
    return mappings.map((m) => {
      const samples = body
        .map((r) => r[m.index])
        .filter((v) => v !== null && v !== undefined && String(v).trim() !== "")
        .slice(0, 3)
        .map((v) => String(v));
      return samples.join(", ");
    });
  }, [rawGrid, headerRow, mappings]);

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
            Importe planilhas Excel (.xlsx, .xlsm) ou CSV com mapeamento dinâmico de colunas, templates reutilizáveis e área de staging
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
                Processando planilha e comparando cabeçalhos com templates salvos...
              </div>
            )}

            {parseError && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs font-medium text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {parseError}
              </div>
            )}

            {/* Auto-detected Template Alert */}
            {autoDetectedTemplate && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-primary">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>
                    Template <strong>&quot;{autoDetectedTemplate.template.name}&quot;</strong> detectado automaticamente com{" "}
                    <strong>{Math.round(autoDetectedTemplate.score * 100)}%</strong> de correspondência ({autoDetectedTemplate.matchedColumns} colunas).
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSelectTemplate("auto")}
                  className="h-6 text-[11px] text-primary hover:bg-primary/20"
                >
                  Usar Auto-De/Para Padrão
                </Button>
              </div>
            )}

            {templateSaveSuccess && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4 shrink-0" />
                {templateSaveSuccess}
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

      {/* Dynamic Column Mapping Panel & Templates (Issue #7 - T05b) */}
      {rawGrid && (
        <Card className="p-5 border-border bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <SlidersHorizontal className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-sm font-bold tracking-tight">Mapeamento Dinâmico de Colunas (De-Para)</h3>
                <p className="text-xs text-muted-foreground">
                  Mapeie ou altere o destino de cada coluna. A pré-visualização abaixo atualiza em tempo real.
                </p>
              </div>
            </div>

            {/* Template Selector & Save Button */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="w-48 sm:w-56">
                <Select
                  value={selectedTemplateId}
                  onValueChange={(val) => {
                    if (val) handleSelectTemplate(val);
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-muted/30">
                    <SelectValue placeholder="Escolher template..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">⚡ Auto-Detecção (Padrão)</SelectItem>
                    {templates.length > 0 && (
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Templates Salvos ({templates.length})
                      </div>
                    )}
                    {templates.map((tpl) => (
                      <SelectItem key={tpl.id} value={tpl.id}>
                        {tpl.name} ({SOURCE_LABELS[tpl.source]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTemplateName(
                    selectedTemplateId !== "auto"
                      ? templates.find((t) => t.id === selectedTemplateId)?.name ?? ""
                      : file ? file.name.replace(/\.[^/.]+$/, "") : ""
                  );
                  setIsSaveTemplateOpen(true);
                }}
                className="h-8 text-xs gap-1.5"
              >
                <BookmarkPlus className="h-3.5 w-3.5 text-primary" />
                Salvar Template
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMappingPanel(!showMappingPanel)}
                className="h-8 text-xs"
              >
                {showMappingPanel ? "Recolher" : "Expandir"}
                {showMappingPanel ? (
                  <ChevronUp className="h-3.5 w-3.5 ml-1" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Interactive Column Mapping Table */}
          {showMappingPanel && (
            <div className="pt-4 space-y-3">
              <div className="max-h-80 overflow-y-auto rounded-lg border border-border bg-background">
                <Table>
                  <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-sm">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs">#</TableHead>
                      <TableHead className="text-xs">Coluna na Planilha</TableHead>
                      <TableHead className="text-xs">Exemplo de Dados</TableHead>
                      <TableHead className="text-xs">Destino no Sistema</TableHead>
                      <TableHead className="text-xs text-right">Ações Rápidas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((m) => (
                      <TableRow key={m.index} className={cn(m.target === "ignore" && "opacity-60")}>
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {m.index + 1}
                        </TableCell>
                        <TableCell className="text-xs font-semibold">
                          {m.header || <span className="italic text-muted-foreground font-normal">Sem título</span>}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground max-w-xs truncate">
                          {columnSamples[m.index] || <span className="italic text-muted-foreground/60">—</span>}
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
                            <SelectContent className="max-h-64">
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
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMappingChange(m.index, "raw")}
                              className={cn("h-6 text-[10px] px-1.5", m.target === "raw" && "text-primary font-bold")}
                            >
                              Bruta
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMappingChange(m.index, "ignore")}
                              className={cn("h-6 text-[10px] px-1.5", m.target === "ignore" && "text-destructive font-bold")}
                            >
                              Ignorar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Status summary of mapped mandatory fields */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Campos-Chave:</span>
                {["date", "athlete", "opponent", "competition"].map((field) => {
                  const mapped = mappings.some((m) => m.target === field);
                  return (
                    <span
                      key={field}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border",
                        mapped
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      )}
                    >
                      {mapped ? <Check className="h-2.5 w-2.5" /> : <AlertTriangle className="h-2.5 w-2.5" />}
                      {IDENTITY_FIELDS[field as keyof typeof IDENTITY_FIELDS]}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      )}

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

      {/* Save Template Modal (Issue #7 - T05b) */}
      <Dialog open={isSaveTemplateOpen} onOpenChange={setIsSaveTemplateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Salvar Template de Mapeamento</DialogTitle>
            <DialogDescription className="text-xs">
              Salve este mapeamento de colunas para reutilizá-lo sempre que importar planilhas desta plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Nome do Template *
              </label>
              <Input
                placeholder="Ex: Wyscout Oficial, FBREF, Sofascore..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Descrição (Opcional)
              </label>
              <Input
                placeholder="Ex: Formato padrão exportado da página de elenco"
                value={templateDesc}
                onChange={(e) => setTemplateDesc(e.target.value)}
                className="text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
                Fonte Padrão
              </label>
              <Select
                value={metricSource}
                onValueChange={(v) => {
                  if (v) setMetricSource(v as MetricSource);
                }}
              >
                <SelectTrigger className="w-full text-xs">
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
            </div>

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {mappings.filter((m) => m.target !== "ignore").length}
              </span>{" "}
              colunas ativas serão gravadas neste template.
            </div>

            {saveTemplateError && (
              <div className="rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {saveTemplateError}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSaveTemplateOpen(false)}
              disabled={isSavingTemplate}
              className="w-full sm:w-auto text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate || !templateName.trim()}
              className="w-full sm:w-auto text-xs gap-1.5"
            >
              {isSavingTemplate ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Salvar Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
