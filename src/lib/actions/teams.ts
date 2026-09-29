"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ─── Schemas ────────────────────────────────────────────────────────────────

const LeagueSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  country: z.string().min(1, "País é obrigatório"),
  season: z.string().min(1, "Temporada é obrigatória"),
});

const TeamSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  shortName: z.string().optional(),
  country: z.string().min(1, "País é obrigatório"),
  city: z.string().optional(),
  leagueId: z.string().optional(),
});

// ─── League Actions ─────────────────────────────────────────────────────────

export async function getLeagues() {
  return prisma.league.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { teams: true } } },
  });
}

export async function createLeague(formData: FormData) {
  const data = LeagueSchema.parse({
    name: formData.get("name"),
    country: formData.get("country"),
    season: formData.get("season"),
  });
  await prisma.league.create({ data });
  revalidatePath("/league");
  revalidatePath("/teams");
}

export async function updateLeague(id: string, formData: FormData) {
  const data = LeagueSchema.parse({
    name: formData.get("name"),
    country: formData.get("country"),
    season: formData.get("season"),
  });
  await prisma.league.update({ where: { id }, data });
  revalidatePath("/league");
  revalidatePath("/teams");
}

export async function deleteLeague(id: string) {
  await prisma.league.delete({ where: { id } });
  revalidatePath("/league");
  revalidatePath("/teams");
}

// ─── Team Actions ───────────────────────────────────────────────────────────

export async function getTeams() {
  return prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      league: true,
      _count: { select: { athletes: true } },
    },
  });
}

export async function getTeamById(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: {
      league: true,
      athletes: { orderBy: { name: "asc" } },
    },
  });
}

export async function createTeam(formData: FormData) {
  const data = TeamSchema.parse({
    name: formData.get("name"),
    shortName: formData.get("shortName") || undefined,
    country: formData.get("country"),
    city: formData.get("city") || undefined,
    leagueId: formData.get("leagueId") || undefined,
  });
  await prisma.team.create({ data });
  revalidatePath("/teams");
  revalidatePath("/athletes");
}

export async function updateTeam(id: string, formData: FormData) {
  const data = TeamSchema.parse({
    name: formData.get("name"),
    shortName: formData.get("shortName") || undefined,
    country: formData.get("country"),
    city: formData.get("city") || undefined,
    leagueId: formData.get("leagueId") || undefined,
  });
  await prisma.team.update({ where: { id }, data });
  revalidatePath("/teams");
  revalidatePath("/athletes");
}

export async function deleteTeam(id: string) {
  await prisma.team.delete({ where: { id } });
  revalidatePath("/teams");
  revalidatePath("/athletes");
}
