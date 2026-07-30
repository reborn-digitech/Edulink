import { PrismaClient } from "@prisma/client";
import { withTenantOn } from "./tenant-tx";

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

/**
 * What `withTenant` hands its callback: on Postgres a transaction client, on
 * SQLite the plain one. Either way, everything a query needs.
 */
export type TenantClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Runs `work` with the database told which school it is acting for.
 *
 * The mechanism, and the reason it has to be a per-transaction wrapper rather
 * than something set once per request, is in `tenant-tx.ts` — which is where it
 * lives so `npm run rls:verify` can exercise it against a real Postgres without
 * dragging this SQLite-bound client along.
 */
export function withTenant<T>(
  schoolId: string,
  work: (client: TenantClient) => Promise<T>,
): Promise<T> {
  return withTenantOn(db, schoolId, work as (tx: never) => Promise<T>);
}
