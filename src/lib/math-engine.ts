/**
 * ⚽ Motor Matemático e Estatístico Avançado (The Net Scouting Engine)
 *
 * Fundamentação Teórica:
 * - CEREBRO / Aula 02: Validação de Modelos, Outliers e Índice de Desempenho Global (IDG) - Prof. Eleandro
 * - CEREBRO / ROADMAP_IDEIAS_FUTURAS_APP.md
 *
 * Implementa:
 * 1. Detecção de Outliers via Z-Score por partida
 * 2. Alternância entre Coeficiente de Variação de Pearson (CVP) e Tornqvist (CVT)
 * 3. Cálculo Consolidado do Índice de Desempenho Global (IDG)
 * 4. Tratamento do Zero Técnico (0.001) para evitar divisões por zero
 */

export const ZERO_TECNICO = 0.001;

export type StabilityCategory = "HIGH" | "MODERATE" | "LOW";

export interface OutlierAnalysis {
  mean: number;
  median: number;
  stdDev: number;
  hasOutliers: boolean;
  outliers: number[];
  normalValues: number[];
  zScores: number[];
}

export interface MetricCVResult {
  metricName: string;
  sampleSize: number;
  mean: number;
  median: number;
  stdDev: number;
  hasOutliers: boolean;
  coefficientType: "PEARSON_CVP" | "TORNQVIST_CVT";
  cvPercent: number; // Coeficiente de variação em %
}

export interface IDGResult {
  idgScore: number; // Percentual consolidado do IDG
  stabilityCategory: StabilityCategory;
  stabilityLabel: string;
  stabilityDescription: string;
  metricsBreakdown: MetricCVResult[];
}

/**
 * Calcula a média aritmética de uma série numérica.
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

/**
 * Calcula a mediana de uma série numérica (resistente a outliers).
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calcula o desvio padrão de uma série.
 * Usa N se N <= 2 ou N - 1 para amostras maiores.
 */
export function calculateStdDev(values: number[], mean: number): number {
  if (values.length <= 1) return 0;
  const divisor = values.length > 2 ? values.length - 1 : values.length;
  const variance =
    values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / divisor;
  return Math.sqrt(variance);
}

/**
 * Analisa a dispersão da série e detecta outliers usando o Z-Score.
 * Padrão futebol: |Z-Score| >= 2.0 em pequenas e médias amostras (5 a 38 jogos).
 */
export function detectOutliers(
  values: number[],
  threshold = 2.0
): OutlierAnalysis {
  if (values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      hasOutliers: false,
      outliers: [],
      normalValues: [],
      zScores: [],
    };
  }

  const mean = calculateMean(values);
  const median = calculateMedian(values);
  const stdDev = calculateStdDev(values, mean);

  if (stdDev === 0) {
    return {
      mean,
      median,
      stdDev: 0,
      hasOutliers: false,
      outliers: [],
      normalValues: [...values],
      zScores: values.map(() => 0),
    };
  }

  const outliers: number[] = [];
  const normalValues: number[] = [];
  const zScores: number[] = [];

  for (const v of values) {
    const z = (v - mean) / stdDev;
    zScores.push(Math.round(z * 100) / 100);
    if (Math.abs(z) >= threshold) {
      outliers.push(v);
    } else {
      normalValues.push(v);
    }
  }

  return {
    mean,
    median,
    stdDev,
    hasOutliers: outliers.length > 0,
    outliers,
    normalValues,
    zScores,
  };
}

/**
 * Calcula o Coeficiente de Variação (CV) com alternância metodológica:
 * - Se NÃO houver outliers: CVP (Pearson) = Desvio Padrão / Média
 * - Se HOUVER outliers: CVT (Tornqvist) = Desvio Padrão / Mediana
 *
 * Aplica injeção do Zero Técnico (0.001) para evitar divisão por zero quando
 * a média ou mediana for zero.
 */
export function calculateCoefficientOfVariation(
  values: number[],
  metricName = "metric"
): MetricCVResult {
  const analysis = detectOutliers(values);

  if (values.length <= 1 || analysis.stdDev === 0) {
    return {
      metricName,
      sampleSize: values.length,
      mean: analysis.mean,
      median: analysis.median,
      stdDev: analysis.stdDev,
      hasOutliers: false,
      coefficientType: "PEARSON_CVP",
      cvPercent: 0,
    };
  }

  let cv = 0;
  let coefficientType: "PEARSON_CVP" | "TORNQVIST_CVT" = "PEARSON_CVP";

  if (analysis.hasOutliers) {
    // Aplicação da regra de ouro do CEREBRO: se tem outlier, usa CVT com mediana
    coefficientType = "TORNQVIST_CVT";
    const denominator =
      Math.abs(analysis.median) < ZERO_TECNICO ? ZERO_TECNICO : Math.abs(analysis.median);
    cv = (analysis.stdDev / denominator) * 100;
  } else {
    // Sem outliers: usa CVP clássico de Pearson com média
    coefficientType = "PEARSON_CVP";
    const denominator =
      Math.abs(analysis.mean) < ZERO_TECNICO ? ZERO_TECNICO : Math.abs(analysis.mean);
    cv = (analysis.stdDev / denominator) * 100;
  }

  return {
    metricName,
    sampleSize: values.length,
    mean: Math.round(analysis.mean * 100) / 100,
    median: Math.round(analysis.median * 100) / 100,
    stdDev: Math.round(analysis.stdDev * 100) / 100,
    hasOutliers: analysis.hasOutliers,
    coefficientType,
    cvPercent: Math.min(100, Math.round(cv * 10) / 10), // Limitado a 100% de dispersão
  };
}

/**
 * Calcula o Índice de Desempenho Global (IDG).
 *
 * O IDG é a consolidação ponderada dos Coeficientes de Variação (CV)
 * das métricas primárias da posição.
 *
 * Classificação oficial (Prof. Eleandro):
 * - < 15%: Alta Estabilidade / Regularidade de Elite
 * - 15% a 30%: Estabilidade Moderada
 * - > 30%: Instabilidade Crítica / Risco de Oscilação
 */
export function calculateIDG(
  metricsSeries: Record<string, number[]>
): IDGResult {
  const breakdown: MetricCVResult[] = [];
  const entries = Object.entries(metricsSeries);

  if (entries.length === 0) {
    return {
      idgScore: 0,
      stabilityCategory: "HIGH",
      stabilityLabel: "Alta Estabilidade",
      stabilityDescription: "Amostragem em processamento.",
      metricsBreakdown: [],
    };
  }

  for (const [metricKey, values] of entries) {
    if (values.length > 0) {
      breakdown.push(calculateCoefficientOfVariation(values, metricKey));
    }
  }

  if (breakdown.length === 0) {
    return {
      idgScore: 0,
      stabilityCategory: "HIGH",
      stabilityLabel: "Alta Estabilidade",
      stabilityDescription: "Sem dados suficientes.",
      metricsBreakdown: [],
    };
  }

  // Média dos coeficientes de variação
  const totalCV = breakdown.reduce((acc, m) => acc + m.cvPercent, 0);
  const rawIdg = totalCV / breakdown.length;
  const idgScore = Math.round(rawIdg * 10) / 10;

  let stabilityCategory: StabilityCategory = "HIGH";
  let stabilityLabel = "Alta Estabilidade (Elite)";
  let stabilityDescription = "Atleta extremamente regular com baixa dispersão jogo a jogo.";

  if (idgScore > 30) {
    stabilityCategory = "LOW";
    stabilityLabel = "Instabilidade Crítica";
    stabilityDescription = "Alta oscilação entre jogos. Risco de intermitência tática.";
  } else if (idgScore >= 15) {
    stabilityCategory = "MODERATE";
    stabilityLabel = "Estabilidade Moderada";
    stabilityDescription = "Regularidade aceitável com oscilações pontuais de rendimento.";
  }

  return {
    idgScore,
    stabilityCategory,
    stabilityLabel,
    stabilityDescription,
    metricsBreakdown: breakdown,
  };
}

/**
 * Mapeamento de estilos visuais e tokens para as categorias do IDG.
 */
export const STABILITY_CONFIG: Record<
  StabilityCategory,
  {
    label: string;
    shortLabel: string;
    bgClass: string;
    borderClass: string;
    textClass: string;
    badgeDark: string;
    badgePrint: string;
    dotClass: string;
  }
> = {
  HIGH: {
    label: "Alta Estabilidade (Elite)",
    shortLabel: "Estável",
    bgClass: "bg-emerald-500/15",
    borderClass: "border-emerald-500/30",
    textClass: "text-emerald-400",
    badgeDark: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    badgePrint: "bg-emerald-100 text-emerald-950 border-emerald-300",
    dotClass: "bg-emerald-500",
  },
  MODERATE: {
    label: "Estabilidade Moderada",
    shortLabel: "Moderado",
    bgClass: "bg-amber-500/15",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-400",
    badgeDark: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    badgePrint: "bg-amber-100 text-amber-950 border-amber-300",
    dotClass: "bg-amber-500",
  },
  LOW: {
    label: "Instabilidade Crítica",
    shortLabel: "Instável",
    bgClass: "bg-rose-500/15",
    borderClass: "border-rose-500/30",
    textClass: "text-rose-400",
    badgeDark: "bg-rose-500/15 text-rose-400 border-rose-500/30",
    badgePrint: "bg-rose-100 text-rose-950 border-rose-300",
    dotClass: "bg-rose-500",
  },
};
