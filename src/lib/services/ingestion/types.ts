export type DetectedFileType = "ATHLETE" | "MATCH" | "TEAM";

export interface ImportDetailItem {
  rowNumber: number;
  playerName: string;
  teamName: string;
  matchedAthleteName?: string;
  athleteId?: string;
  similarityScore: number;
  action: "UPDATED" | "CREATED" | "SKIPPED";
}

export interface ImportResultSummary {
  success: boolean;
  detectedType: DetectedFileType;
  detectedTypeLabel: string;
  totalRows: number;
  matchedCount: number;
  createdCount: number;
  errorCount: number;
  details: ImportDetailItem[];
  error?: string;
}

export interface IngestionAgent {
  readonly agentName: string;
  readonly supportedType: DetectedFileType;
  process(
    rawRows: Record<string, unknown>[],
    fileName: string,
    detectedTypeLabel: string
  ): Promise<ImportResultSummary>;
}
