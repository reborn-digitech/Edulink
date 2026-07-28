import { PrismaClient } from "@prisma/client";

/**
 * Prisma singleton. Next's dev server re-evaluates modules on every HMR pass;
 * without stashing the client on globalThis you leak a connection pool per edit
 * until SQLite refuses to open another handle.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type { Prisma } from "@prisma/client";
