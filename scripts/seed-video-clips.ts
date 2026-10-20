import chalk from "chalk";
import { prisma } from "../src/lib/prisma";

async function main() {
  console.log(chalk.bold.cyan("\n================================================================================"));
  console.log(chalk.bold.cyan("     OVERVIEW SCOUT • MOCK DE DECUPAGEM TÁTICA (VIDEO CLIPS)"));
  console.log(chalk.bold.cyan("================================================================================\n"));

  console.log(chalk.yellow("🧹 Limpando VideoClips prévios para recriação limpa..."));
  await prisma.videoClip.deleteMany({});

  const targetNames = ["Pedro", "Alex Sandro", "Arrascaeta", "Gerson", "Estêvão", "Veiga"];
  let athletes = await prisma.athlete.findMany({
    where: {
      OR: targetNames.map((name) => ({ name: { contains: name, mode: "insensitive" } })),
    },
    include: { team: true },
    take: 8,
  });

  if (athletes.length === 0) {
    athletes = await prisma.athlete.findMany({
      include: { team: true },
      take: 8,
    });
  }

  const matches = await prisma.match.findMany({
    take: 12,
    orderBy: { date: "desc" },
  });

  const sampleClipsTemplates = [
    {
      category: "Gol",
      titleSuffix: "Finalização de primeira na grande área após cruzamento rasteiro",
      url: "https://www.youtube.com/watch?v=0e3GPea1Tyg",
      thumbnailUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80",
      timestamp: "14:22",
    },
    {
      category: "Passe Progressivo",
      titleSuffix: "Ruptura vertical quebrando 2 linhas de marcação compacta",
      url: "https://www.youtube.com/watch?v=7wtfhZwyrcc",
      thumbnailUrl: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=80",
      timestamp: "38:45",
    },
    {
      category: "Desarme",
      titleSuffix: "Recuperação imediata pós-perda com desarme frontal limpo",
      url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      thumbnailUrl: "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=800&q=80",
      timestamp: "67:10",
    },
    {
      category: "Perda de Posse",
      titleSuffix: "Pressão adversária em zona 14 e perda sob dobra de marcação",
      url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      thumbnailUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
      timestamp: "82:04",
    },
    {
      category: "Passe Progressivo",
      titleSuffix: "Inversão de corredor com bola longa precisa de 40 metros",
      url: "https://www.youtube.com/watch?v=0e3GPea1Tyg",
      thumbnailUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=800&q=80",
      timestamp: "27:50",
    },
    {
      category: "Gol",
      titleSuffix: "Cabeceio certeiro no ângulo após infiltração em bola parada",
      url: "https://www.youtube.com/watch?v=7wtfhZwyrcc",
      thumbnailUrl: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80",
      timestamp: "51:18",
    },
  ];

  let totalCreated = 0;

  for (let i = 0; i < athletes.length; i++) {
    const athlete = athletes[i];
    const match = matches[i % matches.length] || null;
    const countToCreate = i % 2 === 0 ? 3 : 2;

    for (let c = 0; c < countToCreate; c++) {
      const template = sampleClipsTemplates[(i + c) % sampleClipsTemplates.length];
      await prisma.videoClip.create({
        data: {
          title: `${athlete.name} • ${template.titleSuffix}`,
          url: template.url,
          thumbnailUrl: template.thumbnailUrl,
          category: template.category,
          timestamp: template.timestamp,
          athleteId: athlete.id,
          matchId: match ? match.id : undefined,
        },
      });
      totalCreated++;
    }
    console.log(chalk.green(`   ✔ ${athlete.name} (${athlete.team?.name ?? "Sem Clube"}): ${countToCreate} clipes táticos gerados.`));
  }

  const count = await prisma.videoClip.count();
  console.log(chalk.bold.green(`\n✅ Concluído! Total de VideoClips no banco: ${count}\n`));
}

main()
  .catch((err) => {
    console.error(chalk.red("Erro ao gerar video clips:"), err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
