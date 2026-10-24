import { cache } from "react";
import { cookies, headers } from "next/headers";
import { hashToken } from "./crypto";
import { bearerToken } from "./bearer";
import { SESSION_ABSOLUTE_MAX_DAYS, SESSION_COOKIE } from "./constants";
import { NO_TENANT, type RequestTenant } from "./tenant-context";

/**
 * Working out which schools the database may show the current request.
 *
 * This is the bootstrap, and it runs BEFORE anything is authorised. It reads the
 * session cookie and answers one narrow question — "which schools is this
 * request allowed to see rows from?" — so that `db.ts` can tell Postgres before
 * it runs anything scoped.
 *
 * It is NOT the authorisation check. `getSession()` still verifies that the
 * role and school on the session row are backed by a live membership, and every
 * `require*`/`assert*` helper still runs. This only decides what the database
 * will hand over; those decide what the application will do with it. Both have
 * to agree, and the narrower of the two wins, which is the database.
 *
 * WHY IT READS THE COOKIE AGAIN rather than being handed the session: because
 * being handed it is what broke. A value passed down from `getSession()` has to
 * survive the journey back out of an async call into its caller, and in a route
 * handler or a server action it did not. Reading the cookie needs nothing to
 * survive anything — `cookies()` works in every server context Next has — so
 * this cannot be right in one of them and silently empty in the others.
 *
 * The queries here run on the UNEXTENDED Prisma client, which is what keeps this
 * from recursing: they must not be intercepted and wrapped in a tenant
 * transaction by the very extension that is calling them. They only touch
 * Session and Guardianship, neither of which is school-scoped (see the foot of
 * prisma/rls.sql), so they need no tenant to succeed.
 */

/** Only the shape this needs, so it cannot reach for anything scoped. */
export type SessionReadableClient = {
  session: {
    findUnique(args: unknown): Promise<{
      userId: string;
      activeSchoolId: string | null;
      activeRole: string | null;
      revokedAt: Date | null;
      expiresAt: Date;
      createdAt: Date;
      // Read through the session's own relation rather than a second query.
      // User carries no policy, so this needs no tenant to succeed — the same
      // reason the session lookup itself works here.
      user: { isSuperuser: boolean; disabledAt: Date | null } | null;
    } | null>;
  };
  guardianship: {
    findMany(args: unknown): Promise<{ studentSchoolId: string }[]>;
  };

  $transaction<R>(fn: (tx: MembershipReadableTx) => Promise<R>): Promise<R>;
};

type MembershipReadableTx = {
  $executeRawUnsafe(sql: string, ...values: unknown[]): Promise<number>;
  membership: { findFirst(args: unknown): Promise<{ id: string } | null> };
};

/**
 * `cache()` is an OPTIMISATION HERE AND NOTHING MORE, and that distinction is
 * the whole lesson of this file's history.
 *
 * Inside a render it collapses the ten queries on a page down to one session
 * lookup. Anywhere else — a route handler, a server action — it silently does
 * nothing at all, and the only consequence is that the lookup runs again. It is
 * one indexed read on a table with no policy. Correctness does not depend on it,
 * which is exactly what could not be said of the store it replaced.
 */
export const resolveRequestTenant = cache(
  async (client: SessionReadableClient): Promise<RequestTenant> => {
    let token: string | undefined;
    let owner: string | null = null;
    try {
      token = (await cookies()).get(SESSION_COOKIE)?.value;
      // The phone sends the same session token as a bearer instead of a
      // cookie. Without this line every /api/v1 read ran as nobody: the
      // handler's getSession saw the person, the row-level policy did not,
      // and a school's own admin got "school is required, got null" from
      // their own memberships.
      const hdrs = await headers();
      if (!token) token = bearerToken(hdrs) ?? undefined;
      // An outbox replay names the person who queued it; see below.
      owner = hdrs.get("x-edulink-owner");
    } catch {
      // No request scope at all: a script, a unit test, a build-time render.
      // Nothing to scope to, and every policied read will correctly return
      // nothing rather than everything.
      return NO_TENANT;
    }

    if (!token) return NO_TENANT;

    const session = await client.session.findUnique({
      where: { tokenHash: hashToken(token) },
      select: {
        userId: true,
        activeSchoolId: true,
        activeRole: true,
        revokedAt: true,
        expiresAt: true,
        createdAt: true,
        user: { select: { isSuperuser: true, disabledAt: true } },
      },
    });

    // A revoked or expired session gets no tenant, so a stale cookie cannot keep
    // reading rows while `getSession()` is separately refusing to sign it in.
    if (!session) return NO_TENANT;
    if (session.revokedAt) return NO_TENANT;
    if (session.expiresAt.getTime() < Date.now()) return NO_TENANT;
    // THE SAME THREE REFUSALS `getSession` MAKES (session.ts readSession), so the
    // two can never disagree about who is signed in (QA-26, 24 Oct 2026): a
    // session past its six-month absolute end, a person the operator disabled,
    // and an outbox replay queued by somebody other than the session's holder
    // (X-Edulink-Owner) are each nobody to the database as well.
    if (session.createdAt.getTime() + SESSION_ABSOLUTE_MAX_DAYS * 86_400_000 < Date.now()) return NO_TENANT;
    if (session.user?.disabledAt) return NO_TENANT;
    if (owner && owner !== session.userId) return NO_TENANT;

    // ORTHOGONAL TO THE SCHOOL SET, and every branch below carries it unchanged.
    // Somebody who runs the server may also teach somewhere, so this is not an
    // alternative to having schools — it is an extra key to two tables, and it
    // widens nothing else. See RequestTenant.isSuperuser.
    const isSuperuser = session.user?.isSuperuser === true;

    // A parent has no school of their own and legitimately spans them: their
    // schools are their children's. This is the one role whose set is not simply
    // the school on the session, and getting it wrong is what made every parent
    // page return nothing the first time round.
    if (session.activeRole === "PARENT") {
      const guardianships = await client.guardianship.findMany({
        where: { parentUserId: session.userId, status: "ACTIVE" },
        select: { studentSchoolId: true },
      });
      return {
        schoolIds: [...new Set(guardianships.map((g) => g.studentSchoolId))],
        userId: session.userId,
        joinCode: null,
        isSuperuser,
      };
    }

    // AN EXPERT BELONGS TO NO SCHOOL, AND IS GIVEN NONE. Every school with a
    // confirmed booking or an active mentorship used to go into this set, and
    // the tenant clause then opened that school's every table to an outside
    // adult. What an expert reaches is now named table by table in
    // scripts/gen-rls.ts (EXPERT_READABLE, EXPERT_WRITES), each clause keyed
    // on their own user id through the booking or the mentorship itself — so
    // the database, and not only the application, stops at the engagement.
    // A cancelled booking still drops out at once: it drops out of the clause.
    if (session.activeRole === "EXPERT") {
      return { schoolIds: [], userId: session.userId, joinCode: null, isSuperuser };
    }

    // The school on the session row is a CLAIM, and it is checked here rather
    // than taken. A teacher removed from a school this morning still holds a
    // cookie naming it, and the point of row-level security is to be the answer
    // even when some future code path forgets to ask `getSession()` first. So
    // the database is told about a school only once this user is known to still
    // actively belong to it.
    if (!session.activeSchoolId) {
      // No school on the session is the ordinary state for a superuser who runs
      // the server and teaches nowhere. They still get their two tables.
      return { schoolIds: [], userId: session.userId, joinCode: null, isSuperuser };
    }

    const belongs = await ownMembershipIn(client, session.userId, session.activeSchoolId);
    return {
      schoolIds: belongs ? [session.activeSchoolId] : [],
      userId: session.userId,
      joinCode: null,
      isSuperuser,
    };
  },
);

/**
 * Does this user still hold an active membership of that school?
 *
 * Asked with `app.user_id` set and no schools at all, which is the one thing the
 * Membership policy allows on those terms: your own rows. It cannot answer for
 * anybody else, and it cannot write.
 */
async function ownMembershipIn(
  client: SessionReadableClient,
  userId: string,
  schoolId: string,
): Promise<boolean> {
  const membership = await client.$transaction(async (tx) => {
    // Parameterised: set_config takes a value, not an identifier.
    await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, userId);
    return tx.membership.findFirst({
      where: { userId, schoolId, status: "ACTIVE", leftAt: null },
      select: { id: true },
    });
  });
  return membership !== null;
}
