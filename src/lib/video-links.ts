export const TACTICAL_VIDEO_CATEGORIES = [
  "Saída de Bola & Construção",
  "Finalização & Ataque à Área",
  "Duelos 1v1 & Dribles",
  "Bolas Longas & Inversões",
  "Transição Defensiva & Recomposição",
  "Pressão Alta & Desarmes",
  "Bolas Paradas",
  "Outro Clipe Tático",
] as const;

export type TacticalVideoCategory = (typeof TACTICAL_VIDEO_CATEGORIES)[number] | string;

export function detectVideoHost(url: string): {
  type: "GOOGLE_DRIVE" | "YOUTUBE" | "VIMEO" | "WYSCOUT" | "GENERIC";
  label: string;
  badgeClass: string;
} {
  const normalized = url.toLowerCase();
  if (normalized.includes("drive.google.com") || normalized.includes("docs.google.com")) {
    return {
      type: "GOOGLE_DRIVE",
      label: "Google Drive",
      badgeClass: "bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25",
    };
  }
  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
    return {
      type: "YOUTUBE",
      label: "YouTube",
      badgeClass: "bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/25",
    };
  }
  if (normalized.includes("vimeo.com")) {
    return {
      type: "VIMEO",
      label: "Vimeo",
      badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25",
    };
  }
  if (normalized.includes("wyscout.com")) {
    return {
      type: "WYSCOUT",
      label: "Wyscout",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25",
    };
  }
  return {
    type: "GENERIC",
    label: "Link Externo",
    badgeClass: "bg-zinc-500/15 text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/25",
  };
}
