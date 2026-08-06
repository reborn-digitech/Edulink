import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Password hashing and token handling.
 *
 * Passwords: argon2id. Parameters follow OWASP's 2024 minimum for argon2id
 * (19 MiB memory, 2 iterations, parallelism 1). Cost is deliberately felt at
 * login — this is the only thing standing between a stolen database dump and a
 * classroom's worth of children's accounts.
 *
 * Tokens (sessions, magic links, invites): a random 32-byte value is handed to
 * the user; only its SHA-256 is stored. SHA-256 rather than argon2 is correct
 * here — the token already has 256 bits of entropy, so there is nothing to
 * brute-force and the lookup must stay indexable.
 */

const ARGON_OPTS = {
  memoryCost: 19_456, // KiB
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return argonHash(plain, ARGON_OPTS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argonVerify(hash, plain);
  } catch {
    // Malformed/legacy hash. Fail closed rather than throwing a 500 that tells
    // an attacker this account exists but is stored oddly.
    return false;
  }
}

/**
 * Constant-ish work even when the account does not exist, so response timing
 * does not reveal which emails are registered. The digest is a real argon2
 * hash of a fixed string, generated once at module load.
 */
let dummyHashPromise: Promise<string> | null = null;
export async function fakePasswordWork(): Promise<void> {
  dummyHashPromise ??= argonHash("edulink-nonexistent-account-probe", ARGON_OPTS);
  await argonVerify(await dummyHashPromise, "wrong-password").catch(() => false);
}

/* -------------------------------------------------------------------------- */
/* Opaque tokens                                                               */
/* -------------------------------------------------------------------------- */

/** 32 random bytes, base64url. This is the only copy the user ever sees. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** What we store. Never store the raw token. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Timing-safe comparison for any secret compared outside the database. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/* -------------------------------------------------------------------------- */
/* Password policy                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately length-first rather than a symbol-class checklist: NIST 800-63B
 * dropped composition rules because they push users to "Passw0rd!". Children
 * setting their own password get the same floor but friendlier copy upstream.
 */
const COMMON = new Set([
  "password", "12345678", "123456789", "qwertyui", "letmein1", "iloveyou",
  "football", "baseball", "sunshine", "princess", "welcome1", "abc12345",
  "password1", "monkey12", "trustno1", "dragon12", "school12", "teacher1",
]);

/** ⚠ KEYS, not sentences — the caller translates them for whoever typed. */
export function passwordProblems(password: string, context: string[] = []): TranslationKey[] {
  const problems: TranslationKey[] = [];
  if (password.length < 10) problems.push("refusal.pwAtLeast10");
  if (password.length > 200) problems.push("refusal.pwTooLong");
  if (/^\s|\s$/.test(password)) problems.push("refusal.pwTrimSpace");
  if (COMMON.has(password.toLowerCase())) {
    problems.push("refusal.pwTooCommon");
  }
  if (/^(.)\1+$/.test(password)) problems.push("refusal.pwRepeats");
  const lower = password.toLowerCase();
  for (const term of context) {
    const t = term.trim().toLowerCase();
    if (t.length >= 4 && lower.includes(t)) {
      problems.push("refusal.pwContainsName");
      break;
    }
  }
  return problems;
}
