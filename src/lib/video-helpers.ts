/**
 * Helpers para Decupagem Tática & Central de Vídeos
 * Suporte a YouTube, Vimeo, MP4 nativo e Estilos Térmicos por Categoria
 */

export interface EmbedInfo {
  type: "youtube" | "vimeo" | "mp4" | "other";
  embedUrl: string | null;
  directUrl: string;
}

export function parseVideoUrl(url: string): EmbedInfo {
  if (!url) {
    return { type: "other", embedUrl: null, directUrl: url || "" };
  }

  const cleanUrl = url.trim();

  // 1. YouTube
  // Formatos: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID, youtube.com/shorts/ID
  const ytMatch =
    cleanUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`,
      directUrl: cleanUrl,
    };
  }

  // 2. Vimeo
  // Formatos: vimeo.com/12345678, player.vimeo.com/video/12345678
  const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/);
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      type: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      directUrl: cleanUrl,
    };
  }

  // 3. MP4 / WebM / Formato de arquivo de vídeo direto
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(cleanUrl) || cleanUrl.includes("commondatastorage.googleapis.com")) {
    return {
      type: "mp4",
      embedUrl: cleanUrl,
      directUrl: cleanUrl,
    };
  }

  return {
    type: "other",
    embedUrl: cleanUrl,
    directUrl: cleanUrl,
  };
}

export interface CategoryTheme {
  badgeClass: string;
  dotClass: string;
  glowClass: string;
  borderHover: string;
  gradientBg: string;
}

export function getCategoryTheme(category: string): CategoryTheme {
  const norm = category.toLowerCase().trim();

  // Gol / Finalização (Térmico Verde / Emerald)
  if (norm.includes("gol") || norm.includes("finaliza") || norm.includes("chute")) {
    return {
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.25)]",
      dotClass: "bg-emerald-400",
      glowClass: "from-emerald-600/20 via-teal-900/10 to-transparent",
      borderHover: "hover:border-emerald-500/50",
      gradientBg: "from-emerald-950/40 via-[#0d141e] to-black/80",
    };
  }

  // Passe Progressivo / Construção / Criação (Térmico Ciano / Azul)
  if (norm.includes("passe") || norm.includes("constru") || norm.includes("cria") || norm.includes("cruzamento")) {
    return {
      badgeClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.25)]",
      dotClass: "bg-cyan-400",
      glowClass: "from-cyan-600/20 via-blue-900/10 to-transparent",
      borderHover: "hover:border-cyan-500/50",
      gradientBg: "from-cyan-950/40 via-[#0a1120] to-black/80",
    };
  }

  // Desarme / Interceptação / Defensivo (Térmico Índigo / Roxo)
  if (norm.includes("desarme") || norm.includes("intercep") || norm.includes("defes") || norm.includes("recupera")) {
    return {
      badgeClass: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.25)]",
      dotClass: "bg-indigo-400",
      glowClass: "from-indigo-600/20 via-purple-900/10 to-transparent",
      borderHover: "hover:border-indigo-500/50",
      gradientBg: "from-indigo-950/40 via-[#0e0e1c] to-black/80",
    };
  }

  // Perda de Posse / Erro / Falta (Térmico Rosa / Vermelho)
  if (norm.includes("perda") || norm.includes("falta") || norm.includes("erro") || norm.includes("pressao")) {
    return {
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.25)]",
      dotClass: "bg-rose-400",
      glowClass: "from-rose-600/20 via-amber-900/10 to-transparent",
      borderHover: "hover:border-rose-500/50",
      gradientBg: "from-rose-950/40 via-[#180a11] to-black/80",
    };
  }

  // Padrão (Térmico Âmbar / Dourado)
  return {
    badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.25)]",
    dotClass: "bg-amber-400",
    glowClass: "from-amber-600/20 via-yellow-900/10 to-transparent",
    borderHover: "hover:border-amber-500/50",
    gradientBg: "from-amber-950/40 via-[#14120a] to-black/80",
  };
}
