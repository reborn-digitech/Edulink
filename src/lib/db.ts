import { PrismaClient } from "@prisma/client";
import { currentTenants, isInTenantTransaction, markInTransaction } from "./tenant-context";

/**
 * Prisma singleton, extended so every query tells Postgres which school it is
 * for.
 *
 * The policies in prisma/rls.sql compare `schoolId` against
 * `current_setting('app.school_id')`, and that setting only survives the
 * transaction it was made in — deliberately, because Prisma pools connections
 * and a per-request setting would be inherited by whatever request borrows that
 * connection next. `npm run rls:verify` demonstrates that leak rather than
 * asserting it.
 *
 * So every query runs inside its own small transaction that sets the tenant
 * first. That is done HERE rather than at 248 call sites, because a call site
 * that forgets is a call site that reads nothing — or, before RLS existed,
 * everything.
 *
 * The cost is real and worth naming: a page issuing ten queries opens ten
 * transactions instead of none. For a school-sized workload that is cheaper than
 * the alternative, which is trusting 248 places to remember.
 */
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

function createClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        const schoolIds = currentTenants();

        // Nothing to scope to — a login, a registration, the session lookup
        // itself. Those touch tables with no policy (User, Session, AuthToken),
        // which is why they still work with the tenant unset. Anything scoped
        // correctly comes back empty.
        if (schoolIds.length === 0) return query(args);

        // Already inside a transaction that set the tenant. Postgres has no
        // nested transactions and Prisma would reject a second one.
        if (isInTenantTransaction()) return query(args);

        // Raw queries carry no model to re-issue against; run them as-is.
        if (!model) return query(args);

        return markInTransaction(() =>
          base.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.school_ids', ${schoolIds.join(",")}, true)`;
            // Re-issued ON the transaction client, not merely alongside it.
            // `query(args)` here would already be in flight on whatever
            // connection the pool handed it — a different one — so the setting
            // above would apply to a transaction the query never joined. That
            // failed silently in the safe direction: every scoped read returned
            // nothing, and every page that expected a row threw.
            const delegate = (tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>> | undefined>)[model];
            if (!delegate?.[operation]) return query(args);
            return delegate[operation](args);
          }),
        );
      },
    },
    client: {
      /**
       * The app's own interactive transactions — registration, joining, invite
       * acceptance, starting a remark thread — set the tenant once at the top
       * instead of per statement, so they stay a single atomic unit.
       */
      async $tenantTransaction<T>(work: (tx: unknown) => Promise<T>): Promise<T> {
        const schoolIds = currentTenants();
        return base.$transaction(async (tx) => {
          if (schoolIds.length > 0) {
            await tx.$executeRaw`SELECT set_config('app.school_ids', ${schoolIds.join(",")}, true)`;
          }
          return markInTransaction(() => work(tx));
        });
      },
    },
  });
}

type ExtendedClient = ReturnType<typeof createClient>;

export const db: ExtendedClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type { Prisma } from "@prisma/client";
