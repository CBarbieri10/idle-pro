/**
 * Utilitário de Cores e Identidade Visual dos Clubes (Overview Scout)
 * Mapeamento oficial dos 20 clubes da Série A do Brasileirão
 */

export interface ClubColors {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor?: string;
}

/**
 * Fallback neutro para clubes não mapeados ou sem identificação
 */
export const DEFAULT_CLUB_COLORS: ClubColors = {
  primaryColor: "#27272a", // Zinc 800
  secondaryColor: "#52525b", // Zinc 600
  textColor: "#ffffff",
  accentColor: "#00e676", // Verde Overview Scout
};

/**
 * Mapeamento oficial de cores canônicas dos 20 clubes da Série A
 */
export const CANONICAL_CLUB_COLORS: Record<string, ClubColors> = {
  Flamengo: {
    primaryColor: "#c5241f", // Vermelho rubro-negro
    secondaryColor: "#111111", // Preto
    textColor: "#ffffff",
    accentColor: "#e53e3e",
  },
  Palmeiras: {
    primaryColor: "#006437", // Verde esmeralda
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#00a859",
  },
  Botafogo: {
    primaryColor: "#0b0e14", // Preto alvinegro
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#3b82f6",
  },
  "São Paulo": {
    primaryColor: "#ffffff", // Branco tricolor
    secondaryColor: "#c8102e", // Vermelho
    textColor: "#c8102e",
    accentColor: "#000000",
  },
  Cruzeiro: {
    primaryColor: "#003a94", // Azul estrelado
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#38bdf8",
  },
  Grêmio: {
    primaryColor: "#0d80bf", // Azul celeste tricolor
    secondaryColor: "#111111", // Preto
    textColor: "#ffffff",
    accentColor: "#ffffff",
  },
  Mirassol: {
    primaryColor: "#ffcc00", // Amarelo leão
    secondaryColor: "#006633", // Verde
    textColor: "#006633",
    accentColor: "#15803d",
  },
  "Vasco da Gama": {
    primaryColor: "#111111", // Preto cruzmaltino
    secondaryColor: "#ffffff", // Faixa branca
    textColor: "#ffffff",
    accentColor: "#dc2626",
  },
  Remo: {
    primaryColor: "#0c2340", // Azul marinho
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#38bdf8",
  },
  "Athletico-PR": {
    primaryColor: "#c4161c", // Vermelho furacão
    secondaryColor: "#111111", // Preto
    textColor: "#ffffff",
    accentColor: "#f87171",
  },
  Bahia: {
    primaryColor: "#004b87", // Azul tricolor de aço
    secondaryColor: "#d21034", // Vermelho
    textColor: "#ffffff",
    accentColor: "#ffffff",
  },
  Internacional: {
    primaryColor: "#cc0000", // Vermelho colorado
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#fca5a5",
  },
  "RB Bragantino": {
    primaryColor: "#ffffff", // Branco massa bruta
    secondaryColor: "#d81e05", // Vermelho Red Bull
    textColor: "#d81e05",
    accentColor: "#1e3a8a",
  },
  Chapecoense: {
    primaryColor: "#007a3d", // Verde chape
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#4ade80",
  },
  Corinthians: {
    primaryColor: "#ffffff", // Branco alvinegro
    secondaryColor: "#111111", // Preto
    textColor: "#111111",
    accentColor: "#71717a",
  },
  "Atlético Mineiro": {
    primaryColor: "#111111", // Preto galo forte
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#e4e4e7",
  },
  Coritiba: {
    primaryColor: "#005930", // Verde coxa
    secondaryColor: "#ffffff", // Branco
    textColor: "#ffffff",
    accentColor: "#22c55e",
  },
  Santos: {
    primaryColor: "#ffffff", // Branco peixe
    secondaryColor: "#111111", // Preto
    textColor: "#111111",
    accentColor: "#d4af37", // Dourado histórico
  },
  Vitória: {
    primaryColor: "#d81a21", // Vermelho rubro-negro baiano
    secondaryColor: "#111111", // Preto
    textColor: "#ffffff",
    accentColor: "#fb7185",
  },
  Fluminense: {
    primaryColor: "#7e1e2f", // Grená tricolor
    secondaryColor: "#006241", // Verde
    textColor: "#ffffff",
    accentColor: "#ffffff",
  },
};

/**
 * Normaliza variações comuns de nomes de clubes brasileiros
 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(cr|se|ec|fc|saf|fbpa|sc|fbc|clube|esporte|sport)\b/gi, "")
    .replace(/[-_.]+/g, " ")
    .trim();
}

/**
 * Dicionário heurístico de resolução de nomes
 */
const ALIAS_MAP: Record<string, string> = {
  flamengo: "Flamengo",
  palmeiras: "Palmeiras",
  botafogo: "Botafogo",
  "sao paulo": "São Paulo",
  cruzeiro: "Cruzeiro",
  gremio: "Grêmio",
  mirassol: "Mirassol",
  vasco: "Vasco da Gama",
  "vasco da gama": "Vasco da Gama",
  remo: "Remo",
  athletico: "Athletico-PR",
  "athletico pr": "Athletico-PR",
  "athletico paranaense": "Athletico-PR",
  "atletico paranaense": "Athletico-PR",
  bahia: "Bahia",
  internacional: "Internacional",
  inter: "Internacional",
  bragantino: "RB Bragantino",
  "rb bragantino": "RB Bragantino",
  "red bull bragantino": "RB Bragantino",
  chapecoense: "Chapecoense",
  chape: "Chapecoense",
  corinthians: "Corinthians",
  atletico: "Atlético Mineiro",
  "atletico mineiro": "Atlético Mineiro",
  "atletico mg": "Atlético Mineiro",
  galo: "Atlético Mineiro",
  coritiba: "Coritiba",
  coxa: "Coritiba",
  santos: "Santos",
  vitoria: "Vitória",
  fluminense: "Fluminense",
  flu: "Fluminense",
};

/**
 * Calcula cor de texto de alto contraste com base na cor de fundo (Fórmula YIQ)
 */
export function getContrastTextColor(hexColor: string): string {
  if (!hexColor || !hexColor.startsWith("#")) return "#ffffff";
  const cleanHex = hexColor.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 155 ? "#111111" : "#ffffff";
}

/**
 * Retorna as cores oficiais de um clube ou o fallback neutro
 */
export function getClubColors(clubName?: string | null): ClubColors {
  if (!clubName || typeof clubName !== "string") {
    return DEFAULT_CLUB_COLORS;
  }

  // 1. Busca direta no mapa canônico
  if (CANONICAL_CLUB_COLORS[clubName]) {
    return CANONICAL_CLUB_COLORS[clubName];
  }

  // 2. Busca por normalização e apelidos
  const clean = normalizeName(clubName);

  for (const [alias, canonicalKey] of Object.entries(ALIAS_MAP)) {
    if (clean.includes(alias) || alias.includes(clean)) {
      const colors = CANONICAL_CLUB_COLORS[canonicalKey];
      if (colors) return colors;
    }
  }

  // 3. Fallback inteligente: se o nome contiver alguma das chaves canônicas
  for (const [canonicalKey, colors] of Object.entries(CANONICAL_CLUB_COLORS)) {
    if (clean.includes(normalizeName(canonicalKey))) {
      return colors;
    }
  }

  return DEFAULT_CLUB_COLORS;
}
