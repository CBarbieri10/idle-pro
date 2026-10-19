/**
 * Utilitário de Slugify Dinâmico para colunas do SportsBase / Wyscout.
 * Converte qualquer cabeçalho de coluna em um identificador snake_case padronizado.
 * Ex: 'Passes progressivos' -> 'passes_progressivos'
 * Ex: 'Recuperações da bola no campo adversário' -> 'recuperacoes_da_bola_no_campo_adversario'
 * Ex: 'Ações com sucesso, %' -> 'acoes_com_sucesso_pct'
 * Ex: 'Duelos defensivos ganhos, %' -> 'duelos_defensivos_ganhos_pct'
 */
export function slugifyMetricKey(header: string): string {
  if (!header) return "";

  let str = String(header).trim();

  // Substituição contextual de símbolos frequentes
  str = str.replace(/%/g, " pct ");
  str = str.replace(/№/g, " no ");
  str = str.replace(/&/g, " e ");
  str = str.replace(/1v1|1x1/gi, " um_contra_um ");

  // Normalização NFD para desmembrar acentuação gráfica
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // Substitui caracteres não alfanuméricos por underscores
  str = str.toLowerCase().replace(/[^a-z0-9]+/g, "_");

  // Remove underscores duplicados e das pontas
  str = str.replace(/^_+|_+$/g, "").replace(/_+/g, "_");

  return str;
}

/**
 * Mapa de tradução dos slugs gerados dinamicamente para as chaves canônicas da plataforma.
 * Garante que métricas vitais para o Laboratório Moneyball (progressive_passes, recoveries_opponent_half, etc.)
 * sejam mapeadas com máxima precisão.
 */
export const CANONICAL_SLUG_MAP: Record<string, string> = {
  // Passes Progressivos (Vital para Moneyball 2D)
  passes_progressivos: "progressive_passes",
  passes_progressivos_por_90: "progressive_passes",
  progressive_passes: "progressive_passes",
  progressive_pass: "progressive_passes",

  // Recuperações no Campo Adversário (Vital para Moneyball & Quadrantes)
  recuperacoes_da_bola_no_campo_adversario: "recoveries_opponent_half",
  recuperacoes_no_campo_adversario: "recoveries_opponent_half",
  recuperacoes_campo_adversario: "recoveries_opponent_half",
  recuperacoes_campo_adv: "recoveries_opponent_half",
  recoveries_opponent_half: "recoveries_opponent_half",
  recoveries_in_opponent_half: "recoveries_opponent_half",

  // Chances de gol (Vital para Eixo X de Ofensividade)
  chances_de_gol: "goal_chances",
  goal_chances: "goal_chances",

  // Ataque & Criação
  gols: "goals",
  goals: "goals",
  assistencias: "assists",
  assists: "assists",
  chutes: "shots",
  finalizacoes: "shots",
  shots: "shots",
  chutes_no_alvo: "shots_on_target",
  finalizacoes_no_alvo: "shots_on_target",
  shots_on_target: "shots_on_target",
  xg: "xg",
  xg_gols_esperados: "xg",
  gols_esperados: "xg",
  expected_goals: "xg",
  xg_por_finalizacao: "xg_per_shot",
  xg_per_shot: "xg_per_shot",
  dribles: "dribles_completed",
  dribles_certos: "dribles_completed",
  dribles_com_sucesso: "dribles_completed",
  dribles_completed: "dribles_completed",
  passes_chave: "key_passes",
  passes_decisivos: "key_passes",
  key_passes: "key_passes",
  passes_chave_precisos: "key_passes_accurate",
  key_passes_accurate: "key_passes_accurate",
  cruzamentos: "crosses_accurate",
  cruzamentos_certos: "crosses_accurate",
  cruzamentos_precisos: "crosses_accurate",
  crosses_accurate: "crosses_accurate",

  // Passes & Construção
  passes: "passes",
  passes_certos: "passes",
  passes_precisos_pct: "pass_accuracy",
  precisao_de_passe_pct: "pass_accuracy",
  precisao_de_passe: "pass_accuracy",
  pass_accuracy: "pass_accuracy",
  bolas_longas: "long_balls_accurate",
  bolas_longas_certas: "long_balls_accurate",
  long_balls_accurate: "long_balls_accurate",

  // Defesa & Combate
  desarmes: "tackles",
  tackles: "tackles",
  desarmes_padj: "padj_tackles",
  padj_tackles: "padj_tackles",
  interceptacoes: "interceptions",
  interceptions: "interceptions",
  interceptacoes_padj: "padj_interceptions",
  padj_interceptions: "padj_interceptions",
  cortes: "clearances",
  clearances: "clearances",
  bloqueios: "blocks",
  blocks: "blocks",
  duelos_aereos_ganhos: "aerial_duels_won",
  aerial_duels_won: "aerial_duels_won",
  duelos_defensivos_ganhos: "ground_duels_won",
  duelos_no_chao_ganhos: "ground_duels_won",
  ground_duels_won: "ground_duels_won",
  duelos_defensivos_ganhos_pct: "defensive_duels_won_pct",
  defensive_duels_won_pct: "defensive_duels_won_pct",
  recuperacoes_da_bola: "recoveries",
  recuperacoes: "recoveries",
  recoveries: "recoveries",
  faltas_cometidas: "fouls_committed",
  fouls_committed: "fouls_committed",

  // Goleiro
  defesas: "saves",
  saves: "saves",
  defesas_dentro_da_area: "saves_inside_box",
  saves_inside_box: "saves_inside_box",
  gols_sofridos: "goals_conceded",
  goals_conceded: "goals_conceded",
  saidas_do_gol: "high_claims",
  high_claims: "high_claims",

  // Geral
  minutos_jogados: "minutes_played",
  minutes_played: "minutes_played",
  no: "jersey_number",
  numero: "jersey_number",
  jersey_number: "jersey_number",
  nota: "rating",
  indice: "rating",
  rating: "rating",
};
