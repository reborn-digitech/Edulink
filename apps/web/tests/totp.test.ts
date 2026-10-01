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
import { TWO_FACTOR_COOKIE } from "@/lib/two-factor";
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
async function bearerFor(userId: string): Promise<string> {
  const token = `zz-totp-${userId}-${Math.random().toString(36).slice(2)}-${"x".repeat(24)}`;
  await db.session.create({ data: { userId, tokenHash: hashToken(token), activeSchoolId: schoolId, activeRole: userId === adminId ? "ADMIN" : "TEACHER", expiresAt: new Date(Date.now() + 3_600_000) } });
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
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.rateLimit.deleteMany({ where: { OR: [{ bucket: { in: [adminEmail, teacherEmail].map((e) => `login:${e}`) } }, { bucket: { startsWith: `totp-enrol:${adminId}` } }, { bucket: { startsWith: `totp-off:${adminId}` } }] } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: [adminId, teacherId] } } });
  await db.session.deleteMany({ where: { userId: { in: [adminId, teacherId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: [adminId, teacherId] } } });
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
    const refused = await startPost();
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({ code: "FORBIDDEN" });
    expect((await db.user.findUniqueOrThrow({ where: { id: teacherId }, select: { totpPendingEnc: true } })).totpPendingEnc).toBeNull();
  });

  it("start hands the secret and the URI over once and seals it pending; a wrong code is refused; the right one turns it on with eight recovery codes", async () => {
    asBearer(await bearerFor(adminId));
    const started = await startPost();
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
    recoveryCodes = ((await right.json()) as { recoveryCodes: string[] }).recoveryCodes;
    expect(recoveryCodes).toHaveLength(8);
    const after = await db.user.findUniqueOrThrow({ where: { id: adminId }, select: { totpPendingEnc: true, totpSecretEnc: true, totpEnabledAt: true, totpRecoveryHashes: true } });
    expect(after.totpPendingEnc).toBeNull();
    expect(after.totpSecretEnc).toMatch(/^v2\./);
    expect(after.totpEnabledAt).not.toBeNull();
    expect(after.totpRecoveryHashes).toHaveLength(8);
    expect(after.totpRecoveryHashes).not.toContain(recoveryCodes[0]);
    expect(await (await statusGet()).json()).toMatchObject({ enabled: true, recoveryLeft: 8 });
    expect(await db.auditLog.count({ where: { actorUserId: adminId, action: "auth.totp.enrolled" } })).toBe(1);

    const again = await startPost();
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
