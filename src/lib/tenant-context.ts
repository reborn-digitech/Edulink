import { cache } from "react";
import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Which school the current request is acting for.
 *
 * Row-level security reads `app.school_id`, and that has to be set inside the
 * transaction running the query (tenant-tx.ts explains why per-request is
 * unsafe). Something has to carry the school from "we resolved the session" to
 * "we are about to run a query", through 248 call sites that have no idea RLS
 * exists.
 *
 * React's `cache()` is that something. It memoises per REQUEST, so every server
 * component, action and lib call in one request gets the same object, and two
 * requests being served at the same moment get different ones. A module-level
 * variable would be shared between them, which is a bug that stays invisible
 * until two schools use the app in the same second.
 *
 * AsyncLocalStorage was the first attempt and does not work here.
 * `storage.enterWith()` binds the store for the CALLEE's context, not the
 * caller's — so `getSession()` would set it and the page awaiting `getSession()`
 * would see nothing. That failed loudly (every scoped page 500'd on an empty
 * result) rather than quietly, which is the one good thing about it.
 */

type TenantStore = {
  /**
   * Every school this request may see. Empty for a login or a registration.
   *
   * A LIST because people are not always in one school. A parent with children
   * at two is ordinary, and their session carries no school at all; a teacher
   * may hold posts at two. A single id could express neither, and the parent
   * pages returned nothing until this became a set.
   */
  schoolIds: string[];
};

const store = cache((): TenantStore => ({ schoolIds: [] }));

/**
 * Whether a tenant-scoped transaction is already open AROUND THIS CALL.
 *
 * Deliberately AsyncLocalStorage and not the request-scoped store above, and the
 * difference is not academic. This flag must be true only for queries nested
 * INSIDE a transaction, not for every query in the request — and pages run their
 * queries with `Promise.all`. Held per request, the first query to open a
 * transaction set the flag and its siblings then skipped opening their own,
 * ran with no tenant, and returned nothing. Every scoped page 500'd.
 *
 * ALS is the right tool here precisely because it propagates DOWNWARD into
 * nested work and nowhere else. It is the wrong tool for the school itself,
 * which has to travel back up from `getSession()` to its caller.
 */
const openTransaction = new AsyncLocalStorage<true>();

/** Binds the schools this request may see. Called by `getSession`. */
export function bindTenants(schoolIds: (string | null | undefined)[]): void {
  store().schoolIds = [...new Set(schoolIds.filter((id): id is string => Boolean(id)))];
}

export function currentTenants(): string[] {
  return store().schoolIds;
}

export function isInTenantTransaction(): boolean {
  return openTransaction.getStore() === true;
}

/** Runs `work` with everything beneath it treated as already in a transaction. */
export function markInTransaction<T>(work: () => Promise<T>): Promise<T> {
  return openTransaction.run(true, work);
}

/**
 * Runs `work` for a school other than the request's own, then puts it back.
 *
 * Narrowing, not widening: it REPLACES the set for the duration, so work that
 * should only touch one school cannot accidentally read another. It cannot grant
 * access to a school the request did not already have, because the policies are
 * enforced by Postgres against whatever this sets.
 */
export async function forSchool<T>(schoolId: string, work: () => Promise<T>): Promise<T> {
  const current = store();
  const previous = current.schoolIds;
  current.schoolIds = [schoolId];
  try {
    return await work();
  } finally {
    current.schoolIds = previous;
  }
}
