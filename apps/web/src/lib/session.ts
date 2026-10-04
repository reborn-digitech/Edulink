import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { clientAddress } from "./rate-limit";
import { generateToken, hashToken } from "./crypto";
import { isOutsideRole, SESSION_COOKIE, SESSION_TTL_DAYS, type Role } from "./constants";
import { forOwnSchools } from "./tenant-context";
import { readJson } from "./json";
import { bearerToken } from "./bearer";
import { gateRequest } from "./role-gate";
import { ROUTE_HEADER } from "./route-header";
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
  channels: { push: boolean; email: boolean; sms?: boolean; whatsapp?: boolean };
  quietHours: { start: string; end: string } | null;
};

export const DEFAULT_PREFS: UserPrefs = {
  theme: "system",
  contrast: "normal",
  font: "default",
  motion: "full",
  locale: "en",
  channels: { push: true, email: true, sms: true, whatsapp: true },
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
/* How long a session lives                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A session may slide, but not forever. A bearer token that is used every
 * fortnight used to be immortal — read past the midpoint, pushed out another
 * thirty days, indefinitely. It now ends this many days after it was CREATED,
 * however busy it has been; the person signs in again, once, every six months.
 */
export const SESSION_ABSOLUTE_MAX_DAYS = 180;

/**
 * Whoever runs the server signs in more often than a parent does. An
 * operator's session slides in seven-day steps rather than thirty: the account
 * that can read every school is the one whose forgotten laptop matters most.
 */
export const SUPERUSER_SESSION_TTL_DAYS = 7;

async function sessionTtlDaysFor(userId: string): Promise<number> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { isSuperuser: true } });
  return user?.isSuperuser ? SUPERUSER_SESSION_TTL_DAYS : SESSION_TTL_DAYS;
}

/** The moment a session created at `createdAt` may last until, whatever slides it. */
function absoluteEnd(createdAt: Date): number {
  return createdAt.getTime() + SESSION_ABSOLUTE_MAX_DAYS * 86_400_000;
}

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
  const ttlDays = await sessionTtlDaysFor(userId);
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);

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
  jar.set(SESSION_COOKIE, token, cookieOptions(ttlDays * 86_400));
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
  // Cleared with the attributes it was set with, so the clearing cookie is as hard to reach as the live one was.
  jar.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
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
  return revokeAllAccess(userId, { keepSessionId });
}

/** The delegates `revokeAllAccess` touches — `db`, or a transaction client. */
type RevokeClient = Pick<typeof db, "session" | "authToken" | "deviceToken" | "pushSubscription">;

/**
 * Everything that could still let somebody in as this person, gone at once.
 *
 * Sessions, because that is what "sign out everywhere" means. Every unspent
 * token, because a magic link requested five minutes ago is a live way in
 * that outlasts the password it belonged to. And the PUSH REGISTRATIONS —
 * the phone's Expo token and the browser's web-push subscription — which used
 * to survive every revocation: a device signed out by a password reset kept
 * receiving "Aarav was marked absent" and "new mark in Maths" for as long as
 * the app stayed installed, which is exactly the leak a reset is meant to
 * close. Both tables are keyed by user alone, so all of the person's go.
 *
 * `keepSessionId` is "every device but this one"; the push rows go
 * regardless, and this device re-registers on its next foreground. `tokens`
 * is for the flows that take the account back — a reset, a reclaim — and
 * not for "sign out other devices", which must not burn the verification
 * email the same person is about to open.
 */
export async function revokeAllAccess(
  userId: string,
  opts: { keepSessionId?: string; tokens?: boolean; client?: RevokeClient } = {},
): Promise<number> {
  const client = opts.client ?? db;
  const now = new Date();
  const result = await client.session.updateMany({
    where: { userId, revokedAt: null, ...(opts.keepSessionId ? { id: { not: opts.keepSessionId } } : {}) },
    data: { revokedAt: now },
  });
  if (opts.tokens) {
    await client.authToken.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
  }
  await client.deviceToken.deleteMany({ where: { userId } });
  await client.pushSubscription.deleteMany({ where: { userId } });
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
  const expiresAt = new Date(Date.now() + (await sessionTtlDaysFor(userId)) * 86_400_000);
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
 * pushes the expiry out to a full TTL again (a "sliding" expiry, capped at
 * SESSION_ABSOLUTE_MAX_DAYS from creation), and the write is skipped while
 * lastSeenAt is fresh so a busy screen does not write the row on every
 * request. Cookies keep their fixed thirty days — the browser's maxAge cannot
 * be reset from a server-component read.
 */
const SEEN_THROTTLE_MS = 60 * 60_000;

const readSession = cache(async (): Promise<ActiveContext | null> => {
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
  // An outbox replay names the person who queued it (X-Edulink-Owner). A
  // teacher's unsent register must not go out under whoever signed in next
  // on the same browser; the outbox keeps its rows by owner, and this is the
  // server's own refusal should a row slip past it. Not signed in, as far as
  // that write is concerned.
  const owner = (await headers()).get("x-edulink-owner");
  if (owner && owner !== session.userId) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  // However far it slid, a session ends six months after it began.
  if (absoluteEnd(session.createdAt) < Date.now()) return null;
  if (session.user.disabledAt) return null;

  if (viaBearer && Date.now() - session.lastSeenAt.getTime() > SEEN_THROTTLE_MS) {
    const ttlMs = (session.user.isSuperuser ? SUPERUSER_SESSION_TTL_DAYS : SESSION_TTL_DAYS) * 86_400_000;
    const slide = session.expiresAt.getTime() - Date.now() < ttlMs / 2;
    // Never past the absolute end: the last slide is a short one.
    const slidTo = new Date(Math.min(Date.now() + ttlMs, absoluteEnd(session.createdAt)));
    await db.session.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date(), ...(slide ? { expiresAt: slidTo } : {}) },
    });
  }

  // The role/school on the cookie's session row is a *claim*. Verify the
  // membership still exists and is active before trusting it — a teacher
  // removed from a school this morning must not keep their afternoon session
  // scoped to it.
  let membershipId: string | null = null;
  let role: Role | null = (session.activeRole as Role | null) ?? null;
  // A parent has no school; neither does a session with no role. A school id
  // stored against either — POST /api/v1/me/context used to accept any string
  // for a PARENT — must not become the school this session reads for, or
  // the channel the events stream subscribes it to.
  // …nor an expert or a recruiter (4 Oct 2026), who belong to no school at all.
  let schoolId: string | null = role && role !== "PARENT" && !isOutsideRole(role) ? session.activeSchoolId : null;

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

  // THE MODULE GATE (role-gate.ts): a driver, the library's desk, a warden or
  // an alumnus reaches only the doors and pages its module names, and a door
  // of a module the school has not switched on is refused for everyone. An
  // /api/v1 refusal is thrown from here, before the handler has the session;
  // a page outside a module role's own is served as if the session had no
  // school, which every page gate answers by sending the person to choose.
  let refusal: unknown = null;
  try {
    const verdict = await gateRequest((await headers()).get(ROUTE_HEADER), { role, schoolId });
    if (verdict === "no-context") {
      schoolId = null;
      role = null;
      membershipId = null;
    }
  } catch (error) {
    // Kept beside the context rather than thrown from here: the refusal's
    // sentence is written in the person's own language, which is read from
    // this same session (i18n/server.ts), and a cached rejection would take
    // that read down with it. `getSession` throws it; nothing is served.
    refusal = error;
    schoolId = null;
    role = null;
    membershipId = null;
  }

  const ctx: ActiveContext = {
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
  if (refusal) refused.set(ctx, refusal);
  return ctx;
});

/** The gate's refusal for a resolved session, if the request was refused (role-gate.ts). */
const refused = new WeakMap<ActiveContext, unknown>();

/**
 * Resolves the current session — and throws the module gate's refusal
 * (role-gate.ts: an /api/v1 door a module role may not pass, or a module
 * the school has off), which every handler's `apiFailure` answers 403.
 * The read itself is `cache`d, once per request.
 */
export async function getSession(): Promise<ActiveContext | null> {
  const ctx = await readSession();
  if (ctx && refused.has(ctx)) throw refused.get(ctx);
  return ctx;
}

/**
 * The session for choosing the language a request is answered in, refusal
 * or not: a refused request is still answered in its person's language.
 * i18n/server.ts alone.
 */
export async function sessionForLocale(): Promise<ActiveContext | null> {
  return readSession();
}

/** Switches the active role/school on the current session. */
export async function setActiveContext(
  sessionId: string,
  userId: string,
  next: { schoolId: string | null; role: Role | null },
): Promise<boolean> {
  if (next.role === "RECRUITER") {
    // A recruiter has no membership anywhere (4 Oct 2026): their account is the RecruiterProfile, and it must be live.
    const profile = await db.recruiterProfile.findUnique({ where: { userId }, select: { disabledAt: true } });
    if (!profile || profile.disabledAt) return false;
  } else if (next.role && next.role !== "PARENT") {
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

  // A parent's context names no school, whatever the body said: a school id
  // stored here was read back by getSession and handed to the events stream,
  // which subscribed the parent to that school's grades and registers.
  const schoolId = next.role && next.role !== "PARENT" && !isOutsideRole(next.role) ? next.schoolId : null;

  await db.session.update({
    where: { id: sessionId },
    data: { activeSchoolId: schoolId, activeRole: next.role, lastSeenAt: new Date() },
  });
  await db.user.update({
    where: { id: userId },
    data: { lastRole: next.role, lastSchoolId: schoolId },
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
  return clientAddress(hdrs);
}
