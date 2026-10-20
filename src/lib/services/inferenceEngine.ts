/**
 * Motor de Inferência Tática (Overview Scout Tactical Inference Engine)
 * Base Metodológica: CÉREBRO — Aulas 1, 2 e 3 (Professor Roberto Torrecilhas / S.E. Palmeiras)
 * 
 * Traduz dados estatísticos brutos e métricas canônicas em insights táticos
 * pré-digeridos com a taxonomia do modelo de jogo.
 */

export interface TacticalMetricInput {
  position?: string | null;
  canonicalMetrics?: Record<
    string,
    { per90?: number; count?: number; value?: number; percentile?: number } | number
  > | null;
  metrics?: Record<
    string,
    { per90?: number; count?: number; value?: number; percentile?: number } | number
  > | null;
  rawMetrics?: Record<string, unknown> | null;
}

export type InsightTone = "alert" | "praise" | "cognitive" | "info";

export interface TacticalInsightItem {
  id: string;
  ruleKey: string;
  category: string;
  tone: InsightTone;
  title: string;
  description: string;
  fullText: string;
  lessonTag: "Aula 01" | "Aula 02" | "Aula 03" | "Aulas 1 e 2" | "Aulas 2 e 3";
}

/**
 * Utilitário seguro para extrair números a partir de chaves canônicas ou dados brutos (Wyscout/Sofascore)
 */
function extractMetricValue(
  input: TacticalMetricInput | Record<string, unknown>,
  targetKeys: string[]
): number | null {
  if (!input) return null;

  // 1. Tentar input.canonicalMetrics ou input.metrics
  const pool =
    (input as TacticalMetricInput).canonicalMetrics ||
    (input as TacticalMetricInput).metrics ||
    (input as Record<string, unknown>);

  if (pool && typeof pool === "object") {
    for (const key of targetKeys) {
      if (key in pool) {
        const val = (pool as Record<string, unknown>)[key];
        if (typeof val === "number" && !isNaN(val)) return val;
        if (val && typeof val === "object" && "per90" in val) {
          const num = Number((val as { per90?: unknown }).per90);
          if (!isNaN(num)) return num;
        }
        if (val && typeof val === "object" && "value" in val) {
          const num = Number((val as { value?: unknown }).value);
          if (!isNaN(num)) return num;
        }
      }
    }
  }

  // 2. Tentar rawMetrics (Wyscout / importação crua)
  const raw = (input as TacticalMetricInput).rawMetrics;
  if (raw && typeof raw === "object") {
    for (const key of targetKeys) {
      if (key in raw) {
        const val = raw[key];
        if (typeof val === "number" && !isNaN(val)) return val;
        if (typeof val === "string") {
          const clean = val.replace("%", "").replace(",", ".").trim();
          const parsed = parseFloat(clean);
          if (!isNaN(parsed)) return parsed;
        }
      }
    }
  }

  return null;
}

function normalizePosition(pos?: string | null): string {
  if (!pos) return "";
  return pos.toUpperCase();
}

/**
 * Motor Principal: Retorna os insights como um array de strings pré-digeridas
 * @param input Dados estatísticos brutos e/ou métricas canônicas do jogador
 * @returns Array de strings formatadas com a taxonomia do Cérebro
 */
export function generateTacticalInferences(
  input: TacticalMetricInput | Record<string, unknown>
): string[] {
  const detailed = generateDetailedTacticalInsights(input);
  return detailed.map((item) => item.fullText);
}

/**
 * Alias compatível com diferentes convenções de importação
 */
export const inferenceEngine = generateTacticalInferences;

/**
 * Motor Detalhado: Retorna os insights com metadados estruturados para renderização na UI
 */
export function generateDetailedTacticalInsights(
  input: TacticalMetricInput | Record<string, unknown>
): TacticalInsightItem[] {
  const insights: TacticalInsightItem[] = [];

  const rawPos =
    (input as TacticalMetricInput).position ||
    (input as { position?: string }).position ||
    "";
  const pos = normalizePosition(rawPos);

  const isCenterBack =
    pos.includes("CENTER_BACK") ||
    pos.includes("CB") ||
    pos.includes("ZAG") ||
    pos.includes("ZAGUEIRO");

  const isDefensiveMid =
    pos.includes("DEFENSIVE_MID") ||
    pos.includes("DM") ||
    pos.includes("VOL") ||
    pos.includes("VOLANTE");

  const isDefenderOrVolante = isCenterBack || isDefensiveMid;

  const isFullBack =
    pos.includes("BACK") ||
    pos.includes("FB") ||
    pos.includes("LATERAL") ||
    pos.includes("ALA");

  const isMidfielder =
    pos.includes("MID") ||
    pos.includes("MEIA") ||
    pos.includes("MÉDIO") ||
    pos.includes("CENTRAL_MID") ||
    pos.includes("ATTACKING_MID") ||
    pos.includes("CM") ||
    pos.includes("AM") ||
    isDefensiveMid;

  const isAttacker =
    pos.includes("STRIKER") ||
    pos.includes("FORWARD") ||
    pos.includes("WING") ||
    pos.includes("PONTA") ||
    pos.includes("ATACANTE") ||
    pos.includes("CENTROAVANTE");

  // Coleta de métricas defensivas
  const tackles =
    extractMetricValue(input, [
      "padj_tackles",
      "tackles",
      "Desarmes",
      "Desarmes / 90 min.",
      "Desarmes com sucesso, %",
      "tackles_per90",
    ]) ?? 0;

  const interceptions =
    extractMetricValue(input, [
      "padj_interceptions",
      "interceptions",
      "Interceptações",
      "Interceptações / 90 min.",
      "interceptions_per90",
    ]) ?? 0;

  const aerialPct =
    extractMetricValue(input, [
      "aerial_duels_won_pct",
      "Duelos aéreos ganhos, %",
      "aerial_duels_pct",
      "% Duelos Aéreos",
    ]) ??
    (extractMetricValue(input, ["aerial_duels_won", "Duelos Aéreos Ganhos"]) != null
      ? (extractMetricValue(input, ["aerial_duels_won", "Duelos Aéreos Ganhos"])! >= 2.5
          ? 65
          : extractMetricValue(input, ["aerial_duels_won", "Duelos Aéreos Ganhos"])! * 20)
      : 0);

  const aerialDuelsWon =
    extractMetricValue(input, [
      "aerial_duels_won",
      "Duelos Aéreos Ganhos",
      "aerial_duels_won_per90",
    ]) ?? 0;

  const fouls =
    extractMetricValue(input, [
      "fouls_committed",
      "Faltas",
      "Faltas cometidas",
      "Faltas / 90 min.",
      "fouls",
    ]) ?? 1.2;

  // Coleta de métricas ofensivas e de passe
  let passAccuracy =
    extractMetricValue(input, [
      "pass_accuracy",
      "Passes precisos, %",
      "passes_accuracy_pct",
      "pass_pct",
    ]) ?? 0;
  if (passAccuracy > 0 && passAccuracy <= 1) passAccuracy = passAccuracy * 100;

  const progPasses =
    extractMetricValue(input, [
      "progressive_passes",
      "Passes progressivos",
      "Passes progressivos / 90 min.",
      "prog_passes",
    ]) ?? 0;

  const keyPasses =
    extractMetricValue(input, [
      "key_passes",
      "Passes decisivos",
      "Passes inteligentes / 90 min.",
      "Assistências para finalização",
    ]) ?? 0;

  const dribbles =
    extractMetricValue(input, [
      "dribbles_completed",
      "Dribles bem-sucedidos, %",
      "Dribles certos",
      "dribbles",
    ]) ?? 0;

  const xgPerShot =
    extractMetricValue(input, [
      "xg_per_shot",
      "xG por finalização",
      "xg_shot",
    ]) ?? 0;

  const crosses =
    extractMetricValue(input, [
      "crosses_accurate",
      "crosses",
      "Cruzamentos",
      "Cruzamentos precisos, %",
    ]) ?? 0;

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 1 (Defensiva - Aula 3):
  // Se Zagueiro/Volante tem alto volume de desarmes, mas baixa taxa de interceptação:
  // Alerta sobre 'Comportamento de risco em Zona Central (prioriza roubo em vez de indução/temporização)'
  // ───────────────────────────────────────────────────────────────────────────
  const hasHighTackles = tackles >= 2.0;
  const hasLowInterceptions = interceptions <= 1.4 || (tackles > 0 && interceptions / tackles < 0.65);

  if ((isDefenderOrVolante || (!pos && hasHighTackles)) && hasHighTackles && hasLowInterceptions) {
    const title =
      "Comportamento de risco em Zona Central (prioriza roubo em vez de indução/temporização)";
    const desc = `Atleta registra alto volume de desarmes (${tackles.toFixed(
      1
    )}/90), porém baixa leitura de interceptação (${interceptions.toFixed(
      1
    )}/90). Em zonas centrais (Aula 3), o excesso de botes agressivos expõe a linha e desprotege o funil da grande área; a recomendação tática é calibrar o perfilamento em semi-perfil para induzir o passador adversário para fora e temporizar a jogada.`;

    insights.push({
      id: "rule-1-defensive-central-risk",
      ruleKey: "defensive_central_risk",
      category: "Fase Defensiva (Aula 3)",
      tone: "alert",
      lessonTag: "Aula 03",
      title,
      description: desc,
      fullText: `⚠️ Alerta Tático: ${title}. ${desc}`,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 2 (Aérea - Aula 3):
  // Se % de Duelos Aéreos Ganhos for altíssima e o número de faltas for baixo:
  // Elogio sobre 'Domínio dos 6 elementos do duelo aéreo (passada, tempo de bola e impulsão) evitando choque desnecessário'
  // ───────────────────────────────────────────────────────────────────────────
  const hasHighAerial = aerialPct >= 58 || aerialDuelsWon >= 2.2;
  const hasLowFouls = fouls <= 1.35;

  if (hasHighAerial && hasLowFouls) {
    const title =
      "Domínio dos 6 elementos do duelo aéreo (passada, tempo de bola e impulsão) evitando choque desnecessário";
    const desc = `Apresenta excelente taxa de duelos aéreos ganhos (${
      aerialPct > 0 ? `${aerialPct.toFixed(1)}%` : `${aerialDuelsWon.toFixed(1)}/90`
    }) aliada a baixíssimo índice de faltas cometidas (${fouls.toFixed(
      1
    )}/90). Revela aplicação prática dos 6 elementos da Aula 3: ajuste prévio da passada para trás para ganhar impulsão vertical com a perna correta, uso do braço sobre o ombro sem empurrar as costas e corte aéreo direcionado para a posse da equipe.`;

    insights.push({
      id: "rule-2-aerial-mastery",
      ruleKey: "aerial_mastery",
      category: "Duelos Aéreos (Aula 3)",
      tone: "praise",
      lessonTag: "Aula 03",
      title,
      description: desc,
      fullText: `🛡️ Eficiência Aérea: ${title}. ${desc}`,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGRA 3 (Ofensiva/Cognitiva - Aulas 1 e 2):
  // Se Meia tem alta retenção de bola e alto acerto de passes no terço final:
  // Vincular a 'Alta eficiência neural, scanning rápido sob carga decisória e domínio da intenção de passe de ruptura'
  // ───────────────────────────────────────────────────────────────────────────
  const hasHighRetentionAndPassing =
    passAccuracy >= 81 && (progPasses >= 3.2 || keyPasses >= 0.9 || dribbles >= 1.0);

  if ((isMidfielder || (!pos && hasHighRetentionAndPassing)) && hasHighRetentionAndPassing) {
    const title =
      "Alta eficiência neural, scanning rápido sob carga decisória e domínio da intenção de passe de ruptura";
    const desc = `Sustenta precisão de passe de elite (${passAccuracy.toFixed(
      1
    )}%) e alta retenção de bola sob pressão entrelinhas (Aulas 1 e 2). Demonstra cognição de alto nível sob carga decisória extrema (até 46 decisões/minuto), executando varreduras visuais contínuas (scanning) a cada 2 segundos e utilizando a perna distante da marcação como alavanca limpa para acionar companheiros em ruptura.`;

    insights.push({
      id: "rule-3-cognitive-offensive-mastery",
      ruleKey: "cognitive_offensive_mastery",
      category: "Cognição & Passe (Aulas 1 e 2)",
      tone: "cognitive",
      lessonTag: "Aulas 1 e 2",
      title,
      description: desc,
      fullText: `🧠 Inteligência Cognitiva: ${title}. ${desc}`,
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // REGRAS COMPLEMENTARES BASEADAS NO CÉREBRO:
  // ───────────────────────────────────────────────────────────────────────────

  // Regra Complementar 4 (Laterais - Aulas 2 e 3):
  if (isFullBack && (crosses >= 2.5 || progPasses >= 3.8)) {
    insights.push({
      id: "rule-4-lateral-corridor",
      ruleKey: "lateral_corridor",
      category: "Espaço & Amplitude (Aulas 2 e 3)",
      tone: "info",
      lessonTag: "Aulas 2 e 3",
      title: "Amplitude e Vantagem Espacial no Corredor Externo",
      description: `Capacidade de gerar vantagem dinâmica antes do encaixe do bloco baixo adversário (${crosses.toFixed(
        1
      )} cruzamentos/90), sustentando a largura no terço final e oferecendo linha de passe em apoio imediato pós-ação.`,
      fullText: `⚡ Dinâmica de Corredor (Aulas 2 e 3): Amplitude e Vantagem Espacial no Corredor Externo com apoio pós-ação e cruzamentos calibrados.`,
    });
  }

  // Regra Complementar 5 (Atacantes - Aulas 1 e 2):
  if (isAttacker && (xgPerShot >= 0.15 || keyPasses >= 1.2)) {
    insights.push({
      id: "rule-5-attacker-blind-side",
      ruleKey: "attacker_blind_side",
      category: "Finalização & Ocupação (Aulas 1 e 2)",
      tone: "praise",
      lessonTag: "Aulas 1 e 2",
      title: "Ocupação do Ponto Cego e Remate na Zona de Ouro",
      description: `Movimentação sem bola alinhada ao padrão de Haaland no ataque ao blind side do zagueiro (Aula 1), priorizando finalizações sem necessidade de controle prévio (Aula 2) com elevada qualidade por chute (${xgPerShot.toFixed(
        2
      )} xG/Shot).`,
      fullText: `🎯 Finalização de Elite (Aulas 1 e 2): Ocupação do Ponto Cego e Remate na Zona de Ouro com alta qualidade média de finalização (${xgPerShot.toFixed(
        2
      )} xG/Shot).`,
    });
  }

  // Regra Complementar 6 (Viés de Sobrevivência de Wald - Aula 2):
  // Se a precisão de passe geral for baixa ou se não houver insights ainda, contextualiza com a alegoria de Wald
  if (passAccuracy > 0 && passAccuracy < 74) {
    insights.push({
      id: "rule-6-wald-bias",
      ruleKey: "systemic_wald_bias",
      category: "Diagnóstico Sistêmico (Aula 2)",
      tone: "info",
      lessonTag: "Aula 02",
      title: "Alerta Metodológico: Viés de Sobrevivência de Abraham Wald",
      description: `A baixa taxa de passe (${passAccuracy.toFixed(
        1
      )}%) não deve ser rotulada apressadamente como incapacidade técnica isolada do jogador. A comissão deve auditar se a estrutura coletiva está oferecendo opções limpas de apoio ou se o atleta está tomando decisões sob desamparo posicional.`,
      fullText: `🔍 Diagnóstico Sistêmico (Aula 2): Alerta Metodológico: Viés de Sobrevivência de Abraham Wald. Auditar o desamparo coletivo antes de penalizar o erro técnico.`,
    });
  }

  // Fallback garantido se nenhuma regra específica disparou por baixa amostragem
  if (insights.length === 0) {
    insights.push({
      id: "fallback-neutral-scanning",
      ruleKey: "neutral_scanning",
      category: "Visão Geral do Analista (Aulas 1 e 2)",
      tone: "info",
      lessonTag: "Aula 01",
      title: "Estabilidade Operacional sob Avaliação Longitudinal",
      description:
        "O perfil estatístico do atleta opera dentro dos padrões basais de equilíbrio. Recomenda-se aprofundar a videoanálise qualitativa do 'Antes do Antes' (ajuste corporal e scanning visual prévio) em jogos de alta exigência competitiva.",
      fullText:
        "ℹ️ Leitura do Analista: Estabilidade Operacional sob Avaliação Longitudinal. Recomenda-se acompanhamento de vídeo focado no 'Antes do Antes' (scanning e ajuste corporal prévio).",
    });
  }

  return insights;
}

/**
 * ─── Passo 4: Assinatura do Analista IA (Coletiva / Sistêmica - Aula 3) ───────
 * Micro-insights sistêmicos para rankings de Clubes / Equipes
 * Base Metodológica: CÉREBRO — Aulas 1, 2 e 3 (Professor Roberto Torrecilhas)
 */
export interface SystemicTeamInsight {
  metricKey: string;
  title: string;
  lessonTag: "Aula 01" | "Aula 02" | "Aula 03" | "Aulas 1 e 2" | "Aulas 2 e 3";
  microInsight: string;
  tacticalDescription: string;
}

export const SYSTEMIC_TEAM_INSIGHTS: Record<string, SystemicTeamInsight> = {
  high_press: {
    metricKey: "high_press",
    title: "Pressão Alta",
    lessonTag: "Aula 03",
    microInsight:
      "Aula 03 • Eficiência em comportamento pós-perda coletivo, sufocando a saída adversária no campo de ataque.",
    tacticalDescription:
      "Ativação coordenada de gatilhos de pressão e encurtamento simultâneo das linhas para forçar o passe quebrado do oponente no primeiro terço.",
  },
  offensive_volume: {
    metricKey: "offensive_volume",
    title: "Volume Ofensivo",
    lessonTag: "Aulas 1 e 2",
    microInsight:
      "Aulas 01 e 02 • Ocupação territorial progressiva e circulação vertical, empurrando o bloco adversário para o próprio terço.",
    tacticalDescription:
      "Construção com quebra de linhas e chegadas contínuas ao terço final por condução e triangulação nos corredores internos.",
  },
  block_solidity: {
    metricKey: "block_solidity",
    title: "Solidez de Bloco",
    lessonTag: "Aula 03",
    microInsight:
      "Aula 03 • Compactação em bloco médio/baixo e coordenação das coberturas defensivas, minimizando espaços entre linhas.",
    tacticalDescription:
      "Sincronismo de balanço defensivo e indução para corredores fechados, combinando desarmes no chão e interceptações antecipadas sem conceder faltas frontais.",
  },
};

export function getSystemicTeamInsight(metricKey: string): SystemicTeamInsight {
  return (
    SYSTEMIC_TEAM_INSIGHTS[metricKey] || {
      metricKey,
      title: "Comportamento Coletivo",
      lessonTag: "Aula 03",
      microInsight:
        "Aula 03 • Organização e equilíbrio tático coletivo entre as fases do jogo.",
      tacticalDescription:
        "Sincronismo de linhas e resposta padronizada aos momentos de transição ofensiva e defensiva.",
    }
  );
}
