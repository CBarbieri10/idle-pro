import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Instância singleton do Prisma Client otimizada para Serverless (Vercel + Neon PostgreSQL)
 * Reutiliza instâncias ativas para prevenir exaustão do connection pool do Neon.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// Preserva o client global em Serverless (Vercel Lambdas) e desenvolvimento
globalForPrisma.prisma = prisma;
