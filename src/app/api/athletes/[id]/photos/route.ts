import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  MAX_PHOTO_BYTES,
  inspectImage,
  saveAthletePhoto,
  deleteStoredPhoto,
} from "@/lib/uploads";

type Kind = "profile" | "action";

const FIELDS = {
  profile: { url: "photoUrl", alpha: "photoHasAlpha" },
  action: { url: "actionPhotoUrl", alpha: "actionPhotoHasAlpha" },
} as const;

function parseKind(value: unknown): Kind | null {
  return value === "profile" || value === "action" ? value : null;
}

function revalidate(id: string) {
  revalidatePath("/athletes");
  revalidatePath(`/athletes/${id}`);
}

/**
 * POST /api/athletes/:id/photos
 * multipart/form-data: { kind: "profile" | "action", file: File }
 * Accepts PNG, JPG and WebP (validated by binary signature). Transparency in
 * PNG/WebP is detected and persisted so the profile can render cut-outs.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const athlete = await prisma.athlete.findUnique({ where: { id } });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const kind = parseKind(formData?.get("kind"));
  const file = formData?.get("file");

  if (!kind) {
    return NextResponse.json({ error: "Categoria de foto inválida" }, { status: 400 });
  }
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 413 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const image = inspectImage(buf);
  if (!image) {
    return NextResponse.json(
      { error: "Formato não suportado. Use PNG, JPG ou WebP." },
      { status: 415 }
    );
  }

  const fields = FIELDS[kind];
  const previousUrl = athlete[fields.url];
  const url = await saveAthletePhoto(id, kind, buf, image.format);

  const updated = await prisma.athlete.update({
    where: { id },
    data: { [fields.url]: url, [fields.alpha]: image.hasAlpha },
    select: {
      id: true,
      photoUrl: true,
      photoHasAlpha: true,
      actionPhotoUrl: true,
      actionPhotoHasAlpha: true,
    },
  });

  await deleteStoredPhoto(previousUrl);
  revalidate(id);

  return NextResponse.json({ ...updated, format: image.format, hasAlpha: image.hasAlpha });
}

/** DELETE /api/athletes/:id/photos?kind=profile|action */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  if (!kind) {
    return NextResponse.json({ error: "Categoria de foto inválida" }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { id } });
  if (!athlete) {
    return NextResponse.json({ error: "Atleta não encontrado" }, { status: 404 });
  }

  const fields = FIELDS[kind];
  await prisma.athlete.update({
    where: { id },
    data: { [fields.url]: null, [fields.alpha]: false },
  });
  await deleteStoredPhoto(athlete[fields.url]);
  revalidate(id);

  return NextResponse.json({ ok: true });
}
