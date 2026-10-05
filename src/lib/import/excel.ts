import * as XLSX from "xlsx";
import { type Cell, type Grid, parseCsv, TEMPLATE_HEADERS, TEMPLATE_EXAMPLE } from "./mapping";

/**
 * Parses an uploaded File (Excel .xlsx/.xlsm/.xls or CSV) into a 2D Grid (Cell[][]).
 */
export async function parseSpreadsheetFile(file: File): Promise<Grid> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv" || file.type === "text/csv") {
    const text = await file.text();
    return parseCsv(text);
  }

  // Excel binary parsing via SheetJS
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: "array",
    cellDates: true,
    dense: true,
  });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("A planilha não contém nenhuma aba com dados.");
  }

  const sheet = workbook.Sheets[firstSheetName];
  if (!sheet) {
    throw new Error("Não foi possível ler a primeira aba da planilha.");
  }

  // Convert worksheet to array of arrays (Grid)
  const rawGrid = XLSX.utils.sheet_to_json<Cell[]>(sheet, {
    header: 1,
    defval: "",
    blankrows: false,
  });

  return rawGrid as Grid;
}

/**
 * Generates an Excel (.xlsx) template file with example data and formatted columns.
 */
export function generateTemplateXlsx(): Uint8Array {
  const data = [TEMPLATE_HEADERS, TEMPLATE_EXAMPLE];
  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set friendly column widths
  ws["!cols"] = TEMPLATE_HEADERS.map((h) => ({
    wch: Math.max(h.length + 4, 12),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Métricas");

  const out = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  return new Uint8Array(out);
}

/**
 * Triggers a browser download of a generated file.
 */
export function triggerFileDownload(content: BlobPart | Uint8Array, filename: string, mimeType: string) {
  const blob = new Blob([content as unknown as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
