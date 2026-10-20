import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  const hash = await bcrypt.hash("admin123", 12);

  // Update old domains to overviewscout.com
  await prisma.user.updateMany({
    where: { email: "admin@thenetscout.com" },
    data: {
      email: "admin@overviewscout.com",
      name: "Admin Overview Scout",
      password: hash,
    },
  });

  await prisma.user.updateMany({
    where: { email: "analista@thenetscouting.com" },
    data: {
      email: "analista@overviewscout.com",
      name: "Analista de Desempenho",
      password: hash,
    },
  });

  await prisma.user.updateMany({
    where: { email: "clube@thenetscouting.com" },
    data: {
      email: "clube@overviewscout.com",
      name: "Diretoria do Clube",
      password: hash,
    },
  });

  // Ensure admin@overviewscout.com exists
  const admin = await prisma.user.findUnique({
    where: { email: "admin@overviewscout.com" },
  });

  if (!admin) {
    await prisma.user.create({
      data: {
        email: "admin@overviewscout.com",
        name: "Admin Overview Scout",
        password: hash,
        role: "ADMIN",
      },
    });
  } else {
    await prisma.user.update({
      where: { email: "admin@overviewscout.com" },
      data: { password: hash },
    });
  }

  // Also ensure analista and clube exist
  const analista = await prisma.user.findUnique({
    where: { email: "analista@overviewscout.com" },
  });
  if (!analista) {
    await prisma.user.create({
      data: {
        email: "analista@overviewscout.com",
        name: "Analista de Desempenho",
        password: hash,
        role: "ANALYST",
      },
    });
  }

  const clube = await prisma.user.findUnique({
    where: { email: "clube@overviewscout.com" },
  });
  if (!clube) {
    await prisma.user.create({
      data: {
        email: "clube@overviewscout.com",
        name: "Diretoria do Clube",
        password: hash,
        role: "CLUB",
      },
    });
  }

  const allUsers = await prisma.user.findMany();
  console.log("=== USUÁRIOS NO BANCO DE DADOS ===");
  for (const u of allUsers) {
    const isPasswordValid = await bcrypt.compare("admin123", u.password);
    console.log(`Email: ${u.email} | Role: ${u.role} | Senha 'admin123' válida? ${isPasswordValid}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
