import {
  PrismaClient,
  Position,
  FootPreference,
  MatchVenue,
  MetricSource,
  Team,
  Match,
  AnalystPortfolio,
} from "@prisma/client";
import { normalizeRawMetric } from "../src/lib/normalization";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando carga de dados do Showroom (Brasileirão Série A)...");

  // 1. Liga
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
  console.log("✅ Liga criada/encontrada:", league.name);

  // 2. Clubes
  const teamsData = [
    { name: "Palmeiras", shortName: "PAL", country: "Brasil", city: "São Paulo" },
    { name: "Flamengo", shortName: "FLA", country: "Brasil", city: "Rio de Janeiro" },
    { name: "Botafogo", shortName: "BOT", country: "Brasil", city: "Rio de Janeiro" },
    { name: "São Paulo", shortName: "SAO", country: "Brasil", city: "São Paulo" },
    { name: "Cruzeiro", shortName: "CRU", country: "Brasil", city: "Belo Horizonte" },
    { name: "Grêmio", shortName: "GRE", country: "Brasil", city: "Porto Alegre" },
  ];

  const teams: Record<string, Team> = {};
  for (const t of teamsData) {
    let team = await prisma.team.findFirst({ where: { name: t.name } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          ...t,
          leagueId: league.id,
        },
      });
    }
    teams[t.name] = team;
  }
  console.log(`✅ ${Object.keys(teams).length} clubes prontos`);

  // 3. Jogos da Rodada
  const matchesData = [
    {
      teamId: teams["Palmeiras"].id,
      opponentId: teams["Flamengo"].id,
      opponentName: "Flamengo",
      venue: MatchVenue.HOME,
      competition: "Brasileirão Série A",
      round: "Rodada 18",
      goalsFor: 2,
      goalsAgainst: 1,
      date: new Date("2026-08-15T16:00:00Z"),
      leagueId: league.id,
    },
    {
      teamId: teams["Botafogo"].id,
      opponentId: teams["São Paulo"].id,
      opponentName: "São Paulo",
      venue: MatchVenue.HOME,
      competition: "Brasileirão Série A",
      round: "Rodada 18",
      goalsFor: 3,
      goalsAgainst: 0,
      date: new Date("2026-08-15T18:30:00Z"),
      leagueId: league.id,
    },
    {
      teamId: teams["Cruzeiro"].id,
      opponentId: teams["Grêmio"].id,
      opponentName: "Grêmio",
      venue: MatchVenue.HOME,
      competition: "Brasileirão Série A",
      round: "Rodada 18",
      goalsFor: 1,
      goalsAgainst: 1,
      date: new Date("2026-08-16T16:00:00Z"),
      leagueId: league.id,
    },
  ];

  const matches: Match[] = [];
  for (const m of matchesData) {
    let match = await prisma.match.findFirst({
      where: {
        teamId: m.teamId,
        opponentName: m.opponentName,
        round: m.round,
      },
    });
    if (!match) {
      match = await prisma.match.create({ data: m });
    }
    matches.push(match);
  }
  console.log(`✅ ${matches.length} partidas registradas`);

  // 4. Atletas e Scouts Reais
  const athletesData = [
    {
      name: "Estêvão Willian",
      position: Position.RIGHT_WING,
      teamName: "Palmeiras",
      birthDate: new Date("2007-04-24"),
      nationality: "Brasil",
      height: 176,
      weight: 68,
      footPreference: FootPreference.LEFT,
      notes: "Extremo desequilibrante no 1v1. Tomada de decisão madura, condução em velocidade e finalização com curva.",
      matchIndex: 0, // Palmeiras x Flamengo
      minutesPlayed: 88,
      stats: {
        goals: 1,
        assists: 1,
        shots: 4,
        shots_on_target: 2,
        xg: 0.78,
        dribbles_completed: 6,
        key_passes: 3,
        passes: 38,
        pass_accuracy: 86,
        progressive_passes: 6,
        rating: 8.8,
      },
      pinToPortfolio: true,
      portfolioNote: "Prioridade scouting internacional. Potencial Ballon d'Or sub-21.",
    },
    {
      name: "Luiz Henrique",
      position: Position.RIGHT_WING,
      teamName: "Botafogo",
      birthDate: new Date("2001-01-02"),
      nationality: "Brasil",
      height: 182,
      weight: 78,
      footPreference: FootPreference.LEFT,
      notes: "Ponta de força física aliada a drible curto. Proteção de bola de costas para a marcação e potência em chutes cruzados.",
      matchIndex: 1, // Botafogo x São Paulo
      minutesPlayed: 82,
      stats: {
        goals: 1,
        assists: 1,
        shots: 3,
        shots_on_target: 2,
        xg: 0.62,
        dribbles_completed: 5,
        key_passes: 4,
        passes: 32,
        pass_accuracy: 84,
        rating: 8.5,
      },
      pinToPortfolio: true,
      portfolioNote: "Desempenho de seleção nacional. Força física superior na transição ofensiva.",
    },
    {
      name: "Gerson",
      position: Position.CENTRAL_MID,
      teamName: "Flamengo",
      birthDate: new Date("1997-05-20"),
      nationality: "Brasil",
      height: 184,
      weight: 79,
      footPreference: FootPreference.LEFT,
      notes: "Médio interior de alto ritmo. Retenção de bola sob pressão, condução pelo centro e visão vertical de passe.",
      matchIndex: 0, // Palmeiras x Flamengo
      minutesPlayed: 90,
      stats: {
        goals: 0,
        assists: 1,
        passes: 64,
        pass_accuracy: 92,
        progressive_passes: 8,
        key_passes: 3,
        tackles: 4,
        interceptions: 2,
        ground_duels_won: 7,
        rating: 7.9,
      },
      pinToPortfolio: false,
    },
    {
      name: "Aníbal Moreno",
      position: Position.DEFENSIVE_MID,
      teamName: "Palmeiras",
      birthDate: new Date("1999-05-13"),
      nationality: "Argentina",
      height: 178,
      weight: 74,
      footPreference: FootPreference.RIGHT,
      notes: "Volante de cobertura defensiva impecável. Leitura de espaços, pressão imediata pós-perda e desarme limpo.",
      matchIndex: 0, // Palmeiras x Flamengo
      minutesPlayed: 90,
      stats: {
        tackles: 6,
        interceptions: 4,
        recoveries: 9,
        clearances: 3,
        ground_duels_won: 9,
        aerial_duels_won: 3,
        passes: 52,
        pass_accuracy: 89,
        rating: 8.2,
      },
      pinToPortfolio: true,
      portfolioNote: "Líder defensivo. Volume de desarmes e interceptações no topo da liga.",
    },
    {
      name: "Bastos",
      position: Position.CENTER_BACK,
      teamName: "Botafogo",
      birthDate: new Date("1991-11-23"),
      nationality: "Angola",
      height: 188,
      weight: 84,
      footPreference: FootPreference.RIGHT,
      notes: "Zagueiro dominante no jogo aéreo e nas disputas de 1 contra 1. Velocidade de recuperação e desarmes firmes.",
      matchIndex: 1, // Botafogo x São Paulo
      minutesPlayed: 90,
      stats: {
        clearances: 7,
        interceptions: 3,
        blocks: 2,
        tackles: 3,
        aerial_duels_won: 6,
        passes: 45,
        pass_accuracy: 91,
        rating: 8.1,
      },
      pinToPortfolio: false,
    },
    {
      name: "Matheus Pereira",
      position: Position.ATTACKING_MID,
      teamName: "Cruzeiro",
      birthDate: new Date("1996-05-05"),
      nationality: "Brasil",
      height: 175,
      weight: 70,
      footPreference: FootPreference.LEFT,
      notes: "Cérebro criativo da equipe. Capacidade de quebrar linhas com passes entre defensores e cobranças venenosas de bola parada.",
      matchIndex: 2, // Cruzeiro x Grêmio
      minutesPlayed: 90,
      stats: {
        goals: 1,
        assists: 0,
        shots: 3,
        xg: 0.45,
        key_passes: 5,
        passes: 58,
        pass_accuracy: 88,
        progressive_passes: 7,
        dribbles_completed: 3,
        rating: 8.4,
      },
      pinToPortfolio: true,
      portfolioNote: "Mestre da criação de oportunidades. Média de passes-chave acima do padrão europeu.",
    },
    {
      name: "Mathías Villasanti",
      position: Position.DEFENSIVE_MID,
      teamName: "Grêmio",
      birthDate: new Date("1997-01-24"),
      nationality: "Paraguai",
      height: 178,
      weight: 73,
      footPreference: FootPreference.RIGHT,
      notes: "Motor incansável do meio-campo. Marcação individual agressiva e infiltração na área adversária.",
      matchIndex: 2, // Cruzeiro x Grêmio
      minutesPlayed: 90,
      stats: {
        tackles: 5,
        interceptions: 3,
        recoveries: 7,
        passes: 48,
        pass_accuracy: 87,
        rating: 7.6,
      },
      pinToPortfolio: false,
    },
    {
      name: "John",
      position: Position.GOALKEEPER,
      teamName: "Botafogo",
      birthDate: new Date("1996-02-13"),
      nationality: "Brasil",
      height: 196,
      weight: 92,
      footPreference: FootPreference.RIGHT,
      notes: "Goleiro de envergadura massiva. Reflexos excepcionais à queima-roupa e segurança nas saídas do gol.",
      matchIndex: 1, // Botafogo x São Paulo
      minutesPlayed: 90,
      stats: {
        saves: 5,
        saves_inside_box: 3,
        passes: 26,
        pass_accuracy: 78,
        rating: 8.0,
      },
      pinToPortfolio: false,
    },
  ];

  // 5. Obter usuário analista para o portfólio
  const user = await prisma.user.findFirst();
  let portfolio: AnalystPortfolio | null = null;
  if (user) {
    portfolio = await prisma.analystPortfolio.findFirst({ where: { userId: user.id } });
    if (!portfolio) {
      portfolio = await prisma.analystPortfolio.create({
        data: { userId: user.id, name: "Meu Portfólio de Scouting" },
      });
    }
  }

  for (const aData of athletesData) {
    const team = teams[aData.teamName];
    let athlete = await prisma.athlete.findFirst({
      where: { name: aData.name, teamId: team.id },
    });

    if (!athlete) {
      athlete = await prisma.athlete.create({
        data: {
          name: aData.name,
          position: aData.position,
          teamId: team.id,
          birthDate: aData.birthDate,
          nationality: aData.nationality,
          height: aData.height,
          weight: aData.weight,
          footPreference: aData.footPreference,
          notes: aData.notes,
        },
      });
    }

    const match = matches[aData.matchIndex];

    // Cria/atualiza RawMetric
    const raw = await prisma.rawMetric.upsert({
      where: {
        matchId_athleteId_source: {
          matchId: match.id,
          athleteId: athlete.id,
          source: MetricSource.WYSCOUT,
        },
      },
      create: {
        matchId: match.id,
        athleteId: athlete.id,
        source: MetricSource.WYSCOUT,
        minutesPlayed: aData.minutesPlayed,
        data: aData.stats,
      },
      update: {
        minutesPlayed: aData.minutesPlayed,
        data: aData.stats,
      },
    });

    // Normaliza para CanonicalMetric (Per-90)
    await normalizeRawMetric(prisma, raw.id);

    // Se marcado para portfólio
    if (aData.pinToPortfolio && portfolio) {
      await prisma.portfolioAthlete.upsert({
        where: {
          portfolioId_athleteId: {
            portfolioId: portfolio.id,
            athleteId: athlete.id,
          },
        },
        create: {
          portfolioId: portfolio.id,
          athleteId: athlete.id,
          notes: aData.portfolioNote,
        },
        update: {
          notes: aData.portfolioNote,
        },
      });
    }

    console.log(`⭐ Atleta processado: ${athlete.name} (${team.name}) - Per-90 computado!`);
  }

  // 6. Amostras de Links de Vídeo Táticos (Fase 4 - Issue #11)
  const estevao = await prisma.athlete.findFirst({ where: { name: { contains: "Estêvão" } } });
  if (estevao) {
    const existingVideos = await prisma.videoLink.findFirst({ where: { athleteId: estevao.id } });
    if (!existingVideos) {
      await prisma.videoLink.createMany({
        data: [
          {
            athleteId: estevao.id,
            matchId: matches[0]?.id,
            url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            title: "Gol de curva e tomada de decisão no 1v1",
            category: "Finalização & Ataque à Área",
            description: "Recebe na ponta direita, conduz para o meio e finaliza com precisão milimétrica no ângulo oposto.",
          },
          {
            athleteId: estevao.id,
            matchId: matches[0]?.id,
            url: "https://drive.google.com/file/d/1example-estevao-tactical-clip/view",
            title: "Decupagem: Saída sob pressão e quebra de linhas",
            category: "Saída de Bola & Construção",
            description: "Drible de proteção de costas e passe vertical progressivo de primeira quebrando o bloco de marcação.",
          },
        ],
      });
      console.log("🎥 Vídeos táticos do showroom vinculados a Estêvão");
    }
  }

  console.log("\n🎉 Showroom povoado com sucesso!");
  console.log("👉 Acesse o Dashboard e o Catálogo da Liga para ver o showroom em ação!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed do showroom:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
