import { Position, FootPreference } from "@prisma/client";

export const POSITION_LABELS: Record<Position, string> = {
  GOALKEEPER: "Goleiro",
  RIGHT_BACK: "Lateral Direito",
  CENTER_BACK: "Zagueiro",
  LEFT_BACK: "Lateral Esquerdo",
  DEFENSIVE_MID: "Volante",
  CENTRAL_MID: "Meia Central",
  ATTACKING_MID: "Meia Atacante",
  RIGHT_WING: "Ponta Direita",
  LEFT_WING: "Ponta Esquerda",
  STRIKER: "Centroavante",
  FORWARD: "Atacante",
};

export const FOOT_LABELS: Record<FootPreference, string> = {
  RIGHT: "Direito",
  LEFT: "Esquerdo",
  BOTH: "Ambidestro",
};

export const POSITION_COLORS: Record<Position, string> = {
  GOALKEEPER: "text-yellow-400 bg-yellow-400/10",
  RIGHT_BACK: "text-blue-400 bg-blue-400/10",
  CENTER_BACK: "text-blue-400 bg-blue-400/10",
  LEFT_BACK: "text-blue-400 bg-blue-400/10",
  DEFENSIVE_MID: "text-green-400 bg-green-400/10",
  CENTRAL_MID: "text-green-400 bg-green-400/10",
  ATTACKING_MID: "text-orange-400 bg-orange-400/10",
  RIGHT_WING: "text-red-400 bg-red-400/10",
  LEFT_WING: "text-red-400 bg-red-400/10",
  STRIKER: "text-red-400 bg-red-400/10",
  FORWARD: "text-red-400 bg-red-400/10",
};

export function formatHeight(cm: number | null | undefined): string {
  if (!cm) return "—";
  return `${cm} cm`;
}

export function formatWeight(kg: number | null | undefined): string {
  if (!kg) return "—";
  return `${kg} kg`;
}

export function formatAge(birthDate: Date | null | undefined): string {
  if (!birthDate) return "—";
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    return `${age - 1} anos`;
  }
  return `${age} anos`;
}

export function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}
