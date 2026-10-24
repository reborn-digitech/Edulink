import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";
import { claimToken } from "@/lib/auth-tokens";
import { verifyEmailByToken, resendVerification } from "@/lib/passwords";
import { generateToken, hashToken } from "@/lib/crypto";
import { EMAIL_VERIFY_TTL_HOURS } from "@/lib/constants";
import { HANDLE_DOMAIN } from "@/lib/login-name";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

// The verify page is called as a function below (QA-13); its JSX needs React in scope.
(globalThis as { React?: typeof React }).React = React;

/**
 * The two links that had nowhere to land.
 *
 * ⚠ REGISTRATION HAS ALWAYS EMAILED `${APP_URL}/verify?token=…` AND THE LOGIN
 * PAGE `${APP_URL}/magic?token=…`, and neither route existed. Every school
 * admin's welcome email led to a 404, and the magic-link login — offered three
 * clicks from the front door and listed in the README as verified working —
 * signed nobody in.
 *
 * The property these tests exist for is that a token is spent ONCE, atomically,
 * and that a verification link cannot bless an address the account has since
 * moved away from.
 */

const db = new PrismaClient();

const SUFFIX = "@zzverify.test";
const made: string[] = [];
const addressesUsed = new Set<string>();

function address(label: string): string {
  const value = `${label}.${randomBytes(4).toString("hex")}${SUFFIX}`;
  addressesUsed.add(value);
  return value;
}

async function makeUser(email: string): Promise<string> {
  addressesUsed.add(email);
  const user = await db.user.create({ data: { email, name: "Verify Person", prefs: "{}" } });
  made.push(user.id);
  return user.id;
}

/** A verification token exactly as `register/actions.ts` mints one. */
async function mintVerify(
  userId: string,
  email: string,
  opts: { expired?: boolean } = {},
): Promise<string> {
  const token = generateToken();
  await db.authToken.create({
    data: {
      userId,
      email,
      purpose: "EMAIL_VERIFY",
      tokenHash: hashToken(token),
      expiresAt: opts.expired
        ? new Date(Date.now() - 1_000)
        : new Date(Date.now() + EMAIL_VERIFY_TTL_HOURS * 3_600_000),
    },
  });
  return token;
}

async function mintMagic(userId: string, email: string): Promise<string> {
  const token = generateToken();
  await db.authToken.create({
    data: {
      userId,
      email,
      purpose: "MAGIC_LINK",
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 20 * 60_000),
    },
  });
  return token;
}

let userId: string;
let email: string;

beforeEach(async () => {
  email = address("admin");
  userId = await makeUser(email);
});

afterEach(async () => {
  await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "verify-resend:" } } });
  await db.authToken.deleteMany({ where: { userId: { in: made } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: made } } });
  await db.outboundEmail.deleteMany({ where: { to: { in: [...addressesUsed] } } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  made.length = 0;
  addressesUsed.clear();
});

afterAll(async () => {
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("claimToken", () => {
  it("spends a live token once and reports who it was for", async () => {
    const token = await mintVerify(userId, email);
    const first = await claimToken(token, "EMAIL_VERIFY");

    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.userId).toBe(userId);
      expect(first.email).toBe(email);
    }
  });

  it("⚠ a second claim of the same link is refused, not honoured twice", async () => {
    /**
     * The property the conditional UPDATE buys. A mail client that prefetches
     * the link and the person who then clicks it are the ORDINARY case, not an
     * attack — and for a magic link, two successes is two sessions from one
     * email.
     */
    const token = await mintMagic(userId, email);
    const first = await claimToken(token, "MAGIC_LINK");
    const second = await claimToken(token, "MAGIC_LINK");

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe("USED");
  });

  it("⚠ racing claims produce exactly one winner", async () => {
    // Read-then-write would let both reads see a live row. This is the version
    // of the test that would catch that regression.
    const token = await mintMagic(userId, email);
    const results = await Promise.all([
      claimToken(token, "MAGIC_LINK"),
      claimToken(token, "MAGIC_LINK"),
      claimToken(token, "MAGIC_LINK"),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
  });

  it("refuses an expired token without consuming it", async () => {
    const token = await mintVerify(userId, email, { expired: true });
    const claim = await claimToken(token, "EMAIL_VERIFY");

    expect(claim.ok).toBe(false);
    if (!claim.ok) expect(claim.reason).toBe("EXPIRED");

    // Left unconsumed on purpose: the resend path re-reads it as a receipt.
    const row = await db.authToken.findFirstOrThrow({ where: { userId } });
    expect(row.consumedAt).toBeNull();
  });

  it("refuses a missing or unknown token", async () => {
    for (const bad of [undefined, "", "   ", "not-a-real-token"]) {
      const claim = await claimToken(bad, "EMAIL_VERIFY");
      expect(claim.ok).toBe(false);
      if (!claim.ok) expect(claim.reason).toBe("UNKNOWN");
    }
  });

  it("⚠ will not redeem a token minted for a different job", async () => {
    // A magic link is a session; a verification link is a flag on a column.
    // Letting one be presented as the other is a privilege change.
    const token = await mintVerify(userId, email);
    const claim = await claimToken(token, "MAGIC_LINK");

    expect(claim.ok).toBe(false);
    if (!claim.ok) expect(claim.reason).toBe("UNKNOWN");

    // And it is still spendable for what it actually is.
    expect((await claimToken(token, "EMAIL_VERIFY")).ok).toBe(true);
  });
});

/* -------------------------------------------------------------------------- */

describe("verifying an email address", () => {
  it("marks the address confirmed", async () => {
    const token = await mintVerify(userId, email);
    const result = await verifyEmailByToken(token);

    expect(result.ok, JSON.stringify(result)).toBe(true);
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    expect(user.emailVerifiedAt).not.toBeNull();
  });

  it("⚠ refuses a link for an address the account has moved away from", async () => {
    /**
     * THE CHECK THAT ONLY BECAME NECESSARY ONCE AN ADDRESS COULD BE CHANGED.
     * Without it, a token minted for the old address stamps `emailVerifiedAt`
     * onto whatever the account holds now — laundering an unproven address into
     * a verified one with a link that proves nothing about it.
     */
    const token = await mintVerify(userId, email);
    const moved = address("moved-to");
    await db.user.update({ where: { id: userId }, data: { email: moved } });

    const result = await verifyEmailByToken(token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("STALE");

    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    expect(user.emailVerifiedAt).toBeNull();
  });

  it("reports an expired link as expired, and verifies nothing", async () => {
    const token = await mintVerify(userId, email, { expired: true });
    const result = await verifyEmailByToken(token);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("EXPIRED");
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    });
    expect(user.emailVerifiedAt).toBeNull();
  });

  it("reports a second visit as used rather than broken", async () => {
    const token = await mintVerify(userId, email);
    await verifyEmailByToken(token);
    const again = await verifyEmailByToken(token);

    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toBe("USED");
  });

  it("refuses a token with no address recorded on it", async () => {
    // Not a token this app mints. Guessing that it meant "whatever the account
    // holds now" is the one reading that could verify something unproven.
    const token = generateToken();
    await db.authToken.create({
      data: {
        userId,
        purpose: "EMAIL_VERIFY",
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });

    const result = await verifyEmailByToken(token);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("UNKNOWN");
  });
});

/* -------------------------------------------------------------------------- */

describe("asking for a fresh link", () => {
  it("sends one to the address on the account", async () => {
    const token = await mintVerify(userId, email, { expired: true });
    const result = await resendVerification(token);

    expect(result.ok, result.errorKey).toBe(true);
    const sent = await db.outboundEmail.findFirst({
      where: { to: email, purpose: "EMAIL_VERIFY" },
      select: { text: true },
    });
    expect(sent, "a new link must actually go out").not.toBeNull();
    expect(sent!.text).toContain("/verify?token=");
  });

  it("and the link it sends actually works", async () => {
    // The whole point. A resend that mints a token nothing can redeem would
    // have been the same bug one level down.
    const expiredToken = await mintVerify(userId, email, { expired: true });
    await resendVerification(expiredToken);

    const sent = await db.outboundEmail.findFirstOrThrow({
      where: { to: email, purpose: "EMAIL_VERIFY" },
      select: { text: true },
    });
    const fresh = sent.text.match(/\/verify\?token=([A-Za-z0-9_-]+)/)?.[1];
    expect(fresh).toBeDefined();
    expect((await verifyEmailByToken(fresh)).ok).toBe(true);
  });

  it("⚠ cannot be aimed at an account the caller does not hold a link for", async () => {
    /**
     * THE BUG THE FIRST DRAFT HAD. It took a user id, which the page had to
     * hand — and a server action's arguments are client input, so it was an
     * unauthenticated mailer pointed at any id somebody could produce. The rate
     * limit would have bounded the volume and not the aim.
     */
    const strangerEmail = address("stranger");
    const strangerId = await makeUser(strangerEmail);

    // Everything the caller could plausibly hold or guess, including the
    // victim's own id and address.
    for (const attempt of [strangerId, strangerEmail, "not-a-token", ""]) {
      const result = await resendVerification(attempt);
      expect(result.ok, `"${attempt}" must not send`).toBe(false);
    }
    expect(await db.outboundEmail.count({ where: { to: strangerEmail } })).toBe(0);
  });

  it("refuses a token minted for a different job", async () => {
    const magic = await mintMagic(userId, email);
    const result = await resendVerification(magic);
    expect(result.ok).toBe(false);
    expect(await db.outboundEmail.count({ where: { to: email } })).toBe(0);
  });

  it("⚠ will not mail a pupil's handle, which never routes", async () => {
    const handle = `pupil.${randomBytes(3).toString("hex")}@${HANDLE_DOMAIN}`;
    const pupilId = await makeUser(handle);
    const token = await mintVerify(pupilId, handle, { expired: true });

    const result = await resendVerification(token);
    expect(result.ok).toBe(false);
    expect(await db.outboundEmail.count({ where: { to: handle } })).toBe(0);
  });

  it("stops somebody holding the button", async () => {
    const token = await mintVerify(userId, email, { expired: true });
    let refusal: string | undefined;
    for (let i = 0; i < 5; i++) {
      const result = await resendVerification(token);
      if (!result.ok && result.errorKey === "refusal.tooManyRequests") {
        refusal = result.errorKey;
        break;
      }
    }
    expect(refusal, "the loop must stop").toBeDefined();
  });

  it("says nothing to do when the address is already confirmed", async () => {
    const token = await mintVerify(userId, email, { expired: true });
    await db.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });

    const result = await resendVerification(token);
    expect(result.ok).toBe(true);
    // Reported as fine, but no second email — there is nothing to confirm.
    expect(await db.outboundEmail.count({ where: { to: email } })).toBe(0);
  });
});

/* -------------------------------------------------------------------------- */

describe("QA-13: opening the link spends nothing; the person's press does", () => {
  /** The token row and the account, as the database holds them. */
  const state = async (token: string) => ({
    consumed: (await db.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(token) }, select: { consumedAt: true } })).consumedAt !== null,
    verified: (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { emailVerifiedAt: true } })).emailVerifiedAt !== null,
  });

  it("⚠ a GET of /verify (a mail scanner's prefetch, a preview) leaves the token unspent and the address unconfirmed", async () => {
    const token = await mintVerify(userId, email);
    const { default: VerifyPage } = await import("@/app/verify/page");
    await VerifyPage({ searchParams: Promise.resolve({ token }) });
    const html = renderToStaticMarkup(await VerifyPage({ searchParams: Promise.resolve({ token }) }));
    expect(await state(token)).toEqual({ consumed: false, verified: false });
    // What the person sees instead: the address and one button inside a form that posts the token back.
    const t = translator("en");
    expect(html).toContain(t("verify.confirmTitle"));
    expect(html).toContain(t("verify.confirmButton"));
    expect(html).toMatch(/<form[^>]*>[\s\S]*name="token"[\s\S]*<\/form>/);
    expect(html).not.toContain(t("verify.confirmed"));
  });

  it("the confirm button's POST spends it once and confirms the address; the page then says so", async () => {
    const token = await mintVerify(userId, email);
    const { confirmEmail } = await import("@/app/verify/actions");
    const form = new FormData();
    form.set("token", token);
    // The action answers with a redirect back to the page, marked done.
    await expect(confirmEmail(form)).rejects.toMatchObject({ digest: expect.stringContaining("/verify?token=") });
    expect(await state(token)).toEqual({ consumed: true, verified: true });
    const { inspectVerifyToken } = await import("@/lib/passwords");
    expect(await inspectVerifyToken(token)).toMatchObject({ state: "USED", email });
    // A second press is the used link, not a second confirmation.
    await expect(confirmEmail(form)).rejects.toMatchObject({ digest: expect.stringContaining("/verify?token=") });
    expect(await db.auditLog.count({ where: { actorUserId: userId, action: "auth.email.verified" } })).toBe(1);
  });

  it("the read-only look says what a press would find, for each of the outcomes", async () => {
    const { inspectVerifyToken } = await import("@/lib/passwords");
    const live = await mintVerify(userId, email);
    expect(await inspectVerifyToken(live)).toEqual({ state: "READY", email });
    expect(await inspectVerifyToken(await mintVerify(userId, email, { expired: true }))).toMatchObject({ state: "EXPIRED", email });
    expect(await inspectVerifyToken("not-a-token")).toEqual({ state: "UNKNOWN", email: null });
    expect(await inspectVerifyToken(undefined)).toEqual({ state: "UNKNOWN", email: null });
    expect(await inspectVerifyToken(await mintMagic(userId, email))).toEqual({ state: "UNKNOWN", email: null });
    await db.user.update({ where: { id: userId }, data: { email: address("moved") } });
    expect(await inspectVerifyToken(live)).toEqual({ state: "STALE", email: null });
    expect(await state(live)).toEqual({ consumed: false, verified: false });
  });
});
