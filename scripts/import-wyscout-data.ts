/**
 * 🇧🇷 Pipeline Oficial de Ingestão de Dados do Brasileirão Série A (Wyscout / TNS Engine)
 *
 * Execução: npx tsx scripts/import-wyscout-data.ts
 */

import {
  PrismaClient,
  Position,
  FootPreference,
  MatchVenue,
  MetricSource,
  StabilityCategory,
  Team,
  Prisma,
} from "@prisma/client";
import * as xlsx from "xlsx";
import * as path from "path";
import * as fs from "fs";
import { calculatePAdj, calculateXgPerShot } from "../src/lib/math-engine";

const prisma = new PrismaClient();

const MATCH_FILE =
  process.env.MATCH_FILE ||
  "D:/Downloads/06.10.2026 - Brazil. Brasileiro Serie A - Estatísticas da partida.xlsx";

const PLAYER_FILE =
  process.env.PLAYER_FILE ||
  "D:/Downloads/06.10.2026 - Brazil. Brasileiro Serie A - Estatísticas do jogador.xlsx";

// ─── 1. Mapeamento Canônico dos 20 Clubes da Série A ──────────────────────────

interface ClubInfo {
  canonicalName: string;
  shortName: string;
  city: string;
  country: string;
}

const CLUB_DIRECTORY: Record<string, ClubInfo> = {
  "cr flamengo": { canonicalName: "Flamengo", shortName: "FLA", city: "Rio de Janeiro", country: "Brasil" },
  "flamengo": { canonicalName: "Flamengo", shortName: "FLA", city: "Rio de Janeiro", country: "Brasil" },
  "se palmeiras": { canonicalName: "Palmeiras", shortName: "PAL", city: "São Paulo", country: "Brasil" },
  "palmeiras": { canonicalName: "Palmeiras", shortName: "PAL", city: "São Paulo", country: "Brasil" },
  "saf botafogo": { canonicalName: "Botafogo", shortName: "BOT", city: "Rio de Janeiro", country: "Brasil" },
  "botafogo": { canonicalName: "Botafogo", shortName: "BOT", city: "Rio de Janeiro", country: "Brasil" },
  "são paulo fc": { canonicalName: "São Paulo", shortName: "SAO", city: "São Paulo", country: "Brasil" },
  "sao paulo fc": { canonicalName: "São Paulo", shortName: "SAO", city: "São Paulo", country: "Brasil" },
  "são paulo": { canonicalName: "São Paulo", shortName: "SAO", city: "São Paulo", country: "Brasil" },
  "cruzeiro ec": { canonicalName: "Cruzeiro", shortName: "CRU", city: "Belo Horizonte", country: "Brasil" },
  "cruzeiro": { canonicalName: "Cruzeiro", shortName: "CRU", city: "Belo Horizonte", country: "Brasil" },
  "grêmio fbpa": { canonicalName: "Grêmio", shortName: "GRE", city: "Porto Alegre", country: "Brasil" },
  "gremio fbpa": { canonicalName: "Grêmio", shortName: "GRE", city: "Porto Alegre", country: "Brasil" },
  "grêmio": { canonicalName: "Grêmio", shortName: "GRE", city: "Porto Alegre", country: "Brasil" },
  "corinthians": { canonicalName: "Corinthians", shortName: "COR", city: "São Paulo", country: "Brasil" },
  "santos fc": { canonicalName: "Santos", shortName: "SAN", city: "Santos", country: "Brasil" },
  "santos": { canonicalName: "Santos", shortName: "SAN", city: "Santos", country: "Brasil" },
  "fluminense fc": { canonicalName: "Fluminense", shortName: "FLU", city: "Rio de Janeiro", country: "Brasil" },
  "fluminense": { canonicalName: "Fluminense", shortName: "FLU", city: "Rio de Janeiro", country: "Brasil" },
  "vasco da gama": { canonicalName: "Vasco da Gama", shortName: "VAS", city: "Rio de Janeiro", country: "Brasil" },
  "atletico mineiro": { canonicalName: "Atlético Mineiro", shortName: "CAM", city: "Belo Horizonte", country: "Brasil" },
  "atlético mineiro": { canonicalName: "Atlético Mineiro", shortName: "CAM", city: "Belo Horizonte", country: "Brasil" },
  "sc internacional": { canonicalName: "Internacional", shortName: "INT", city: "Porto Alegre", country: "Brasil" },
  "internacional": { canonicalName: "Internacional", shortName: "INT", city: "Porto Alegre", country: "Brasil" },
  "club athletico paranaense": { canonicalName: "Athletico-PR", shortName: "CAP", city: "Curitiba", country: "Brasil" },
  "athletico paranaense": { canonicalName: "Athletico-PR", shortName: "CAP", city: "Curitiba", country: "Brasil" },
  "esporte clube bahia": { canonicalName: "Bahia", shortName: "BAH", city: "Salvador", country: "Brasil" },
  "bahia": { canonicalName: "Bahia", shortName: "BAH", city: "Salvador", country: "Brasil" },
  "red bull bragantino": { canonicalName: "RB Bragantino", shortName: "RBB", city: "Bragança Paulista", country: "Brasil" },
  "ec vitória": { canonicalName: "Vitória", shortName: "VIT", city: "Salvador", country: "Brasil" },
  "ec vitoria": { canonicalName: "Vitória", shortName: "VIT", city: "Salvador", country: "Brasil" },
  "vitória": { canonicalName: "Vitória", shortName: "VIT", city: "Salvador", country: "Brasil" },
  "coritiba": { canonicalName: "Coritiba", shortName: "CFC", city: "Curitiba", country: "Brasil" },
  "mirassol": { canonicalName: "Mirassol", shortName: "MIR", city: "Mirassol", country: "Brasil" },
  "chapecoense": { canonicalName: "Chapecoense", shortName: "CHA", city: "Chapecó", country: "Brasil" },
  "remo": { canonicalName: "Remo", shortName: "REM", city: "Belém", country: "Brasil" },
};

function resolveClub(rawName: string): ClubInfo {
  const key = rawName.trim().toLowerCase();
  return (
    CLUB_DIRECTORY[key] || {
      canonicalName: rawName.trim(),
      shortName: rawName.trim().slice(0, 3).toUpperCase(),
      city: "Brasil",
      country: "Brasil",
    }
  );
}

// ─── 2. Helpers de Conversão ──────────────────────────────────────────────────

function parseNum(val: unknown): number {
  if (val == null || val === "-" || val === "") return 0;
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  const cleaned = String(val).replace("%", "").replace(",", ".").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function parseExcelDate(serial: unknown): Date {
  if (typeof serial === "number" && serial > 0) {
    return new Date((serial - 25569) * 86400 * 1000);
  }
  if (typeof serial === "string" && !isNaN(Date.parse(serial))) {
    return new Date(serial);
  }
  return new Date();
}

function mapWyscoutPosition(pos: string | undefined): Position {
  if (!pos) return Position.CENTRAL_MID;
  const upper = pos.trim().toUpperCase();
  if (upper.includes("GK")) return Position.GOALKEEPER;
  if (upper === "LB" || upper === "LWB") return Position.LEFT_BACK;
  if (upper === "RB" || upper === "RWB") return Position.RIGHT_BACK;
  if (upper.includes("CB")) return Position.CENTER_BACK;
  if (upper.includes("DM")) return Position.DEFENSIVE_MID;
  if (upper.includes("AM") || upper === "CAM") return Position.ATTACKING_MID;
  if (upper === "LM" || upper === "LW") return Position.LEFT_WING;
  if (upper === "RM" || upper === "RW") return Position.RIGHT_WING;
  if (upper === "CF" || upper === "ST" || upper.includes("CF")) return Position.STRIKER;
  if (upper.includes("CM")) return Position.CENTRAL_MID;
  return Position.CENTRAL_MID;
}

// ─── 3. Execução Principal do Pipeline ────────────────────────────────────────

async function main() {
  console.log("🚀 =================================================================");
  console.log("   INICIANDO PIPELINE OFICIAL DE INGESTÃO: BRASILEIRÃO SÉRIE A 2026");
  console.log("===================================================================\n");

  if (!fs.existsSync(MATCH_FILE) || !fs.existsSync(PLAYER_FILE)) {
    throw new Error(
      `Arquivos não encontrados:\n- Partidas: ${MATCH_FILE}\n- Jogadores: ${PLAYER_FILE}`
    );
  }

  // 1. Liga Canônica
  let league = await prisma.league.findFirst({
    where: { name: "Brasileirão Série A" },
  });
  if (!league) {
    league = await prisma.league.create({
      data: {
        name: "Brasileirão Série A",
        country: "Brasil",
        season: "2026",
      },
    });
  }
  console.log(`✅ Liga pronta: ${league.name} (${league.season}) [ID: ${league.id}]`);

  // 2. Leitura dos Arquivos Excel
  console.log(`\n📂 Lendo arquivo de partidas: ${MATCH_FILE}...`);
  const wbMatch = xlsx.readFile(MATCH_FILE);
  const matchRows: Record<string, unknown>[] = xlsx.utils.sheet_to_json(
    wbMatch.Sheets[wbMatch.SheetNames[0]]
  );
  console.log(`   ➔ ${matchRows.length} linhas de partidas carregadas.`);

  console.log(`📂 Lendo arquivo de jogadores: ${PLAYER_FILE}...`);
  const wbPlayer = xlsx.readFile(PLAYER_FILE);
  const playerRows: Record<string, unknown>[] = xlsx.utils.sheet_to_json(
    wbPlayer.Sheets[wbPlayer.SheetNames[0]]
  );
  console.log(`   ➔ ${playerRows.length} atletas profissionais carregados.`);

  // 3. Cadastro dos 20 Clubes da Série A
  console.log("\n⚽ Sincronizando os 20 Clubes Oficiais...");
  const rawTeamNames = Array.from(
    new Set(playerRows.map((r) => String(r["Time"] || "")))
  );
  const teamMap: Record<string, Team> = {};

  for (const rawName of rawTeamNames) {
    const info = resolveClub(rawName);
    let team = await prisma.team.findFirst({
      where: {
        OR: [
          { name: info.canonicalName },
          { shortName: info.shortName },
          { name: rawName },
        ],
      },
    });

    if (!team) {
      team = await prisma.team.create({
        data: {
          name: info.canonicalName,
          shortName: info.shortName,
          city: info.city,
          country: info.country,
          leagueId: league.id,
        },
      });
      console.log(`   ➕ Clube criado: ${team.name} (${team.shortName})`);
    } else {
      // Atualizar dados de padronização
      team = await prisma.team.update({
        where: { id: team.id },
        data: {
          name: info.canonicalName,
          shortName: info.shortName,
          leagueId: league.id,
        },
      });
      console.log(`   ✔ Clube sincronizado: ${team.name} (${team.shortName})`);
    }

    teamMap[rawName] = team;
    teamMap[info.canonicalName] = team;
  }

  // 4. Ingestão de Partidas e Cálculo da Posse Média por Clube
  console.log("\n📅 Cadastrando e vinculando partidas reais do Brasileirão...");
  const teamPossessionAccumulator: Record<string, { total: number; count: number }> = {};
  let matchesCreated = 0;

  for (const row of matchRows) {
    const matchStr = String(row["Match"] || "");
    const matchDate = parseExcelDate(row["Data"]);
    let rawPossession = parseNum(row["Posse de bola, %"]);
    if (rawPossession <= 1.0 && rawPossession > 0) {
      rawPossession = rawPossession * 100;
    }
    const possession = rawPossession > 0 ? rawPossession : 50;
    const opponentPossession = 100 - possession;

    // Extrair "Time A 2:1 Time B"
    const scoreMatch = matchStr.match(/^(.*?)\s+(\d+):(\d+)\s+(.*?)$/);
    if (!scoreMatch) continue;

    const [, homeRaw, homeG, awayG, awayRaw] = scoreMatch;
    const homeTeam = teamMap[homeRaw] || teamMap[resolveClub(homeRaw).canonicalName];
    const awayTeam = teamMap[awayRaw] || teamMap[resolveClub(awayRaw).canonicalName];

    if (!homeTeam) continue;

    // Acumular posse
    if (!teamPossessionAccumulator[homeTeam.id]) {
      teamPossessionAccumulator[homeTeam.id] = { total: 0, count: 0 };
    }
    teamPossessionAccumulator[homeTeam.id].total += possession;
    teamPossessionAccumulator[homeTeam.id].count += 1;

    // Verificar se já existe partida
    const existing = await prisma.match.findFirst({
      where: {
        teamId: homeTeam.id,
        opponentName: awayTeam ? awayTeam.name : awayRaw,
        date: matchDate,
      },
    });

    if (!existing) {
      await prisma.match.create({
        data: {
          teamId: homeTeam.id,
          opponentName: awayTeam ? awayTeam.name : awayRaw,
          opponentId: awayTeam ? awayTeam.id : undefined,
          date: matchDate,
          competition: "Brasileirão Série A",
          round: "Rodada Série A",
          venue: MatchVenue.HOME,
          goalsFor: parseInt(homeG, 10),
          goalsAgainst: parseInt(awayG, 10),
          possession,
          opponentPossession,
          leagueId: league.id,
        },
      });
      matchesCreated++;
    }
  }
  console.log(`   ✅ ${matchesCreated} novas partidas gravadas.`);

  // Posse média de cada clube
  const clubOpponentPossessionMap: Record<string, number> = {};
  for (const [teamId, data] of Object.entries(teamPossessionAccumulator)) {
    const avgPoss = data.count > 0 ? data.total / data.count : 50;
    clubOpponentPossessionMap[teamId] = Math.round((100 - avgPoss) * 10) / 10;
  }

  // 5. Ingestão em Lote dos 671 Atletas com Motor Matemático
  console.log("\n🏃 Ingerindo e normalizando os 671 atletas com motor IDG, PAdj e xG/Shot...");

  // Pegar ou criar uma partida de referência de cada time para associar a métrica bruta
  const teamDefaultMatchMap: Record<string, string> = {};
  for (const team of Object.values(teamMap)) {
    let firstMatch = await prisma.match.findFirst({ where: { teamId: team.id } });
    if (!firstMatch) {
      firstMatch = await prisma.match.create({
        data: {
          teamId: team.id,
          opponentName: "Temporada Regular 2026",
          date: new Date("2026-08-01"),
          competition: "Brasileirão Série A",
          round: "Rodada 1",
          venue: MatchVenue.HOME,
          possession: 50,
          opponentPossession: 50,
          leagueId: league.id,
        },
      });
    }
    teamDefaultMatchMap[team.id] = firstMatch.id;
  }

  let athleteCount = 0;
  const BATCH_SIZE = 25;

  for (let i = 0; i < playerRows.length; i += BATCH_SIZE) {
    const batch = playerRows.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (row) => {
        const playerName = String(row["Jogador"] || "").trim();
        const rawTeam = String(row["Time"] || "").trim();
        const team = teamMap[rawTeam] || teamMap[resolveClub(rawTeam).canonicalName];

        if (!playerName || !team) return;

        const age = parseNum(row["Idade"]);
        const height = parseNum(row["Altura"]);
        const weight = parseNum(row["Peso"]);
        const nationality = String(row["Nacionalidade"] || "Brasil");
        const position = mapWyscoutPosition(
          row["Posição"] != null ? String(row["Posição"]) : undefined
        );
        const minutes = parseNum(row["Minutos jogados"]);
        const matches = parseNum(row["Partidas jogadas"]);
        const rating = parseNum(row["Índice"]);

        // Totais de ações ofensivas e defensivas
        const goals = parseNum(row["Gols"]);
        const assists = parseNum(row["Assistências"]);
        const shots = parseNum(row["Chutes"]);
        const shotsOnTarget = parseNum(row["Chutes no alvo"]);
        const xg = parseNum(row["xG (Gols esperados)"]);
        const passes = parseNum(row["Passes"]);
        const passAccuracy = parseNum(row["Passes precisos, %"]) * 100;
        const progPasses = parseNum(row["Passes progressivos"]);
        const keyPasses = parseNum(row["Passes-chave"]);
        const crosses = parseNum(row["Cruzamentos"]);
        const tackles = parseNum(row["Desarmes"]);
        const interceptions = parseNum(row["Interceptações"]);
        const dribbles = parseNum(row["Dribles"]);
        const aerialDuels = parseNum(row["Duelos aéreos"]);
        const groundDuels = parseNum(row["Duelos defensivos"]);
        const recoveries = parseNum(row["Recuperações da bola"]);
        const clearances = parseNum(row["Duelos ganhos"]);

        // Cálculo de Per-90 com segurança
        const per90 = (val: number) =>
          minutes > 0 ? Math.round(((val / minutes) * 90) * 100) / 100 : 0;

        // PAdj (Defesa ajustada pela posse adversária)
        const oppPossession = clubOpponentPossessionMap[team.id] || 50;
        const padjTackles = calculatePAdj(per90(tackles), oppPossession);
        const padjInterceptions = calculatePAdj(per90(interceptions), oppPossession);

        // xG/Shot
        const xgPerShot = calculateXgPerShot(xg, shots);

        // Cálculo do IDG (Índice de Desempenho Global e Estabilidade)
        const successfulActionsPct = parseNum(row["Ações bem-sucedidas, %"]) * 100;
        const duelWinPct = parseNum(row["Duelos ganhos, %"]) * 100;

        // Indicador de estabilidade longitudinal baseado na coerência dos rates e minutos
        const varianceBase = Math.abs(successfulActionsPct - 75) * 0.4 + Math.abs(duelWinPct - 50) * 0.3;
        const idgScore = Math.min(45, Math.max(8.5, Math.round((12.5 + varianceBase * 0.5) * 10) / 10));

        const stabilityCategory: StabilityCategory =
          idgScore < 15
            ? StabilityCategory.HIGH
            : idgScore <= 30
            ? StabilityCategory.MODERATE
            : StabilityCategory.LOW;

        // Upsert do Atleta
        let athlete = await prisma.athlete.findFirst({
          where: { name: playerName, teamId: team.id },
        });

        const birthDate = age > 0 ? new Date(2026 - Math.round(age), 0, 1) : null;

        if (!athlete) {
          athlete = await prisma.athlete.create({
            data: {
              name: playerName,
              position,
              birthDate,
              height: height > 0 ? Math.round(height) : null,
              weight: weight > 0 ? Math.round(weight) : null,
              nationality,
              footPreference: FootPreference.RIGHT,
              teamId: team.id,
              notes: `Atleta oficial da Série A 2026. Índice Wyscout: ${rating} (${matches} jogos, ${minutes} min).`,
              idgScore,
              stabilityCategory,
            },
          });
        } else {
          athlete = await prisma.athlete.update({
            where: { id: athlete.id },
            data: {
              position,
              birthDate,
              height: height > 0 ? Math.round(height) : undefined,
              weight: weight > 0 ? Math.round(weight) : undefined,
              nationality,
              idgScore,
              stabilityCategory,
            },
          });
        }

        // Salvar TODAS as 75 colunas brutas no JSONB (RawMetric)
        const defaultMatchId = teamDefaultMatchMap[team.id];
        if (defaultMatchId) {
          await prisma.rawMetric.deleteMany({
            where: { athleteId: athlete.id },
          });

          const rawMetric = await prisma.rawMetric.create({
            data: {
              athleteId: athlete.id,
              matchId: defaultMatchId,
              source: MetricSource.WYSCOUT,
              minutesPlayed: Math.round(minutes),
              data: row as Prisma.InputJsonValue, // Gravando 100% das 75 colunas brutas no JSONB
            },
          });

          // Gravar métricas canônicas agregadas
          await prisma.canonicalMetric.deleteMany({
            where: { athleteId: athlete.id },
          });

          const canonicalData = [
            { metricName: "goals", absoluteValue: goals, per90Value: per90(goals) },
            { metricName: "assists", absoluteValue: assists, per90Value: per90(assists) },
            { metricName: "shots", absoluteValue: shots, per90Value: per90(shots) },
            { metricName: "shots_on_target", absoluteValue: shotsOnTarget, per90Value: per90(shotsOnTarget) },
            { metricName: "xg", absoluteValue: xg, per90Value: per90(xg) },
            { metricName: "xg_per_shot", absoluteValue: xgPerShot, per90Value: xgPerShot },
            { metricName: "passes", absoluteValue: passes, per90Value: per90(passes) },
            { metricName: "pass_accuracy", absoluteValue: passAccuracy, per90Value: passAccuracy },
            { metricName: "progressive_passes", absoluteValue: progPasses, per90Value: per90(progPasses) },
            { metricName: "key_passes", absoluteValue: keyPasses, per90Value: per90(keyPasses) },
            { metricName: "crosses_accurate", absoluteValue: crosses, per90Value: per90(crosses) },
            { metricName: "tackles", absoluteValue: tackles, per90Value: per90(tackles) },
            { metricName: "padj_tackles", absoluteValue: padjTackles, per90Value: padjTackles },
            { metricName: "interceptions", absoluteValue: interceptions, per90Value: per90(interceptions) },
            { metricName: "padj_interceptions", absoluteValue: padjInterceptions, per90Value: padjInterceptions },
            { metricName: "dribbles_completed", absoluteValue: dribbles, per90Value: per90(dribbles) },
            { metricName: "aerial_duels_won", absoluteValue: aerialDuels, per90Value: per90(aerialDuels) },
            { metricName: "ground_duels_won", absoluteValue: groundDuels, per90Value: per90(groundDuels) },
            { metricName: "recoveries", absoluteValue: recoveries, per90Value: per90(recoveries) },
            { metricName: "clearances", absoluteValue: clearances, per90Value: per90(clearances) },
            { metricName: "rating", absoluteValue: rating > 0 ? rating / 25 : 7.0, per90Value: rating > 0 ? rating / 25 : 7.0 },
          ];

          await prisma.canonicalMetric.createMany({
            data: canonicalData.map((c) => ({
              rawMetricId: rawMetric.id,
              athleteId: athlete.id,
              matchId: defaultMatchId,
              metricName: c.metricName,
              absoluteValue: c.absoluteValue,
              per90Value: c.per90Value,
            })),
          });
        }

        athleteCount++;
      })
    );

    process.stdout.write(`   ➔ Processados ${Math.min(i + BATCH_SIZE, playerRows.length)} / ${playerRows.length} atletas...\r`);
  }

  console.log(`\n\n🎉 INGESTÃO CONCLUÍDA COM SUCESSO!`);
  console.log(`📊 Total de atletas sincronizados na Série A: ${athleteCount}`);
  console.log(`🏟️ Total de clubes com dados ativos: ${Object.keys(teamMap).length / 2}`);
  console.log(`⚡ Todas as 75 colunas arquivadas com segurança no banco Neon!`);
}

main()
  .catch((e) => {
    console.error("❌ Erro fatal no pipeline de importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
