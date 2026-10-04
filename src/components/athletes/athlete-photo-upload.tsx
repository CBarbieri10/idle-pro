"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Camera,
  Check,
  ImagePlus,
  Layers,
  Loader2,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Kind = "profile" | "action";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

// ─── Client-side transparency sniffing (mirrors src/lib/uploads.ts) ─────────

async function sniffAlpha(file: File): Promise<boolean> {
  const buf = new Uint8Array(await file.slice(0, 64 * 1024).arrayBuffer());
  const ascii = (s: number, e: number) => String.fromCharCode(...buf.slice(s, e));
  const view = new DataView(buf.buffer);

  if (buf[0] === 0x89 && ascii(1, 4) === "PNG") {
    if (buf[25] === 4 || buf[25] === 6) return true;
    let off = 8;
    while (off + 8 <= buf.length) {
      const len = view.getUint32(off);
      const type = ascii(off + 4, off + 8);
      if (type === "tRNS") return true;
      if (type === "IDAT" || type === "IEND") break;
      off += 12 + len;
    }
    return false;
  }
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") {
    const chunk = ascii(12, 16);
    if (chunk === "VP8X") return (buf[20] & 0x10) !== 0;
    if (chunk === "VP8L") return (buf[24] & 0x10) !== 0;
  }
  return false;
}

// ─── Photo Slot ──────────────────────────────────────────────────────────────

interface PhotoSlotProps {
  athleteId: string;
  kind: Kind;
  label: string;
  description: string;
  currentUrl: string | null;
  currentHasAlpha: boolean;
  icon: React.ReactNode;
}

interface Pending {
  file: File;
  url: string;
  hasAlpha: boolean;
}

function PhotoSlot({
  athleteId,
  kind,
  label,
  description,
  currentUrl,
  currentHasAlpha,
  icon,
}: PhotoSlotProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, startTransition] = useTransition();

  // Release object URLs when replaced/unmounted
  useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.url); }, [pending]);

  const displayedUrl = pending?.url ?? currentUrl;
  const displayedAlpha = pending ? pending.hasAlpha : currentHasAlpha;
  const aspect = kind === "profile" ? "aspect-[4/5]" : "aspect-video";

  async function selectFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Formato não suportado. Use PNG, JPG ou WebP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Arquivo muito grande. Máximo 5 MB.");
      return;
    }
    const hasAlpha = await sniffAlpha(file).catch(() => false);
    setPending({ file, url: URL.createObjectURL(file), hasAlpha });
  }

  function confirmUpload() {
    if (!pending) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", pending.file);
      const res = await fetch(`/api/athletes/${athleteId}/photos`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Erro ao enviar foto");
        return;
      }
      setPending(null);
      router.refresh();
    });
  }

  function removePhoto() {
    if (!confirm(`Remover ${label.toLowerCase()}?`)) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/athletes/${athleteId}/photos?kind=${kind}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Erro ao remover foto");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15 text-primary">
            {icon}
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground">{description}</p>
          </div>
        </div>
        {displayedUrl && displayedAlpha && (
          <span className="inline-flex items-center gap-1 rounded-full bg-chart-2/15 px-2 py-0.5 text-[10px] font-medium text-chart-2">
            <Layers className="h-3 w-3" />
            Transparente
          </span>
        )}
      </div>

      {/* Drop zone / Stage */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          selectFile(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "group relative overflow-hidden rounded-xl border transition-all duration-300",
          aspect,
          displayedUrl ? "border-border/50" : "border-dashed border-border/60",
          dragging && "border-primary ring-2 ring-primary/30 scale-[1.01]",
          pending && "ring-2 ring-primary/50 border-primary/60"
        )}
      >
        {displayedUrl ? (
          <>
            {displayedAlpha ? (
              // Cut-out: render on a premium stage, never crop
              <div className="photo-stage absolute inset-0">
                <Image
                  src={displayedUrl}
                  alt={label}
                  fill
                  className="object-contain object-bottom drop-shadow-[0_12px_24px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, 360px"
                  unoptimized
                />
              </div>
            ) : (
              <Image
                src={displayedUrl}
                alt={label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 100vw, 360px"
                unoptimized
              />
            )}

            {pending ? (
              <div className="absolute left-2 top-2 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground shadow">
                Pré-visualização
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all duration-200 group-hover:bg-black/45 group-hover:opacity-100">
                <button
                  type="button"
                  id={`photo-${kind}-replace`}
                  aria-label="Trocar foto"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-zinc-900 shadow-lg transition hover:scale-110 hover:bg-white"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  id={`photo-${kind}-remove`}
                  aria-label="Remover foto"
                  disabled={busy}
                  onClick={removePhoto}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-red-600 shadow-lg transition hover:scale-110 hover:bg-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            id={`photo-${kind}-add`}
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="photo-stage absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground/70 transition-colors hover:text-foreground"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur transition-transform group-hover:scale-110">
              <ImagePlus className="h-5 w-5" />
            </span>
            <span className="text-xs font-medium">Arraste ou clique para enviar</span>
            <span className="text-[10px] text-muted-foreground/60">
              PNG/WebP transparente recomendado
            </span>
          </button>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Confirm bar */}
      {pending && (
        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          <Button
            type="button"
            id={`photo-${kind}-confirm`}
            size="sm"
            className="flex-1 gap-1.5"
            disabled={busy}
            onClick={confirmUpload}
          >
            <Check className="h-3.5 w-3.5" />
            Confirmar envio
          </Button>
          <Button
            type="button"
            id={`photo-${kind}-cancel`}
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={busy}
            onClick={() => { setPending(null); setError(null); }}
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </Button>
        </div>
      )}

      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <X className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          selectFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface AthletePhotoUploadProps {
  athleteId: string;
  photoUrl: string | null;
  photoHasAlpha: boolean;
  actionPhotoUrl: string | null;
  actionPhotoHasAlpha: boolean;
}

export function AthletePhotoUpload({
  athleteId,
  photoUrl,
  photoHasAlpha,
  actionPhotoUrl,
  actionPhotoHasAlpha,
}: AthletePhotoUploadProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[2fr_3fr]">
        <PhotoSlot
          athleteId={athleteId}
          kind="profile"
          label="Foto de Perfil"
          description="Retrato oficial — ideal recortado"
          currentUrl={photoUrl}
          currentHasAlpha={photoHasAlpha}
          icon={<User className="h-3.5 w-3.5" />}
        />
        <PhotoSlot
          athleteId={athleteId}
          kind="action"
          label="Foto de Ação"
          description="Em campo, jogo ou treino"
          currentUrl={actionPhotoUrl}
          currentHasAlpha={actionPhotoHasAlpha}
          icon={<Camera className="h-3.5 w-3.5" />}
        />
      </div>
      <p className="text-center text-[10px] text-muted-foreground/60">
        Formatos aceitos: PNG, JPG e WebP · Máximo 5 MB · Imagens com fundo
        transparente são exibidas sobrepostas no cabeçalho do perfil
      </p>
    </div>
  );
}
