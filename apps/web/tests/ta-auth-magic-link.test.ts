/**
 * The sign-in link and the other proofs of a mailbox (testing analysis of 13 November 2026, auth batch).
 *
 * TA-035 (Medium, Security): a sign-in link opened on a never-verified account left the earlier password and
 * sessions in place, while SSO and an invitation take such an account back. Now the link does too.
 *
 * TA-036 (Medium, Security): SSO's reclaim of a never-verified account cleared the password and left the earlier
 * holder's two-step sign-in, so the address's owner was asked for a code from the stranger's phone forever.
 *
 * TA-040 (Medium, Security): the phone's consume door made none of the web's address and closed-account checks,
 * and an address change spent no link or reset code already sent to the old address.
 *
 * TA-551 (Low, Security): a sign-in link was minted and mailed to a pupil's login name (@edulink.local).
 *
 * TA-245 (Medium, Security): sign-in links were limited per typed address only, so one caller could have the
 * platform mail every registered person.
 *
 * TA-503 (Low, Accessibility): the link's confirm page declared lang="en" whatever language it was written in.
 *
 * Every row is one this suite makes (@test.invalid and stamped @edulink.local accounts, a stamped ZZ school, its
 * own rate-limit buckets) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { generateToken, hashPassword, hashToken } from "@/lib/crypto";
import { GET as magicGet, POST as magicPost } from "@/app/magic/route";
import { POST as consumePost } from "@/app/api/v1/auth/magic-link/consume/route";
import { requestMagicLink } from "@/app/login/actions";
import { signInWithPassword } from "@/lib/auth-login";
import { signInWithSso } from "@/lib/sso";
import { twoFactorChallengeFor } from "@/lib/two-factor";
import { confirmEmailChange } from "@/lib/passwords";
import { LOGIN_PER_ADDRESS } from "@/lib/rate-limit";
import { __resetCookies, __setCookie, __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taauth-ml-${who}-${STAMP}@test.invalid`;
const HANDLE_MAIL = `zz-taauth-ml-handle-${STAMP}@edulink.local`;
const STRANGER_PASSWORD = `Zz-stranger-${STAMP}-Kestrel`;
// A documentation-range address (2001:db8::/32) under the prefix tests/setup.ts leaves alone, so a second vitest
// process's set-up cannot wipe this suite's per-address bucket while it is counting.
const CALLER = `2001:db8:7a:77:${Math.floor(STAMP / 65536).toString(16).slice(-4)}:${(STAMP % 65536).toString(16)}::1`;

let schoolId = "";
const made: string[] = [];

async function account(who: string, data: { emailVerifiedAt?: Date | null; totp?: boolean; email?: string } = {}): Promise<string> {
  const id = (
    await db.user.create({
      data: {
        name: `ZZ TA Auth ${who}`,
        email: data.email ?? MAIL(who),
        passwordHash: await hashPassword(STRANGER_PASSWORD),
        emailVerifiedAt: data.emailVerifiedAt ?? null,
        ...(data.totp ? { totpEnabledAt: new Date(), totpSecretEnc: "sealed-in-test", totpRecoveryHashes: ["zz-recovery"] } : {}),
        prefs: "{}",
      },
      select: { id: true },
    })
  ).id;
  made.push(id);
  await db.membership.create({ data: { userId: id, schoolId, role: "TEACHER", status: "ACTIVE" } });
  return id;
}

async function mint(userId: string, email: string, purpose = "MAGIC_LINK"): Promise<string> {
  const token = generateToken();
  await db.authToken.create({ data: { userId, email, purpose, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 20 * 60_000) } });
  return token;
}

async function liveSession(userId: string): Promise<string> {
  return (await db.session.create({ data: { userId, tokenHash: hashToken(generateToken()), expiresAt: new Date(Date.now() + 86_400_000) }, select: { id: true } })).id;
}

const postMagic = (token: string) =>
  magicPost(
    new NextRequest("http://localhost/magic", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", origin: "http://localhost" },
      body: new URLSearchParams({ token }).toString(),
    }),
  );
const postConsume = (token: string) =>
  consumePost(new Request("http://localhost/api/v1/auth/magic-link/consume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) }));

async function until<T>(read: () => Promise<T>, done: (value: T) => boolean, ms = 10_000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const value = await read();
    if (done(value) || Date.now() > end) return value;
    await new Promise((r) => setTimeout(r, 100));
  }
}

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Auth Magic ${STAMP}`, slug: `zz-taauth-ml-${STAMP}`, code: `ZTAML${String(STAMP).slice(-6)}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const ids = (await db.user.findMany({ where: { OR: [{ id: { in: made } }, { email: { startsWith: "zz-taauth-ml-", contains: `-${STAMP}` } }] }, select: { id: true } })).map((u) => u.id);
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { contains: `zz-taauth-ml-` } }, { bucket: { contains: CALLER } }] } });
  await db.ssoIdentity.deleteMany({ where: { userId: { in: ids } } });
  await db.twoFactorChallenge.deleteMany({ where: { userId: { in: ids } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.authToken.deleteMany({ where: { userId: { in: ids } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: ids } }, { schoolId }] } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@` } } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe.sequential("TA-035: a sign-in link takes a never-verified account back", () => {
  it("TA-035: /magic on an unverified account clears the stranger's password and second step and ends their sessions", async () => {
    __resetCookies();
    const userId = await account("web", { totp: true });
    const stale = await liveSession(userId);
    const token = await mint(userId, MAIL("web"));

    const done = await postMagic(token);
    expect(done.status).toBe(303);
    // No code page: the second step was the stranger's, and it is gone.
    expect(done.headers.get("location")).not.toContain("/login/code");
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, emailVerifiedAt: true, totpEnabledAt: true, totpSecretEnc: true } });
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();
    expect(user.totpEnabledAt).toBeNull();
    expect(user.totpSecretEnc).toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: stale } })).revokedAt).not.toBeNull();
    expect(await signInWithPassword(MAIL("web"), STRANGER_PASSWORD, { caller: null })).toMatchObject({ ok: false, reason: "noMatch" });
  });

  it("TA-035: the phone's consume door takes it back the same way", async () => {
    const userId = await account("phone");
    const stale = await liveSession(userId);
    const token = await mint(userId, MAIL("phone"));

    const done = await postConsume(token);
    expect(done.status).toBe(200);
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, emailVerifiedAt: true } });
    expect(user.passwordHash).toBeNull();
    expect(user.emailVerifiedAt).not.toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: stale } })).revokedAt).not.toBeNull();
  });

  it("TA-035: both doors record the reclaim on their auth.login row (meta.reclaimed)", async () => {
    __resetCookies();
    const webId = await account("audit-web");
    expect((await postMagic(await mint(webId, MAIL("audit-web")))).status).toBe(303);
    const phoneId = await account("audit-phone");
    expect((await postConsume(await mint(phoneId, MAIL("audit-phone")))).status).toBe(200);
    for (const [userId, api] of [[webId, false], [phoneId, true]] as const) {
      const rows = await until(
        () => db.auditLog.findMany({ where: { actorUserId: userId, action: "auth.login" }, select: { meta: true } }),
        (found) => found.length > 0,
      );
      expect(rows).toHaveLength(1);
      const meta = JSON.parse(rows[0]?.meta ?? "{}") as Record<string, unknown>;
      expect(meta).toMatchObject({ via: "magic-link", reclaimed: true });
      expect(meta.api === true).toBe(api);
    }
  });

  it("TA-035: a verified account's password and other sessions are left as they were", async () => {
    __resetCookies();
    const userId = await account("verified", { emailVerifiedAt: new Date() });
    const other = await liveSession(userId);
    const done = await postMagic(await mint(userId, MAIL("verified")));
    expect(done.status).toBe(303);
    expect((await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true } })).passwordHash).not.toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: other } })).revokedAt).toBeNull();
  });
});

describe.sequential("TA-036: SSO taking back a never-verified account clears its second step", () => {
  it("TA-036: after the reclaim the account has no second step and no open challenge, and no code is asked", async () => {
    const userId = await account("sso", { totp: true });
    const open = await db.twoFactorChallenge.create({ data: { userId, tokenHash: hashToken(generateToken()), via: "password", expiresAt: new Date(Date.now() + 300_000) }, select: { id: true } });

    const outcome = await signInWithSso("google", { subject: `zz-taauth-sso-${STAMP}`, email: MAIL("sso"), emailVerified: true, name: null });
    expect(outcome).toMatchObject({ ok: true, userId, linked: true });
    const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { passwordHash: true, totpEnabledAt: true, totpSecretEnc: true, totpRecoveryHashes: true } });
    expect(user.passwordHash).toBeNull();
    expect(user.totpEnabledAt).toBeNull();
    expect(user.totpSecretEnc).toBeNull();
    expect(user.totpRecoveryHashes).toEqual([]);
    expect((await db.twoFactorChallenge.findUniqueOrThrow({ where: { id: open.id } })).usedAt).not.toBeNull();
    expect(await twoFactorChallengeFor(userId, "sso:google")).toBeNull();
  });
});

describe.sequential("TA-040: the consume door checks what /magic checks, and an address change spends what was sent", () => {
  it("TA-040: a link minted for an address the account has since left is refused by the consume door", async () => {
    const userId = await account("moved", { emailVerifiedAt: new Date() });
    const token = await mint(userId, MAIL("moved"));
    await db.user.update({ where: { id: userId }, data: { email: MAIL("moved-new") } });
    const res = await postConsume(token);
    expect(res.status).toBe(401);
    expect(await db.session.count({ where: { userId } })).toBe(0);
  });

  it("TA-040: a recruiter the operator closed, with no other way in, is refused by the consume door with the sentence", async () => {
    const userId = await account("closed", { emailVerifiedAt: new Date() });
    await db.membership.deleteMany({ where: { userId } });
    await db.recruiterProfile.create({ data: { userId, companyName: `ZZ TA Auth Recruiter ${STAMP}`, disabledAt: new Date() } });
    try {
      const res = await postConsume(await mint(userId, MAIL("closed")));
      expect(res.status).toBe(403);
      expect(await db.session.count({ where: { userId } })).toBe(0);
    } finally {
      await db.recruiterProfile.deleteMany({ where: { userId } });
    }
  });

  it("TA-040: confirming a new address spends the sign-in links and reset codes already sent", async () => {
    const userId = await account("change", { emailVerifiedAt: new Date() });
    const link = await mint(userId, MAIL("change"));
    const reset = await mint(userId, MAIL("change"), "PASSWORD_RESET");
    const code = "123456";
    await db.authToken.create({
      data: { userId, purpose: "EMAIL_CHANGE", tokenHash: hashToken(`${userId}:EMAIL_CHANGE:${code}`), meta: JSON.stringify({ email: MAIL("change-new") }), expiresAt: new Date(Date.now() + 600_000) },
    });
    expect(await confirmEmailChange(userId, code)).toMatchObject({ ok: true });
    for (const raw of [link, reset]) {
      expect((await db.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(raw) }, select: { consumedAt: true } })).consumedAt).not.toBeNull();
    }
    expect((await postConsume(link)).status).toBe(401);
  });
});

describe.sequential("TA-551: no sign-in link for a pupil's login name", () => {
  it("TA-551: the answer is the ordinary one, and no token is minted and no mail queued for the handle", async () => {
    __setHeaders({ "x-forwarded-for": CALLER });
    const pupil = await account("handle", { email: HANDLE_MAIL });
    const answer = await requestMagicLink({ email: HANDLE_MAIL });
    expect(answer).toEqual({ ok: true, errors: {} });
    // The work runs after the answer; give it the time it takes for a deliverable address.
    const control = await account("control", { emailVerifiedAt: new Date() });
    await requestMagicLink({ email: MAIL("control") });
    await until(() => db.authToken.count({ where: { userId: control, purpose: "MAGIC_LINK" } }), (n) => n > 0);
    expect(await db.authToken.count({ where: { userId: control, purpose: "MAGIC_LINK" } })).toBe(1);
    expect(await db.authToken.count({ where: { userId: pupil, purpose: "MAGIC_LINK" } })).toBe(0);
    expect(await db.outboundEmail.count({ where: { to: HANDLE_MAIL } })).toBe(0);
    __setHeaders({});
  });
});

describe.sequential("TA-245: sign-in links are limited per caller address too", () => {
  it("TA-245: one address asking for links to many different addresses is refused past the per-address allowance", async () => {
    __setHeaders({ "x-forwarded-for": CALLER });
    await db.rateLimit.deleteMany({ where: { bucket: `magic-addr:${CALLER}` } });
    let refused = 0;
    let allowed = 0;
    for (let i = 0; i < LOGIN_PER_ADDRESS.limit + 5; i++) {
      const answer = await requestMagicLink({ email: MAIL(`spray${i}`) });
      if (answer.ok) allowed++;
      else refused++;
    }
    __setHeaders({});
    expect(allowed).toBeLessThanOrEqual(LOGIN_PER_ADDRESS.limit);
    expect(refused).toBeGreaterThanOrEqual(5);
  });
});

describe("TA-503: the confirm page declares the language it is written in", () => {
  it("TA-503: lang is mr for a Marathi reader, hi for Hindi and en for English", async () => {
    for (const locale of ["mr", "hi", "en"] as const) {
      __resetCookies();
      __setCookie("edulink_locale", locale);
      const page = await magicGet(new NextRequest("http://localhost/magic?token=zz-not-a-real-token-but-long-enough"));
      expect(await page.text()).toContain(`<html lang="${locale}">`);
    }
    __resetCookies();
  });
});
