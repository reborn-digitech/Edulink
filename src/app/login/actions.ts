"use server";

import { db } from "@/lib/db";
import { fakePasswordWork, generateToken, hashToken, verifyPassword } from "@/lib/crypto";
import { checkSecondFactor, isEnabled } from "@/lib/two-factor";
import { createSession } from "@/lib/session";
import { loginSchema, magicLinkSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { sendMagicLink } from "@/lib/email";
import { audit } from "@/lib/audit";
import { forUser } from "@/lib/tenant-context";
import { toLoginEmail } from "@/lib/login-name";
import { MAGIC_LINK_TTL_MINUTES, ROLE_HOME, type Role } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type LoginState = {
  ok: boolean;
  errors: FieldErrors;
  redirectTo?: string;
  /** Set when the password was right but a second factor is still owed. */
  needsSecondFactor?: boolean;
  /** The short-lived token that redeems that challenge. Never a session. */
  challenge?: string;
};

/** Namespaced so a challenge can never be mistaken for a magic link. */
const TWO_FACTOR_PURPOSE = "TWO_FACTOR";

/**
 * Students who joined with a class code have no real email address — they get a
 * generated handle like `amara.k4f9`, stored against an internal domain so one
 * unique lookup still serves every account type. See login-name.ts, which owns
 * that rule now that three places depend on it.
 *
 * A child typing just their handle must work. Without this, the email validator
 * rejects it before it ever reaches the database and they are locked out of the
 * account they created ninety seconds ago.
 */
function normalizeIdentifier(input: unknown): unknown {
  if (typeof input !== "object" || input === null) return input;
  const record = input as Record<string, unknown>;
  const email = record.email;
  if (typeof email !== "string") return input;

  return { ...record, email: toLoginEmail(email) };
}

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
  const parsed = loginSchema.safeParse(normalizeIdentifier(input));
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

  // THE PASSWORD IS NOT ENOUGH FROM HERE. No session is created and nothing is
  // returned that could be turned into one: what goes back is a short-lived
  // challenge token bound to this user, redeemable only by `completeLogin`
  // below. Creating the session first and "asking" for a code afterwards would
  // make the second factor a suggestion.
  if (await isEnabled(user.id)) {
    const token = generateToken();
    await db.authToken.create({
      data: {
        userId: user.id,
        purpose: TWO_FACTOR_PURPOSE,
        tokenHash: hashToken(token),
        // Five minutes: long enough to open an authenticator app, short enough
        // that a challenge left on a shared screen is worthless.
        expiresAt: new Date(Date.now() + 5 * 60_000),
      },
    });
    await audit({ actorUserId: user.id, action: "auth.login.secondFactorRequired" });
    return { ok: true, errors: {}, needsSecondFactor: true, challenge: token };
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
 * Redeems a two-factor challenge and finishes the login.
 *
 * SINGLE-USE AND TIME-LIMITED, checked in that order. The token is consumed the
 * moment a correct code is supplied, so a challenge cannot be replayed even if
 * the second factor itself were somehow reusable — which it is not, because
 * `checkSecondFactor` refuses a TOTP step it has already accepted and marks a
 * recovery code used.
 *
 * A WRONG CODE DOES NOT CONSUME THE CHALLENGE. Somebody mistyping six digits
 * should not have to start from their password again, and the five-minute
 * expiry already bounds how long guessing can go on.
 */
export async function completeLogin(
  challenge: string,
  code: string,
): Promise<LoginState & { remainingRecoveryCodes?: number }> {
  const generic = { ok: false as const, errors: { _form: "That code is not right." } };

  const token = await db.authToken.findUnique({
    where: { tokenHash: hashToken(challenge) },
    select: { id: true, userId: true, purpose: true, expiresAt: true, consumedAt: true },
  });

  if (
    !token ||
    !token.userId ||
    token.purpose !== TWO_FACTOR_PURPOSE ||
    token.consumedAt ||
    token.expiresAt.getTime() < Date.now()
  ) {
    return { ok: false, errors: { _form: "That sign-in attempt has expired. Start again." } };
  }

  const result = await checkSecondFactor(token.userId, code);
  if (!result.ok) {
    await audit({ actorUserId: token.userId, action: "auth.secondFactor.failed" });
    return generic;
  }

  await db.authToken.update({ where: { id: token.id }, data: { consumedAt: new Date() } });

  const user = await db.user.findUniqueOrThrow({
    where: { id: token.userId },
    select: { id: true, lastRole: true, lastSchoolId: true },
  });
  const context = await resolveContext(user.id, user.lastRole, user.lastSchoolId);
  await createSession(user.id, { schoolId: context.schoolId, role: context.role });

  await audit({
    schoolId: context.schoolId,
    actorUserId: user.id,
    action: "auth.login",
    meta: { role: context.role, secondFactor: result.usedRecoveryCode ? "recovery" : "totp" },
  });

  return {
    ok: true,
    errors: {},
    redirectTo: context.redirectTo,
    remainingRecoveryCodes: result.usedRecoveryCode ? result.remaining : undefined,
  };
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
  // THE ONE PLACE WITH NO SCHOOL TO SCOPE TO, and the reason `forUser` exists.
  //
  // This has to ask which schools somebody belongs to, and the answer lives in a
  // table scoped by school. There is no session yet either — it is created from
  // what this returns. So it binds the USER instead, and the Membership policy
  // answers "your own rows" without needing a school.
  //
  // Inside the wrapper rather than at the three call sites (password login,
  // magic link, invite acceptance) on purpose: a call site that has to remember
  // is a call site that eventually forgets, and forgetting here means everyone
  // lands on "Join your school" holding a perfectly good password.
  return forUser(userId, () => resolveContextForUser(userId, preferredRole, preferredSchoolId));
}

async function resolveContextForUser(
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

  // An expert has no Membership and no Guardianship, so without this branch they
  // authenticate successfully and are then sent to "join a school" — which is
  // the one thing they must never do. Counted into `total` as well, because a
  // teacher who is also an expert has two ways in and should be asked which.
  const expertProfile = await db.expertProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  const total =
    memberships.length + (guardianships > 0 ? 1 : 0) + (expertProfile ? 1 : 0);

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
  // No school on the session, deliberately: an expert's schools are derived from
  // their confirmed bookings on every request, never carried on the cookie.
  if (expertProfile) return { role: "EXPERT", schoolId: null, redirectTo: "/expert" };

  // Runs the server, teaches nowhere. Checked LAST, after every school-shaped
  // way in, because somebody who is both an operator and a teacher should land
  // in their classroom — the flag is an extra door, not a replacement for one.
  const operator = await db.user.findUnique({
    where: { id: userId },
    select: { isSuperuser: true },
  });
  if (operator?.isSuperuser) return { role: null, schoolId: null, redirectTo: "/root" };

  /**
   * AN ALUMNUS BELONGS TO NOTHING AND IS NOT NEW, which is the distinction this
   * branch kept failing to draw — first for experts, then for operators, and
   * now for the person it matters most to.
   *
   * Somebody who has left every school they were at, because they moved to one
   * that is not on this platform or finished school altogether, has no active
   * membership at all. Sending them to "join with a code" is the same wrong
   * answer a suspended member used to get: there is no code that helps, and
   * everything their schools wrote about them was sitting one redirect away.
   *
   * Left-and-gone memberships only — `leftAt` is deliberately not filtered, so
   * this asks "were you ever a pupil" rather than "are you one now".
   */
  const everAPupil = await db.membership.count({ where: { userId, role: "STUDENT" } });
  if (everAPupil > 0) return { role: null, schoolId: null, redirectTo: "/record" };

  // Signed in, but belongs to nothing yet.
  return { role: null, schoolId: null, redirectTo: "/join?first=1" };
}
