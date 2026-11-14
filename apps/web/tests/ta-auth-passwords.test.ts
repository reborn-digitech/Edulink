/**
 * The password rule and the sign-in's walls (testing analysis of 13 November 2026, auth batch).
 *
 * TA-288 (Low, Security): the common-password rule could never refuse a password — its list held eight- and
 * nine-character words and the length rule refuses those first, so "password123" and "1234567890" passed. The
 * list is now one module of ten-plus passwords and padded stems, shared by the server's gate and the meter.
 *
 * TA-528 (Low, Security): the sign-in's per-address and whole-service walls were peeked before the password check
 * and charged after a failure, so a burst of requests for different logins all read the same count and every
 * password was checked. They are now counted first and given back on a right password.
 *
 * The burst uses identifiers that name nobody and one stamped address; its buckets are removed afterwards.
 */
import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { passwordProblems } from "@/lib/crypto";
import { passwordStrength } from "@/lib/password-strength";
import { COMMON_PASSWORDS } from "@/lib/common-passwords";
import { signInWithPassword } from "@/lib/auth-login";
import { LOGIN_PER_ADDRESS } from "@/lib/rate-limit";

const db = new PrismaClient();
const STAMP = Date.now();
// A documentation-range address (2001:db8::/32) under the prefix tests/setup.ts leaves alone, so a second vitest
// process's set-up cannot wipe this suite's per-address bucket while it is counting.
const CALLER = `2001:db8:7a:79:${Math.floor(STAMP / 65536).toString(16).slice(-4)}:${(STAMP % 65536).toString(16)}::1`;
const BURST = LOGIN_PER_ADDRESS.limit + 20;

afterAll(async () => {
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: `login-addr:${CALLER}` }, { bucket: { startsWith: "login:zz-taauth-burst-", endsWith: `-${STAMP}@test.invalid` } }] } });
  await db.$disconnect();
});

describe("TA-288: the common-password rule refuses common passwords of ten characters and more", () => {
  it("TA-288: password123, 1234567890, qwertyuiop and Password@2024 are refused as too common, by the gate and the meter", () => {
    for (const password of ["password123", "1234567890", "qwertyuiop", "Password@2024", "qwerty123456", "Welcome12345"]) {
      expect(passwordProblems(password), password).toContain("refusal.pwTooCommon");
      expect(passwordStrength(password).problemKeys, password).toContain("refusal.pwTooCommon");
    }
  });

  it("TA-288: every whole entry is at least ten characters, so each can refuse something the length rule lets through", () => {
    for (const entry of COMMON_PASSWORDS) expect(entry.length, entry).toBeGreaterThanOrEqual(10);
  });

  it("TA-288: an ordinary long password is not called common", () => {
    for (const password of ["Sunflower-2031", "correct-horse-battery-staple-42", "Zz-taauth-Heron-2026", "पासवर्ड-नया-2026"]) {
      expect(passwordProblems(password), password).not.toContain("refusal.pwTooCommon");
    }
  });
});

describe("TA-528: a burst from one address meets the per-address wall at its allowance", () => {
  it(`TA-528: ${BURST} wrong sign-ins at once from one address check at most ${LOGIN_PER_ADDRESS.limit} and refuse the rest`, { timeout: 120_000 }, async () => {
    await db.rateLimit.deleteMany({ where: { bucket: `login-addr:${CALLER}` } });
    const answers = await Promise.all(
      Array.from({ length: BURST }, (_, i) => signInWithPassword(`zz-taauth-burst-${i}-${STAMP}@test.invalid`, "Not-the-password-2026", { caller: CALLER })),
    );
    const checked = answers.filter((a) => !a.ok && a.reason === "noMatch").length;
    const refused = answers.filter((a) => !a.ok && a.reason === "rate").length;
    expect(checked).toBeLessThanOrEqual(LOGIN_PER_ADDRESS.limit);
    expect(refused).toBeGreaterThanOrEqual(BURST - LOGIN_PER_ADDRESS.limit);
  });
});
