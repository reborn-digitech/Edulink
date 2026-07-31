import { AsyncLocalStorage } from "node:async_hooks";

/**
 * Which school — and which user — the current query is acting for.
 *
 * Row-level security reads `app.school_ids`, and that has to be set inside the
 * transaction running the query (tenant-tx.ts explains why per-request is
 * unsafe). Something has to carry the tenant from "we know who is asking" to
 * "we are about to run a query", through 248 call sites that have no idea RLS
 * exists.
 *
 * THIS USED TO PUSH, AND THAT IS THE BUG THIS FILE EXISTS TO NOT REPEAT.
 * `getSession()` resolved the session and wrote the school into a store its
 * callers would read. Written with React's `cache()`, which memoises per RENDER
 * — not per request. A server component sees one object; a route handler and a
 * server action get a FRESH one on every call, so the write landed in a
 * throwaway and every read came back empty. Postgres then did exactly what it
 * was told and returned nothing, so:
 *
 *   - every staff and student login landed on "Join your school", because the
 *     membership lookup behind it returned zero rows;
 *   - taking the register 403'd, and so did the offline outbox replaying it;
 *   - every attachment, post image and school logo 404'd;
 *   - the directory export 403'd for the admin who owns the directory.
 *
 * None of it was caught, because the test suite connects as the database OWNER
 * (see tests/setup.ts) and the route sweep only ever exercised page renders —
 * the one context where `cache()` does work.
 *
 * SO NOTHING PUSHES ANY MORE. `db.ts` PULLS: each query resolves the tenant for
 * itself from the session cookie (tenant-request.ts), which works identically in
 * a render, a server action, a route handler and the service worker's replay,
 * because it depends on no ambient state travelling upward. What remains here is
 * only what genuinely travels DOWNWARD, which is what AsyncLocalStorage is good
 * at: a deliberate override, and the flag that stops transactions nesting.
 */

export type RequestTenant = {
  /**
   * Every school this request may see. Empty for a login, a registration, or a
   * script.
   *
   * A LIST because people are not always in one school. A parent with children
   * at two is ordinary, and their session carries no school at all; a teacher
   * may hold posts at two. A single id could express neither, and the parent
   * pages returned nothing until this became a set.
   */
  schoolIds: string[];
  /**
   * The signed-in user, when there is one.
   *
   * Set as `app.user_id` alongside the schools, because one question cannot be
   * answered by a school: "which schools do I belong to?" — which is the first
   * thing a login has to ask, before any school is known. The Membership policy
   * lets a user READ their own rows on the strength of this (never write them);
   * see the header of prisma/rls.sql.
   */
  userId: string | null;
  /**
   * An unguessable code somebody has just typed in, when that is the ONLY thing
   * they have.
   *
   * A join code names the school it belongs to — that is its whole job — so the
   * lookup cannot be scoped by school without already knowing the answer. The
   * policies let a caller read exactly the row whose code matches this, and
   * nothing else: knowing the code IS the authorisation, which is the same thing
   * the code meant before any of this was school-scoped.
   */
  joinCode: string | null;
};

export const NO_TENANT: RequestTenant = { schoolIds: [], userId: null, joinCode: null };

/**
 * A deliberate, scoped override of what the resolver would have said.
 *
 * ALS is the right tool here precisely because it propagates DOWNWARD into
 * nested work and nowhere else — which is all an override needs, and is the
 * thing it could never do for a value that had to travel back up out of
 * `getSession()`.
 */
const override = new AsyncLocalStorage<RequestTenant>();

/**
 * Whether a tenant-scoped transaction is already open AROUND THIS CALL.
 *
 * This flag must be true only for queries nested INSIDE a transaction, not for
 * every query in the request — and pages run their queries with `Promise.all`.
 * Held per request, the first query to open a transaction set the flag and its
 * siblings then skipped opening their own, ran with no tenant, and returned
 * nothing. Every scoped page 500'd.
 */
const openTransaction = new AsyncLocalStorage<true>();

/** What a caller explicitly asked for, if anything. `db.ts` prefers this. */
export function tenantOverride(): RequestTenant | undefined {
  return override.getStore();
}

export function isInTenantTransaction(): boolean {
  return openTransaction.getStore() === true;
}

/** Runs `work` with everything beneath it treated as already in a transaction. */
export function markInTransaction<T>(work: () => Promise<T>): Promise<T> {
  return openTransaction.run(true, work);
}

/**
 * Runs `work` for an explicit tenant, whatever the session would have said.
 *
 * The general form the three below are written in terms of. It REPLACES the set
 * for the duration rather than adding to it, and it does not check anything —
 * the caller is asserting a right it has already established, and Postgres will
 * enforce the policies against exactly what this sets. So the rule for using it
 * is: the school ids must come from rows the DATABASE returned, never from a
 * route param, a form field, or anything else a client can name.
 */
export function forTenant<T>(tenant: RequestTenant, work: () => Promise<T>): Promise<T> {
  // `await work()`, NOT `work` — and the difference is a silent no-op.
  //
  // AsyncLocalStorage leaves the context when the callback RETURNS, and Prisma
  // invokes its query extension a tick after the call is made. Hand `run` a
  // callback that returns the promise without awaiting it — `() => db.thing()`,
  // which is the shape everybody writes — and the context is already gone by the
  // time db.ts asks what the tenant is. It reads `undefined`, scopes to nothing,
  // and the query comes back empty with no error anywhere.
  //
  // Awaiting here keeps the context entered until the work has actually
  // finished, so the natural spelling at the call site is the correct one. The
  // alternative was every caller remembering to write `async () => { await … }`,
  // which is precisely the kind of thing call sites forget.
  return override.run(tenant, async () => await work());
}

/**
 * Runs `work` for one school, whatever the session would have said.
 *
 * Narrowing, not widening: work that should only touch one school cannot
 * accidentally read another.
 */
export function forSchool<T>(schoolId: string, work: () => Promise<T>): Promise<T> {
  const current = override.getStore();
  return forTenant(
    { schoolIds: [schoolId], userId: current?.userId ?? null, joinCode: current?.joinCode ?? null },
    work,
  );
}

/**
 * Runs `work` for every school this person has a foot in — the "who am I,
 * everywhere?" query, which is the role switcher and nothing else.
 *
 * THIS IS THE ONE WIDENING IN THE CODEBASE, so it is worth being exact about
 * what it does and does not open up. The request is normally scoped to the ONE
 * school it is acting for, deliberately: a Riverside admin who also teaches at
 * Oakfield should not have Oakfield's rows within reach while they are being a
 * Riverside admin, because then a forgotten `WHERE` cannot leak them either.
 *
 * The switcher is the exception that proves it, because its entire job is to
 * show the other doors. Somebody with a post at two schools could not use the
 * app at all otherwise — not just the switcher: the nav shell asks this on every
 * page, so their `/teacher` and `/account` were 500s too.
 *
 * What it cannot do: reach a school the person does not belong to. The ids are
 * read back out of Membership and Guardianship first, under the policies, so
 * this widens to exactly the set Postgres already agreed to and no further.
 */
export function forOwnSchools<T>(
  userId: string,
  schoolIds: string[],
  work: () => Promise<T>,
): Promise<T> {
  return forTenant({ schoolIds: [...new Set(schoolIds)], userId, joinCode: null }, work);
}

/**
 * Runs `work` as a user with no school yet — the login bootstrap.
 *
 * This is the chicken and egg the whole design turns on: `resolveContext` has to
 * ask which schools somebody belongs to, and the answer lives in a table that is
 * itself scoped by school. There is no school to scope it to yet. So instead of
 * a school this binds the USER, and the Membership policy answers "your own
 * rows" without needing one.
 *
 * Reads only. `app.user_id` is deliberately absent from every WITH CHECK, so
 * this cannot be used to write a membership into a school — which would be
 * self-service enrolment in whichever school you named.
 */
export function forUser<T>(userId: string, work: () => Promise<T>): Promise<T> {
  return forTenant({ schoolIds: [], userId, joinCode: null }, work);
}

/**
 * Runs `work` for somebody holding nothing but a code.
 *
 * The other bootstrap, and the mirror of `forUser`. A child typing a class join
 * code, or a parent typing their child's student code, has no session, no
 * school and no membership — the code is the only thing they have, and the row
 * it names is the thing that would tell us which school to scope to.
 *
 * NARROWER THAN ANYTHING ELSE HERE, not wider: no school is bound, so the only
 * rows readable inside this are the ones whose code is exactly the string the
 * caller typed. It cannot enumerate, cannot widen to a school, and is absent
 * from every WITH CHECK — a code gets you a look, never a write.
 */
export function forJoinCode<T>(joinCode: string, work: () => Promise<T>): Promise<T> {
  return forTenant({ schoolIds: [], userId: override.getStore()?.userId ?? null, joinCode }, work);
}
