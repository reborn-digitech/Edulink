/**
 * Two-step sign-in (TOTP).
 *
 * The pure functions against RFC 4226's and RFC 6238's own test vectors,
 * then the whole round trip with a ZZ admin: enrol (a wrong code refused,
 * the right one answering eight recovery codes), a password sign-in that
 * answers TWO_FACTOR instead of a session, a wrong code counted, the right
 * code minting a session the bearer opens /me with, the same code refused
 * again inside its window, a recovery code working once, five wrong codes
 * killing a challenge, the web form's own two steps, and disabling. A ZZ
 * teacher is refused enrolment.
 */
import { randomBytes } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, hashToken } from "@/lib/crypto";
import { __resetCookies, __setCookie, __setHeaders, cookies } from "../tests/stubs/next-headers";
import { base32Decode, base32Encode, generateRecoveryCodes, hashRecoveryCode, hotp, matchRecoveryCode, otpauthUri, stepOf, totpCode, verifyTotp } from "@/lib/totp";
import { TOTP_PER_ACCOUNT, TWO_FACTOR_COOKIE, totpAccountBucket } from "@/lib/two-factor";
import { requestPasswordReset, resetPassword } from "@/lib/passwords";
import { SESSION_COOKIE } from "@/lib/constants";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { POST as totpPost } from "@/app/api/v1/auth/totp/route";
import { GET as statusGet } from "@/app/api/v1/account/totp/route";
import { POST as startPost } from "@/app/api/v1/account/totp/start/route";
import { POST as confirmPost } from "@/app/api/v1/account/totp/confirm/route";
import { POST as disablePost } from "@/app/api/v1/account/totp/disable/route";
import { GET as meGet } from "@/app/api/v1/me/route";
import { login } from "@/app/login/actions";
import { completeTwoFactor } from "@/app/login/code/actions";

/* -------------------------------------------------------------------------- */
/* The RFC vectors                                                             */
/* -------------------------------------------------------------------------- */

const RFC_SECRET = new TextEncoder().encode("12345678901234567890");
const RFC_SECRET_B32 = base32Encode(RFC_SECRET);

describe("RFC 4226 HOTP", () => {
  it("matches the appendix D vectors for counters 0 to 9", () => {
    const expected = ["755224", "287082", "359152", "969429", "338314", "254676", "287922", "162583", "399871", "520489"];
    expect(expected.map((_, i) => hotp(RFC_SECRET, i))).toEqual(expected);
  });
});

describe("RFC 6238 TOTP (SHA-1, 30 s)", () => {
  // Appendix B: the eight-digit codes, whose last six are the six-digit ones.
  const vectors: [number, string][] = [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ];
  it("matches the appendix B vectors", () => {
    for (const [seconds, eight] of vectors) {
      expect(hotp(RFC_SECRET, stepOf(seconds * 1000), 8)).toBe(eight);
      expect(totpCode(RFC_SECRET_B32, seconds * 1000)).toBe(eight.slice(-6));
    }
  });
  it("accepts a code one step either side and nothing further, and says which step", () => {
    const now = 1111111111 * 1000;
    const centre = stepOf(now);
    expect(verifyTotp(RFC_SECRET_B32, hotp(RFC_SECRET, centre), now)).toBe(centre);
    expect(verifyTotp(RFC_SECRET_B32, hotp(RFC_SECRET, centre - 1), now)).toBe(centre - 1);
    expect(verifyTotp(RFC_SECRET_B32, hotp(RFC_SECRET, centre + 1), now)).toBe(centre + 1);
    expect(verifyTotp(RFC_SECRET_B32, hotp(RFC_SECRET, centre + 2), now)).toBeNull();
    expect(verifyTotp(RFC_SECRET_B32, "05 04 71", now)).toBe(centre);
    expect(verifyTotp(RFC_SECRET_B32, "0504710", now)).toBeNull();
    expect(verifyTotp(RFC_SECRET_B32, "abcdef", now)).toBeNull();
  });
  it("base32 round-trips and the URI carries the secret, the issuer and the parameters every app assumes", () => {
    expect(RFC_SECRET_B32).toBe("GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ");
    expect(Buffer.from(base32Decode("gezd gnbv gy3t qojq gezd gnbv gy3t qojq")).toString()).toBe("12345678901234567890");
    const uri = otpauthUri("Relay", "head@zz.test", RFC_SECRET_B32);
    expect(uri.startsWith("otpauth://totp/Relay:head%40zz.test?")).toBe(true);
    const params = new URL(uri).searchParams;
    expect(params.get("secret")).toBe(RFC_SECRET_B32);
    expect(params.get("issuer")).toBe("Relay");
    expect(params.get("algorithm")).toBe("SHA1");
    expect(params.get("digits")).toBe("6");
    expect(params.get("period")).toBe("30");
  });
  it("recovery codes are eight of XXXX-XXXX, matched by their hash whatever the case and the hyphen", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(8);
    for (const code of codes) expect(code).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const hashes = codes.map(hashRecoveryCode);
    expect(matchRecoveryCode(codes[3]!.toLowerCase().replace("-", " "), hashes)).toBe(hashes[3]);
    expect(matchRecoveryCode("ZZZZ-ZZZZ", hashes)).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* The round trip                                                              */
/* -------------------------------------------------------------------------- */

const db = new PrismaClient();
const STAMP = Date.now();
const PASSWORD = `Zz-totp-${STAMP}-Kestrel`;
let schoolId = "";
let adminId = "";
let teacherId = "";
let adminEmail = "";
let teacherEmail = "";
// QA-23: an office account with no password (a sign-in link or SSO only).
let linkOnlyId = "";

const json = (path: string, body: unknown, token?: string) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

function asBearer(token: string | null) {
  __resetCookies();
  __setHeaders(token ? { authorization: `Bearer ${token}` } : {});
}

/** A bearer session for `userId` without going through the sign-in doors — the account endpoints need one. */
async function bearerFor(userId: string, signedInMinutesAgo = 0): Promise<string> {
  const token = `zz-totp-${userId}-${Math.random().toString(36).slice(2)}-${"x".repeat(24)}`;
  await db.session.create({ data: { userId, tokenHash: hashToken(token), activeSchoolId: schoolId, activeRole: userId === teacherId ? "TEACHER" : "ADMIN", createdAt: new Date(Date.now() - signedInMinutesAgo * 60_000), expiresAt: new Date(Date.now() + 3_600_000) } });
  return token;
}

/** The code the app would show `delta` steps from now. */
function codeAt(secret: string, delta: number): string {
  return hotp(base32Decode(secret), stepOf(Date.now()) + delta);
}

beforeAll(async () => {
  // The secret is sealed with the gateway box. CI's .env is the example, with
  // no key; the fees suites make a throwaway one the same way.
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  adminEmail = `zz-totp-admin-${STAMP}@test.invalid`;
  teacherEmail = `zz-totp-teacher-${STAMP}@test.invalid`;
  const school = await db.school.create({
    data: { name: `ZZ TOTP ${STAMP}`, slug: `zz-totp-${STAMP}`, code: `ZT${String(STAMP).slice(-6)}`, contactEmail: adminEmail, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const hash = await hashPassword(PASSWORD);
  adminId = (await db.user.create({ data: { name: "ZZ TOTP Admin", email: adminEmail, passwordHash: hash, emailVerifiedAt: new Date() }, select: { id: true } })).id;
  teacherId = (await db.user.create({ data: { name: "ZZ TOTP Teacher", email: teacherEmail, passwordHash: hash, emailVerifiedAt: new Date() }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: teacherId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  linkOnlyId = (await db.user.create({ data: { name: "ZZ TOTP Link-only Admin", email: `zz-totp-linkonly-${STAMP}@test.invalid`, emailVerifiedAt: new Date() }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: linkOnlyId, schoolId, role: "ADMIN", status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { in: [adminEmail, teacherEmail].map((e) => `login:${e}`) } }, { bucket: { startsWith: `totp-enrol:${adminId}` } }, { bucket: { startsWith: `totp-off:${adminId}` } }, { bucket: totpAccountBucket(adminId) }, { bucket: { contains: `zz-totp-admin-${STAMP}` } }] } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: [adminId, teacherId, linkOnlyId] } } });
  await db.session.deleteMany({ where: { userId: { in: [adminId, teacherId, linkOnlyId] } } });
  await db.authToken.deleteMany({ where: { userId: { in: [adminId, teacherId, linkOnlyId] } } });
  await db.outboundEmail.deleteMany({ where: { to: { in: [adminEmail, teacherEmail] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: [adminId, teacherId, linkOnlyId] } } });
  await db.$disconnect();
});

let secret = "";
let recoveryCodes: string[] = [];

describe("enrolment", () => {
  it("the status says an admin may turn it on and has not; a teacher may not and is refused the start", async () => {
    expect(process.env.FEES_SECRET_KEY, "the round trip needs FEES_SECRET_KEY in .env").toBeTruthy();
    asBearer(await bearerFor(adminId));
    const status = await statusGet();
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({ eligible: true, enabled: false, recoveryLeft: 0, available: true });

    asBearer(await bearerFor(teacherId));
    expect(await (await statusGet()).json()).toMatchObject({ eligible: false, enabled: false });
    const refused = await startPost(json("/api/v1/account/totp/start", { password: PASSWORD }));
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({ code: "FORBIDDEN" });
    expect((await db.user.findUniqueOrThrow({ where: { id: teacherId }, select: { totpPendingEnc: true } })).totpPendingEnc).toBeNull();
  });

  // QA-23 (24 Oct 2026): a session alone used to start it, so a stolen one could put its own authenticator on the account.
  it("⚠ a session alone does not start it: no password is a 422 on the field, a wrong one a 422 audited, and nothing is pending", async () => {
    asBearer(await bearerFor(adminId));
    const bare = await startPost(new Request("http://localhost/api/v1/account/totp/start", { method: "POST" }));
    expect(bare.status).toBe(422);
    expect(await bare.json()).toMatchObject({ code: "BAD_REQUEST", issues: { password: "Type your password to turn on two-step sign-in." } });
    const wrong = await startPost(json("/api/v1/account/totp/start", { password: "not-the-password-at-all" }));
    expect(wrong.status).toBe(422);
    expect(await wrong.json()).toMatchObject({ issues: { password: "That password is not right." } });
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.enrolRefused" } })).toBe(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: adminId }, select: { totpPendingEnc: true } })).totpPendingEnc).toBeNull();
    expect(await (await statusGet()).json()).toMatchObject({ hasPassword: true });
  });

  it("⚠ an account with no password needs a sign-in made in the last ten minutes", async () => {
    asBearer(await bearerFor(linkOnlyId, 30));
    expect(await (await statusGet()).json()).toMatchObject({ eligible: true, hasPassword: false });
    const stale = await startPost(json("/api/v1/account/totp/start", {}));
    expect(stale.status).toBe(403);
    expect(await stale.json()).toMatchObject({ error: "Sign out and sign in again, then turn on two-step sign-in within ten minutes." });
    asBearer(await bearerFor(linkOnlyId, 2));
    const fresh = await startPost(json("/api/v1/account/totp/start", {}));
    expect(fresh.status).toBe(200);
    await db.user.update({ where: { id: linkOnlyId }, data: { totpPendingEnc: null } });
  });

  it("start hands the secret and the URI over once and seals it pending; a wrong code is refused; the right one turns it on with eight recovery codes and signs every other session out", async () => {
    // Another device of the admin's, signed in before two-step sign-in was on (QA-23).
    const otherDevice = await bearerFor(adminId);
    const doing = await bearerFor(adminId);
    asBearer(doing);
    const started = await startPost(json("/api/v1/account/totp/start", { password: PASSWORD }));
    expect(started.status).toBe(200);
    const body = (await started.json()) as { secret: string; uri: string; account: string };
    secret = body.secret;
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    expect(new URL(body.uri).searchParams.get("secret")).toBe(secret);
    expect(body.account).toBe(adminEmail);
    const row = await db.user.findUniqueOrThrow({ where: { id: adminId }, select: { totpPendingEnc: true, totpEnabledAt: true } });
    expect(row.totpPendingEnc).toMatch(/^v2\./);
    expect(row.totpPendingEnc).not.toContain(secret);
    expect(row.totpEnabledAt).toBeNull();

    // Not on yet: the password alone still signs in.
    const plain = await loginPost(json("/api/v1/auth/login", { identifier: adminEmail, password: PASSWORD }));
    expect(plain.status).toBe(200);
    expect(await plain.json()).toMatchObject({ context: { schoolId, role: "ADMIN" } });

    const wrong = await confirmPost(json("/api/v1/account/totp/confirm", { code: "000000" }));
    expect(wrong.status).toBe(422);
    expect(await wrong.json()).toMatchObject({ code: "BAD_REQUEST", issues: { code: expect.any(String) } });

    const right = await confirmPost(json("/api/v1/account/totp/confirm", { code: totpCode(secret) }));
    expect(right.status).toBe(200);
    const confirmed = (await right.json()) as { recoveryCodes: string[]; signedOut: number };
    recoveryCodes = confirmed.recoveryCodes;
    expect(recoveryCodes).toHaveLength(8);
    expect(confirmed.signedOut).toBeGreaterThanOrEqual(1);
    expect((await db.session.findUniqueOrThrow({ where: { tokenHash: hashToken(otherDevice) }, select: { revokedAt: true } })).revokedAt, "the other device is signed out").not.toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { tokenHash: hashToken(doing) }, select: { revokedAt: true } })).revokedAt, "the session turning it on stays").toBeNull();
    const after = await db.user.findUniqueOrThrow({ where: { id: adminId }, select: { totpPendingEnc: true, totpSecretEnc: true, totpEnabledAt: true, totpRecoveryHashes: true } });
    expect(after.totpPendingEnc).toBeNull();
    expect(after.totpSecretEnc).toMatch(/^v2\./);
    expect(after.totpEnabledAt).not.toBeNull();
    expect(after.totpRecoveryHashes).toHaveLength(8);
    expect(after.totpRecoveryHashes).not.toContain(recoveryCodes[0]);
    expect(await (await statusGet()).json()).toMatchObject({ enabled: true, recoveryLeft: 8 });
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.enrolled" } })).toBe(1);

    const again = await startPost(json("/api/v1/account/totp/start", { password: PASSWORD }));
    expect(again.status).toBe(409);
  });
});

describe("the second step of a sign-in", () => {
  let challenge = "";

  async function firstStep(): Promise<string> {
    // The password door is limited to ten tries a quarter-hour per login; this suite's are its own.
    await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "login:zz-totp" } } });
    const res = await loginPost(json("/api/v1/auth/login", { identifier: adminEmail, password: PASSWORD, device: "Test phone" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { code: string; challenge: string; token?: string };
    expect(body).toMatchObject({ code: "TWO_FACTOR", challenge: expect.any(String) });
    expect(body.token).toBeUndefined();
    return body.challenge;
  }

  it("a password sign-in answers TWO_FACTOR and a challenge, and mints no session", async () => {
    const before = await db.session.count({ where: { userId: adminId } });
    challenge = await firstStep();
    expect(await db.session.count({ where: { userId: adminId } })).toBe(before);
    const row = await db.twoFactorChallenge.findUniqueOrThrow({ where: { tokenHash: hashToken(challenge) } });
    expect(row).toMatchObject({ userId: adminId, via: "password", attempts: 0, usedAt: null });
    expect(row.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(5 * 60_000);
  });

  it("a wrong code is refused with the tries left and counted on the row", async () => {
    const res = await totpPost(json("/api/v1/auth/totp", { challenge, code: "000000" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED", error: expect.stringContaining("4") });
    const row = await db.twoFactorChallenge.findUniqueOrThrow({ where: { tokenHash: hashToken(challenge) } });
    expect(row.attempts).toBe(1);
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.failed" } })).toBe(1);
  });

  it("the right code mints the session the login would have, the bearer opens /me, and the challenge is spent", async () => {
    const code = codeAt(secret, 1);
    const res = await totpPost(json("/api/v1/auth/totp", { challenge, code, device: "Test phone" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; sessionId: string; context: { schoolId: string; role: string } };
    expect(body.context).toEqual({ schoolId, role: "ADMIN" });
    asBearer(body.token);
    expect((await meGet()).status).toBe(200);
    const session = await db.session.findUniqueOrThrow({ where: { id: body.sessionId }, select: { userAgent: true } });
    expect(session.userAgent).toBe("Test phone");
    const row = await db.twoFactorChallenge.findUniqueOrThrow({ where: { tokenHash: hashToken(challenge) } });
    expect(row.usedAt).not.toBeNull();
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.passed" } })).toBe(1);
    const login = await db.auditLog.findFirst({ where: { actorUserId: adminId, action: "auth.login" }, orderBy: { createdAt: "desc" } });
    expect(login?.meta).toContain("totp:password");

    // Spent: the same challenge and the next code are nothing now.
    const spent = await totpPost(json("/api/v1/auth/totp", { challenge, code: codeAt(secret, 1) }));
    expect(spent.status).toBe(401);

    // The code that just signed in is refused again inside its window, on a fresh challenge.
    const fresh = await firstStep();
    const replay = await totpPost(json("/api/v1/auth/totp", { challenge: fresh, code }));
    expect(replay.status).toBe(401);
  });

  it("a recovery code signs in once, in place of a code, and is gone", async () => {
    const recovery = recoveryCodes[0]!;
    const first = await totpPost(json("/api/v1/auth/totp", { challenge: await firstStep(), code: recovery.toLowerCase() }));
    expect(first.status).toBe(200);
    asBearer(await bearerFor(adminId));
    expect(await (await statusGet()).json()).toMatchObject({ enabled: true, recoveryLeft: 7 });
    const second = await totpPost(json("/api/v1/auth/totp", { challenge: await firstStep(), code: recovery }));
    expect(second.status).toBe(401);
  });

  it("five wrong codes kill a challenge: the fifth says start again, and so does anything after it", async () => {
    const dead = await firstStep();
    for (let i = 1; i <= 4; i++) {
      const res = await totpPost(json("/api/v1/auth/totp", { challenge: dead, code: "111111" }));
      expect(res.status).toBe(401);
      expect(((await res.json()) as { error: string }).error).toContain(String(5 - i));
    }
    const fifth = await totpPost(json("/api/v1/auth/totp", { challenge: dead, code: "111111" }));
    expect(fifth.status).toBe(401);
    expect(((await fifth.json()) as { error: string }).error).not.toMatch(/\d tries/);
    const right = await totpPost(json("/api/v1/auth/totp", { challenge: dead, code: codeAt(secret, 1) }));
    expect(right.status).toBe(401);
    expect(await db.session.count({ where: { userId: adminId, userAgent: "Test phone" } })).toBe(1);
    expect(await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "totp:" } } })).toBeTruthy();
    // The account's own count (QA-22) is the next block's to fill.
    await db.rateLimit.deleteMany({ where: { bucket: totpAccountBucket(adminId) } });
  });

  it("a garbage challenge and an expired one are refused alike", async () => {
    expect((await totpPost(json("/api/v1/auth/totp", { challenge: "x".repeat(40), code: "123456" }))).status).toBe(401);
    const old = await firstStep();
    await db.twoFactorChallenge.update({ where: { tokenHash: hashToken(old) }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await totpPost(json("/api/v1/auth/totp", { challenge: old, code: codeAt(secret, 1) }))).status).toBe(401);
  });

  it("the web form: the password action sets the challenge cookie and no session; the code action mints the cookie session", async () => {
    __resetCookies();
    __setHeaders({});
    const first = await login({ identifier: adminEmail, password: PASSWORD });
    expect(first).toMatchObject({ ok: true, twoFactor: true, redirectTo: "/login/code" });
    const jar = await cookies();
    expect(jar.get(TWO_FACTOR_COOKIE)?.value).toBeTruthy();
    expect(jar.get(SESSION_COOKIE)).toBeUndefined();

    const wrong = await completeTwoFactor({ code: "000000" });
    expect(wrong.ok).toBe(false);
    expect(wrong.errors.code).toContain("4");

    // The whole suite runs inside one thirty-second step, and the code one
    // step ahead has already signed in above; the replay guard would refuse
    // it. Move the last accepted step back two, as thirty seconds would.
    await db.user.update({ where: { id: adminId }, data: { totpLastStep: stepOf(Date.now()) - 2 } });
    const sessionsBefore = await db.session.count({ where: { userId: adminId } });
    const right = await completeTwoFactor({ code: codeAt(secret, 1) });
    expect(right).toMatchObject({ ok: true });
    expect(right.redirectTo).toBeTruthy();
    expect(jar.get(SESSION_COOKIE)?.value).toBeTruthy();
    expect(await db.session.count({ where: { userId: adminId } })).toBe(sessionsBefore + 1);

    // With the cookie gone, the step is dead and the person is sent back to the start.
    __setCookie(SESSION_COOKIE, null);
    const stale = await completeTwoFactor({ code: codeAt(secret, 1) });
    expect(stale).toMatchObject({ ok: false, redirectTo: "/login?step=expired" });
    __resetCookies();
  });
});

// QA-22 (24 Oct 2026): the limits were per challenge and per address, and a fresh challenge comes with every right
// password, so somebody holding the password and rotating addresses had about fifty guesses a quarter-hour.
describe("the account's own ceiling on wrong codes", () => {
  async function challengeFor(): Promise<string> {
    await db.rateLimit.deleteMany({ where: { bucket: { startsWith: "login:zz-totp" } } });
    const res = await loginPost(json("/api/v1/auth/login", { identifier: adminEmail, password: PASSWORD }));
    return ((await res.json()) as { challenge: string }).challenge;
  }
  const guess = (challenge: string, code: string, address: string) =>
    totpPost(new Request("http://localhost/api/v1/auth/totp", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": address }, body: JSON.stringify({ challenge, code }) }));

  it("⚠ the tenth wrong code in an hour, across challenges and addresses, locks the second step: audited, every open challenge spent, the holder told", async () => {
    await db.rateLimit.deleteMany({ where: { bucket: totpAccountBucket(adminId) } });
    __resetCookies();
    __setHeaders({});
    const statuses: number[] = [];
    let challenge = "";
    for (let i = 1; i <= TOTP_PER_ACCOUNT.limit; i++) {
      if ((i - 1) % 5 === 0) challenge = await challengeFor();
      statuses.push((await guess(challenge, "111111", `203.0.113.${i}`)).status);
    }
    expect(statuses.slice(0, 9).every((s) => s === 401)).toBe(true);
    expect(statuses[9], "the tenth wrong code").toBe(429);
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.locked" } })).toBe(1);
    expect(await db.twoFactorChallenge.count({ where: { userId: adminId, usedAt: null } })).toBe(0);
    const notice = await db.outboundEmail.findFirstOrThrow({ where: { to: adminEmail, purpose: "ACCOUNT_SECURITY" }, select: { subject: true, text: true } });
    expect(notice.subject).toBe("Too many wrong sign-in codes on your account");
    expect(notice.text).toContain("10 wrong codes");

    // Locked: even the right code, on a fresh challenge from yet another address, is not tried.
    await db.user.update({ where: { id: adminId }, data: { totpLastStep: stepOf(Date.now()) - 2 } });
    const locked = await guess(await challengeFor(), codeAt(secret, 0), "198.51.100.7");
    expect(locked.status).toBe(429);
    expect(Number(locked.headers.get("retry-after"))).toBeGreaterThan(60);
    expect(((await locked.json()) as { code: string }).code).toBe("RATE_LIMITED");
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.locked" } }), "locked once, not again").toBe(1);
  });

  it("⚠ a password reset lifts it: the owner proved the mailbox, and the password the guesser held is gone", async () => {
    await requestPasswordReset(adminEmail);
    const sent = await db.outboundEmail.findFirstOrThrow({ where: { to: adminEmail, purpose: "PASSWORD_RESET" }, orderBy: { createdAt: "desc" }, select: { text: true } });
    const code = sent.text.split("\n")[0]!.trim();
    expect(code).toMatch(/^\d{6}$/);
    expect(await resetPassword(adminEmail, code, `${PASSWORD}-New`)).toMatchObject({ ok: true });
    expect(await db.rateLimit.count({ where: { bucket: totpAccountBucket(adminId) } })).toBe(0);
    // Back to the suite's password, for the block below.
    await db.user.update({ where: { id: adminId }, data: { passwordHash: await hashPassword(PASSWORD) } });
  });
});

describe("turning it off", () => {
  it("needs a code (a wrong one is refused), and afterwards the password signs straight in", async () => {
    asBearer(await bearerFor(adminId));
    expect((await disablePost(json("/api/v1/account/totp/disable", { code: "000000" }))).status).toBe(422);
    expect((await disablePost(json("/api/v1/account/totp/disable", { code: recoveryCodes[1] }))).status).toBe(200);
    const row = await db.user.findUniqueOrThrow({ where: { id: adminId }, select: { totpSecretEnc: true, totpEnabledAt: true, totpRecoveryHashes: true, totpLastStep: true } });
    expect(row).toEqual({ totpSecretEnc: null, totpEnabledAt: null, totpRecoveryHashes: [], totpLastStep: null });
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.disabled" } })).toBe(1);
    expect(await (await statusGet()).json()).toMatchObject({ enabled: false, recoveryLeft: 0 });
    expect((await disablePost(json("/api/v1/account/totp/disable", { code: recoveryCodes[2] }))).status).toBe(409);

    const plain = await loginPost(json("/api/v1/auth/login", { identifier: adminEmail, password: PASSWORD }));
    expect(plain.status).toBe(200);
    expect(await plain.json()).toMatchObject({ token: expect.any(String), context: { role: "ADMIN" } });
  });
});
