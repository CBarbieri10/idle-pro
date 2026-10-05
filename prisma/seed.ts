/**
 * Seed script — cria o usuário admin de desenvolvimento
 * Execução: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const accounts = [
    { email: "admin@thenetscout.com", name: "Admin TNS", role: "ADMIN" as const },
    { email: "analista@thenetscouting.com", name: "Analista de Desempenho", role: "ANALYST" as const },
  ];

  const passwordHash = await bcrypt.hash("admin123", 12);

  for (const acc of accounts) {
    const existing = await prisma.user.findUnique({ where: { email: acc.email } });
    if (existing) {
      await prisma.user.update({
        where: { email: acc.email },
        data: { password: passwordHash },
      });
      console.log(`✅ Usuário atualizado/garantido: ${acc.email} (senha: admin123)`);
    } else {
      await prisma.user.create({
        data: {
          email: acc.email,
          password: passwordHash,
          name: acc.name,
          role: acc.role,
        },
      });
      console.log(`✅ Usuário criado: ${acc.email} (senha: admin123)`);
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
