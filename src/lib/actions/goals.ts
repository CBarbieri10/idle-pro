"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const GoalSchema = z.object({
  athleteId: z.string().min(1, "Atleta é obrigatório"),
  title: z.string().min(2, "Título deve ter no mínimo 2 caracteres").max(140),
  metric: z.string().optional().nullable(),
  currentValue: z.coerce.number().default(0),
  targetValue: z.coerce.number().positive("A meta deve ser um número maior que zero"),
  unit: z.string().default("absoluto"),
  category: z.string().min(1, "Categoria é obrigatória"),
  objective: z.string().optional().nullable(),
});

export async function getGoalsByAthlete(athleteId: string) {
  return prisma.athleteGoal.findMany({
    where: { athleteId },
    orderBy: [
      { isCompleted: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function createGoal(formData: z.infer<typeof GoalSchema>) {
  const validated = GoalSchema.parse(formData);
  const isCompleted = validated.currentValue >= validated.targetValue;

  const goal = await prisma.athleteGoal.create({
    data: {
      athleteId: validated.athleteId,
      title: validated.title,
      metric: validated.metric?.trim() ? validated.metric.trim() : null,
      currentValue: validated.currentValue,
      targetValue: validated.targetValue,
      unit: validated.unit,
      category: validated.category,
      objective: validated.objective?.trim() ? validated.objective.trim() : null,
      isCompleted,
    },
  });

  revalidatePath(`/athletes/${validated.athleteId}`);
  return { success: true, goal };
}

export async function updateGoalProgress(
  id: string,
  athleteId: string,
  currentValue: number
) {
  const goal = await prisma.athleteGoal.findUnique({
    where: { id },
  });

  if (!goal) {
    throw new Error("Meta não encontrada");
  }

  const isCompleted = currentValue >= goal.targetValue;

  const updated = await prisma.athleteGoal.update({
    where: { id },
    data: {
      currentValue,
      isCompleted,
    },
  });

  revalidatePath(`/athletes/${athleteId}`);
  return { success: true, goal: updated };
}

export async function updateGoal(
  id: string,
  athleteId: string,
  formData: Partial<z.infer<typeof GoalSchema>>
) {
  const existing = await prisma.athleteGoal.findUnique({ where: { id } });
  if (!existing) throw new Error("Meta não encontrada");

  const newCurrent = formData.currentValue !== undefined ? formData.currentValue : existing.currentValue;
  const newTarget = formData.targetValue !== undefined ? formData.targetValue : existing.targetValue;
  const isCompleted = newCurrent >= newTarget;

  const updated = await prisma.athleteGoal.update({
    where: { id },
    data: {
      ...formData,
      isCompleted,
    },
  });

  revalidatePath(`/athletes/${athleteId}`);
  return { success: true, goal: updated };
}

export async function deleteGoal(id: string, athleteId: string) {
  await prisma.athleteGoal.delete({
    where: { id },
  });

  revalidatePath(`/athletes/${athleteId}`);
  return { success: true };
}
