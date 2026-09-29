/**
 * Seed script — cria o usuário admin de desenvolvimento
 * Execução: npx tsx prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@thenetscout.com";

  // Verifica se já existe para não duplicar
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Usuário admin já existe: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash("admin123", 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name: "Admin TNS",
      role: "ADMIN",
    },
  });

  console.log(`✅ Usuário admin criado: ${user.email} (id: ${user.id})`);
  console.log("   Email: admin@thenetscout.com");
  console.log("   Senha: admin123");
  console.log("   ⚠️  Altere a senha em produção!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
