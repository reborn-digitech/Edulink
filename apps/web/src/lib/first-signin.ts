import "server-only";
import { randomInt } from "node:crypto";
import { db } from "./db";
import { revokeAllAccess } from "./session";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { hashPassword, hashToken, passwordProblems } from "./crypto";
import { readJson } from "./json";
import { isDeliverableEmail, toLoginEmail, HANDLE_DOMAIN } from "./login-name";
import { forSchool, forUser } from "./tenant-context";
import { notify } from "./notify";
import { guardiansToTell } from "./student-consent";
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
/** TA-037: the office's reset code for a pupil on a login name who forgot the password (see issueOfficeReset). */
export const OFFICE_RESET_PURPOSE = "OFFICE_RESET";
export { FIRST_SIGNIN_TTL_DAYS, OFFICE_RESET_TTL_HOURS } from "./first-signin-constants";
import { FIRST_SIGNIN_TTL_DAYS, OFFICE_RESET_TTL_HOURS } from "./first-signin-constants";
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

/**
 * owner-batch-item2a (27 Oct 2026): THE ROLES A FIRST SIGN-IN IS FOR. A pupil,
 * and a support worker (a cleaner, cook, guard or peon) the office added with
 * no login (support-staff.ts). The worker's account has no handle until the
 * office first issues a code: one is minted then, from the name and four
 * random letters, so the same account and the same membership gain a login
 * and nobody is given a second one. Signed in, a support worker reads their
 * own payslips and profile and nothing else (role-gate.ts).
 */
export const FIRST_SIGNIN_ROLES = ["STUDENT", "SUPPORT"] as const;
export type FirstSignInRole = (typeof FIRST_SIGNIN_ROLES)[number];

/** A login handle for a support worker: the name's letters and four random ones, as a pupil's is the name and four of the code. */
function supportHandle(name: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "staff";
  let tail = "";
  for (let i = 0; i < 4; i++) tail += ALPHABET[randomInt(ALPHABET.length)];
  return `${base}.${tail.toLowerCase()}`;
}

/** Gives a support worker's account with no address a handle, once; a second press finds the first one's. */
async function ensureSupportHandle(userId: string, name: string): Promise<string | null> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const email = `${supportHandle(name)}@${HANDLE_DOMAIN}`;
    try {
      const set = await db.user.updateMany({ where: { id: userId, email: null }, data: { email } });
      if (set.count === 1) return email;
      return (await db.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? null;
    } catch (error) {
      // Another account holds that handle: draw again.
      if ((error as { code?: string }).code !== "P2002") throw error;
    }
  }
  return null;
}

/** Issues (or re-issues) a pupil's, or a support worker's, first sign-in code. Admin only. */
export async function issueFirstSignIn(ctx: ActiveContext, studentMembershipId: string): Promise<IssueResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanIssueASignIn");
  const schoolId = ctx.schoolId;

  const pupil = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: { in: [...FIRST_SIGNIN_ROLES] }, status: "ACTIVE", leftAt: null },
    select: { id: true, role: true, user: { select: { id: true, name: true, email: true, disabledAt: true, passwordHash: true, emailVerifiedAt: true } } },
  });
  if (!pupil) return { ok: false, errorKey: "refusal.notPupilsHere" };
  if (pupil.user.disabledAt) return { ok: false, errorKey: "refusal.accountDisabled" };
  if (isDeliverableEmail(pupil.user.email)) return { ok: false, errorKey: "firstSignin.hasAddressUseForgot" };
  // A support worker's account was made with no handle at all (owner-batch-item2a): its first code gives it one.
  if (pupil.role === "SUPPORT" && !pupil.user.email && !pupil.user.passwordHash && !pupil.user.emailVerifiedAt) {
    pupil.user.email = await ensureSupportHandle(pupil.user.id, pupil.user.name);
  }
  const handle = handleOf(pupil.user.email);
  if (!handle) return { ok: false, errorKey: "firstSignin.noHandle" };

  /**
   * ⚠ A FIRST SIGN-IN IS FOR AN ACCOUNT THAT HAS NEVER SIGNED IN. Redeeming
   * the code SETS THE PASSWORD, so issuing one for an account that already
   * has a password, a verified address, or a life at another school — a
   * membership there, or a child it guards — would let this school's admin
   * take that account over: a transfer linked by a guessed birthday, then a
   * code that resets its password. Such an account is refused by name of
   * the rule; a pupil who has forgotten their password uses the reset, and
   * one with no address asks the school that issued the account.
   */
  const account = pupil.user;
  if (account.passwordHash || account.emailVerifiedAt) return { ok: false, errorKey: pupil.role === "SUPPORT" ? "supportStaff.alreadySignsIn" : "firstSignin.notEligible" };
  const elsewhere = await forUser(account.id, async () => {
    const membership = await db.membership.findFirst({ where: { userId: account.id, schoolId: { not: schoolId } }, select: { id: true } });
    if (membership) return true;
    const guards = await db.guardianship.findFirst({ where: { parentUserId: account.id, studentSchoolId: { not: schoolId } }, select: { id: true } });
    return Boolean(guards);
  });
  if (elsewhere) return { ok: false, errorKey: pupil.role === "SUPPORT" ? "supportStaff.alreadySignsIn" : "firstSignin.notEligible" };

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

type ResetAccount = {
  id: string;
  email: string | null;
  disabledAt: Date | null;
  passwordHash: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
};

/**
 * TA-037 (the owner's decision of 14 November 2026, option 1): why the office may NOT reset this pupil's password,
 * or null when it may. Asked when the code is issued and again when it is redeemed, so a code issued before the
 * account gained a confirmed mobile or a place elsewhere opens nothing.
 *
 * The office may reset only what is wholly its own: a login name (no email), no confirmed mobile (that pupil uses
 * "Forgotten your password?"), a password already chosen (a first sign-in otherwise), and no life beyond this
 * school's pupil — no place at another school ever, no other role here, no child guarded. That last is the takeover
 * guard of the first sign-in (assessment 2026-09-24 Critical 1), unchanged: such a pupil still needs the operator.
 */
async function officeResetRefusal(account: ResetAccount, schoolId: string, studentMembershipId: string): Promise<TranslationKey | null> {
  if (account.disabledAt) return "refusal.accountDisabled";
  if (isDeliverableEmail(account.email)) return "firstSignin.hasAddressUseForgot";
  if (!handleOf(account.email)) return "firstSignin.noHandle";
  if (account.phoneVerifiedAt) return "firstSignin.resetHasMobile";
  if (!account.passwordHash) return "firstSignin.resetNoPassword";
  if (account.emailVerifiedAt) return "firstSignin.resetOperatorOnly";
  const beyond = await forUser(account.id, async () => {
    const membership = await db.membership.findFirst({
      where: { userId: account.id, id: { not: studentMembershipId }, OR: [{ schoolId: { not: schoolId } }, { role: { not: "STUDENT" } }] },
      select: { id: true },
    });
    if (membership) return true;
    return Boolean(await db.guardianship.findFirst({ where: { parentUserId: account.id }, select: { id: true } }));
  });
  return beyond ? "firstSignin.resetOperatorOnly" : null;
}

/**
 * TA-037: the pupil's guardians hear that the office issued a reset code; where no family guardian is on the app (the
 * school itself stands in), the head does instead, and never the stand-in, who is the school. An adult at a college
 * is told to their guardians as every notice that names no grant is (TA-262): not at all. A notice that fails does
 * not take the code with it: the office still needs to read it.
 */
async function tellOfficeReset(ctx: ActiveContext, schoolId: string, studentMembershipId: string, name: string): Promise<void> {
  const vars = { name };
  const family = await db.guardianship.findMany({ where: { studentMembershipId, status: "ACTIVE", relation: { not: "SCHOOL" } }, select: { parentUserId: true } });
  if (family.length > 0) {
    const allowed = new Set((await forSchool(schoolId, () => guardiansToTell([studentMembershipId]))).get(studentMembershipId) ?? []);
    for (const userId of new Set(family.map((g) => g.parentUserId))) {
      if (!allowed.has(userId)) continue;
      await notify({ userId, schoolId, kind: "SYSTEM", titleKey: "firstSignin.notifResetTitle", titleVars: vars, bodyKey: "firstSignin.notifResetBody", bodyVars: vars }).catch(() => {});
    }
    return;
  }
  const heads = await forSchool(schoolId, () =>
    db.membership.findMany({ where: { schoolId, role: "PRINCIPAL", status: "ACTIVE", leftAt: null, userId: { not: ctx.user.id } }, select: { userId: true } }),
  );
  for (const userId of new Set(heads.map((h) => h.userId))) {
    await notify({ userId, schoolId, kind: "SYSTEM", titleKey: "firstSignin.notifResetTitle", titleVars: vars, bodyKey: "firstSignin.notifResetHeadBody", bodyVars: vars }).catch(() => {});
  }
}

/**
 * TA-037: THE OFFICE RESETS A FORGOTTEN PASSWORD WITH A CODE. A pupil on a login name who forgot the password had
 * nowhere a reset could go and was told to ask the school, which had nothing to give: a first sign-in code is
 * refused once a password exists. Now the office (ADMIN alone: not a guardian, not a class teacher) issues a
 * one-time code to its own pupil the rule above allows; the pupil types it with the handle at /first-signin (or the
 * phone's first sign-in screen) and chooses a new password, and redeeming it signs out every device and spends every
 * other token, as the first sign-in does. It works for OFFICE_RESET_TTL_HOURS (24), not a fortnight; issuing a new one
 * spends the old; five tries. The token, the spending of the old ones and the audit row are one transaction, and the
 * family (or the head) is told. Web only: the phone has no screen that issues codes.
 */
export async function issueOfficeReset(ctx: ActiveContext, studentMembershipId: string): Promise<IssueResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanIssueASignIn");
  const schoolId = ctx.schoolId;

  const pupil = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: {
      id: true,
      user: { select: { id: true, name: true, preferredName: true, email: true, disabledAt: true, passwordHash: true, emailVerifiedAt: true, phoneVerifiedAt: true } },
    },
  });
  if (!pupil) return { ok: false, errorKey: "refusal.notPupilsHere" };
  const refusal = await officeResetRefusal(pupil.user, schoolId, pupil.id);
  if (refusal) return { ok: false, errorKey: refusal };
  const handle = handleOf(pupil.user.email);
  if (!handle) return { ok: false, errorKey: "firstSignin.noHandle" };

  const code = mintCode();
  const expiresAt = new Date(Date.now() + OFFICE_RESET_TTL_HOURS * 3_600_000);
  await forSchool(schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      // Only the newest code works, of either kind: issuing spends whatever was outstanding.
      await tx.authToken.updateMany({
        where: { userId: pupil.user.id, purpose: { in: [FIRST_SIGNIN_PURPOSE, OFFICE_RESET_PURPOSE] }, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.authToken.create({
        data: {
          userId: pupil.user.id,
          purpose: OFFICE_RESET_PURPOSE,
          tokenHash: hashToken(`${pupil.user.id}:${code}`),
          meta: JSON.stringify({ issuedByUserId: ctx.user.id, schoolId }),
          expiresAt,
        },
      });
      await audit(
        { schoolId, actorUserId: ctx.user.id, action: "auth.officeReset.issue", targetType: "Membership", targetId: pupil.id, meta: { expiresAt: expiresAt.toISOString() } },
        tx,
      );
    }),
  );

  await tellOfficeReset(ctx, schoolId, pupil.id, pupil.user.preferredName ?? pupil.user.name);

  return { ok: true, issued: { code: formatCode(code), handle, expiresAt } };
}

export type RedeemResult =
  | { ok: true; userId: string; schoolId: string; role: FirstSignInRole }
  /** `field` names the password when the code was right and the password is what the rule refuses (TA-502). */
  | { ok: false; errorKey: TranslationKey; field?: "password" };

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
    // The office's reset code (TA-037) is typed at the same door as a first sign-in code; issuing either spends the other.
    where: { userId: user.id, purpose: { in: [FIRST_SIGNIN_PURPOSE, OFFICE_RESET_PURPOSE] }, consumedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, tokenHash: true, meta: true, purpose: true },
    orderBy: { createdAt: "desc" },
  });
  if (!live) return generic;
  const reset = live.purpose === OFFICE_RESET_PURPOSE;

  const meta = readJson<{ schoolId?: string }>(live.meta, {});

  // ONE CONDITIONAL STATEMENT charges the try, before the code is compared:
  // `attempts + 1 WHERE attempts < cap`, so a burst of guesses arriving
  // together gets exactly the cap between them. The count used to live in
  // `meta`, read and then written, and every guess in a burst read 0. A token
  // that cannot be charged is spent.
  const charged = await db.authToken.updateMany({
    where: { id: live.id, consumedAt: null, attempts: { lt: MAX_FIRST_SIGNIN_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (charged.count === 0) {
    await db.authToken.updateMany({ where: { id: live.id, consumedAt: null }, data: { consumedAt: new Date() } });
    return generic;
  }

  if (live.tokenHash !== hashToken(`${user.id}:${code}`)) {
    await audit({ schoolId: meta.schoolId, actorUserId: user.id, action: reset ? "auth.officeReset.failed" : "auth.firstSignin.failed" });
    return generic;
  }

  const problems = passwordProblems(newPassword, [rawHandle]);
  if (problems.length > 0) {
    // A weak password after a RIGHT code gives the try back — reached only
    // past the comparison, so it widens nobody's window.
    await db.authToken.updateMany({ where: { id: live.id, attempts: { gt: 0 } }, data: { attempts: { decrement: 1 } } });
    return { ok: false, errorKey: problems[0]!, field: "password" };
  }

  // NOBODY IS SIGNED IN HERE, so the membership row sits behind a fence no
  // session opens. The token remembers which school issued it; that school
  // is the only one this code can sign a pupil into.
  if (!meta.schoolId) return generic;
  const schoolId = meta.schoolId;
  const membership = await forSchool(schoolId, () =>
    db.membership.findFirst({
      // A pupil, or a support worker the office gave a code (owner-batch-item2a).
      // The office's reset code is for a pupil alone (TA-037).
      where: { userId: user.id, schoolId, role: { in: reset ? (["STUDENT"] as FirstSignInRole[]) : [...FIRST_SIGNIN_ROLES] }, status: "ACTIVE", leftAt: null },
      select: { id: true, schoolId: true, role: true },
      orderBy: { role: "asc" },
    }),
  );
  if (!membership) return generic;

  if (reset) {
    // TA-037: asked again now, so a code issued before the account gained a confirmed mobile, an address or a place
    // at another school opens nothing. Then the password, every device signed out, every other token spent and the
    // audit row, in one transaction.
    const account = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, disabledAt: true, passwordHash: true, emailVerifiedAt: true, phoneVerifiedAt: true },
    });
    if (!account || (await officeResetRefusal(account, schoolId, membership.id))) return generic;
    const passwordHash = await hashPassword(newPassword);
    await forSchool(schoolId, () =>
      db.$tenantTransaction(async (raw) => {
        const tx = raw as typeof db;
        await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
        await revokeAllAccess(user.id, { tokens: true, client: tx });
        await audit({ schoolId, actorUserId: user.id, action: "auth.officeReset.completed", targetType: "Membership", targetId: membership.id }, tx);
      }),
    );
    return { ok: true, userId: user.id, schoolId, role: "STUDENT" };
  }

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  await revokeAllAccess(user.id, { tokens: true });

  await audit({ schoolId: membership.schoolId, actorUserId: user.id, action: "auth.firstSignin.completed" });

  return { ok: true, userId: user.id, schoolId: membership.schoolId, role: membership.role as FirstSignInRole };
}
