"use server";

import { db } from "@/lib/db";
import { fakePasswordWork, generateToken, hashToken, verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { loginSchema, magicLinkSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { sendMagicLink } from "@/lib/email";
import { audit } from "@/lib/audit";
import { MAGIC_LINK_TTL_MINUTES, ROLE_HOME, type Role } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type LoginState = { ok: boolean; errors: FieldErrors; redirectTo?: string };

/**
 * Password login.
 *
 * Failure is always the same message and always costs roughly the same time,
 * whether the account exists, has no password set, or the password is wrong.
 * Anything else turns the login form into an account-enumeration oracle — which
 * for a service holding children's records is a real safeguarding problem, not
 * a theoretical one.
 */
export async function login(input: unknown): Promise<LoginState> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { email, password } = parsed.data;
  const generic = { ok: false, errors: { _form: "That email and password do not match." } };

  const user = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true, disabledAt: true, lastRole: true, lastSchoolId: true },
  });

  if (!user?.passwordHash) {
    await fakePasswordWork();
    return generic;
  }
  if (user.disabledAt) {
    await fakePasswordWork();
    return generic;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    await audit({ actorUserId: user.id, action: "auth.login.failed", meta: { email } });
    return generic;
  }

  // Restore the role they last used, but only if it is still valid.
  const context = await resolveContext(user.id, user.lastRole, user.lastSchoolId);

  await createSession(user.id, { schoolId: context.schoolId, role: context.role });
  await audit({
    schoolId: context.schoolId,
    actorUserId: user.id,
    action: "auth.login",
    meta: { role: context.role },
  });

  return { ok: true, errors: {}, redirectTo: context.redirectTo };
}

/**
 * Magic link. Always reports success, again to avoid confirming whether an
 * address is registered.
 */
export async function requestMagicLink(input: unknown): Promise<LoginState> {
  const parsed = magicLinkSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { email } = parsed.data;
  const user = await db.user.findUnique({ where: { email }, select: { id: true, disabledAt: true } });

  if (user && !user.disabledAt) {
    const token = generateToken();
    await db.authToken.create({
      data: {
        userId: user.id,
        email,
        purpose: "MAGIC_LINK",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60_000),
      },
    });
    await sendMagicLink(email, `${APP_URL}/magic?token=${token}`, MAGIC_LINK_TTL_MINUTES);
  }

  return { ok: true, errors: {} };
}

/**
 * Picks the role/school to open the session with. Exported because the magic
 * link and invite-acceptance routes need exactly the same logic.
 */
export async function resolveContext(
  userId: string,
  preferredRole?: string | null,
  preferredSchoolId?: string | null,
): Promise<{ role: Role | null; schoolId: string | null; redirectTo: string }> {
  if (preferredRole && preferredRole !== "PARENT" && preferredSchoolId) {
    const membership = await db.membership.findFirst({
      where: {
        userId,
        schoolId: preferredSchoolId,
        role: preferredRole,
        status: "ACTIVE",
        leftAt: null,
      },
      select: { id: true },
    });
    if (membership) {
      return {
        role: preferredRole as Role,
        schoolId: preferredSchoolId,
        redirectTo: ROLE_HOME[preferredRole as Role],
      };
    }
  }

  const memberships = await db.membership.findMany({
    where: { userId, status: "ACTIVE", leftAt: null },
    select: { role: true, schoolId: true },
    orderBy: { joinedAt: "asc" },
  });

  const guardianships = await db.guardianship.count({
    where: { parentUserId: userId, status: "ACTIVE" },
  });

  const total = memberships.length + (guardianships > 0 ? 1 : 0);

  // More than one way in? Let them choose rather than guessing wrong.
  if (total > 1) return { role: null, schoolId: null, redirectTo: "/switch" };

  const only = memberships[0];
  if (only) {
    return {
      role: only.role as Role,
      schoolId: only.schoolId,
      redirectTo: ROLE_HOME[only.role as Role],
    };
  }
  if (guardianships > 0) return { role: "PARENT", schoolId: null, redirectTo: "/parent" };

  // Signed in, but belongs to nothing yet.
  return { role: null, schoolId: null, redirectTo: "/join?first=1" };
}
