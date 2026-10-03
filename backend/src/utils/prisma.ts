import { PrismaClient } from '@prisma/client';

/**
 * Single shared PrismaClient.
 * Instantiating PrismaClient per request exhausts the connection pool, so the
 * client is cached on `globalThis` during `tsx --watch` / `next dev` reloads.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
