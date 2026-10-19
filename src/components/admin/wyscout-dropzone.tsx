"use client";

import React, { useState, useRef, useTransition } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Brain,
  Layers,
  Search,
  ExternalLink,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  importWyscoutSpreadsheetAction,
  type ImportResultSummary,
  type ImportDetailItem,
} from "@/lib/actions/wyscout-import";
import Link from "next/link";

export function WyscoutDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResultSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "xlsx" && ext !== "xls" && ext !== "csv") {
      setErrorMessage("Formato não suportado. Envie uma planilha Excel (.xlsx, .xls) ou .csv.");
      setSelectedFile(null);
      return;
    }
    setErrorMessage(null);
    setSelectedFile(file);
    setResult(null);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    setErrorMessage(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await importWyscoutSpreadsheetAction(formData);
      if (res.success) {
        setResult(res);
      } else {
        setErrorMessage(res.error || "Erro ao processar o arquivo.");
      }
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredDetails = result?.details.filter(
    (d) =>
      d.playerName.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (d.matchedAthleteName &&
        d.matchedAthleteName.toLowerCase().includes(filterQuery.toLowerCase())) ||
      d.teamName.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 w-full">
      {/* ─── Hero Dropzone Card (Frosted Glass) ────────────────────────── */}
      <Card className="rounded-3xl border border-white/[0.12] bg-[#0c101d]/75 backdrop-blur-2xl p-8 shadow-[0_12px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 via-cyan-500/15 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.3)]">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-extrabold text-white tracking-wide">
                    Motor Híbrido de Ingestão & Fuzzy Match
                  </h2>
                  <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0.5 px-2">
                    Wyscout Standard
                  </Badge>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Arraste planilhas de estatísticas para cruzar automaticamente com os atletas do Brasileirão via inteligência de strings.
                </p>
              </div>
            </div>

            {selectedFile && !isPending && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 text-xs"
              >
                Trocar Planilha
              </Button>
            )}
          </div>

          {/* Interactive Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 relative ${
              isDragging
                ? "border-emerald-400 bg-emerald-500/[0.08] scale-[1.01] shadow-[0_0_30px_rgba(16,185,129,0.25)]"
                : selectedFile
                ? "border-emerald-500/40 bg-[#121829]/60 hover:border-emerald-500/60"
                : "border-white/[0.15] bg-[#0f1424]/40 hover:border-emerald-500/30 hover:bg-[#141b2f]/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            <div className="flex flex-col items-center justify-center space-y-3.5">
              {selectedFile ? (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] animate-pulse">
                    <FileCheck className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">{selectedFile.name}</h3>
                    <p className="text-xs font-mono text-zinc-400 mt-0.5">
                      {(selectedFile.size / 1024).toFixed(1)} KB &bull; Pronto para fusão no banco Neon
                    </p>
                  </div>

                  {/* Badge Verde de Auto-Detect */}
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-in fade-in">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>
                      Tipo Detectado Automaticamente:{" "}
                      <strong className="text-white">
                        {selectedFile.name.toLowerCase().includes("partida") ||
                        selectedFile.name.toLowerCase().includes("match") ||
                        selectedFile.name.toLowerCase().includes("jogo")
                          ? "Planilha de Partidas (MATCH)"
                          : selectedFile.name.toLowerCase().includes("time") ||
                            selectedFile.name.toLowerCase().includes("equipe") ||
                            selectedFile.name.toLowerCase().includes("clube")
                          ? "Planilha de Clubes (TEAM)"
                          : "Planilha de Atletas (ATHLETE)"}
                      </strong>
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] border border-white/[0.12] flex items-center justify-center text-zinc-300 group-hover:text-emerald-400 transition-colors">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">
                      Arraste sua planilha aqui ou clique para selecionar
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Suporta arquivos <span className="text-emerald-400 font-mono">.xlsx</span>,{" "}
                      <span className="text-emerald-400 font-mono">.xls</span> ou{" "}
                      <span className="text-emerald-400 font-mono">.csv</span> exportados do Wyscout
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Trigger */}
          {selectedFile && !result && (
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={handleUpload}
                disabled={isPending}
                className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-zinc-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.35)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Processando Fuzzy Match & Gravando Indicadores...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Iniciar Fusão de Dados e Fuzzy Match
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-xs text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </Card>

      {/* ─── Resultado da Ingestão & Relatório de Fuzzy Match ────────────── */}
      {result && (
        <Card className="rounded-3xl border border-white/[0.12] bg-[#0c101d]/85 backdrop-blur-2xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-300">
          {/* Header com Badge Verde de Auto-Detect Confirmado */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-black text-white">
                Ingestão Concluída &bull; Fusão Longitudinal Realizada
              </h3>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-xs font-mono py-1 px-3 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 mr-1.5" />
              Auto-Detect: {result.detectedTypeLabel}
            </Badge>
          </div>

          {/* Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                Linhas Analisadas
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {result.totalRows}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.06] p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider">
                Fuzzy Matches (Atualizados)
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {result.matchedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/[0.06] p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-cyan-400 tracking-wider">
                Atletas Novos (Criados)
              </p>
              <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
                {result.createdCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 text-center">
              <p className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                Taxa de Sucesso
              </p>
              <p className="text-2xl font-black text-white font-mono mt-1">
                {result.totalRows > 0
                  ? `${Math.round(((result.matchedCount + result.createdCount) / result.totalRows) * 100)}%`
                  : "100%"}
              </p>
            </div>
          </div>

          {/* Search Filter and Table Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Mapeamento de Jogadores & Similaridade
              </h3>
            </div>

            <div className="relative w-64">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filtrar por nome ou time..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-white/[0.1] bg-[#121828] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>

          {/* Results Table */}
          <div className="rounded-2xl border border-white/[0.08] overflow-hidden bg-[#090d18]">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="py-3 px-4">Linha</th>
                    <th className="py-3 px-4">Nome na Planilha</th>
                    <th className="py-3 px-4">Clube</th>
                    <th className="py-3 px-4">Match no Banco (Neon)</th>
                    <th className="py-3 px-4">Similaridade</th>
                    <th className="py-3 px-4">Ação</th>
                    <th className="py-3 px-4 text-right">Ver Perfil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredDetails && filteredDetails.length > 0 ? (
                    filteredDetails.map((item, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-4 font-mono text-zinc-500">{item.rowNumber}</td>
                        <td className="py-2.5 px-4 font-bold text-white">{item.playerName}</td>
                        <td className="py-2.5 px-4 text-zinc-400">{item.teamName || "—"}</td>
                        <td className="py-2.5 px-4 font-medium text-emerald-300">
                          {item.matchedAthleteName || item.playerName}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              item.similarityScore >= 90
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : item.similarityScore >= 75
                                ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10"
                                : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                            }`}
                          >
                            {item.similarityScore.toFixed(0)}% match
                          </Badge>
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                              item.action === "UPDATED"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-cyan-500/15 text-cyan-300"
                            }`}
                          >
                            {item.action === "UPDATED" ? "FUSÃO / ATUALIZADO" : "CRIADO"}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {item.athleteId && (
                            <Link
                              href={`/athletes/${item.athleteId}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                              <span>Abrir Perfil</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">
                        Nenhum registro encontrado para o filtro digitado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-4 text-xs text-zinc-400">
            <span>
              💡 Todos os perfis atualizados agora têm telemetria completa e disparam o Motor de Inferência Tática (Aulas 1, 2 e 3).
            </span>
            <Link
              href="/athletes"
              className="inline-flex items-center gap-2 font-bold text-emerald-400 hover:text-emerald-300"
            >
              <span>Ir para Catálogo de Atletas</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}
