"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const VideoLinkSchema = z.object({
  athleteId: z.string().min(1, "Atleta é obrigatório"),
  matchId: z.string().optional().nullable(),
  url: z.string().url("URL de vídeo inválida. Deve iniciar com http:// ou https://"),
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres").max(120),
  category: z.string().min(1, "Categoria tática é obrigatória"),
  description: z.string().optional().nullable(),
});

export async function getVideoLinksByAthlete(athleteId: string) {
  return prisma.videoLink.findMany({
    where: { athleteId },
    include: {
      match: {
        select: {
          id: true,
          round: true,
          competition: true,
          opponentName: true,
          date: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createVideoLink(formData: z.infer<typeof VideoLinkSchema>) {
  const validated = VideoLinkSchema.parse(formData);

  const video = await prisma.videoLink.create({
    data: {
      athleteId: validated.athleteId,
      matchId: validated.matchId && validated.matchId !== "none" ? validated.matchId : null,
      url: validated.url,
      title: validated.title,
      category: validated.category,
      description: validated.description?.trim() ? validated.description.trim() : null,
    },
  });

  revalidatePath(`/athletes/${validated.athleteId}`);
  return { success: true, video };
}

export async function deleteVideoLink(id: string, athleteId: string) {
  await prisma.videoLink.delete({
    where: { id },
  });

  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
}
