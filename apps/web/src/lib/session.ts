import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";
import { SESSION_COOKIE, SESSION_TTL_DAYS, type Role } from "./constants";
import { forOwnSchools } from "./tenant-context";
import { readJson } from "./json";
import { bearerToken } from "./bearer";
export { bearerToken };

/**
 * Opaque server-side sessions.
 *
 * Chosen over a JWT because the spec requires device management and session
 * revocation (§2). A stateless token cannot be revoked before it expires
 * without a server-side denylist — at which point you have a session table
 * anyway, only with worse ergonomics.
 */

export type SessionUser = {
  id: string;
  name: string;
  preferredName: string | null;
  email: string | null;
  avatarKey: string | null;
  isMinor: boolean;
  /** Whoever runs the server. Orthogonal to `role`, which names a school post. */
  isSuperuser: boolean;
  /** The content team: shared question bank and platform competitions. */
  isAppAdmin: boolean;
  prefs: UserPrefs;
};

export type UserPrefs = {
  theme: "light" | "dark" | "system";
  contrast: "normal" | "high";
  font: "default" | "dyslexic";
  motion: "full" | "reduced";
  locale: string;
  channels: { push: boolean; email: boolean };
  quietHours: { start: string; end: string } | null;
};

export const DEFAULT_PREFS: UserPrefs = {
  theme: "system",
  contrast: "normal",
  font: "default",
  motion: "full",
  locale: "en",
  channels: { push: true, email: true },
  quietHours: null,
};

export type ActiveContext = {
  user: SessionUser;
  sessionId: string;
  /** Null for a parent, who has no Membership row. */
  membershipId: string | null;
  schoolId: string | null;
  role: Role | null;
};

/* -------------------------------------------------------------------------- */
/* Cookie                                                                      */
/* -------------------------------------------------------------------------- */

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true, // JS can never read it, so XSS cannot exfiltrate the session
    secure: process.env.NODE_ENV === "production", // localhost is http in dev
    sameSite: "lax" as const, // "strict" would break magic-link landings
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

/**
 * Issues a session and sets the cookie. Returns the session id so the caller
 * can show it in device management.
 */
export async function createSession(
  userId: string,
  opts: { schoolId?: string | null; role?: Role | null } = {},
): Promise<string> {
  const token = generateToken();
  const hdrs = await headers();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  const session = await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      activeSchoolId: opts.schoolId ?? null,
      activeRole: opts.role ?? null,
      userAgent: hdrs.get("user-agent")?.slice(0, 400) ?? null,
      ip: clientIp(hdrs),
      expiresAt,
    },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, cookieOptions(SESSION_TTL_DAYS * 86_400));
  return session.id;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  jar.delete(SESSION_COOKIE);
}

/** Revoke one device. Ownership is checked here, not by the caller. */
export async function revokeSession(sessionId: string, ownerUserId: string): Promise<boolean> {
  const result = await db.session.updateMany({
    where: { id: sessionId, userId: ownerUserId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return result.count > 0;
}

export async function revokeOtherSessions(userId: string, keepSessionId: string): Promise<number> {
  const result = await db.session.updateMany({
    where: { userId, revokedAt: null, id: { not: keepSessionId } },
    data: { revokedAt: new Date() },
  });
  return result.count;
}

/* -------------------------------------------------------------------------- */
/* Read                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Resolves the current session. Wrapped in React `cache` so a page that checks
 * auth in the layout, the page and three server components still issues one
 * query per request.
 */
/**
 * A session for the phone: the same Session row a browser gets, handed back as
 * a bearer token instead of set as a cookie. The app keeps it in secure
 * storage and sends `Authorization: Bearer <token>`; `getSession` below reads
 * either. Nothing else differs — device management, revocation and the
 * per-school tenant binding all see one kind of session.
 */
export async function createApiSession(
  userId: string,
  opts: { schoolId?: string | null; role?: Role | null; userAgent?: string | null; ip?: string | null } = {},
): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);
  const session = await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      activeSchoolId: opts.schoolId ?? null,
      activeRole: opts.role ?? null,
      userAgent: opts.userAgent?.slice(0, 400) ?? null,
      ip: opts.ip ?? null,
      expiresAt,
    },
    select: { id: true },
  });
  return { sessionId: session.id, token, expiresAt };
}

/**
 * How far into a session's life a bearer read extends it. The phone never
 * re-signs-in if it is used at least this often: a read past the midpoint
 * pushes the expiry out to a full TTL again (a "sliding" expiry), and the
 * write is skipped while lastSeenAt is fresh so a busy screen does not write
 * the row on every request. Cookies keep their fixed thirty days — the
 * browser's maxAge cannot be reset from a server-component read.
 */
const SLIDE_AFTER_MS = (SESSION_TTL_DAYS * 86_400_000) / 2;
const SEEN_THROTTLE_MS = 60 * 60_000;

export const getSession = cache(async (): Promise<ActiveContext | null> => {
  const jar = await cookies();
  let token = jar.get(SESSION_COOKIE)?.value ?? null;
  let viaBearer = false;
  if (!token) {
    token = bearerToken(await headers());
    viaBearer = token !== null;
  }
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.disabledAt) return null;

  if (viaBearer && Date.now() - session.lastSeenAt.getTime() > SEEN_THROTTLE_MS) {
    const slide = session.expiresAt.getTime() - Date.now() < SLIDE_AFTER_MS;
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), ...(slide ? { expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000) } : {}) },
    });
  }

  // The role/school on the cookie's session row is a *claim*. Verify the
  // membership still exists and is active before trusting it — a teacher
  // removed from a school this morning must not keep their afternoon session
  // scoped to it.
  let membershipId: string | null = null;
  let schoolId: string | null = session.activeSchoolId;
  let role: Role | null = (session.activeRole as Role | null) ?? null;

  // Nothing is bound here, deliberately. This function used to push the schools
  // it had just resolved into a store its callers would read, and in a route
  // handler or a server action that write went nowhere — see tenant-context.ts.
  // `db.ts` now resolves the tenant per query from the same cookie this
  // function reads, so the query below arrives already scoped to the school on
  // the session, which is exactly the school it is asking about.
  //
  // What remains here is the part that was always this function's job: deciding
  // whether the role and school ON THE SESSION ROW are still backed by a live
  // membership. The database decides what may be READ; this decides what the
  // application will TRUST, and a teacher removed from a school this morning
  // must not keep their afternoon session scoped to it.
  if (schoolId && role && role !== "PARENT") {
    const membership = await db.membership.findFirst({
      where: {
        userId: session.userId,
        schoolId,
        role,
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true },
    });
    if (membership) {
      membershipId = membership.id;
    } else {
      schoolId = null;
      role = null;
    }
  }

  return {
    sessionId: session.id,
    membershipId,
    schoolId,
    role,
    user: {
      id: session.user.id,
      name: session.user.name,
      preferredName: session.user.preferredName,
      email: session.user.email,
      avatarKey: session.user.avatarKey,
      isMinor: session.user.isMinor,
      isSuperuser: session.user.isSuperuser,
      isAppAdmin: session.user.isAppAdmin,
      prefs: readJson<UserPrefs>(session.user.prefs, DEFAULT_PREFS),
    },
  };
});

/** Switches the active role/school on the current session. */
export async function setActiveContext(
  sessionId: string,
  userId: string,
  next: { schoolId: string | null; role: Role | null },
): Promise<boolean> {
  if (next.role && next.role !== "PARENT") {
    if (!next.schoolId) return false;
    const ok = await db.membership.findFirst({
      where: {
        userId,
        schoolId: next.schoolId,
        role: next.role,
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true },
    });
    if (!ok) return false;
  }

  if (next.role === "PARENT") {
    const isParent = await db.guardianship.findFirst({
      where: { parentUserId: userId, status: "ACTIVE" },
      select: { id: true },
    });
    if (!isParent) return false;
  }

  await db.session.update({
    where: { id: sessionId },
    data: { activeSchoolId: next.schoolId, activeRole: next.role, lastSeenAt: new Date() },
  });
  await db.user.update({
    where: { id: userId },
    data: { lastRole: next.role, lastSchoolId: next.schoolId },
  });
  return true;
}

/**
 * Every role/school the user can switch into, for the role switcher UI.
 *
 * TWO PASSES, and the first one is the interesting one. This is the only query
 * in the app that has to see ACROSS schools — everything else is scoped to the
 * one being acted for, which is the point. Asking for the schools and their
 * names in a single joined query therefore fails for exactly the person who
 * needs the switcher most: the membership rows come back (a user may always read
 * their own), the `school` relation on the other school does not, and Prisma
 * refuses a required relation that returned nothing. It is a 500, and because
 * the nav shell calls this on every page, it is a 500 on ALL of them.
 *
 * So: find out which schools this person has a foot in, then widen to exactly
 * those and read them. The ids come out of the database under the policies
 * before they are used to set one, which is what keeps this from being a way
 * around anything — see `forOwnSchools`.
 */
export async function listContexts(userId: string) {
  const [ownSchools, childSchools] = await Promise.all([
    // Readable across schools because they are this user's own rows.
    db.membership.findMany({
      where: { userId, status: "ACTIVE", leftAt: null },
      select: { schoolId: true },
    }),
    // Guardianship holds the school on the row itself, and carries no policy —
    // so this works before any school is known, which is the same reason the
    // parent bootstrap in tenant-request.ts reads it that way.
    db.guardianship.findMany({
      where: { parentUserId: userId, status: "ACTIVE" },
      select: { studentSchoolId: true },
    }),
  ]);

  const schoolIds = [
    ...ownSchools.map((m) => m.schoolId),
    ...childSchools.map((g) => g.studentSchoolId),
  ];

  return forOwnSchools(userId, schoolIds, () => readContexts(userId));
}

async function readContexts(userId: string) {
  const [memberships, guardianships] = await Promise.all([
    db.membership.findMany({
      where: { userId, status: "ACTIVE", leftAt: null },
      include: { school: { select: { id: true, name: true, logoPath: true, brandPrimary: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    db.guardianship.findMany({
      where: { parentUserId: userId, status: "ACTIVE" },
      include: {
        student: {
          include: { school: { select: { id: true, name: true } }, user: { select: { id: true, name: true, preferredName: true } } },
        },
      },
      // `children[0]` is the child every parent page opens on. Without an
      // orderBy that was Postgres row order — which a vacuum or re-seed can
      // flip, silently changing which child a parent lands on. First claimed,
      // first shown, same as memberships above.
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return {
    memberships: memberships.map((m) => ({
      membershipId: m.id,
      schoolId: m.schoolId,
      schoolName: m.school.name,
      logoPath: m.school.logoPath,
      brandPrimary: m.school.brandPrimary,
      role: m.role as Role,
    })),
    children: guardianships.map((g) => ({
      guardianshipId: g.id,
      studentMembershipId: g.studentMembershipId,
      studentUserId: g.student.user.id,
      name: g.student.user.preferredName ?? g.student.user.name,
      schoolId: g.student.schoolId,
      schoolName: g.student.school.name,
      /** The child has LEFT this school. The guardianship deliberately survives
       *  (it is what keeps the record reachable), so the pages must say so
       *  rather than render an ordinary day. */
      leftAt: g.student.leftAt,
      /** "SCHOOL" is the stand-in the school holds for a guardianless pupil.
       *  The chooser must not call that person a Parent — an admin whose
       *  promoted classes had no teachers was greeted as "Parent · 11
       *  children", which reads as a breach. */
      relation: g.relation,
    })),
  };
}

function clientIp(hdrs: Headers): string | null {
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return hdrs.get("x-real-ip");
}
