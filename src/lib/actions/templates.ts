"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { MetricSource } from "@prisma/client";
import { normalizeHeader, type ColumnTarget } from "@/lib/import/mapping";

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Graceful fallback when invoked outside Next.js request context (e.g. tests)
  }
}

export type StoredColumnMapping = {
  header: string;
  target: ColumnTarget;
};

export type StoredColumnsMap = Record<string, StoredColumnMapping>;

const TemplateSchema = z.object({
  name: z.string().trim().min(1, "Nome do template é obrigatório"),
  description: z.string().trim().optional().nullable(),
  source: z.nativeEnum(MetricSource).default("OTHER"),
  columns: z.record(
    z.string(),
    z.object({
      header: z.string(),
      target: z.string(),
    })
  ),
});

export type MappingTemplateDTO = {
  id: string;
  name: string;
  description: string | null;
  source: MetricSource;
  columns: StoredColumnsMap;
  createdAt: Date;
  updatedAt: Date;
};

export async function getMappingTemplates(): Promise<MappingTemplateDTO[]> {
  const templates = await prisma.mappingTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    source: t.source,
    columns: t.columns as StoredColumnsMap,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));
}

export async function saveMappingTemplate(input: {
  id?: string;
  name: string;
  description?: string | null;
  source: MetricSource;
  columns: StoredColumnsMap;
}): Promise<{ ok: true; data: MappingTemplateDTO } | { ok: false; error: string }> {
  try {
    const validated = TemplateSchema.parse(input);

    let template;
    if (input.id) {
      template = await prisma.mappingTemplate.update({
        where: { id: input.id },
        data: {
          name: validated.name,
          description: validated.description ?? null,
          source: validated.source,
          columns: validated.columns,
        },
      });
    } else {
      template = await prisma.mappingTemplate.upsert({
        where: { name: validated.name },
        create: {
          name: validated.name,
          description: validated.description ?? null,
          source: validated.source,
          columns: validated.columns,
        },
        update: {
          description: validated.description ?? null,
          source: validated.source,
          columns: validated.columns,
        },
      });
    }

    safeRevalidate("/matches/import");

    return {
      ok: true,
      data: {
        id: template.id,
        name: template.name,
        description: template.description,
        source: template.source,
        columns: template.columns as StoredColumnsMap,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      },
    };
  } catch (err) {
    console.error("Save template error:", err);
    if (err instanceof z.ZodError) {
      return { ok: false, error: err.errors[0]?.message ?? "Dados inválidos" };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao salvar template de mapeamento.",
    };
  }
}

export async function deleteMappingTemplate(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.mappingTemplate.delete({ where: { id } });
    safeRevalidate("/matches/import");
    return { ok: true };
  } catch (err) {
    console.error("Delete template error:", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erro ao excluir template.",
    };
  }
}

export type BestMatchResult = {
  template: MappingTemplateDTO;
  score: number; // 0 to 1
  matchedColumnsCount: number;
  totalTemplateColumnsCount: number;
};

/**
 * Finds the template with the highest matching score for a given list of uploaded headers.
 */
export async function findBestMatchingTemplate(
  uploadedHeaders: string[]
): Promise<BestMatchResult | null> {
  const templates = await getMappingTemplates();
  if (templates.length === 0) return null;

  const normalizedUploadHeaders = new Set(
    uploadedHeaders.map((h) => normalizeHeader(h)).filter(Boolean)
  );
  if (normalizedUploadHeaders.size === 0) return null;

  let bestMatch: BestMatchResult | null = null;

  for (const t of templates) {
    const templateKeys = Object.keys(t.columns);
    if (templateKeys.length === 0) continue;

    let matches = 0;
    for (const key of templateKeys) {
      if (normalizedUploadHeaders.has(key)) {
        matches++;
      }
    }

    const score = matches / templateKeys.length;
    // Require at least 3 matching columns and score >= 0.35
    if (matches >= 3 && score >= 0.35) {
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = {
          template: t,
          score,
          matchedColumnsCount: matches,
          totalTemplateColumnsCount: templateKeys.length,
        };
      }
    }
  }

  return bestMatch;
}
