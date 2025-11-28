// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

/**
 * Lazily create a PrismaClient when first used.
 * This avoids instantiating Prisma during the Vercel build step.
 */
export function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
