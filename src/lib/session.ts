import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";
import { SESSION_COOKIE, SESSION_TTL_DAYS, type Role } from "./constants";
import { bindTenants } from "./tenant-context";
import { readJson } from "./json";

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
export const getSession = cache(async (): Promise<ActiveContext | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;
  if (session.revokedAt) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (session.user.disabledAt) return null;

  // The role/school on the cookie's session row is a *claim*. Verify the
  // membership still exists and is active before trusting it — a teacher
  // removed from a school this morning must not keep their afternoon session
  // scoped to it.
  let membershipId: string | null = null;
  let schoolId: string | null = session.activeSchoolId;
  let role: Role | null = (session.activeRole as Role | null) ?? null;

  // Bind the schools this request may see, before the first scoped query.
  // Everything downstream — pages, actions, the libs they call — inherits it and
  // never has to think about RLS. The membership check immediately below is
  // itself scoped, and correctly so: it asks whether this user belongs to THAT
  // school, which is exactly the question the policies answer.
  //
  // A PARENT gets the schools of their children instead. They have no school of
  // their own and legitimately span them, so this is the one role whose set is
  // not simply its session's school. Reading it costs one extra query, for
  // parents only.
  if (role === "PARENT") {
    const guardianships = await db.guardianship.findMany({
      where: { parentUserId: session.userId, status: "ACTIVE" },
      // Read straight off the row, NOT through `student`. Membership is policied,
      // and at this moment nothing is bound yet — the join would come back null
      // and Prisma refuses a required relation that returned nothing. This is
      // the bootstrap: it has to work before the tenant is known.
      select: { studentSchoolId: true },
    });
    bindTenants(guardianships.map((g) => g.studentSchoolId));
  } else {
    bindTenants([schoolId]);
  }

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

  // A claim that did not survive verification must not leave the request bound
  // to the school it claimed.
  if (schoolId === null && role !== "PARENT") bindTenants([]);

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

/** Every role/school the user can switch into, for the role switcher UI. */
export async function listContexts(userId: string) {
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
          include: { school: { select: { id: true, name: true } }, user: { select: { name: true, preferredName: true } } },
        },
      },
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
      name: g.student.user.preferredName ?? g.student.user.name,
      schoolId: g.student.schoolId,
      schoolName: g.student.school.name,
    })),
  };
}

function clientIp(hdrs: Headers): string | null {
  const forwarded = hdrs.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return hdrs.get("x-real-ip");
}
