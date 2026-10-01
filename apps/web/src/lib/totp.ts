import { createHmac, createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Time-based one-time passwords (RFC 6238 over RFC 4226), with node:crypto
 * and nothing else.
 *
 * SHA-1, six digits, thirty-second steps, which is what every authenticator
 * app assumes when the otpauth URI says nothing else — and the URI here says
 * it anyway. A code is accepted for the step it was made in and the step on
 * either side, so a phone whose clock is half a minute out still signs in;
 * the step that was accepted is handed back so the caller can refuse the
 * same code a second time inside its window.
 *
 * Pure functions on purpose: the database, the sealing and the audit rows
 * live in two-factor.ts, so this file is held to the RFC's own test vectors
 * and nothing else.
 */

export const TOTP_STEP_SECONDS = 30;
export const TOTP_DIGITS = 6;
/** How many steps either side of now a code is accepted for. */
export const TOTP_WINDOW = 1;

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/** RFC 4648 base32, no padding — what the URI carries and what the person types if they cannot scan. */
export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

export function base32Decode(text: string): Uint8Array {
  const clean = text.toUpperCase().replace(/[^A-Z2-7]/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of clean) {
    value = (value << 5) | BASE32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Uint8Array.from(out);
}

/** A fresh 160-bit secret, as RFC 4226 recommends for HMAC-SHA-1, in base32. */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/** RFC 4226: the HMAC's dynamic truncation, as `digits` decimal digits. */
export function hotp(secret: Uint8Array, counter: number, digits = TOTP_DIGITS): string {
  const message = Buffer.alloc(8);
  // A 64-bit big-endian counter; the step count fits comfortably in 53 bits.
  message.writeUInt32BE(Math.floor(counter / 0x1_0000_0000), 0);
  message.writeUInt32BE(counter >>> 0, 4);
  const mac = createHmac("sha1", Buffer.from(secret)).update(message).digest();
  const offset = mac[mac.length - 1]! & 0x0f;
  const binary = ((mac[offset]! & 0x7f) << 24) | (mac[offset + 1]! << 16) | (mac[offset + 2]! << 8) | mac[offset + 3]!;
  return String(binary % 10 ** digits).padStart(digits, "0");
}

/** The step the clock is in: seconds since the epoch, divided by thirty. */
export function stepOf(nowMs: number, stepSeconds = TOTP_STEP_SECONDS): number {
  return Math.floor(nowMs / 1000 / stepSeconds);
}

/** The code an authenticator shows at `nowMs` for a base32 secret. */
export function totpCode(secretBase32: string, nowMs = Date.now(), stepSeconds = TOTP_STEP_SECONDS, digits = TOTP_DIGITS): string {
  return hotp(base32Decode(secretBase32), stepOf(nowMs, stepSeconds), digits);
}

/**
 * Whether `code` is right for the secret at `nowMs`, within ±TOTP_WINDOW
 * steps. Returns the step it matched, or null. Every candidate is compared
 * in constant time and every one is compared, so the answer's timing says
 * nothing about which step, if any, was close.
 */
export function verifyTotp(secretBase32: string, code: string, nowMs = Date.now(), window = TOTP_WINDOW): number | null {
  const typed = code.replace(/\s+/g, "");
  if (!/^\d{6}$/.test(typed)) return null;
  const secret = base32Decode(secretBase32);
  const centre = stepOf(nowMs);
  let matched: number | null = null;
  for (let delta = -window; delta <= window; delta++) {
    const step = centre + delta;
    if (step < 0) continue;
    if (codesEqual(hotp(secret, step), typed)) matched ??= step;
  }
  return matched;
}

function codesEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * The otpauth:// URI an authenticator app scans (the Key Uri Format Google
 * Authenticator documented and every app since has read). The label is
 * issuer:account so the app's list says whose code it is; the issuer is
 * repeated as a parameter because some apps read only one of the two.
 */
export function otpauthUri(issuer: string, account: string, secretBase32: string): string {
  const label = `${encodeURIComponent(issuer)}:${encodeURIComponent(account)}`;
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: "SHA1",
    digits: String(TOTP_DIGITS),
    period: String(TOTP_STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/* -------------------------------------------------------------------------- */
/* Recovery codes                                                              */
/* -------------------------------------------------------------------------- */

export const RECOVERY_CODE_COUNT = 8;
/** No 0/O or 1/I: a code is read off paper and typed on a phone. */
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Eight codes like `K7PM-3XQ2`, each used once, shown once. */
export function generateRecoveryCodes(count = RECOVERY_CODE_COUNT): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(8);
    let code = "";
    for (let j = 0; j < 8; j++) {
      if (j === 4) code += "-";
      code += RECOVERY_ALPHABET[bytes[j]! % RECOVERY_ALPHABET.length];
    }
    codes.push(code);
  }
  return codes;
}

/** Spaces, hyphens and case are the person's; what is hashed is the letters. */
export function normaliseRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(normaliseRecoveryCode(code)).digest("hex");
}

/** Whether a typed recovery code is one of the stored hashes; the matching hash, or null. */
export function matchRecoveryCode(code: string, hashes: string[]): string | null {
  const typed = Buffer.from(hashRecoveryCode(code), "utf8");
  let found: string | null = null;
  for (const hash of hashes) {
    const stored = Buffer.from(hash, "utf8");
    if (stored.length === typed.length && timingSafeEqual(stored, typed)) found ??= hash;
  }
  return found;
}

/** A recovery code is two groups of four letters and digits; a TOTP code is six digits. */
export function looksLikeRecoveryCode(code: string): boolean {
  return normaliseRecoveryCode(code).length === 8 && !/^\d{6}$/.test(code.replace(/\s+/g, ""));
}
