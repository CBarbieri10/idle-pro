// Server-side only (uses fs) — import only from API routes / server actions.
import { mkdir, writeFile, rm, unlink } from "fs/promises";
import path from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5 MB
const PUBLIC_DIR = path.join(process.cwd(), "public");
const ATHLETES_UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads", "athletes");

export type ImageFormat = "png" | "jpg" | "webp";

export interface InspectedImage {
  format: ImageFormat;
  hasAlpha: boolean;
}

// ─── Binary inspection ───────────────────────────────────────────────────────
// Validates the real file signature (never trust the client MIME / extension)
// and detects transparency so the UI can render cut-outs over a backdrop.

function inspectPng(buf: Buffer): boolean {
  // IHDR color type at byte 25: 4 = gray+alpha, 6 = RGBA
  const colorType = buf[25];
  if (colorType === 4 || colorType === 6) return true;
  // Palette / truecolor images may carry transparency via a tRNS chunk
  let offset = 8;
  while (offset + 8 <= buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString("ascii", offset + 4, offset + 8);
    if (type === "tRNS") return true;
    if (type === "IDAT" || type === "IEND") break;
    offset += 12 + length;
  }
  return false;
}

function inspectWebp(buf: Buffer): boolean {
  const chunk = buf.toString("ascii", 12, 16);
  if (chunk === "VP8X") return (buf[20] & 0x10) !== 0; // extended: alpha flag
  if (chunk === "VP8L") return (buf[24] & 0x10) !== 0; // lossless: alpha_is_used bit
  return false; // "VP8 " simple lossy never has alpha
}

export function inspectImage(buf: Buffer): InspectedImage | null {
  if (buf.length < 30) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.readUInt32BE(0) === 0x89504e47 && buf.readUInt32BE(4) === 0x0d0a1a0a) {
    return { format: "png", hasAlpha: inspectPng(buf) };
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { format: "jpg", hasAlpha: false };
  }
  // WebP: "RIFF" .... "WEBP"
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { format: "webp", hasAlpha: inspectWebp(buf) };
  }
  return null;
}

// ─── Storage (local, MVP — ADR-008) ──────────────────────────────────────────

function athleteDir(athleteId: string) {
  // ids are cuid/uuid; strip anything unexpected to prevent path traversal
  const safeId = athleteId.replace(/[^a-zA-Z0-9_-]/g, "");
  if (!safeId) throw new Error("ID de atleta inválido");
  return { safeId, dir: path.join(ATHLETES_UPLOAD_DIR, safeId) };
}

export async function saveAthletePhoto(
  athleteId: string,
  kind: "profile" | "action",
  buf: Buffer,
  format: ImageFormat
): Promise<string> {
  const { safeId, dir } = athleteDir(athleteId);
  await mkdir(dir, { recursive: true });
  const filename = `${kind}-${Date.now()}.${format}`;
  await writeFile(path.join(dir, filename), buf);
  return `/uploads/athletes/${safeId}/${filename}`;
}

/** Removes a previously stored photo. Silently ignores external/missing files. */
export async function deleteStoredPhoto(publicUrl: string | null | undefined) {
  if (!publicUrl || !publicUrl.startsWith("/uploads/athletes/")) return;
  const filePath = path.normalize(path.join(PUBLIC_DIR, publicUrl));
  if (!filePath.startsWith(ATHLETES_UPLOAD_DIR + path.sep)) return;
  await unlink(filePath).catch(() => {});
}

export async function deleteAthleteUploads(athleteId: string) {
  const { dir } = athleteDir(athleteId);
  await rm(dir, { recursive: true, force: true });
}
