import "server-only";
import { db } from "./db";
import { audit } from "./audit";
import { generateToken, hashToken, verifyPassword } from "./crypto";
import { open, seal, sealingAvailable } from "./secret-box";
import { consume, peek } from "./rate-limit";
import { isDeliverableEmail, toDisplayLoginName } from "./login-name";
import { revokeAllAccess } from "./session";
import { localeForUser, sendAccountNotice } from "./email";
import { translator } from "./i18n/dictionary";
import {
  generateRecoveryCodes,
  generateSecret,
  hashRecoveryCode,
  looksLikeRecoveryCode,
  matchRecoveryCode,
  otpauthUri,
  verifyTotp,
} from "./totp";

/**
 * Two-step sign-in for the office, the head and the operator.
 *
 * WHO. The accounts that can read a whole school — ADMIN and PRINCIPAL — and
 * the one that can read every school. A teacher or a parent is not offered
 * it: their password already guards what they can see, and an authenticator
 * app on a family's shared phone is one more thing to lose. Eligibility is a
 * live question (a membership that ended takes the offer with it) but a
 * secret already enrolled keeps guarding the sign-in whatever the roles
 * become: the sign-in path asks only whether it is ON.
 *
 * THE SECRET NEVER SITS IN THE DATABASE AS TEXT. It is sealed under
 * FEES_SECRET_KEY (secret-box.ts), bound to `${userId}:totp` as associated
 * data so a sealed value moved to another row fails to open. With no key the
 * server refuses to enrol, with the same refusal the fees settings give, and
 * a person already enrolled cannot sign in at all until the key is back —
 * which is the right failure: the alternative is a guard that silently
 * stands aside.
 *
 * TWO STEPS, ONE DOOR. Every first step — the password check, a sign-in
 * link, SSO — ends in `twoFactorChallengeFor`: null means carry on and mint
 * the session; a token means stop, hand the token over (a five-minute cookie
 * on the web, the TWO_FACTOR answer on the phone) and mint nothing. The
 * token's hash is the TwoFactorChallenge row; `verifyTwoFactor` spends it.
 * What is minted after it passes is exactly what the first step would have
 * minted, by the same function, so there is one cookie path and one bearer
 * path and this file owns neither.
 */

export const TOTP_ISSUER = "Shalaghar";
/** The web keeps the challenge here between the two steps, for as long as the challenge lives. */
export const TWO_FACTOR_COOKIE = "edulink_2fa";
export const CHALLENGE_TTL_MS = 5 * 60_000;
export const CHALLENGE_MAX_ATTEMPTS = 5;

/** Wrong codes against one challenge, and against one address whatever the challenge. */
export const TOTP_PER_CHALLENGE = { limit: 10, windowMs: 15 * 60_000 };
export const TOTP_PER_ADDRESS = { limit: 30, windowMs: 15 * 60_000 };
/** Codes tried while turning it on or off, per person. */
export const TOTP_SETTINGS_ATTEMPTS = { limit: 10, windowMs: 15 * 60_000 };

/**
 * WRONG CODES AGAINST ONE ACCOUNT, whatever the challenge or the address
 * (QA-22, 24 Oct 2026). The two limits above are per challenge and per
 * address, and a fresh challenge comes with every right password: somebody
 * who holds the password and rotates addresses had about fifty guesses a
 * quarter-hour. Counted on failures only; the tenth in an hour locks the
 * second step of this account until the hour is out (every open challenge
 * is spent, the audit log says so, and the holder is told by email, since
 * whoever is guessing already has the password). A password reset lifts it
 * (passwords.ts), because the reset is the owner proving the mailbox.
 */
export const TOTP_PER_ACCOUNT = { limit: 10, windowMs: 60 * 60_000 };
export function totpAccountBucket(userId: string): string {
  return `totp-user:${userId}`;
}

/**
 * HOW TURNING IT ON IS PROVED (QA-23, 24 Oct 2026). A session alone used to
 * be enough, so a stolen session could put its own authenticator on the
 * account and lock the owner out (turning it off needs a code; a reset does
 * not clear it). Now the password is asked; an account with no password (a
 * sign-in link or SSO only) needs a sign-in made in the last ten minutes.
 */
export const ENROL_FRESH_SIGN_IN_MS = 10 * 60_000;

export function twoFactorCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    // Only the login pages ever read it; a page elsewhere never sees it.
    path: "/login",
    maxAge: CHALLENGE_TTL_MS / 1000,
  };
}

// A college's exam controller, IQAC, placement officer and accounts office hold the results, the filings, the
// recruiters' access and the money's paperwork (4 Oct 2026): they may turn two-step sign-in on too.
const ELIGIBLE_ROLES = ["ADMIN", "PRINCIPAL", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];

/** The office, the head, or the operator. */
export async function twoFactorEligible(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { isSuperuser: true } });
  if (!user) return false;
  if (user.isSuperuser) return true;
  const membership = await db.membership.findFirst({
    where: { userId, status: "ACTIVE", leftAt: null, role: { in: ELIGIBLE_ROLES } },
    select: { id: true },
  });
  if (membership !== null) return true;
  // A recruiter holds no membership, and reads students' records through the drives of its company
  // (placement, 4 Oct 2026): an active recruiter account may turn two-step sign-in on too.
  const recruiter = await db.recruiterProfile.findUnique({ where: { userId }, select: { disabledAt: true } });
  return recruiter !== null && recruiter.disabledAt === null;
}

export type TwoFactorStatus = {
  eligible: boolean;
  enabled: boolean;
  enabledAt: Date | null;
  recoveryLeft: number;
  available: boolean;
  /** Whether turning it on asks for the password (an account with none needs a fresh sign-in instead; QA-23). */
  hasPassword: boolean;
};

export async function twoFactorStatus(userId: string): Promise<TwoFactorStatus> {
  const [user, eligible] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { totpEnabledAt: true, totpRecoveryHashes: true, passwordHash: true } }),
    twoFactorEligible(userId),
  ]);
  return {
    eligible,
    enabled: user.totpEnabledAt !== null,
    enabledAt: user.totpEnabledAt,
    recoveryLeft: user.totpEnabledAt ? user.totpRecoveryHashes.length : 0,
    available: sealingAvailable(),
    hasPassword: user.passwordHash !== null,
  };
}

/** Whether the second step stands between this person and a session. */
export async function twoFactorRequired(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { totpEnabledAt: true } });
  return user?.totpEnabledAt != null;
}

/* -------------------------------------------------------------------------- */
/* Turning it on and off                                                       */
/* -------------------------------------------------------------------------- */

export type StartResult =
  | { ok: true; secret: string; uri: string; account: string }
  | { ok: false; reason: "ineligible" | "unavailable" | "alreadyOn" | "passwordNeeded" | "wrongPassword" | "signInAgain" }
  | { ok: false; reason: "rate"; retryAfterSeconds: number };

/** What the person turning it on shows for it: the password they sign in with, and the session they are using. */
export type StartProof = { password?: string | null; sessionId: string | null };

/**
 * A fresh secret, sealed into the pending slot and handed back once for the
 * app to scan. Nothing guards the sign-in until a code confirms it; starting
 * again simply replaces the pending secret. The password is asked first, or
 * a fresh sign-in for an account with none (QA-23).
 */
export async function startTwoFactor(userId: string, proof: StartProof): Promise<StartResult> {
  if (!(await twoFactorEligible(userId))) return { ok: false, reason: "ineligible" };
  if (!sealingAvailable()) return { ok: false, reason: "unavailable" };
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totpEnabledAt: true, email: true, phone: true, name: true, passwordHash: true },
  });
  if (user.totpEnabledAt) return { ok: false, reason: "alreadyOn" };
  const proved = await proveHolder(userId, user.passwordHash, proof);
  if (proved) return proved;
  const secret = generateSecret();
  await db.user.update({ where: { id: userId }, data: { totpPendingEnc: seal(secret, bound(userId)) } });
  const account = user.email ? toDisplayLoginName(user.email) : (user.phone ?? user.name);
  return { ok: true, secret, uri: otpauthUri(TOTP_ISSUER, account, secret), account };
}

/**
 * Null when the person has shown they are the account's holder; otherwise the
 * refusal. A wrong password is charged against the same per-person limit as
 * the codes and written to the audit log; it says nothing the login form would
 * not, since the caller is already signed in as this person.
 */
async function proveHolder(userId: string, passwordHash: string | null, proof: StartProof): Promise<Extract<StartResult, { ok: false }> | null> {
  if (passwordHash) {
    if (!proof.password) return { ok: false, reason: "passwordNeeded" };
    const gate = await consume(`totp-enrol:${userId}`, TOTP_SETTINGS_ATTEMPTS.limit, TOTP_SETTINGS_ATTEMPTS.windowMs);
    if (!gate.allowed) return { ok: false, reason: "rate", retryAfterSeconds: gate.retryAfterSeconds };
    if (!(await verifyPassword(passwordHash, proof.password))) {
      await audit({ actorUserId: userId, action: "auth.totp.enrolRefused", meta: { why: "password" } });
      return { ok: false, reason: "wrongPassword" };
    }
    return null;
  }
  const session = proof.sessionId
    ? await db.session.findUnique({ where: { id: proof.sessionId }, select: { userId: true, createdAt: true, revokedAt: true } })
    : null;
  if (!session || session.userId !== userId || session.revokedAt || Date.now() - session.createdAt.getTime() > ENROL_FRESH_SIGN_IN_MS) {
    return { ok: false, reason: "signInAgain" };
  }
  return null;
}

export type ConfirmResult =
  | { ok: true; recoveryCodes: string[]; signedOut: number }
  | { ok: false; reason: "nothingPending" | "wrongCode" | "unavailable" | "alreadyOn" | "rate"; retryAfterSeconds?: number };

/**
 * One right code from the app moves the pending secret into place and mints
 * the recovery codes, shown once. Every OTHER session of the account is
 * signed out as it turns on (QA-23): whoever else held one did not pass the
 * step that now guards the account. `keepSessionId` is the session doing it.
 */
export async function confirmTwoFactor(userId: string, code: string, opts: { keepSessionId: string | null }): Promise<ConfirmResult> {
  if (!sealingAvailable()) return { ok: false, reason: "unavailable" };
  const gate = await consume(`totp-enrol:${userId}`, TOTP_SETTINGS_ATTEMPTS.limit, TOTP_SETTINGS_ATTEMPTS.windowMs);
  if (!gate.allowed) return { ok: false, reason: "rate", retryAfterSeconds: gate.retryAfterSeconds };
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { totpPendingEnc: true, totpEnabledAt: true } });
  if (user.totpEnabledAt) return { ok: false, reason: "alreadyOn" };
  if (!user.totpPendingEnc) return { ok: false, reason: "nothingPending" };
  const secret = open(user.totpPendingEnc, bound(userId));
  const step = verifyTotp(secret, code);
  if (step === null) return { ok: false, reason: "wrongCode" };
  const recoveryCodes = generateRecoveryCodes();
  // Only the row that is still pending is turned on: two confirmations at
  // once cannot each mint a set of codes.
  const turned = await db.user.updateMany({
    where: { id: userId, totpEnabledAt: null, totpPendingEnc: user.totpPendingEnc },
    data: {
      totpSecretEnc: user.totpPendingEnc,
      totpPendingEnc: null,
      totpEnabledAt: new Date(),
      totpRecoveryHashes: recoveryCodes.map(hashRecoveryCode),
      totpLastStep: step,
    },
  });
  if (turned.count !== 1) return { ok: false, reason: "alreadyOn" };
  const signedOut = opts.keepSessionId ? await revokeAllAccess(userId, { keepSessionId: opts.keepSessionId }) : await revokeAllAccess(userId);
  await audit({ actorUserId: userId, action: "auth.totp.enrolled", meta: { otherSessionsSignedOut: signedOut } });
  return { ok: true, recoveryCodes, signedOut };
}

export type DisableResult = { ok: true } | { ok: false; reason: "notOn" | "wrongCode" | "unavailable" | "rate"; retryAfterSeconds?: number };

/** A code from the app or a recovery code turns it off; a session alone does not. */
export async function disableTwoFactor(userId: string, code: string): Promise<DisableResult> {
  const gate = await consume(`totp-off:${userId}`, TOTP_SETTINGS_ATTEMPTS.limit, TOTP_SETTINGS_ATTEMPTS.windowMs);
  if (!gate.allowed) return { ok: false, reason: "rate", retryAfterSeconds: gate.retryAfterSeconds };
  const user = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { totpSecretEnc: true, totpEnabledAt: true, totpRecoveryHashes: true, totpLastStep: true },
  });
  if (!user.totpEnabledAt || !user.totpSecretEnc) return { ok: false, reason: "notOn" };
  if (!sealingAvailable()) return { ok: false, reason: "unavailable" };
  const check = await checkCode(userId, code, user);
  if (!check.ok) return { ok: false, reason: "wrongCode" };
  await db.user.update({
    where: { id: userId },
    data: { totpSecretEnc: null, totpPendingEnc: null, totpEnabledAt: null, totpRecoveryHashes: [], totpLastStep: null },
  });
  await db.twoFactorChallenge.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  await audit({ actorUserId: userId, action: "auth.totp.disabled", meta: { recovery: check.recovery } });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* The second step of a sign-in                                                */
/* -------------------------------------------------------------------------- */

/**
 * Null when this person signs straight in; otherwise the raw challenge the
 * caller hands over in place of a session. `via` is how the first step was
 * passed, recorded on the row and in the audit line when the second passes.
 */
export async function twoFactorChallengeFor(userId: string, via: string): Promise<string | null> {
  if (!(await twoFactorRequired(userId))) return null;
  const token = generateToken();
  await db.twoFactorChallenge.create({
    data: { userId, tokenHash: hashToken(token), via, expiresAt: new Date(Date.now() + CHALLENGE_TTL_MS) },
  });
  return token;
}

export type VerifyResult =
  | { ok: true; userId: string; lastRole: string | null; lastSchoolId: string | null; via: string; recovery: boolean }
  | { ok: false; reason: "rate"; retryAfterSeconds: number }
  | { ok: false; reason: "wrong"; attemptsLeft: number }
  /** Unknown, expired, already spent, or out of attempts — the person starts the sign-in again. */
  | { ok: false; reason: "dead" };

/**
 * Spends a challenge with a code. Every call charges one attempt on the row
 * (a conditional update, so a burst of guesses cannot all see attempt zero)
 * and one against the challenge's and the address's limits; the fifth wrong
 * code kills the challenge, and so does five minutes.
 */
export async function verifyTwoFactor(rawChallenge: string, code: string, opts: { caller?: string | null } = {}): Promise<VerifyResult> {
  const challenge = rawChallenge.trim();
  if (!challenge) return { ok: false, reason: "dead" };
  const tokenHash = hashToken(challenge);

  const byChallenge = await consume(`totp:${tokenHash.slice(0, 32)}`, TOTP_PER_CHALLENGE.limit, TOTP_PER_CHALLENGE.windowMs);
  if (!byChallenge.allowed) return { ok: false, reason: "rate", retryAfterSeconds: byChallenge.retryAfterSeconds };
  if (opts.caller) {
    const byAddress = await consume(`totp-addr:${opts.caller}`, TOTP_PER_ADDRESS.limit, TOTP_PER_ADDRESS.windowMs);
    if (!byAddress.allowed) return { ok: false, reason: "rate", retryAfterSeconds: byAddress.retryAfterSeconds };
  }

  const now = new Date();
  const charged = await db.twoFactorChallenge.updateMany({
    where: { tokenHash, usedAt: null, expiresAt: { gt: now }, attempts: { lt: CHALLENGE_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (charged.count !== 1) return { ok: false, reason: "dead" };
  const row = await db.twoFactorChallenge.findUniqueOrThrow({
    where: { tokenHash },
    select: { id: true, userId: true, via: true, attempts: true },
  });
  const user = await db.user.findUnique({
    where: { id: row.userId },
    select: { id: true, disabledAt: true, lastRole: true, lastSchoolId: true, totpSecretEnc: true, totpEnabledAt: true, totpRecoveryHashes: true, totpLastStep: true },
  });
  if (!user || user.disabledAt || !user.totpEnabledAt || !user.totpSecretEnc) return { ok: false, reason: "dead" };
  if (!sealingAvailable()) return { ok: false, reason: "dead" };

  // The account's own ceiling (QA-22): while it is reached no code is even
  // tried, the right one included, so a lucky guess cannot land in the lock.
  const locked = await peek(totpAccountBucket(user.id), TOTP_PER_ACCOUNT.limit);
  if (!locked.allowed) return { ok: false, reason: "rate", retryAfterSeconds: locked.retryAfterSeconds };

  const check = await checkCode(user.id, code, user);
  if (!check.ok) {
    await audit({ actorUserId: user.id, action: "auth.totp.failed", meta: { via: row.via, attempt: row.attempts } });
    const strike = await consume(totpAccountBucket(user.id), TOTP_PER_ACCOUNT.limit, TOTP_PER_ACCOUNT.windowMs);
    if (!strike.allowed || strike.remaining === 0) {
      // `remaining` 0 and allowed is the failure that reached the ceiling: it,
      // and only it, locks and tells. A burst past it is answered the same way.
      if (strike.allowed) await lockSecondStep(user.id, row.via);
      const until = await peek(totpAccountBucket(user.id), TOTP_PER_ACCOUNT.limit);
      return { ok: false, reason: "rate", retryAfterSeconds: until.allowed ? Math.ceil(TOTP_PER_ACCOUNT.windowMs / 1000) : until.retryAfterSeconds };
    }
    const attemptsLeft = CHALLENGE_MAX_ATTEMPTS - row.attempts;
    return attemptsLeft > 0 ? { ok: false, reason: "wrong", attemptsLeft } : { ok: false, reason: "dead" };
  }
  // The right code spends the challenge once; a second caller with the same
  // token at the same moment finds it spent.
  const spent = await db.twoFactorChallenge.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: now } });
  if (spent.count !== 1) return { ok: false, reason: "dead" };
  await audit({ actorUserId: user.id, action: "auth.totp.passed", meta: { via: row.via, recovery: check.recovery } });
  return { ok: true, userId: user.id, lastRole: user.lastRole, lastSchoolId: user.lastSchoolId, via: row.via, recovery: check.recovery };
}

/**
 * The account's second step is locked (QA-22): every open challenge is spent,
 * the audit log records it, and the holder is told by email in their own
 * language — the guesser already has the password, so the message says to
 * change it. A pupil's handle or an account with no address is told nothing.
 */
async function lockSecondStep(userId: string, via: string): Promise<void> {
  await db.twoFactorChallenge.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  await audit({ actorUserId: userId, action: "auth.totp.locked", meta: { via, failures: TOTP_PER_ACCOUNT.limit, minutes: TOTP_PER_ACCOUNT.windowMs / 60_000 } });
  try {
    const holder = await db.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!holder?.email || !isDeliverableEmail(holder.email)) return;
    const locale = await localeForUser(userId);
    const t = translator(locale);
    await sendAccountNotice({
      to: holder.email,
      purpose: "ACCOUNT_SECURITY",
      subject: t("accountGuard.totpLockedSubject"),
      lines: [t("accountGuard.totpLockedBody", { count: TOTP_PER_ACCOUNT.limit }), t("accountGuard.totpLockedAction")],
      cta: { label: t("accountGuard.resetCta"), path: "/login" },
      locale,
    });
  } catch (error) {
    // The lock stands whether or not the mail went; the audit row is the record.
    console.error("[two-factor] lock notice failed", error);
  }
}

/* -------------------------------------------------------------------------- */

function bound(userId: string): string {
  return `${userId}:totp`;
}

type CodeHolder = { totpSecretEnc: string | null; totpRecoveryHashes: string[]; totpLastStep: number | null };

/**
 * A code from the app, accepted once per step (`totpLastStep` moves forward
 * under a conditional update, so the same code shown over somebody's
 * shoulder cannot be used again inside its half-minute); or a recovery code,
 * taken out of the list under the same kind of condition so it is spent
 * exactly once.
 */
async function checkCode(userId: string, code: string, user: CodeHolder): Promise<{ ok: true; recovery: boolean } | { ok: false }> {
  if (!user.totpSecretEnc) return { ok: false };
  if (looksLikeRecoveryCode(code)) {
    const hash = matchRecoveryCode(code, user.totpRecoveryHashes);
    if (!hash) return { ok: false };
    const remaining = user.totpRecoveryHashes.filter((h) => h !== hash);
    const taken = await db.user.updateMany({
      where: { id: userId, totpRecoveryHashes: { has: hash } },
      data: { totpRecoveryHashes: remaining },
    });
    return taken.count === 1 ? { ok: true, recovery: true } : { ok: false };
  }
  const secret = open(user.totpSecretEnc, bound(userId));
  const step = verifyTotp(secret, code);
  if (step === null) return { ok: false };
  const moved = await db.user.updateMany({
    where: { id: userId, OR: [{ totpLastStep: null }, { totpLastStep: { lt: step } }] },
    data: { totpLastStep: step },
  });
  return moved.count === 1 ? { ok: true, recovery: false } : { ok: false };
}
