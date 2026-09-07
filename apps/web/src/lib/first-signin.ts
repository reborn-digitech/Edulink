import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { hashPassword, hashToken, passwordProblems } from "./crypto";
import { readJson } from "./json";
import { isDeliverableEmail, toLoginEmail, HANDLE_DOMAIN } from "./login-name";
import { forSchool } from "./tenant-context";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * A pupil's FIRST way in, issued by the school.
 *
 * THE GAP THIS CLOSES. A pupil admitted from the office's list, or one whose
 * parent manages the account, has a login handle and no password — and no
 * address a reset code could go to. "Ask your school" was what the reset form
 * said, and the school had nothing to give. Now it has this: a one-time code,
 * shown once to the office, which the pupil types with their handle at
 * /first-signin to choose a password and be signed in.
 *
 * ONLY FOR ACCOUNTS WITH NOWHERE ELSE TO SEND A CODE. A pupil with a real
 * address sets a password through "Forgot password", like everyone else, and
 * the office is told so rather than given a code — two ways to set a
 * password on one account is one way too many to keep straight.
 *
 * THE CODE IS A CREDENTIAL, and is treated as the reset code is: eight
 * characters from an alphabet with no 0/O or 1/I, because it will be read
 * off paper; hashed salted with the user id, so one child's code cannot open
 * another's row even if the letters happen to match; five attempts; a
 * fortnight's life, because the office prints a list on Monday and the class
 * gets a lesson on it a week later; and issuing a new one consumes the old.
 * Redeeming it consumes every other outstanding token on the account and
 * revokes every session, the way a reset does — nothing minted before the
 * password existed should outlive it.
 */

export const FIRST_SIGNIN_PURPOSE = "FIRST_SIGNIN";
export { FIRST_SIGNIN_TTL_DAYS } from "./first-signin-constants";
import { FIRST_SIGNIN_TTL_DAYS } from "./first-signin-constants";
export const MAX_FIRST_SIGNIN_ATTEMPTS = 5;

/** No 0/O, no 1/I: it is going to be read off a printed list by a child. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function formatCode(raw: string): string {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}

function mintCode(): string {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return code;
}

/** The handle a pupil types: everything before the internal domain. */
export function handleOf(email: string | null): string | null {
  if (!email) return null;
  const suffix = `@${HANDLE_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : null;
}

export type IssuedFirstSignIn = {
  code: string;
  handle: string;
  expiresAt: Date;
};

export type IssueResult = { ok: true; issued: IssuedFirstSignIn } | { ok: false; errorKey: TranslationKey };

/** Issues (or re-issues) a pupil's first sign-in code. Admin only. */
export async function issueFirstSignIn(ctx: ActiveContext, studentMembershipId: string): Promise<IssueResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanIssueASignIn");
  const schoolId = ctx.schoolId;

  const pupil = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: { id: true, user: { select: { id: true, email: true, disabledAt: true } } },
  });
  if (!pupil) return { ok: false, errorKey: "refusal.notPupilsHere" };
  if (pupil.user.disabledAt) return { ok: false, errorKey: "refusal.accountDisabled" };
  if (isDeliverableEmail(pupil.user.email)) return { ok: false, errorKey: "firstSignin.hasAddressUseForgot" };
  const handle = handleOf(pupil.user.email);
  if (!handle) return { ok: false, errorKey: "firstSignin.noHandle" };

  const code = mintCode();
  const expiresAt = new Date(Date.now() + FIRST_SIGNIN_TTL_DAYS * 86_400_000);

  // Only the newest code works: issuing consumes whatever was outstanding.
  await db.authToken.updateMany({
    where: { userId: pupil.user.id, purpose: FIRST_SIGNIN_PURPOSE, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await db.authToken.create({
    data: {
      userId: pupil.user.id,
      purpose: FIRST_SIGNIN_PURPOSE,
      tokenHash: hashToken(`${pupil.user.id}:${code}`),
      meta: JSON.stringify({ attempts: 0, issuedByUserId: ctx.user.id, schoolId }),
      expiresAt,
    },
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "auth.firstSignin.issue",
    targetType: "Membership",
    targetId: pupil.id,
    meta: { expiresAt: expiresAt.toISOString() },
  });

  return { ok: true, issued: { code: formatCode(code), handle, expiresAt } };
}

export type RedeemResult =
  | { ok: true; userId: string; schoolId: string }
  | { ok: false; errorKey: TranslationKey };

/**
 * The pupil's side: handle + code + the password they chose.
 *
 * ONE MESSAGE FOR EVERY WAY IT CAN FAIL, as the reset has: a wrong handle, a
 * wrong code, a spent or expired one, too many tries, all read the same —
 * otherwise the form says which handles exist. The password is checked LAST
 * so a weak one does not cost an attempt.
 */
export async function redeemFirstSignIn(rawHandle: string, rawCode: string, newPassword: string): Promise<RedeemResult> {
  const generic: RedeemResult = { ok: false, errorKey: "firstSignin.noMatch" };
  const code = rawCode.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (code.length !== 8 || rawHandle.trim().length === 0) return generic;

  const user = await db.user.findFirst({
    where: { email: toLoginEmail(rawHandle), disabledAt: null },
    select: { id: true, email: true },
  });
  if (!user || isDeliverableEmail(user.email)) return generic;

  const live = await db.authToken.findFirst({
    where: { userId: user.id, purpose: FIRST_SIGNIN_PURPOSE, consumedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, tokenHash: true, meta: true },
    orderBy: { createdAt: "desc" },
  });
  if (!live) return generic;

  const meta = readJson<{ attempts?: number; schoolId?: string }>(live.meta, {});
  const attempts = meta.attempts ?? 0;
  if (attempts >= MAX_FIRST_SIGNIN_ATTEMPTS) {
    await db.authToken.update({ where: { id: live.id }, data: { consumedAt: new Date() } });
    return generic;
  }

  if (live.tokenHash !== hashToken(`${user.id}:${code}`)) {
    await db.authToken.update({
      where: { id: live.id },
      data: { meta: JSON.stringify({ ...meta, attempts: attempts + 1 }) },
    });
    await audit({ schoolId: meta.schoolId, actorUserId: user.id, action: "auth.firstSignin.failed" });
    return generic;
  }

  const problems = passwordProblems(newPassword, [rawHandle]);
  if (problems.length > 0) return { ok: false, errorKey: problems[0]! };

  // NOBODY IS SIGNED IN HERE, so the membership row sits behind a fence no
  // session opens. The token remembers which school issued it; that school
  // is the only one this code can sign a pupil into.
  if (!meta.schoolId) return generic;
  const schoolId = meta.schoolId;
  const membership = await forSchool(schoolId, () =>
    db.membership.findFirst({
      where: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
      select: { schoolId: true },
    }),
  );
  if (!membership) return generic;

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await db.session.updateMany({ where: { userId: user.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await db.authToken.updateMany({ where: { userId: user.id, consumedAt: null }, data: { consumedAt: new Date() } });

  await audit({ schoolId: membership.schoolId, actorUserId: user.id, action: "auth.firstSignin.completed" });

  return { ok: true, userId: user.id, schoolId: membership.schoolId };
}
