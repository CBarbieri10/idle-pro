"use server";

import * as XLSX from "xlsx";
import {
  type DetectedFileType,
  type ImportDetailItem,
  type ImportResultSummary,
  getIngestionAgent,
  athleteAgent,
  matchAgent,
  teamAgent,
} from "@/lib/services/ingestion";

export type { DetectedFileType, ImportDetailItem, ImportResultSummary };

/**
 * Passo 1: Auto-Detect & Roteamento Inteligente (Maestro)
 * Detecta o tipo do arquivo analisando nome do arquivo e cabeçalhos da planilha
 * Regras estritas:
 * - 'jogador'/'athlete'/'player' em nome ou colunas -> ATHLETE
 * - 'partida'/'match'/'jogo'/'confronto' em nome ou colunas -> MATCH
 * - 'time'/'equipe'/'team'/'clube' (sem 'jogador') -> TEAM
 */
export async function detectFileType(fileName: string, headers: string[]): Promise<DetectedFileType> {
  const lowerFileName = (fileName || "").toLowerCase();
  const lowerHeaders = (headers || []).map((h) => String(h).toLowerCase().trim());

  // 1. Identificadores de Jogador/Atleta
  const hasAthleteHeader = lowerHeaders.some(
    (h) =>
      h === "jogador" ||
      h === "player" ||
      h === "athlete" ||
      h === "atleta" ||
      h === "№" ||
      h === "no" ||
      h.includes("jogador") ||
      h.includes("player") ||
      h.includes("minutos jogados")
  );
  const hasAthleteName =
    lowerFileName.includes("jogador") ||
    lowerFileName.includes("athlete") ||
    lowerFileName.includes("player") ||
    lowerFileName.includes("atleta");

  // 2. Identificadores de Partida/Confronto
  const hasMatchHeader = lowerHeaders.some(
    (h) =>
      h === "match" ||
      h.includes("match") ||
      h.includes("partida") ||
      h.includes("jogo") ||
      h.includes("confronto") ||
      h.includes("mandante") ||
      h.includes("visitante") ||
      h.includes("tática (inicial)") ||
      h.includes("tatica (inicial)") ||
      h.includes("posse de bola")
  );
  const hasMatchName =
    lowerFileName.includes("partida") ||
    lowerFileName.includes("match") ||
    lowerFileName.includes("jogo") ||
    lowerFileName.includes("fixtures") ||
    lowerFileName.includes("resultado");

  // 3. Identificadores de Time/Equipe (sem jogador)
  const hasTeamHeader = lowerHeaders.some(
    (h) =>
      h === "time" ||
      h === "equipe" ||
      h === "team" ||
      h === "clube" ||
      h === "club"
  );
  const hasTeamName =
    (lowerFileName.includes("time") ||
      lowerFileName.includes("team") ||
      lowerFileName.includes("equipe") ||
      lowerFileName.includes("clube")) &&
    !hasAthleteName;

  // Priorização estrita
  if (hasAthleteHeader || hasAthleteName) {
    return "ATHLETE";
  }

  if (hasMatchHeader || hasMatchName) {
    return "MATCH";
  }

  if (hasTeamHeader || hasTeamName) {
    return "TEAM";
  }

  // Fallback heurístico: se tem 'Time' ou 'Equipe' e não tem 'Jogador'
  if (lowerHeaders.includes("time") && !lowerHeaders.includes("jogador")) {
    return "TEAM";
  }

  return "ATHLETE";
}

export async function getDetectedTypeLabel(type: DetectedFileType): Promise<string> {
  switch (type) {
    case "ATHLETE":
      return "Planilha de Atletas (ATHLETE)";
    case "MATCH":
      return "Planilha de Partidas / Rodadas (MATCH)";
    case "TEAM":
      return "Planilha de Clubes & Comportamento Coletivo (TEAM)";
  }
}

/**
 * Server Action Principal (Maestro da Ingestão):
 * Processa o arquivo Excel ou CSV enviado via Dropzone com Auto-Detect automático
 * e delegação direta para o Agente Especializado correspondente (Strategy Pattern).
 */
export async function importWyscoutSpreadsheetAction(
  formData: FormData
): Promise<ImportResultSummary> {
  try {
    const file = formData.get("file") as File | null;
    if (!file) {
      return {
        success: false,
        detectedType: "ATHLETE",
        detectedTypeLabel: "Indefinido",
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 1,
        details: [],
        error: "Nenhum arquivo enviado. Por favor, arraste um arquivo .xlsx ou .csv.",
      };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
      dense: true,
    });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return {
        success: false,
        detectedType: "ATHLETE",
        detectedTypeLabel: "Indefinido",
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 1,
        details: [],
        error: "A planilha enviada está vazia ou não contém abas válidas.",
      };
    }

    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    if (rawRows.length === 0) {
      return {
        success: false,
        detectedType: "ATHLETE",
        detectedTypeLabel: "Indefinido",
        totalRows: 0,
        matchedCount: 0,
        createdCount: 0,
        errorCount: 0,
        details: [],
        error: "A planilha não contém linhas de dados preenchidas.",
      };
    }

    // Extrair cabeçalhos da primeira linha para detecção
    const headers = Object.keys(rawRows[0] || {});
    const detectedType = await detectFileType(file.name, headers);
    const detectedTypeLabel = await getDetectedTypeLabel(detectedType);

    // Delegação para o Agente Fixo Especializado
    const agent = getIngestionAgent(detectedType);
    return await agent.process(rawRows, file.name, detectedTypeLabel);
  } catch (error) {
    console.error("Falha fatal na importação da planilha:", error);
    return {
      success: false,
      detectedType: "ATHLETE",
      detectedTypeLabel: "Erro",
      totalRows: 0,
      matchedCount: 0,
      createdCount: 0,
      errorCount: 1,
      details: [],
      error: error instanceof Error ? error.message : "Erro desconhecido ao processar arquivo.",
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delegados de Compatibilidade Retrógrada
// ─────────────────────────────────────────────────────────────────────────────
export async function processAthleteFile(
  rawRows: Record<string, unknown>[],
  fileName: string,
  detectedTypeLabel: string
): Promise<ImportResultSummary> {
  return athleteAgent.process(rawRows, fileName, detectedTypeLabel);
}

export async function processMatchFile(
  rawRows: Record<string, unknown>[],
  fileName: string,
  detectedTypeLabel: string
): Promise<ImportResultSummary> {
  return matchAgent.process(rawRows, fileName, detectedTypeLabel);
}

export async function processTeamFile(
  rawRows: Record<string, unknown>[],
  fileName: string,
  detectedTypeLabel: string
): Promise<ImportResultSummary> {
  return teamAgent.process(rawRows, fileName, detectedTypeLabel);
}
