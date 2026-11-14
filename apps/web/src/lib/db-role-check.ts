/**
 * THE DATABASE ROLES ROW SECURITY DEPENDS ON (TA-194, TA-243). Every tenant table has FORCE ROW LEVEL SECURITY
 * (prisma/rls.sql), which holds every role but one that is a superuser or has BYPASSRLS. So two facts must be true,
 * and until now nothing at boot or release asked either:
 *
 *   - the APPLICATION's role (DATABASE_URL) must be held by the policies: a superuser or BYPASSRLS role skips every
 *     policy, and the tenant fence is then the application's WHERE clauses alone, with no page or log saying so;
 *   - the OWNER's role (DATABASE_ADMIN_URL, on which the jobs runner, migrations' data steps, the retention prune and
 *     the nightly dump run) must pass them: an owner that is neither reads and writes nothing on those tables, and a
 *     job or a backfill "succeeds" over zero rows.
 *
 * The release step asks both before every deploy and stops the deploy on either (scripts/db-grants.mjs, by
 * scripts/db-role-check.mjs, the same two rules for a script with no dependencies); the jobs runner asks the owner's
 * before it starts the schedule and refuses to start it otherwise (POST /api/internal/jobs). Not from
 * instrumentation.ts: anything it reaches is bundled for the edge too, and the database client is not.
 */

export type RoleFlags = { role: string; superuser: boolean; bypassRls: boolean };

type RawClient = { $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T> };

/** The connection's own role and its two flags. */
export async function readRoleFlags(client: RawClient): Promise<RoleFlags> {
  const rows = await client.$queryRawUnsafe<{ role: string; superuser: boolean; bypass: boolean }[]>(
    "SELECT rolname AS role, rolsuper AS superuser, rolbypassrls AS bypass FROM pg_roles WHERE rolname = current_user",
  );
  const row = rows[0];
  if (!row) throw new Error("The connection's role is not in pg_roles.");
  return { role: row.role, superuser: row.superuser === true, bypassRls: row.bypass === true };
}

/** What is wrong with the application's role, or null: it must be held by the policies. */
export function appRoleProblem(flags: RoleFlags): string | null {
  if (!flags.superuser && !flags.bypassRls) return null;
  return `The application's database role "${flags.role}" is ${flags.superuser ? "a superuser" : "BYPASSRLS"}, so row-level security does not apply to it and every school's rows rest on the application's own filters. Point DATABASE_URL at the unprivileged app role (docs/runbooks/go-live.md, step 2.2).`;
}

/** What is wrong with the owner's role, or null: the jobs, data migrations and the dump must pass the policies. */
export function ownerRoleProblem(flags: RoleFlags): string | null {
  if (flags.superuser || flags.bypassRls) return null;
  return `The owner's database role "${flags.role}" is neither a superuser nor BYPASSRLS, so row-level security holds it: every job, every data step of a migration and the dump would read and write no school's rows. Grant it BYPASSRLS (ALTER ROLE "${flags.role}" BYPASSRLS) or use the provider's owner (docs/runbooks/go-live.md, step 0.4).`;
}
