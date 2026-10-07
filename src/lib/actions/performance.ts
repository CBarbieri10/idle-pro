"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Busca o time marcado como o clube principal (Meu Elenco)
 */
export async function getMyTeam() {
  return await prisma.team.findFirst({
    where: { isMyTeam: true },
    include: {
      athletes: {
        orderBy: { name: "asc" },
      },
    },
  });
}

/**
 * Define um time como o "Meu Elenco"
 */
export async function setMyTeam(teamId: string) {
  // Reset all
  await prisma.team.updateMany({
    where: { isMyTeam: true },
    data: { isMyTeam: false },
  });

  // Set the new one
  const updated = await prisma.team.update({
    where: { id: teamId },
    data: { isMyTeam: true },
  });

  revalidatePath("/performance");
  return updated;
}

/**
 * Cria ou atualiza um recorte de vídeo tático
 */
export async function saveTacticalClip(data: {
  id?: string;
  url: string;
  title?: string;
  category: string;
  description?: string;
  athleteId: string;
  matchId?: string;
  startTime?: number;
  endTime?: number;
}) {
  const { id, ...payload } = data;

  let clip;
  if (id) {
    clip = await prisma.videoLink.update({
      where: { id },
      data: payload,
    });
  } else {
    clip = await prisma.videoLink.create({
      data: payload,
    });
  }

  revalidatePath(`/performance/athlete/${data.athleteId}`);
  return clip;
}

/**
 * Deleta um recorte de vídeo tático
 */
export async function deleteTacticalClip(id: string, athleteId: string) {
  await prisma.videoLink.delete({
    where: { id },
  });
  revalidatePath(`/performance/athlete/${athleteId}`);
}

/**
 * Busca vídeos táticos filtrados (por atleta e/ou partida)
 */
export async function getTacticalClips(athleteId: string, matchId?: string) {
  return await prisma.videoLink.findMany({
    where: {
      athleteId,
      ...(matchId ? { matchId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      match: true,
    },
  });
}
