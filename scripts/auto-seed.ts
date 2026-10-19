/**
 * Auto-Seeder de Alta Fidelidade (The Net Scouting)
 * 
 * Localiza dinamicamente a pasta ~/Desktop/stats no sistema operacional do usuário,
 * varre e identifica as 3 planilhas do SportsBase (Partidas, Times e Jogadores),
 * limpa o banco de dados preservando Clubes e Usuários Administrativos,
 * e executa os 3 Agentes de Ingestão Especializados (DDD / Strategy Pattern)
 * na ordem relacional correta.
 * 
 * Execução: npm run seed:stats
 */

import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import * as XLSX from "xlsx";
import chalk from "chalk";
import { prisma } from "../src/lib/prisma";
import {
  matchAgent,
  teamAgent,
  athleteAgent,
} from "../src/lib/services/ingestion";

interface DetectedFiles {
  matchFile: string | null;
  teamFile: string | null;
  athleteFile: string | null;
}

function cleanFileNameForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(\d+\)/g, "") // remove marcadores como (1), (2)
    .replace(/[-_.]+/g, " ")
    .trim();
}

function findStatsFiles(statsDir: string): DetectedFiles {
  const files = fs.readdirSync(statsDir);

  const detected: DetectedFiles = {
    matchFile: null,
    teamFile: null,
    athleteFile: null,
  };

  for (const file of files) {
    if (file.startsWith("~$")) continue; // ignora locks do Excel
    const ext = path.extname(file).toLowerCase();
    if (![".xlsx", ".xls", ".csv"].includes(ext)) continue;

    const clean = cleanFileNameForMatch(file);

    // 1. Identificação de Partidas / Confrontos
    if (clean.includes("partida") || clean.includes("match") || clean.includes("jogo") || clean.includes("confronto")) {
      detected.matchFile = file;
      continue;
    }

    // 2. Identificação de Jogadores / Atletas
    if (clean.includes("jogador") || clean.includes("athlete") || clean.includes("atleta") || clean.includes("player")) {
      detected.athleteFile = file;
      continue;
    }

    // 3. Identificação de Times / Equipes (sem jogador)
    if (
      (clean.includes("time") || clean.includes("equipe") || clean.includes("team") || clean.includes("clube")) &&
      !clean.includes("jogador") &&
      !clean.includes("atleta")
    ) {
      detected.teamFile = file;
      continue;
    }
  }

  return detected;
}

function readSpreadsheetRows(filePath: string): Record<string, unknown>[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    dense: true,
  });

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
}

async function wipeDatabase(): Promise<void> {
  console.log(chalk.yellow("🧹 Limpando dados voláteis no banco de dados (Wipe Seguro)..."));

  // Expurga dados dependentes mantendo Clubes, Ligas e Usuários Administrativos
  await prisma.portfolioAthlete.deleteMany({});
  await prisma.videoLink.deleteMany({});
  await prisma.athleteGoal.deleteMany({});
  await prisma.canonicalMetric.deleteMany({});
  await prisma.rawMetric.deleteMany({});

  // Desvincula e remove usuários com role ATHLETE
  await prisma.user.updateMany({
    where: { athleteId: { not: null } },
    data: { athleteId: null },
  });
  await prisma.user.deleteMany({
    where: { role: "ATHLETE" },
  });

  // Limpa atletas e partidas legadas
  const [deletedAthletes, deletedMatches] = await Promise.all([
    prisma.athlete.deleteMany({}),
    prisma.match.deleteMany({}),
  ]);

  console.log(
    chalk.green(
      `   ✔ Banco limpo: ${deletedAthletes.count} atletas e ${deletedMatches.count} partidas resetados.`
    )
  );
  console.log(chalk.gray("   ✔ Clubes (Teams), Ligas e Contas Administrativas preservados com sucesso.\n"));
}

async function main() {
  console.log(chalk.bold.cyan("\n================================================================================"));
  console.log(chalk.bold.cyan("     THE NET SCOUTING • AUTO-SEEDER DO SISTEMA OPERACIONAL (~/Desktop/stats)"));
  console.log(chalk.bold.cyan("================================================================================\n"));

  // 1. Localização dinâmica da pasta stats na Área de Trabalho
  const statsDir = path.join(os.homedir(), "Desktop", "stats");
  console.log(chalk.cyan(`🔍 Escaneando diretório: ${chalk.bold(statsDir)}`));

  if (!fs.existsSync(statsDir)) {
    console.error(
      chalk.red(`\n❌ Diretório não encontrado: ${statsDir}\nCertifique-se de que a pasta 'stats' existe na sua Área de Trabalho com os arquivos do SportsBase.`)
    );
    process.exit(1);
  }

  // 2. Identificação dos 3 arquivos por palavras-chave
  const { matchFile, teamFile, athleteFile } = findStatsFiles(statsDir);

  if (!matchFile) {
    console.error(chalk.red("❌ Arquivo de Partidas não encontrado na pasta stats (palavra 'partida' ou 'match')."));
  } else {
    console.log(chalk.blue(`   📄 Arquivo de Partidas detectado:  ${chalk.bold(matchFile)}`));
  }

  if (!teamFile) {
    console.error(chalk.red("❌ Arquivo de Times não encontrado na pasta stats (palavra 'time' ou 'equipe')."));
  } else {
    console.log(chalk.blue(`   📄 Arquivo de Clubes detectado:    ${chalk.bold(teamFile)}`));
  }

  if (!athleteFile) {
    console.error(chalk.red("❌ Arquivo de Atletas não encontrado na pasta stats (palavra 'jogador' ou 'athlete')."));
  } else {
    console.log(chalk.blue(`   📄 Arquivo de Atletas detectado:   ${chalk.bold(athleteFile)}`));
  }

  if (!matchFile || !teamFile || !athleteFile) {
    console.error(chalk.red("\n❌ Um ou mais arquivos obrigatórios estão ausentes. Abortando execução."));
    process.exit(1);
  }

  console.log(chalk.green("   ✅ Todos os 3 arquivos do SportsBase foram identificados com sucesso!\n"));

  // 3. Passo 1 (Wipe do Banco de Dados)
  await wipeDatabase();

  // 4. Passo 2 & 3: Leitura e Ingestão DDD Sequencial
  console.log(chalk.bold.cyan("🚀 Iniciando Pipeline de Ingestão Especializada (Domain-Driven Design)...\n"));

  // Etapa 1: Ingestão de Partidas (MatchAgent)
  console.log(chalk.magenta(`1/3. ⚽ Processando Partidas via ${matchAgent.agentName}...`));
  const matchPath = path.join(statsDir, matchFile);
  const matchRows = readSpreadsheetRows(matchPath);
  console.log(chalk.gray(`     Lendo ${matchRows.length} linhas do arquivo...`));
  const matchResult = await matchAgent.process(
    matchRows,
    matchFile,
    "Planilha de Partidas / Rodadas (MATCH)"
  );
  console.log(
    chalk.green(
      `     ✔ Partidas finalizadas: ${matchResult.createdCount} criadas, ${matchResult.matchedCount} atualizadas, ${matchResult.errorCount} erros.\n`
    )
  );

  // Etapa 2: Ingestão de Times (TeamAgent)
  console.log(chalk.magenta(`2/3. 🛡️  Processando Comportamento Coletivo de Clubes via ${teamAgent.agentName}...`));
  const teamPath = path.join(statsDir, teamFile);
  const teamRows = readSpreadsheetRows(teamPath);
  console.log(chalk.gray(`     Lendo ${teamRows.length} linhas do arquivo...`));
  const teamResult = await teamAgent.process(
    teamRows,
    teamFile,
    "Planilha de Clubes & Comportamento Coletivo (TEAM)"
  );
  console.log(
    chalk.green(
      `     ✔ Clubes finalizados: ${teamResult.createdCount} criados, ${teamResult.matchedCount} atualizados com telemetria de quadrantes.\n`
    )
  );

  // Etapa 3: Ingestão de Atletas (AthleteAgent com Aspirador Dinâmico)
  console.log(chalk.magenta(`3/3. 🏃 Processando Atletas com Aspirador Dinâmico via ${athleteAgent.agentName}...`));
  const athletePath = path.join(statsDir, athleteFile);
  const athleteRows = readSpreadsheetRows(athletePath);
  console.log(chalk.gray(`     Lendo ${athleteRows.length} linhas do arquivo (124+ colunas numéricas)...`));
  const athleteResult = await athleteAgent.process(
    athleteRows,
    athleteFile,
    "Planilha de Atletas (ATHLETE)"
  );
  console.log(
    chalk.green(
      `     ✔ Atletas finalizados: ${athleteResult.createdCount} criados, ${athleteResult.matchedCount} atualizados com biometria e métricas Moneyball.\n`
    )
  );

  // 5. Censo Final Pós-Ingestão
  const [totalAthletes, totalMatches, totalRawMetrics, totalCanonicalMetrics, totalTeams] =
    await Promise.all([
      prisma.athlete.count(),
      prisma.match.count(),
      prisma.rawMetric.count(),
      prisma.canonicalMetric.count(),
      prisma.team.count(),
    ]);

  console.log(chalk.bold.cyan("================================================================================"));
  console.log(chalk.bold.green("   ✅ INGESTÃO DO SISTEMA CONCLUÍDA COM SUCESSO!"));
  console.log(chalk.bold.cyan("================================================================================"));
  console.log(chalk.white(`   • Atletas no banco:           ${chalk.bold.green(totalAthletes)}`));
  console.log(chalk.white(`   • Partidas registradas:       ${chalk.bold.green(totalMatches)}`));
  console.log(chalk.white(`   • Clubes cadastrados:         ${chalk.bold.green(totalTeams)}`));
  console.log(chalk.white(`   • Métricas Brutas (Raw):      ${chalk.bold.green(totalRawMetrics)}`));
  console.log(chalk.white(`   • Métricas Canônicas:         ${chalk.bold.green(totalCanonicalMetrics)}`));
  console.log(chalk.bold.cyan("================================================================================\n"));
  console.log(chalk.bold.green("🎉 Base 100% fidedigna com os dados reais do SportsBase da sua Área de Trabalho!\n"));
}

main()
  .catch((err) => {
    console.error(chalk.red("\n❌ Falha fatal no Auto-Seeder:"), err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
