import { PrismaClient } from "@prisma/client";
import {
  isInTenantTransaction,
  markInTransaction,
  tenantOverride,
  type RequestTenant,
} from "./tenant-context";
import { resolveRequestTenant, type SessionReadableClient } from "./tenant-request";

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
 * WHERE THE TENANT COMES FROM. This ASKS for it, per query, rather than reading
 * somewhere that an earlier step was supposed to have written. That direction is
 * deliberate and hard-won: pushing it out of `getSession()` into a per-render
 * store worked in server components and silently did nothing in route handlers
 * and server actions, where the write landed in a throwaway object — so the
 * register, every file, the directory export and every non-parent login broke
 * while 383 tests and a 39-route sweep stayed green. tenant-context.ts has the
 * full account.
 *
 * The cost is real and worth naming: a page issuing ten queries opens ten
 * transactions instead of none, and outside a render each one also re-reads the
 * session row. For a school-sized workload that is cheaper than the alternative,
 * which is trusting 248 places to remember — or one place to have run.
 */
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedClient };

function createClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // The jobs runner (JOBS_RUNNER=1, see job-scheduler.ts) is operator
    // work and reaches every tenant, so it connects as the owner — the same
    // door `npm run job` takes through with-admin-db. Every other process
    // connects as the app role and stays inside the row-level policies.
    ...(process.env.JOBS_RUNNER === "1" && process.env.DATABASE_ADMIN_URL ? { datasourceUrl: process.env.DATABASE_ADMIN_URL } : {}),
  });

  /**
   * The tenant for the query about to run: what a caller explicitly asked for,
   * otherwise whatever the session cookie says.
   *
   * `base`, not the extended client, so the resolver's own session lookup is not
   * intercepted by this extension and wrapped in a transaction that would need a
   * tenant to have already been resolved.
   */
  async function tenantForThisQuery(): Promise<RequestTenant> {
    return tenantOverride() ?? resolveRequestTenant(base as unknown as SessionReadableClient);
  }

  return base.$extends({
    query: {
      async $allOperations({ model, operation, args, query }) {
        // Already inside a transaction that set the tenant. Postgres has no
        // nested transactions and Prisma would reject a second one. Checked
        // before resolving, so nested work does no session lookups either.
        if (isInTenantTransaction()) return query(args);

        // Raw queries carry no model to re-issue against; run them as-is.
        if (!model) return query(args);

        const { schoolIds, userId, joinCode, isSuperuser } = await tenantForThisQuery();

        // Nothing to scope to and nobody to be — a login, a registration, the
        // session lookup itself. Those touch tables with no policy (User,
        // Session, AuthToken), which is why they still work with the tenant
        // unset. Anything scoped correctly comes back empty.
        if (schoolIds.length === 0 && !userId && !joinCode && !isSuperuser) return query(args);

        return markInTransaction(() =>
          base.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT set_config('app.school_ids', ${schoolIds.join(",")}, true)`;
            // Empty rather than absent when there is no user: `= ''` matches no
            // id, so the Membership self-clause stays shut. Both settings are
            // transaction-local, so neither rides a pooled connection anywhere.
            await tx.$executeRaw`SELECT set_config('app.user_id', ${userId ?? ""}, true)`;
            // Whatever code the caller typed in, when that is all they have.
            // Empty rather than absent when there is none: `= ''` matches no
            // code, so the clause stays shut.
            await tx.$executeRaw`SELECT set_config('app.join_code', ${joinCode ?? ""}, true)`;
            // Read by exactly two policies, School and Invite. "0" rather than
            // absent for the same reason as the two above: the clause compares
            // against '1', so anything else keeps it shut.
            await tx.$executeRaw`SELECT set_config('app.is_superuser', ${isSuperuser ? "1" : "0"}, true)`;
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
        const { schoolIds, userId, joinCode, isSuperuser } = await tenantForThisQuery();
        return base.$transaction(async (tx) => {
          if (schoolIds.length > 0) {
            await tx.$executeRaw`SELECT set_config('app.school_ids', ${schoolIds.join(",")}, true)`;
          }
          if (userId) {
            await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
          }
          if (joinCode) {
            await tx.$executeRaw`SELECT set_config('app.join_code', ${joinCode}, true)`;
          }
          if (isSuperuser) {
            await tx.$executeRaw`SELECT set_config('app.is_superuser', '1', true)`;
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
