/**
 * Script de Expurgo / Wipe da Base de Dados (The Net Scouting)
 * 
 * Limpa todos os atletas, partidas, métricas e dados de mock gerados pelo seed legado,
 * deixando o banco virgem para a importação das planilhas reais do Brasileirão 2026
 * via Dropzone (Wyscout / SportsBase).
 * 
 * Preserva estritamente:
 * - Usuários de acesso administrativo (ADMIN, ANALYST, CLUB)
 * - Clubes (Team) e Ligas (League)
 * - Templates de Mapeamento (MappingTemplate)
 * 
 * Execução: npx tsx scripts/wipe-mock-data.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("================================================================================");
  console.log("   THE NET SCOUTING • ROTINA DE EXPURGO SEGURO DA BASE (WIPE SEED FAKE)");
  console.log("================================================================================\n");

  // 1. Diagnóstico Pré-Wipe
  const [
    athleteCount,
    matchCount,
    rawMetricCount,
    canonicalMetricCount,
    portfolioAthleteCount,
    videoLinkCount,
    goalCount,
    agendaCount,
    userCount,
  ] = await Promise.all([
    prisma.athlete.count(),
    prisma.match.count(),
    prisma.rawMetric.count(),
    prisma.canonicalMetric.count(),
    prisma.portfolioAthlete.count(),
    prisma.videoLink.count(),
    prisma.athleteGoal.count(),
    prisma.agendaEvent.count(),
    prisma.user.count(),
  ]);

  console.log("📊 Censo Atual no Neon Database:");
  console.log(`   - Atletas cadastrados:           ${athleteCount}`);
  console.log(`   - Partidas registradas:          ${matchCount}`);
  console.log(`   - Métricas brutas (Raw):         ${rawMetricCount}`);
  console.log(`   - Métricas canônicas:            ${canonicalMetricCount}`);
  console.log(`   - Atletas em portfólios:         ${portfolioAthleteCount}`);
  console.log(`   - Links de vídeo tático:         ${videoLinkCount}`);
  console.log(`   - Metas de desenvolvimento:      ${goalCount}`);
  console.log(`   - Eventos de agenda:             ${agendaCount}`);
  console.log(`   - Usuários do sistema:           ${userCount}\n`);

  console.log("🧹 Iniciando expurgo em cascata controlada...\n");

  // 2. Desvincular e remover contas do tipo ATHLETE (mantendo apenas ADMIN, ANALYST, CLUB)
  console.log("1/9. Desvinculando e limpando contas de atletas...");
  await prisma.user.updateMany({
    where: { athleteId: { not: null } },
    data: { athleteId: null },
  });
  const deletedAthleteUsers = await prisma.user.deleteMany({
    where: { role: "ATHLETE" },
  });
  console.log(`   ✔ ${deletedAthleteUsers.count} contas do tipo ATHLETE removidas.`);

  // 3. Limpar Eventos de Agenda vinculados ou mockados
  console.log("2/9. Limpando eventos de agenda...");
  const deletedAgenda = await prisma.agendaEvent.deleteMany({});
  console.log(`   ✔ ${deletedAgenda.count} eventos de agenda removidos.`);

  // 4. Limpar Portfólios de Atletas
  console.log("3/9. Limpando atletas dos portfólios...");
  const deletedPortfolioAthletes = await prisma.portfolioAthlete.deleteMany({});
  console.log(`   ✔ ${deletedPortfolioAthletes.count} associações de portfólio removidas.`);

  // 5. Limpar Vídeos e Metas
  console.log("4/9. Limpando vídeos e metas...");
  const [deletedVideos, deletedGoals] = await Promise.all([
    prisma.videoLink.deleteMany({}),
    prisma.athleteGoal.deleteMany({}),
  ]);
  console.log(`   ✔ ${deletedVideos.count} vídeos e ${deletedGoals.count} metas removidos.`);

  // 6. Limpar Métricas Canônicas e Brutas
  console.log("5/9. Limpando métricas canônicas e brutas...");
  const deletedCanonical = await prisma.canonicalMetric.deleteMany({});
  const deletedRaw = await prisma.rawMetric.deleteMany({});
  console.log(`   ✔ ${deletedCanonical.count} canônicas e ${deletedRaw.count} brutas removidas.`);

  // 7. Limpar Atletas
  console.log("6/9. Excluindo atletas legados...");
  const deletedAthletes = await prisma.athlete.deleteMany({});
  console.log(`   ✔ ${deletedAthletes.count} atletas excluídos com sucesso.`);

  // 8. Limpar Partidas
  console.log("7/9. Excluindo partidas legadas...");
  const deletedMatches = await prisma.match.deleteMany({});
  console.log(`   ✔ ${deletedMatches.count} partidas excluídas.`);

  // 9. Verificação Pós-Wipe
  console.log("8/9. Auditando integridade do banco virgem...");
  const [finalAthletes, finalMatches, finalCanonical, finalUsers, finalTeams] = await Promise.all([
    prisma.athlete.count(),
    prisma.match.count(),
    prisma.canonicalMetric.count(),
    prisma.user.findMany({ select: { email: true, role: true, name: true } }),
    prisma.team.count(),
  ]);

  console.log("\n================================================================================");
  console.log("   RESULTADO DO EXPURGO: BANCO VIRGEM & PRONTO PARA IMPORTAÇÃO 2026");
  console.log("================================================================================");
  console.log(`   - Atletas remanescentes:    ${finalAthletes} (esperado: 0)`);
  console.log(`   - Partidas remanescentes:   ${finalMatches} (esperado: 0)`);
  console.log(`   - Métricas remanescentes:   ${finalCanonical} (esperado: 0)`);
  console.log(`   - Clubes preservados:       ${finalTeams}`);
  console.log(`   - Usuários administrativos mantidos: ${finalUsers.length}`);
  finalUsers.forEach((u) => {
    console.log(`       • [${u.role}] ${u.email} (${u.name})`);
  });
  console.log("================================================================================\n");
  console.log("🚀 O banco de dados está pronto para receber a primeira planilha real via Dropzone!");
}

main()
  .catch((error) => {
    console.error("❌ Falha durante o expurgo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
