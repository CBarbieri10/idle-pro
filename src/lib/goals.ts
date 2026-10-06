export const GOAL_CATEGORIES = [
  "Técnica",
  "Tática",
  "Física",
  "Mental / Comportamental",
] as const;

export type GoalCategory = (typeof GOAL_CATEGORIES)[number] | string;

export const GOAL_UNITS = [
  { value: "absoluto", label: "Absoluto (Qtd)" },
  { value: "%", label: "Percentual (%)" },
  { value: "gols", label: "Gols" },
  { value: "assists", label: "Assistências" },
  { value: "/90 min", label: "Por 90 min (/90)" },
  { value: "km/h", label: "Velocidade (km/h)" },
  { value: "minutos", label: "Minutos jogados" },
] as const;

export function calculateGoalProgress(current: number, target: number): {
  percent: number;
  rawPercent: number;
  isCompleted: boolean;
  colorClass: string;
  progressBarClass: string;
  badgeClass: string;
} {
  if (target <= 0) {
    return {
      percent: 0,
      rawPercent: 0,
      isCompleted: false,
      colorClass: "text-zinc-400",
      progressBarClass: "bg-zinc-500",
      badgeClass: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
    };
  }

  const rawPercent = Math.round((current / target) * 100);
  const percent = Math.min(100, Math.max(0, rawPercent));
  const isCompleted = current >= target;

  if (isCompleted || rawPercent >= 100) {
    return {
      percent,
      rawPercent,
      isCompleted: true,
      colorClass: "text-emerald-400",
      progressBarClass: "bg-emerald-500",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }

  if (percent >= 80) {
    return {
      percent,
      rawPercent,
      isCompleted: false,
      colorClass: "text-emerald-400",
      progressBarClass: "bg-emerald-500",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    };
  }

  if (percent >= 50) {
    return {
      percent,
      rawPercent,
      isCompleted: false,
      colorClass: "text-amber-400",
      progressBarClass: "bg-amber-500",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    };
  }

  return {
    percent,
    rawPercent,
    isCompleted: false,
    colorClass: "text-indigo-400",
    progressBarClass: "bg-indigo-500",
    badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  };
}

export function getCategoryBadgeClass(category: string): string {
  switch (category.toLowerCase()) {
    case "técnica":
    case "tecnica":
      return "bg-rose-500/15 text-rose-400 border-rose-500/30";
    case "tática":
    case "tatica":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "física":
    case "fisica":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "mental / comportamental":
    case "mental":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30";
    default:
      return "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  }
}
