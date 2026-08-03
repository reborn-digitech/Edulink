import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Time-based one-time passwords, RFC 6238.
 *
 * WRITTEN OUT RATHER THAN INSTALLED, and the reason is the same one that keeps
 * `eval` out of the quiz verifier: this is forty lines of arithmetic that sits
 * directly on the login path, and a dependency there is a supply-chain surface
 * on the thing guarding every account. It is also one of the very few pieces of
 * security code that can be proven correct rather than argued about — RFC 6238
 * publishes test vectors, and `totp.test.ts` runs them. A green suite here means
 * this agrees with the spec every authenticator app implements, not that it
 * agrees with itself.
 *
 * SHA-1 IS THE RIGHT CHOICE HERE and looks like the wrong one. It is what every
 * authenticator app defaults to — Google Authenticator, Authy, 1Password — and
 * an algorithm nothing can scan is worth less than a "weaker" one everything
 * can. The construction is HMAC, where SHA-1's collision weaknesses do not
 * apply, and the secret never leaves the server.
 */

const STEP_SECONDS = 30;
const DIGITS = 6;

/* -------------------------------------------------------------------------- */
/* base32, because that is what a QR code carries                              */
/* -------------------------------------------------------------------------- */

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += ALPHABET[(value << (5 - bits)) & 31];
  // No "=" padding. It is optional in RFC 4648, and several authenticator apps
  // reject a padded secret outright.
  return output;
}

/**
 * Decodes base32, tolerantly.
 *
 * People retype these by hand off a screen, so spaces, lower case and the
 * padding some apps add are all accepted. Anything genuinely not in the alphabet
 * throws rather than being skipped — silently dropping an unrecognised character
 * turns a typo into a different, valid-looking secret that will never match.
 */
export function base32Decode(input: string): Buffer {
  const clean = input.replace(/[\s=]/g, "").toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`"${char}" is not valid base32`);
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/* -------------------------------------------------------------------------- */
/* The algorithm                                                               */
/* -------------------------------------------------------------------------- */

/** RFC 4226 HOTP: an HMAC, dynamically truncated to `digits` decimal digits. */
export function hotp(secret: Buffer, counter: number, digits = DIGITS): string {
  const message = Buffer.alloc(8);
  // A 64-bit counter written big-endian. Split in two because bitwise operators
  // in JS are 32-bit, and a counter past 2^31 would otherwise wrap to negative.
  message.writeUInt32BE(Math.floor(counter / 2 ** 32), 0);
  message.writeUInt32BE(counter >>> 0, 4);

  const digest = createHmac("sha1", secret).update(message).digest();
  const offset = digest[digest.length - 1]! & 0x0f;
  const binary =
    ((digest[offset]! & 0x7f) << 24) |
    ((digest[offset + 1]! & 0xff) << 16) |
    ((digest[offset + 2]! & 0xff) << 8) |
    (digest[offset + 3]! & 0xff);

  return (binary % 10 ** digits).toString().padStart(digits, "0");
}

/** Which 30-second step a given instant falls in. */
export function stepFor(atMs: number): number {
  return Math.floor(atMs / 1000 / STEP_SECONDS);
}

export function totp(secret: Buffer, atMs: number, digits = DIGITS): string {
  return hotp(secret, stepFor(atMs), digits);
}

/**
 * Checks a code, and says WHICH step matched.
 *
 * The step is returned rather than a bare boolean so the caller can refuse to
 * accept the same one twice. Without that, a code shouted across a room — or
 * read off a shoulder — stays usable for the rest of its 30 seconds, which is
 * the whole window an attacker needs.
 *
 * ONE STEP OF DRIFT EITHER WAY. Phone clocks are usually seconds out, not
 * minutes, and each extra step of tolerance multiplies the number of codes valid
 * at any moment. Three is the standard trade and is what this uses.
 *
 * Compared with `timingSafeEqual`, because a byte-at-a-time comparison leaks how
 * much of a guess was right.
 */
export function verifyTotp(
  secret: Buffer,
  code: string,
  atMs: number,
  opts: { window?: number; digits?: number } = {},
): { ok: boolean; step: number | null } {
  const window = opts.window ?? 1;
  const digits = opts.digits ?? DIGITS;

  const cleaned = code.replace(/\s/g, "");
  if (!new RegExp(`^\\d{${digits}}$`).test(cleaned)) return { ok: false, step: null };

  const current = stepFor(atMs);
  const supplied = Buffer.from(cleaned);

  for (let drift = -window; drift <= window; drift++) {
    const step = current + drift;
    if (step < 0) continue;
    const expected = Buffer.from(hotp(secret, step, digits));
    if (expected.length === supplied.length && timingSafeEqual(expected, supplied)) {
      return { ok: true, step };
    }
  }
  return { ok: false, step: null };
}

/* -------------------------------------------------------------------------- */
/* Enrolment                                                                   */
/* -------------------------------------------------------------------------- */

/** A fresh 160-bit secret, the size RFC 4226 recommends for SHA-1. */
export function generateSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * The `otpauth://` URI an authenticator app scans.
 *
 * The label carries the account so somebody with several entries can tell them
 * apart, and both parts are percent-encoded — an issuer or an email containing
 * a colon would otherwise split the label and produce an entry naming the wrong
 * account.
 */
export function provisioningUri(opts: {
  secret: string;
  account: string;
  issuer: string;
}): string {
  const label = `${encodeURIComponent(opts.issuer)}:${encodeURIComponent(opts.account)}`;
  const params = new URLSearchParams({
    secret: opts.secret,
    issuer: opts.issuer,
    algorithm: "SHA1",
    digits: String(DIGITS),
    period: String(STEP_SECONDS),
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/**
 * Recovery codes, for the phone that fell in a river.
 *
 * WITHOUT THESE, TURNING ON 2FA IS A WAY TO LOSE AN ACCOUNT. A teacher who
 * changes phone mid-term and a parent who reinstalls an app are both ordinary,
 * and the alternative to a recovery code is an administrator with the power to
 * switch somebody else's 2FA off — which is a much larger hole than the one 2FA
 * closes.
 *
 * Formatted in two groups so they can be read aloud and written down without
 * losing your place. Ambiguous characters are excluded from the alphabet: these
 * get copied by hand, and 0/O and 1/l are the difference between locked out and
 * not.
 */
const RECOVERY_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRecoveryCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(10);
    let code = "";
    for (const byte of bytes) code += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
    codes.push(`${code.slice(0, 5)}-${code.slice(5)}`);
  }
  return codes;
}

/** Normalised before hashing or comparing, so case and dashes never matter. */
export function normaliseRecoveryCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}
