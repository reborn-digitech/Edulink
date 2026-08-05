import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  findAccount,
  requestPasswordReset,
  resetPassword,
  MAX_RESET_ATTEMPTS,
  RESET_TTL_MINUTES,
} from "@/lib/passwords";
import { hashPassword, verifyPassword } from "@/lib/crypto";

/**
 * Signing in with what you have, and getting back in when you forget.
 *
 * THREE PROPERTIES ARE WORTH THE TROUBLE HERE, and everything below serves one
 * of them:
 *
 *   THE CODE IS NOT GUESSABLE IN PRACTICE. Six digits is a million, which is not
 *   a big number — so the token is spent after five wrong answers and after ten
 *   minutes, and it is hashed with the user id so a code cannot be tried against
 *   an account it was not issued for.
 *
 *   NOTHING SAYS WHETHER AN ACCOUNT EXISTS. A form that answers that question
 *   is a list of which families are registered, and this one holds children's
 *   records. Requesting and resetting both return the same shape whatever the
 *   truth is.
 *
 *   A RESET LOCKS EVERYBODY OUT, including whoever prompted it. Somebody resets
 *   a password because they think another person has it; leaving that person's
 *   session alive makes the whole exercise pointless.
 *
 * The codes are read out of the dev mailbox, which is exactly how a developer
 * reads them — so these tests exercise the real send path rather than a stub.
 */

const db = new PrismaClient();

const SUFFIX = "@zzpassword.test";
const PASSWORD = "correct horse battery";
const PHONE = "+919876500001";

let userId: string;

/**
 * EVERY user this file makes, remembered by id.
 *
 * Cleaning up by `email endsWith SUFFIX` missed the handle accounts entirely —
 * `amara.k4f9@edulink.local` matches no suffix filter and carries no phone, so
 * it survived every run and collided on the unique email the second time. The
 * rule this repo learned the hard way is make your own fixtures and remove
 * exactly those; a filter that describes them is a filter that can be wrong.
 */
const made: string[] = [];

async function makeUser(
  over: { email?: string | null; phone?: string | null; password?: string | null; disabled?: boolean } = {},
): Promise<string> {
  const user = await db.user.create({
    data: {
      email: over.email === null ? null : (over.email ?? `rhea${SUFFIX}`),
      phone: over.phone === null ? null : (over.phone ?? PHONE),
      name: "Rhea",
      prefs: "{}",
      passwordHash: over.password === null ? null : await hashPassword(over.password ?? PASSWORD),
      disabledAt: over.disabled ? new Date() : null,
    },
  });
  made.push(user.id);
  return user.id;
}

/** The code, as a developer would read it: out of the mailbox it was sent to. */
async function lastCode(): Promise<string | null> {
  const message = await db.outboundEmail.findFirst({
    where: { purpose: "PASSWORD_RESET" },
    orderBy: { createdAt: "desc" },
    select: { text: true },
  });
  if (!message) return null;
  return /\b(\d{6})\b/.exec(message.text)?.[1] ?? null;
}

beforeEach(async () => {
  userId = await makeUser();
});

afterEach(async () => {
  await db.outboundEmail.deleteMany({ where: { purpose: "PASSWORD_RESET" } });
  await db.authToken.deleteMany({ where: { userId: { in: made } } });
  await db.session.deleteMany({ where: { userId: { in: made } } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  made.length = 0;
});

afterAll(async () => {
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("finding the one account an identifier names", () => {
  it("finds it by email, by mobile number, and by either spelling of the number", async () => {
    expect((await findAccount(`rhea${SUFFIX}`))?.userId).toBe(userId);
    expect((await findAccount("+919876500001"))?.userId).toBe(userId);
    expect((await findAccount("09876500001"))?.userId).toBe(userId);
    expect((await findAccount("98765 00001"))?.userId).toBe(userId);
    expect((await findAccount("  9876500001  "))?.userId).toBe(userId);
  });

  it("⚠ finds a pupil by the bare handle their school gave them", async () => {
    // They have no address at all — `amara.k4f9` is stored as
    // `amara.k4f9@edulink.local`, and typing the bare handle has to work or a
    // child is locked out of the account they made ninety seconds ago.
    const handleId = await makeUser({ email: "amara.k4f9@edulink.local", phone: null });
    expect((await findAccount("amara.k4f9"))?.userId).toBe(handleId);
    expect((await findAccount("AMARA.K4F9"))?.userId).toBe(handleId);
  });

  it("finds nothing for an identifier nobody has", async () => {
    expect(await findAccount("nobody@nowhere.test")).toBeNull();
    expect(await findAccount("+919999999999")).toBeNull();
    expect(await findAccount("")).toBeNull();
    expect(await findAccount("   ")).toBeNull();
  });

  it("reports a disabled account as found but disabled, rather than as missing", async () => {
    const goneId = await makeUser({ email: `gone${SUFFIX}`, phone: "+919876500002", disabled: true });
    const found = await findAccount(`gone${SUFFIX}`);
    expect(found?.userId).toBe(goneId);
    expect(found?.disabled).toBe(true);
  });
});

describe("asking for a code", () => {
  it("sends one, and it is six digits", async () => {
    const result = await requestPasswordReset(`rhea${SUFFIX}`);
    expect(result).toMatchObject({ ok: true, channel: "EMAIL" });
    expect(await lastCode()).toMatch(/^\d{6}$/);
  });

  it("texts one when the identifier is a number, and says which four digits", async () => {
    const result = await requestPasswordReset("98765 00001");
    expect(result).toMatchObject({ ok: true, channel: "PHONE", hint: "0001" });
    expect(await lastCode()).toMatch(/^\d{6}$/);
  });

  it("⚠ the hint is the last four of what the CALLER typed, not of what we hold", async () => {
    // Somebody typing a number that is not on any account still gets their own
    // digits back. Echoing OUR number would be telling them one they did not
    // know — which is the disclosure this whole design avoids.
    const result = await requestPasswordReset("+919999912345");
    expect(result.hint).toBe("2345");
    expect(await lastCode()).toBeNull();
  });

  it("⚠ says exactly the same thing for an account that does not exist", async () => {
    const real = await requestPasswordReset(`rhea${SUFFIX}`);
    await db.outboundEmail.deleteMany({ where: { purpose: "PASSWORD_RESET" } });
    const fake = await requestPasswordReset(`nobody${SUFFIX}`);

    // Same shape, same fields. A caller cannot tell the two apart, which is
    // the point — the form is not a list of which families are registered.
    expect(fake).toEqual({ ...real, hint: fake.hint });
    expect(await lastCode()).toBeNull();
  });

  it("⚠ sends nothing to a disabled account, and says the same thing anyway", async () => {
    await makeUser({ email: `gone${SUFFIX}`, phone: "+919876500002", disabled: true });
    const result = await requestPasswordReset(`gone${SUFFIX}`);
    expect(result.ok).toBe(true);
    expect(await lastCode()).toBeNull();
  });

  it("⚠ sends nothing when the account has no address on the channel that was used", async () => {
    // A pupil with a handle and no mobile number, asked for by their handle:
    // there is nowhere to send. Silent, because saying so confirms the account.
    await makeUser({ email: "noreach.k1@edulink.local", phone: null });
    const result = await requestPasswordReset("noreach.k1");
    expect(result.ok).toBe(true);
    expect(await lastCode()).toBeNull();
  });

  it("⚠ a second request kills the first code", async () => {
    await requestPasswordReset(`rhea${SUFFIX}`);
    const first = (await lastCode())!;
    await requestPasswordReset(`rhea${SUFFIX}`);
    const second = (await lastCode())!;
    expect(second).not.toBe(first);

    // Two live codes double the guessing surface for no benefit, and somebody
    // who asked twice will use the second message.
    expect((await resetPassword(`rhea${SUFFIX}`, first, "a new long password")).ok).toBe(false);
    expect((await resetPassword(`rhea${SUFFIX}`, second, "a new long password")).ok).toBe(true);
  });
});

describe("using the code", () => {
  async function requestAndRead(identifier = `rhea${SUFFIX}`): Promise<string> {
    await requestPasswordReset(identifier);
    return (await lastCode())!;
  }

  it("sets the new password and it actually works", async () => {
    const code = await requestAndRead();
    expect((await resetPassword(`rhea${SUFFIX}`, code, "a brand new password")).ok).toBe(true);

    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await verifyPassword(user.passwordHash!, "a brand new password")).toBe(true);
    expect(await verifyPassword(user.passwordHash!, PASSWORD)).toBe(false);
  });

  it("works by mobile number as well as by email", async () => {
    await requestPasswordReset("9876500001");
    const code = (await lastCode())!;
    expect((await resetPassword("098765 00001", code, "another long password")).ok).toBe(true);
  });

  it("⚠ gives one account a password it never had", async () => {
    // A pupil who joined with a class code has `passwordHash` null. Reset is
    // how they get one, so refusing on "no existing password" would lock out
    // exactly the people least able to ask for help.
    const noPassword = await makeUser({
      email: `nopass${SUFFIX}`,
      phone: "+919876500003",
      password: null,
    });
    await requestPasswordReset(`nopass${SUFFIX}`);
    const code = (await lastCode())!;
    expect((await resetPassword(`nopass${SUFFIX}`, code, "their first password")).ok).toBe(true);

    const user = await db.user.findUniqueOrThrow({ where: { id: noPassword } });
    expect(await verifyPassword(user.passwordHash!, "their first password")).toBe(true);
  });

  it("⚠ revokes every session, which is the point of resetting", async () => {
    const other = await db.session.create({
      data: {
        userId,
        tokenHash: `zz-session-${Math.random()}`,
        expiresAt: new Date(Date.now() + 86_400_000),
      },
    });

    const code = await requestAndRead();
    await resetPassword(`rhea${SUFFIX}`, code, "a brand new password");

    const after = await db.session.findUniqueOrThrow({ where: { id: other.id } });
    expect(after.revokedAt, "the session somebody else may be holding").not.toBeNull();
  });

  it("⚠ spends the code, so it cannot be used twice", async () => {
    const code = await requestAndRead();
    expect((await resetPassword(`rhea${SUFFIX}`, code, "a brand new password")).ok).toBe(true);
    expect((await resetPassword(`rhea${SUFFIX}`, code, "a third password here")).ok).toBe(false);
  });

  it("⚠ gives up after five wrong answers, even if the sixth is right", async () => {
    const code = await requestAndRead();
    for (let attempt = 0; attempt < MAX_RESET_ATTEMPTS; attempt++) {
      const wrong = String((Number(code) + attempt + 1) % 1_000_000).padStart(6, "0");
      expect((await resetPassword(`rhea${SUFFIX}`, wrong, "a brand new password")).ok).toBe(false);
    }
    // Six digits is a million, which is not a large number. The attempt cap is
    // what makes it defensible.
    expect((await resetPassword(`rhea${SUFFIX}`, code, "a brand new password")).ok).toBe(false);
  });

  it("⚠ refuses an expired code", async () => {
    const code = await requestAndRead();
    await db.authToken.updateMany({
      where: { userId, purpose: "PASSWORD_RESET", consumedAt: null },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect((await resetPassword(`rhea${SUFFIX}`, code, "a brand new password")).ok).toBe(false);
    expect(RESET_TTL_MINUTES).toBeLessThanOrEqual(15);
  });

  it("⚠ a code issued for one account cannot be used on another", async () => {
    /**
     * THE REASON THE HASH IS SALTED WITH THE USER ID. Two people can hold the
     * same six digits at the same moment; without the id, one of the two writes
     * would collide on the unique index — and worse, a bare code would be
     * findable without knowing whose it was.
     */
    const otherId = await makeUser({ email: `other${SUFFIX}`, phone: "+919876500004" });
    await requestPasswordReset(`rhea${SUFFIX}`);
    const rheasCode = (await lastCode())!;

    expect((await resetPassword(`other${SUFFIX}`, rheasCode, "a brand new password")).ok).toBe(false);

    const other = await db.user.findUniqueOrThrow({ where: { id: otherId } });
    expect(await verifyPassword(other.passwordHash!, PASSWORD)).toBe(true);
  });

  it("⚠ a weak password does not spend the code", async () => {
    // Somebody who has proved they hold the phone should not have to ask for a
    // second message because they typed a short password first.
    const code = await requestAndRead();
    const weak = await resetPassword(`rhea${SUFFIX}`, code, "short");
    expect(weak.ok).toBe(false);
    expect(weak.error).not.toMatch(/expired/i);

    expect((await resetPassword(`rhea${SUFFIX}`, code, "a long enough password")).ok).toBe(true);
  });

  it("⚠ every failure reads the same, so nothing can be learned from trying", async () => {
    const code = await requestAndRead();
    const messages = new Set(
      [
        await resetPassword(`nobody${SUFFIX}`, code, "a brand new password"),
        await resetPassword(`rhea${SUFFIX}`, "000000", "a brand new password"),
        await resetPassword(`rhea${SUFFIX}`, "", "a brand new password"),
      ].map((r) => r.error),
    );
    expect(messages.size, "no account, wrong code and empty code must be indistinguishable").toBe(1);
  });

  it("refuses a disabled account holding a valid code", async () => {
    const code = await requestAndRead();
    await db.user.update({ where: { id: userId }, data: { disabledAt: new Date() } });
    expect((await resetPassword(`rhea${SUFFIX}`, code, "a brand new password")).ok).toBe(false);
  });
});
