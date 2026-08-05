"use server";

import { db } from "@/lib/db";
import { fakePasswordWork, generateToken, hashToken, verifyPassword } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import {
  loginSchema,
  magicLinkSchema,
  resetRequestSchema,
  resetSchema,
  fieldErrors,
  type FieldErrors,
} from "@/lib/validation";
import { findAccount, requestPasswordReset, resetPassword } from "@/lib/passwords";
import { consume, retryHint, LOGIN_ATTEMPTS, RESET_REQUESTS } from "@/lib/rate-limit";
import { sendMagicLink } from "@/lib/email";
import { audit } from "@/lib/audit";
import { forUser } from "@/lib/tenant-context";
import { MAGIC_LINK_TTL_MINUTES, ROLE_HOME, type Role } from "@/lib/constants";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type LoginState = {
  ok: boolean;
  errors: FieldErrors;
  redirectTo?: string;
};

/**
 * Password login, with whatever the person actually has.
 *
 * AN EMAIL, A MOBILE NUMBER, OR A HANDLE, resolved by shape in `findAccount` —
 * a pupil who joined with a class code has a generated handle like `amara.k4f9`
 * and no address at all, and a parent is far more likely to remember a phone
 * number than which address the school typed in.
 *
 * Failure is always the same message and always costs roughly the same time,
 * whether the account exists, has no password set, or the password is wrong.
 * Anything else turns the login form into an account-enumeration oracle — which
 * for a service holding children's records is a real safeguarding problem, not
 * a theoretical one. That is also why the message names no channel: "that login
 * and password do not match" says nothing about whether the login was one we
 * recognise.
 */
export async function login(input: unknown): Promise<LoginState> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { identifier, password } = parsed.data;
  const generic = { ok: false, errors: { _form: "That login and password do not match." } };

  /**
   * ⚠ HOW MANY TIMES THIS LOGIN HAS BEEN TRIED LATELY.
   *
   * Argon2 and `fakePasswordWork` make each guess slow; they do not make an
   * unlimited number of them impossible, and until now nothing did.
   *
   * THE MESSAGE SAYS SO, which does not leak anything BECAUSE the limit applies
   * to identifiers that exist and identifiers that do not, identically — the
   * bucket is built before any lookup. Hiding it behind the generic failure
   * would leave somebody who mistyped their password ten times staring at "that
   * does not match" for a password they know is right.
   *
   * The allowance is generous on purpose: this can be used to burn a real
   * person's attempts and keep them out, so ten-in-fifteen-minutes has to sit
   * well above what somebody fumbling their own password does.
   */
  const gate = await consume(
    `login:${identifier.toLowerCase()}`,
    LOGIN_ATTEMPTS.limit,
    LOGIN_ATTEMPTS.windowMs,
  );
  if (!gate.allowed) {
    return {
      ok: false,
      errors: { _form: `Too many attempts. Try again ${retryHint(gate.retryAfterSeconds)}.` },
    };
  }

  const account = await findAccount(identifier);
  if (!account || account.disabled) {
    await fakePasswordWork();
    return generic;
  }

  const user = await db.user.findUnique({
    where: { id: account.userId },
    select: { id: true, passwordHash: true, lastRole: true, lastSchoolId: true },
  });

  if (!user?.passwordHash) {
    await fakePasswordWork();
    return generic;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) {
    // The identifier is NOT recorded: a failed-login trail that stores what was
    // typed accumulates other people's phone numbers and addresses in a table
    // a school admin can read.
    await audit({ actorUserId: user.id, action: "auth.login.failed" });
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

  /**
   * ⚠ THIS SENDS MAIL AND HAD NO LIMIT, which went unnoticed while the link it
   * sent led nowhere. Building the route that redeems it turned a dead endpoint
   * into a working mailer, and a working mailer with no ceiling is the thing
   * `RESET_REQUESTS` was added to prevent — someone can put a registered
   * address in and hold the button.
   *
   * Keyed on what was TYPED and consumed BEFORE the lookup, for the reason the
   * reset flow spells out: an address matching nobody must be limited exactly
   * like one that does, or the limiter becomes the enumeration oracle this
   * function's "always report success" is careful not to be.
   */
  const gate = await consume(`magic:${email}`, RESET_REQUESTS.limit, RESET_REQUESTS.windowMs);
  if (!gate.allowed) {
    return {
      ok: false,
      errors: { _form: `Too many requests. Try again ${retryHint(gate.retryAfterSeconds)}.` },
    };
  }

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

/* -------------------------------------------------------------------------- */
/* Forgotten passwords                                                         */
/* -------------------------------------------------------------------------- */

export type ResetRequestState = {
  ok: boolean;
  errors: FieldErrors;
  /** Last four digits of what the caller typed, for a phone. Never ours. */
  hint?: string;
  channel?: "EMAIL" | "PHONE";
};

/**
 * "Send me a code."
 *
 * Reports the same thing whether or not the account exists, exactly as the
 * magic link does — see the note on `requestPasswordReset`.
 */
export async function requestReset(input: unknown): Promise<ResetRequestState> {
  const parsed = resetRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const result = await requestPasswordReset(parsed.data.identifier);
  if (!result.ok) return { ok: false, errors: { _form: result.error ?? "Try again shortly." } };
  return { ok: true, errors: {}, hint: result.hint, channel: result.channel };
}

/** "Here is the code, and my new password." */
export async function completeReset(input: unknown): Promise<LoginState> {
  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { identifier, code, password } = parsed.data;
  const result = await resetPassword(identifier, code, password);
  if (!result.ok) return { ok: false, errors: { _form: result.error ?? "That did not work." } };

  /**
   * NO SESSION IS CREATED HERE, on purpose. `resetPassword` has just revoked
   * every session this account had — signing the browser straight back in would
   * mean the one action whose purpose is "lock everybody out" ends with somebody
   * logged in, and it would do it before they have typed the new password once.
   * They go to the login form and use it.
   */
  return { ok: true, errors: {}, redirectTo: "/login?reset=1" };
}
