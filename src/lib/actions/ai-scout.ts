"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  generateAthleteTacticalDossier,
  askScoutingCopilot,
  type TacticalDossierSummary,
} from "@/lib/ai-scout";

/**
 * Server Action para gerar e persistir o Parecer Tático com IA no cadastro do atleta
 */
export async function generateAthleteTacticalSummaryAction(
  athleteId: string
): Promise<{ success: boolean; data?: TacticalDossierSummary; error?: string }> {
  try {
    const summary = await generateAthleteTacticalDossier(athleteId);

    await prisma.athlete.update({
      where: { id: athleteId },
      data: {
        tacticalTitle: summary.tacticalTitle,
        tacticalSummary: summary.tacticalSummary,
        tacticalStrengths: summary.strengths,
        tacticalWeaknesses: summary.weaknesses,
      },
    });

    try {
      revalidatePath(`/athletes/${athleteId}`);
      revalidatePath(`/athletes/${athleteId}/raio-x`);
    } catch {
      // Ignorar se fora do ciclo de renderização
    }

    return { success: true, data: summary };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro desconhecido ao gerar parecer tático";
    return { success: false, error: message };
  }
}

/**
 * Server Action para consultar o Copilot de Scouting via chat
 */
export async function askScoutingCopilotAction(
  userQuery: string,
  history: Array<{ role: "user" | "assistant"; content: string }> = []
) {
  try {
    return await askScoutingCopilot(userQuery, history);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Erro ao consultar Copilot de IA";
    return {
      response: `Desculpe, ocorreu uma instabilidade momentânea no processamento do motor de IA: ${message}`,
      matchedAthletes: [],
    };
  }
}
