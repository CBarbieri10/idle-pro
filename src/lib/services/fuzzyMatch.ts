/**
 * Algoritmo de Similaridade e Fusão de Dados (Fuzzy Match Engine)
 * Overview Scout — Motor Híbrido de Ingestão
 * 
 * Cruza nomes de atletas vindos de planilhas de terceiros (Wyscout/Sofascore)
 * com a base canônica de atletas do Brasileirão cadastrados no banco de dados.
 */

export interface CandidateAthlete {
  id: string;
  name: string;
  teamId?: string | null;
  teamName?: string | null;
  position?: string | null;
}

export interface FuzzyMatchResult {
  matched: boolean;
  athlete: CandidateAthlete | null;
  score: number; // 0 a 100
  confidence: "EXACT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  matchedName?: string;
  searchQuery: string;
}

/**
 * Remove acentos, pontuação, múltiplos espaços e converte para minúsculas
 */
export function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacríticos/acentos
    .toLowerCase()
    .replace(/[\(\)\[\]\-–—\.,'"]/g, " ") // remove pontuação e parênteses
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Calcula a Distância de Levenshtein entre duas strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deleção
        dp[i][j - 1] + 1, // inserção
        dp[i - 1][j - 1] + cost // substituição
      );
    }
  }

  return dp[m][n];
}

/**
 * Coeficiente de Sørensen–Dice baseado em bigramas
 */
export function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;

  const getBigrams = (str: string): Map<string, number> => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < str.length - 1; i++) {
      const bigram = str.substring(i, i + 2);
      bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
    }
    return bigrams;
  };

  const bigramsA = getBigrams(a);
  const bigramsB = getBigrams(b);

  let intersectionSize = 0;
  for (const [bigram, countA] of bigramsA.entries()) {
    if (bigramsB.has(bigram)) {
      intersectionSize += Math.min(countA, bigramsB.get(bigram)!);
    }
  }

  const totalBigrams = a.length - 1 + (b.length - 1);
  return (2 * intersectionSize) / totalBigrams;
}

/**
 * Motor de Fuzzy Match para Atletas
 * Analisa correspondência exata, apelidos, abreviações (ex: "L. Henrique") e similaridade de substrings.
 */
export function matchAthleteName(
  rawQueryName: string,
  candidates: CandidateAthlete[],
  teamHint?: string
): FuzzyMatchResult {
  const query = normalizeName(rawQueryName);
  if (!query) {
    return {
      matched: false,
      athlete: null,
      score: 0,
      confidence: "NONE",
      searchQuery: rawQueryName,
    };
  }

  const normTeamHint = teamHint ? normalizeName(teamHint) : "";

  let bestAthlete: CandidateAthlete | null = null;
  let bestScore = 0;

  // Quebra a busca em tokens
  const queryTokens = query.split(" ").filter((t) => t.length > 0);

  for (const candidate of candidates) {
    const candNorm = normalizeName(candidate.name);
    const candTokens = candNorm.split(" ").filter((t) => t.length > 0);

    let currentScore = 0;

    // 1. Match exato
    if (candNorm === query) {
      currentScore = 100;
    }
    // 2. Apelido único / Substring exata
    else if (
      (queryTokens.length === 1 && candTokens.includes(query)) ||
      (candTokens.length === 1 && queryTokens.includes(candNorm))
    ) {
      currentScore = 94;
    }
    // 3. Abreviação comum brasileira (Ex: "L. Henrique" vs "Luiz Henrique")
    else if (
      queryTokens.length >= 2 &&
      candTokens.length >= 2 &&
      (queryTokens[0].length === 1 || candTokens[0].length === 1) &&
      queryTokens[0][0] === candTokens[0][0] &&
      queryTokens[queryTokens.length - 1] === candTokens[candTokens.length - 1]
    ) {
      currentScore = 91;
    }
    // 4. Todos os tokens da query estão contidos no nome do candidato
    else if (
      queryTokens.length > 1 &&
      queryTokens.every((qt) => candTokens.some((ct) => ct.includes(qt) || qt.includes(ct)))
    ) {
      currentScore = 88;
    }
    // 5. Coeficiente de Dice + Levenshtein combinado
    else {
      const diceScore = diceCoefficient(candNorm, query) * 100;
      const maxLen = Math.max(candNorm.length, query.length);
      const levScore = (1 - levenshteinDistance(candNorm, query) / maxLen) * 100;
      currentScore = diceScore * 0.6 + levScore * 0.4;
    }

    // Bônus se o clube coincidir com a dica de equipe da planilha
    if (normTeamHint && candidate.teamName) {
      const candTeamNorm = normalizeName(candidate.teamName);
      if (
        candTeamNorm.includes(normTeamHint) ||
        normTeamHint.includes(candTeamNorm)
      ) {
        currentScore = Math.min(100, currentScore + 6);
      }
    }

    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestAthlete = candidate;
    }
  }

  // Definição de confiança
  let confidence: FuzzyMatchResult["confidence"] = "NONE";
  if (bestScore >= 92) confidence = "EXACT";
  else if (bestScore >= 80) confidence = "HIGH";
  else if (bestScore >= 68) confidence = "MEDIUM";
  else if (bestScore >= 50) confidence = "LOW";

  // Consideramos match positivo se a confiança for pelo menos MÉDIA (>= 68%)
  const matched = bestScore >= 68 && bestAthlete !== null;

  return {
    matched,
    athlete: matched ? bestAthlete : null,
    score: Math.round(bestScore * 10) / 10,
    confidence,
    matchedName: bestAthlete?.name,
    searchQuery: rawQueryName,
  };
}
