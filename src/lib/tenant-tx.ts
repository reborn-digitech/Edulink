/**
 * Telling the database which school a request is acting for.
 *
 * Deliberately in its own module, taking its client as an argument and
 * constructing nothing. `db.ts` builds a Prisma client at import time, bound to
 * the provider the app is compiled for — so anything that imports it cannot be
 * pointed at a different database. This has to be exercised against a real
 * Postgres to be worth anything (`npm run rls:verify`), so it must be importable
 * without dragging a SQLite client along with it.
 *
 * `db.ts` re-exports the bound version, which is what application code uses.
 */

/**
 * The little of Prisma this needs, so any generated client satisfies it —
 * including one generated for a different provider, which is the point.
 *
 * `tx` is `unknown` rather than a Prisma type because the two generated clients
 * have structurally different ones, and this module must not depend on either.
 */
export type TenantCapableClient = {
  $transaction<R>(fn: (tx: unknown) => Promise<R>): Promise<R>;
};

/** SQLite has no row-level security, so there is nothing to set. */
export function isPostgresUrl(url: string | undefined): boolean {
  return /^postgres(ql)?:\/\//.test(url ?? "");
}

/**
 * Runs `work` with `app.school_id` set for the database's benefit.
 *
 * On Postgres this opens a transaction, sets the tenant, and runs the callback
 * inside it — which is what makes the policies in prisma/rls.sql resolve to
 * anything at all. On SQLite it simply runs the callback: there is no row-level
 * security to feed, and faking one would put a different code path in dev from
 * the one that runs in production.
 *
 * SET LOCAL, INSIDE THE TRANSACTION, IS THE WHOLE POINT — and the reason this is
 * a wrapper rather than something set once per request. Prisma pools
 * connections, so a request does not get a fresh one; it borrows whatever the
 * last request left behind. Measured, not assumed: `npm run rls:verify` sets the
 * tenant with a plain `SET` and then runs a query that sets nothing, and that
 * query reads the previous school's rows. A request in that state believes RLS
 * is protecting it, which is worse than having no policies, because nobody goes
 * looking. `SET LOCAL` is discarded at COMMIT, so a connection handed back to
 * the pool carries nothing with it.
 *
 * The callback form of `$transaction` is what pins one connection for the
 * duration. The array form would not, and neither would issuing the SET as a
 * separate top-level query.
 */
export async function withTenantOn<T>(
  client: TenantCapableClient,
  schoolId: string,
  work: (tx: never) => Promise<T>,
  opts: { databaseUrl?: string } = {},
): Promise<T> {
  const url = opts.databaseUrl ?? process.env.DATABASE_URL;
  if (!isPostgresUrl(url)) return work(client as never);

  return client.$transaction(async (tx) => {
    const raw = tx as {
      $executeRawUnsafe: (sql: string, ...values: unknown[]) => Promise<number>;
    };
    // Parameterised: set_config takes a value, not an identifier, so there is no
    // reason to interpolate a school id into the statement.
    await raw.$executeRawUnsafe(`SELECT set_config('app.school_id', $1, true)`, schoolId);
    return work(tx as never);
  });
}
