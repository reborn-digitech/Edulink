import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./tenancy";
import { hashPassword, verifyPassword } from "./crypto";
import {
  generateRecoveryCodes,
  generateSecret,
  normaliseRecoveryCode,
  provisioningUri,
  verifyTotp,
} from "./totp";
import { base32Decode } from "./totp";
import type { ActiveContext } from "./session";

/**
 * Two-factor authentication, on top of `totp.ts`.
 *
 * `totp.ts` is the arithmetic and is proven against the RFC's own vectors. This
 * file is everything that arithmetic cannot decide on its own: when a secret
 * counts as enrolled, what a used code means, and how somebody gets back in when
 * the phone is gone.
 *
 * A SECRET IS NOT ENABLED UNTIL A CODE FROM IT HAS BEEN TYPED. `beginEnrolment`
 * stores the secret with `twoFactorEnabledAt` still null, and only `confirm`
 * flips it. Enabling on generation is how people lock themselves out of an
 * account with a QR code they never actually scanned.
 *
 * RECOVERY CODES ARE HASHED LIKE PASSWORDS, with the same argon2 parameters. A
 * recovery code IS a password — a long-lived credential that alone gets you in —
 * so storing it any other way would be storing a password in the clear.
 */

const ISSUER = "EduLink";

export type Enrolment = { secret: string; uri: string };

/** Starts enrolment. Nothing is enabled yet; the secret is provisional. */
export async function beginEnrolment(session: ActiveContext): Promise<Enrolment> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { email: true, name: true, twoFactorEnabledAt: true },
  });
  if (user.twoFactorEnabledAt) {
    throw new AccessError("Two-factor is already on. Turn it off first to re-enrol.");
  }

  const secret = generateSecret();
  await db.user.update({
    where: { id: session.user.id },
    // Deliberately leaves twoFactorEnabledAt null. A secret sitting here does
    // nothing at all until a code proves the app actually has it.
    data: { twoFactorSecret: secret, twoFactorEnabledAt: null, twoFactorLastStep: null },
  });

  return {
    secret,
    uri: provisioningUri({ secret, account: user.email ?? user.name, issuer: ISSUER }),
  };
}

/**
 * Confirms enrolment with a code, and returns the recovery codes ONCE.
 *
 * The codes are returned in plaintext here and nowhere else, because only their
 * hashes are kept. A caller that loses them has to start again — which is the
 * correct trade, and is why the page shows them before it lets you continue.
 */
export async function confirmEnrolment(
  session: ActiveContext,
  code: string,
): Promise<{ recoveryCodes: string[] }> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { twoFactorSecret: true, twoFactorEnabledAt: true },
  });
  if (user.twoFactorEnabledAt) throw new AccessError("Two-factor is already on");
  if (!user.twoFactorSecret) throw new AccessError("Start again — there is no secret to confirm");

  const result = verifyTotp(base32Decode(user.twoFactorSecret), code, Date.now());
  if (!result.ok) throw new AccessError("That code is not right. Check the time on your phone.");

  const codes = generateRecoveryCodes();
  const hashes = await Promise.all(codes.map((c) => hashPassword(normaliseRecoveryCode(c))));

  await db.$transaction(async (tx) => {
    // Any codes from a previous enrolment are cleared, not added to: leaving
    // them live would mean an old, possibly leaked, set still opens the account.
    await tx.recoveryCode.deleteMany({ where: { userId: session.user.id } });
    await tx.recoveryCode.createMany({
      data: hashes.map((codeHash) => ({ userId: session.user.id, codeHash })),
    });
    await tx.user.update({
      where: { id: session.user.id },
      data: { twoFactorEnabledAt: new Date(), twoFactorLastStep: result.step },
    });
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "twoFactor.enable",
    targetType: "User",
    targetId: session.user.id,
  });

  return { recoveryCodes: codes };
}

/**
 * Turns it off. Requires the CURRENT PASSWORD, not a code.
 *
 * A code proves possession of the phone, which whoever is sitting at an unlocked
 * session already has. The password proves it is the account holder, which is
 * the question that matters when removing a protection.
 */
export async function disable(session: ActiveContext, password: string): Promise<void> {
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { passwordHash: true, twoFactorEnabledAt: true },
  });
  if (!user.twoFactorEnabledAt) return;
  if (!user.passwordHash) throw new AccessError("This account has no password to check");

  if (!(await verifyPassword(user.passwordHash, password))) {
    throw new AccessError("That password is not right");
  }

  await db.$transaction(async (tx) => {
    await tx.recoveryCode.deleteMany({ where: { userId: session.user.id } });
    await tx.user.update({
      where: { id: session.user.id },
      data: { twoFactorSecret: null, twoFactorEnabledAt: null, twoFactorLastStep: null },
    });
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "twoFactor.disable",
    targetType: "User",
    targetId: session.user.id,
  });
}

export type SecondFactorResult = { ok: boolean; usedRecoveryCode: boolean; remaining: number };

/**
 * Checks a second factor at login. Accepts a TOTP code OR a recovery code.
 *
 * BOTH PATHS ARE SINGLE-USE. A TOTP code is refused if its step is not newer
 * than the last accepted one, so a code observed over a shoulder is dead the
 * moment its owner uses it. A recovery code is marked used and never matches
 * again.
 *
 * Takes a userId rather than a session, because at this point in the login there
 * is deliberately no session yet — that is the entire point of the second factor.
 */
export async function checkSecondFactor(
  userId: string,
  code: string,
): Promise<SecondFactorResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorSecret: true, twoFactorEnabledAt: true, twoFactorLastStep: true },
  });
  if (!user?.twoFactorEnabledAt || !user.twoFactorSecret) {
    return { ok: false, usedRecoveryCode: false, remaining: 0 };
  }

  const result = verifyTotp(base32Decode(user.twoFactorSecret), code, Date.now());
  if (result.ok && result.step !== null) {
    // Strictly greater. Equal means this exact code has already been spent.
    if (user.twoFactorLastStep !== null && result.step <= user.twoFactorLastStep) {
      return { ok: false, usedRecoveryCode: false, remaining: await countRemaining(userId) };
    }
    await db.user.update({ where: { id: userId }, data: { twoFactorLastStep: result.step } });
    return { ok: true, usedRecoveryCode: false, remaining: await countRemaining(userId) };
  }

  // Not a valid TOTP code — try the recovery codes. They are hashed, so every
  // unused one has to be checked; there is no way to look one up by value.
  const normalised = normaliseRecoveryCode(code);
  if (normalised.length < 8) {
    return { ok: false, usedRecoveryCode: false, remaining: await countRemaining(userId) };
  }

  const unused = await db.recoveryCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  });
  for (const candidate of unused) {
    if (await verifyPassword(candidate.codeHash, normalised)) {
      await db.recoveryCode.update({ where: { id: candidate.id }, data: { usedAt: new Date() } });
      await audit({
        schoolId: null,
        actorUserId: userId,
        action: "twoFactor.recoveryUsed",
        targetType: "User",
        targetId: userId,
      });
      return { ok: true, usedRecoveryCode: true, remaining: await countRemaining(userId) };
    }
  }

  return { ok: false, usedRecoveryCode: false, remaining: await countRemaining(userId) };
}

async function countRemaining(userId: string): Promise<number> {
  return db.recoveryCode.count({ where: { userId, usedAt: null } });
}

/** Whether this account will be asked for a second factor. */
export async function isEnabled(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabledAt: true },
  });
  return user?.twoFactorEnabledAt != null;
}

export async function status(session: ActiveContext) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { twoFactorEnabledAt: true, passwordHash: true },
  });
  return {
    enabled: user.twoFactorEnabledAt != null,
    enabledAt: user.twoFactorEnabledAt,
    hasPassword: user.passwordHash != null,
    remainingRecoveryCodes: await countRemaining(session.user.id),
  };
}
