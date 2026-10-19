"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface AgendaEventItem {
  id: string;
  title: string;
  type: "session" | "material" | "general";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  color: string;
  description?: string | null;
  athleteId?: string | null;
  athlete?: {
    id: string;
    name: string;
    photoUrl: string | null;
  } | null;
}

export async function getAgendaEvents(): Promise<AgendaEventItem[]> {
  let events = await prisma.agendaEvent.findMany({
    include: {
      athlete: {
        select: {
          id: true,
          name: true,
          photoUrl: true,
        },
      },
    },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });

  if (events.length === 0) {
    const defaultEvents = [
      { title: "Analisar clássico Sub-20", type: "session", date: new Date("2026-10-05T12:00:00Z"), time: "10:00", color: "bg-emerald-500", description: "Avaliação do 1x1 dos pontas e pressão pós-perda" },
      { title: "Revisar relatório tático", type: "material", date: new Date("2026-10-06T12:00:00Z"), time: "14:00", color: "bg-amber-500", description: "Consolidação de pareceres de scouting para diretoria" },
      { title: "Corinthians x Palmeiras", type: "session", date: new Date("2026-10-07T12:00:00Z"), time: "16:00", color: "bg-purple-500", description: "Decupagem em tempo real e análise de bola parada" },
      { title: "Scout quantitativo", type: "material", date: new Date("2026-10-08T12:00:00Z"), time: "09:00", color: "bg-blue-500", description: "Varredura do catálogo Moneyball por atacantes de alto xG/shot" },
      { title: "Decupagem atacante", type: "session", date: new Date("2026-10-07T12:00:00Z"), time: "18:00", color: "bg-zinc-500", description: "Estudo de movimentação em ponto cego" },
      { title: "Reunião de Diretoria", type: "general", date: new Date("2026-10-10T12:00:00Z"), time: "11:00", color: "bg-zinc-500", description: "Apresentação dos dossiês Raio-X dos reforços" },
    ];

    await prisma.agendaEvent.createMany({ data: defaultEvents });

    events = await prisma.agendaEvent.findMany({
      include: {
        athlete: {
          select: {
            id: true,
            name: true,
            photoUrl: true,
          },
        },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
  }

  return events.map((e) => ({
    id: e.id,
    title: e.title,
    type: (e.type as "session" | "material" | "general") || "session",
    date: e.date.toISOString().split("T")[0],
    time: e.time || "10:00",
    color: e.color || "bg-emerald-500",
    description: e.description,
    athleteId: e.athleteId,
    athlete: e.athlete,
  }));
}

export async function createAgendaEvent(data: {
  title: string;
  type?: "session" | "material" | "general";
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  color?: string;
  description?: string;
  athleteId?: string;
}) {
  const dateObj = new Date(`${data.date}T12:00:00.000Z`);

  const created = await prisma.agendaEvent.create({
    data: {
      title: data.title,
      type: data.type || "session",
      date: dateObj,
      time: data.time || "10:00",
      color: data.color || "bg-emerald-500",
      description: data.description || null,
      athleteId: data.athleteId || null,
    },
  });

  revalidatePath("/agenda");
  return {
    id: created.id,
    title: created.title,
    type: created.type as "session" | "material" | "general",
    date: data.date,
    time: created.time || "10:00",
    color: created.color || "bg-emerald-500",
  };
}

export async function updateAgendaEvent(
  id: string,
  data: {
    title?: string;
    type?: "session" | "material" | "general";
    date?: string;
    time?: string;
    color?: string;
    description?: string;
  }
) {
  const payload: Record<string, unknown> = {};
  if (data.title !== undefined) payload.title = data.title;
  if (data.type !== undefined) payload.type = data.type;
  if (data.time !== undefined) payload.time = data.time;
  if (data.color !== undefined) payload.color = data.color;
  if (data.description !== undefined) payload.description = data.description;
  if (data.date !== undefined) {
    payload.date = new Date(`${data.date}T12:00:00.000Z`);
  }

  const updated = await prisma.agendaEvent.update({
    where: { id },
    data: payload,
  });

  revalidatePath("/agenda");
  return updated;
}

export async function deleteAgendaEvent(id: string) {
  await prisma.agendaEvent.delete({
    where: { id },
  });

  revalidatePath("/agenda");
  return { success: true };
}
