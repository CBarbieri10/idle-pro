import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, "-") // replace spaces with hyphens
    .replace(/[^a-z0-9\-]/g, ""); // remove any other weird characters
}

async function main() {
  const teams = await prisma.team.findMany();
  let updatedCount = 0;

  for (const team of teams) {
    const slug = normalizeTeamName(team.name);
    const logoUrl = `/logos/${slug}.svg`;

    await prisma.team.update({
      where: { id: team.id },
      data: { logoUrl },
    });
    
    console.log(`Updated [${team.name}] -> ${logoUrl}`);
    updatedCount++;
  }

  console.log(`\nSuccess! Updated ${updatedCount} teams.`);
}

main()
  .catch((e) => {
    console.error("Error updating logos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
