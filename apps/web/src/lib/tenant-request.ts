import { cache } from "react";
import { cookies, headers } from "next/headers";
import { hashToken } from "./crypto";
import { bearerToken } from "./bearer";
import { SESSION_COOKIE } from "./constants";
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
      // Read through the session's own relation rather than a second query.
      // User carries no policy, so this needs no tenant to succeed — the same
      // reason the session lookup itself works here.
      user: { isSuperuser: boolean } | null;
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
  expertBooking: { findMany(args: unknown): Promise<{ schoolId: string }[]> };
  mentorThread: { findMany(args: unknown): Promise<{ schoolId: string }[]> };
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
    try {
      token = (await cookies()).get(SESSION_COOKIE)?.value;
      // The phone sends the same session token as a bearer instead of a
      // cookie. Without this line every /api/v1 read ran as nobody: the
      // handler's getSession saw the person, the row-level policy did not,
      // and a school's own admin got "school is required, got null" from
      // their own memberships.
      if (!token) token = bearerToken(await headers()) ?? undefined;
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
        user: { select: { isSuperuser: true } },
      },
    });

    // A revoked or expired session gets no tenant, so a stale cookie cannot keep
    // reading rows while `getSession()` is separately refusing to sign it in.
    if (!session) return NO_TENANT;
    if (session.revokedAt) return NO_TENANT;
    if (session.expiresAt.getTime() < Date.now()) return NO_TENANT;

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

    // An expert belongs to no school and reaches one ONLY through a confirmed
    // booking. Same shape as the parent branch above and for the same reason:
    // their tenant set is derived from a relationship, not from a school on the
    // session. A cancelled booking drops out of this set immediately, so access
    // ends when the engagement ends without anything having to revoke it.
    if (session.activeRole === "EXPERT") {
      // SETS app.user_id FIRST, exactly like `ownMembershipIn` below and for
      // exactly the same reason: ExpertBooking carries a schoolId and so has an
      // ordinary tenant policy, and this is the query that has to run BEFORE any
      // school is known. Without the setting the policy correctly refuses it,
      // the expert resolves to no schools, and every page they open 500s on a
      // relation that came back null. The parent branch above needs no such
      // dance only because Guardianship deliberately carries no policy at all.
      //
      // Filtered on `expertUserId`, the denormalised column the policy keys on,
      // rather than joining through ExpertProfile — the join would depend on a
      // second table's readability to answer a question about this one.
      const bookings = await client.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT set_config('app.user_id', $1, true)`, session.userId);
        const [booked, mentoring] = await Promise.all([
          tx.expertBooking.findMany({
            where: { expertUserId: session.userId, status: "CONFIRMED" },
            select: { schoolId: true },
          }),
          // An ACTIVE mentorship reaches a school too. PENDING_CONSENT does not:
          // until a guardian has said yes, the expert has no business seeing
          // anything of that school, and leaving it out here means that is true
          // of the database and not merely of the UI.
          tx.mentorThread.findMany({
            where: { expertUserId: session.userId, status: "ACTIVE" },
            select: { schoolId: true },
          }),
        ]);
        return [...booked, ...mentoring];
      });
      return {
        schoolIds: [...new Set(bookings.map((b) => b.schoolId))],
        userId: session.userId,
        joinCode: null,
        isSuperuser,
      };
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
