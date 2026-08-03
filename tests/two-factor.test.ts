import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { hashPassword } from "@/lib/crypto";
import { base32Decode, totp, stepFor } from "@/lib/totp";
import {
  beginEnrolment,
  checkSecondFactor,
  confirmEnrolment,
  disable,
  isEnabled,
  status,
} from "@/lib/two-factor";
import type { ActiveContext } from "@/lib/session";

/**
 * Two-factor, at the persistence layer.
 *
 * `totp.test.ts` proves the arithmetic against the RFC's own vectors. What is
 * left for here is everything the arithmetic cannot decide: that a secret does
 * nothing until a code has confirmed it, that a code works exactly once, and
 * that a recovery code is a single-use credential rather than a permanent one.
 *
 * Those are the properties that make 2FA worth having. An implementation that
 * accepts the same code twice has bought almost nothing over a password.
 */

const db = new PrismaClient();
const PASSWORD = "correct-horse-battery-staple-77";
const EMAIL = "twofactor.unit@example.test";

function ctx(userId: string): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "Two Factor",
      preferredName: null,
      email: EMAIL,
      avatarKey: null,
      isMinor: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

let userId: string;
let session: ActiveContext;

async function freshUser() {
  await db.user.deleteMany({ where: { email: EMAIL } });
  const user = await db.user.create({
    data: { email: EMAIL, name: "Two Factor", prefs: "{}", passwordHash: await hashPassword(PASSWORD) },
  });
  userId = user.id;
  session = ctx(user.id);
}

/** Enrols and returns the secret, so a test can generate live codes. */
async function enrol(): Promise<string> {
  const { secret } = await beginEnrolment(session);
  const code = totp(base32Decode(secret), Date.now());
  await confirmEnrolment(session, code);
  return secret;
}

beforeAll(freshUser);
afterEach(freshUser);

afterAll(async () => {
  await db.user.deleteMany({ where: { email: EMAIL } });
  await db.$disconnect();
});

describe("enrolling", () => {
  it("⚠ a generated secret does NOT switch two-factor on by itself", async () => {
    // Enabling on generation is how somebody locks themselves out with a QR code
    // they never actually scanned.
    await beginEnrolment(session);
    expect(await isEnabled(userId)).toBe(false);

    const stored = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(stored.twoFactorSecret).not.toBeNull();
    expect(stored.twoFactorEnabledAt).toBeNull();
  });

  it("switches on only once a code from that secret is typed", async () => {
    const { secret } = await beginEnrolment(session);
    await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));
    expect(await isEnabled(userId)).toBe(true);
  });

  it("⚠ refuses to confirm with a wrong code, and stays off", async () => {
    await beginEnrolment(session);
    await expect(confirmEnrolment(session, "000000")).rejects.toBeInstanceOf(AccessError);
    expect(await isEnabled(userId)).toBe(false);
  });

  it("refuses to confirm when no enrolment was started", async () => {
    await expect(confirmEnrolment(session, "123456")).rejects.toBeInstanceOf(AccessError);
  });

  it("refuses to start again while it is already on", async () => {
    await enrol();
    await expect(beginEnrolment(session)).rejects.toBeInstanceOf(AccessError);
  });

  it("hands back ten recovery codes, once, and stores only hashes", async () => {
    const { secret } = await beginEnrolment(session);
    const { recoveryCodes } = await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));

    expect(recoveryCodes).toHaveLength(10);
    const stored = await db.recoveryCode.findMany({ where: { userId } });
    expect(stored).toHaveLength(10);
    // ⚠ No stored row may contain a plaintext code.
    for (const code of recoveryCodes) {
      expect(stored.some((row) => row.codeHash === code)).toBe(false);
    }
  });
});

describe("⚠ a code works exactly once", () => {
  it("accepts a valid code", async () => {
    const secret = await enrol();
    // The enrolment already spent the current step, so use the next one.
    const later = Date.now() + 30_000;
    const result = await checkSecondFactor(userId, totp(base32Decode(secret), later));
    expect(result.ok).toBe(true);
  });

  it("⚠ refuses the SAME code a second time", async () => {
    const secret = await enrol();
    const later = Date.now() + 30_000;
    const code = totp(base32Decode(secret), later);

    expect((await checkSecondFactor(userId, code)).ok).toBe(true);
    // Replay. Mathematically still valid for the rest of its window — which is
    // exactly the window somebody reading over a shoulder would use.
    expect((await checkSecondFactor(userId, code)).ok).toBe(false);
  });

  it("⚠ refuses a code from a step already passed", async () => {
    const secret = await enrol();
    const now = Date.now();

    // Steps must stay INSIDE the ±1 drift window to be accepted at all. A code
    // 60s out is two steps away, is refused as too far, and therefore never
    // advances `lastStep` — an earlier version of this test used one and proved
    // nothing. So: accept the next step, then offer the current one back.
    expect((await checkSecondFactor(userId, totp(base32Decode(secret), now + 30_000))).ok).toBe(
      true,
    );

    const stale = totp(base32Decode(secret), now);
    expect((await checkSecondFactor(userId, stale)).ok).toBe(false);
  });

  it("⚠ refuses a code more than one step away in the first place", async () => {
    const secret = await enrol();
    const now = Date.now();
    expect((await checkSecondFactor(userId, totp(base32Decode(secret), now + 90_000))).ok).toBe(
      false,
    );
    expect((await checkSecondFactor(userId, totp(base32Decode(secret), now - 90_000))).ok).toBe(
      false,
    );
  });

  it("records the step it accepted", async () => {
    const secret = await enrol();
    const at = Date.now() + 30_000;
    await checkSecondFactor(userId, totp(base32Decode(secret), at));
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.twoFactorLastStep).toBe(stepFor(at));
  });

  it("refuses nonsense without throwing", async () => {
    await enrol();
    expect((await checkSecondFactor(userId, "000000")).ok).toBe(false);
    expect((await checkSecondFactor(userId, "")).ok).toBe(false);
    expect((await checkSecondFactor(userId, "not-a-code")).ok).toBe(false);
  });

  it("⚠ refuses everything for an account that never enabled it", async () => {
    const result = await checkSecondFactor(userId, "123456");
    expect(result.ok).toBe(false);
  });
});

describe("⚠ recovery codes", () => {
  it("let somebody in when the phone is gone", async () => {
    const { secret } = await beginEnrolment(session);
    const { recoveryCodes } = await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));

    const result = await checkSecondFactor(userId, recoveryCodes[0]!);
    expect(result.ok).toBe(true);
    expect(result.usedRecoveryCode).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("⚠ are single-use — the same one never works twice", async () => {
    const { secret } = await beginEnrolment(session);
    const { recoveryCodes } = await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));

    expect((await checkSecondFactor(userId, recoveryCodes[0]!)).ok).toBe(true);
    expect((await checkSecondFactor(userId, recoveryCodes[0]!)).ok).toBe(false);
    // ...while a different one still works.
    expect((await checkSecondFactor(userId, recoveryCodes[1]!)).ok).toBe(true);
  });

  it("accept whatever case and spacing they were written down in", async () => {
    const { secret } = await beginEnrolment(session);
    const { recoveryCodes } = await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));

    const messy = recoveryCodes[0]!.toLowerCase().replace("-", " ");
    expect((await checkSecondFactor(userId, messy)).ok).toBe(true);
  });

  it("⚠ confirming clears any codes that were already there", async () => {
    // The invariant is "after confirming, the only codes that work are the ones
    // just issued" — regardless of how older ones came to exist. Going through
    // disable() to set that up proves nothing, because disable() clears them
    // itself; a mutant that removed the guard in confirmEnrolment survived the
    // test below for exactly that reason. So the stale row is planted directly.
    const stale = await hashPassword("STALE1STALE1");
    await db.recoveryCode.create({ data: { userId, codeHash: stale } });

    const { secret } = await beginEnrolment(session);
    await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));

    expect(await db.recoveryCode.count({ where: { userId } })).toBe(10);
    expect((await checkSecondFactor(userId, "STALE1STALE1")).ok).toBe(false);
  });

  it("⚠ a re-enrolment invalidates the previous set", async () => {
    const { secret } = await beginEnrolment(session);
    const { recoveryCodes: first } = await confirmEnrolment(
      session,
      totp(base32Decode(secret), Date.now()),
    );

    await disable(session, PASSWORD);
    const { secret: second } = await beginEnrolment(session);
    await confirmEnrolment(session, totp(base32Decode(second), Date.now()));

    // A leaked old set must not still open the account.
    expect((await checkSecondFactor(userId, first[0]!)).ok).toBe(false);
  });
});

describe("turning it off", () => {
  it("⚠ requires the password, not a code", async () => {
    await enrol();
    await expect(disable(session, "wrong-password")).rejects.toBeInstanceOf(AccessError);
    expect(await isEnabled(userId)).toBe(true);
  });

  it("clears the secret and every recovery code", async () => {
    await enrol();
    await disable(session, PASSWORD);

    expect(await isEnabled(userId)).toBe(false);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.twoFactorSecret).toBeNull();
    expect(user.twoFactorLastStep).toBeNull();
    expect(await db.recoveryCode.count({ where: { userId } })).toBe(0);
  });

  it("is harmless when it was never on", async () => {
    await expect(disable(session, PASSWORD)).resolves.toBeUndefined();
  });
});

describe("what the account page is told", () => {
  it("reports off, with no codes, before enrolment", async () => {
    const state = await status(session);
    expect(state.enabled).toBe(false);
    expect(state.remainingRecoveryCodes).toBe(0);
    expect(state.hasPassword).toBe(true);
  });

  it("reports on, with a count that falls as codes are spent", async () => {
    const { secret } = await beginEnrolment(session);
    const { recoveryCodes } = await confirmEnrolment(session, totp(base32Decode(secret), Date.now()));

    expect((await status(session)).remainingRecoveryCodes).toBe(10);
    await checkSecondFactor(userId, recoveryCodes[0]!);
    expect((await status(session)).remainingRecoveryCodes).toBe(9);
    expect((await status(session)).enabled).toBe(true);
  });
});
