import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { generateKeyPairSync, sign as cryptoSign, verify as cryptoVerify } from "node:crypto";
import { claimsToIdentity, signInWithSso, verifyIdToken, appleClientSecret } from "@/lib/sso";
import { generateToken, hashPassword, hashToken } from "@/lib/crypto";

/**
 * SSO's three load-bearing claims, held without any provider credentials:
 * the linking policy (sub is the key, verified email only the introduction,
 * and SSO never creates accounts), ID-token verification (a real RS256
 * signature over our own JWKS, and every downgrade refused), and Apple's
 * self-signed client secret. Disposable ZZ users; deletion asserted.
 */

const db = new PrismaClient();
const LINKED_EMAIL = "zz.sso.linked@riverside.test";
const DISABLED_EMAIL = "zz.sso.disabled@riverside.test";
const UNVERIFIED_EMAIL = "zz.sso.unverified@riverside.test";

let linkedUserId: string;

const b64url = (input: Buffer | string) => Buffer.from(input as never).toString("base64url");

beforeAll(async () => {
  const linked = await db.user.create({
    data: { email: LINKED_EMAIL, name: "ZZ SSO Linked", prefs: "{}" },
  });
  linkedUserId = linked.id;
  await db.user.create({
    data: { email: DISABLED_EMAIL, name: "ZZ SSO Disabled", prefs: "{}", disabledAt: new Date() },
  });
});

afterAll(async () => {
  const emails = [LINKED_EMAIL, DISABLED_EMAIL, UNVERIFIED_EMAIL];
  const ids = (await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } })).map((u) => u.id);
  await db.ssoIdentity.deleteMany({ where: { userId: { in: ids } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.user.deleteMany({ where: { email: { in: emails } } });
  expect(await db.user.count({ where: { email: { in: emails } } })).toBe(0);
  await db.$disconnect();
});

describe("the linking policy", () => {
  it("links a verified email once, then trusts only the subject", async () => {
    const first = await signInWithSso("google", {
      subject: "zz-sub-1",
      email: LINKED_EMAIL,
      emailVerified: true,
      name: "ZZ SSO Linked",
    });
    expect(first).toEqual({ ok: true, userId: linkedUserId, linked: true });

    // The provider email changed; the subject did not. Same person.
    const second = await signInWithSso("google", {
      subject: "zz-sub-1",
      email: "zz.sso.renamed@riverside.test",
      emailVerified: true,
      name: "ZZ SSO Linked",
    });
    expect(second).toEqual({ ok: true, userId: linkedUserId, linked: false });

    expect(await db.ssoIdentity.count({ where: { userId: linkedUserId } })).toBe(1);
  });

  it("an unverified email introduces nobody — and says so, rather than 'no account'", async () => {
    const result = await signInWithSso("google", {
      subject: "zz-sub-2",
      email: LINKED_EMAIL,
      emailVerified: false,
      name: null,
    });
    expect(result).toEqual({ ok: false, reason: "unverified-email" });
    expect(await db.ssoIdentity.count({ where: { subject: "zz-sub-2" } })).toBe(0);
  });

  it("⚠ a verified email meeting an account that never proved its address takes the account: password gone, sessions and push registrations gone, address verified", async () => {
    const squatter = await db.user.create({
      data: { email: UNVERIFIED_EMAIL, name: "ZZ Squatter", prefs: "{}", passwordHash: await hashPassword("whatever-they-typed-8812"), emailVerifiedAt: null },
    });
    const session = await db.session.create({
      data: { userId: squatter.id, tokenHash: hashToken(generateToken()), expiresAt: new Date(Date.now() + 86_400_000) },
    });
    await db.authToken.create({
      data: { userId: squatter.id, email: UNVERIFIED_EMAIL, purpose: "MAGIC_LINK", tokenHash: hashToken(generateToken()), expiresAt: new Date(Date.now() + 600_000) },
    });
    await db.deviceToken.create({ data: { userId: squatter.id, expoPushToken: `ExponentPushToken[zz-sso-${squatter.id}]`, platform: "ios" } });
    await db.pushSubscription.create({ data: { userId: squatter.id, endpoint: `https://push.invalid/zz-sso-${squatter.id}`, p256dh: "k", auth: "a" } });

    const result = await signInWithSso("google", { subject: "zz-sub-5", email: UNVERIFIED_EMAIL, emailVerified: true, name: "The Real One" });
    expect(result).toEqual({ ok: true, userId: squatter.id, linked: true });

    const after = await db.user.findUniqueOrThrow({ where: { id: squatter.id } });
    expect(after.passwordHash).toBeNull();
    expect(after.emailVerifiedAt).not.toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: session.id } })).revokedAt).not.toBeNull();
    expect(await db.authToken.count({ where: { userId: squatter.id, consumedAt: null } })).toBe(0);
    expect(await db.deviceToken.count({ where: { userId: squatter.id } })).toBe(0);
    expect(await db.pushSubscription.count({ where: { userId: squatter.id } })).toBe(0);

    // A verified account is never touched this way: the linked user above still has what it had.
    await db.session.deleteMany({ where: { userId: squatter.id } });
    await db.authToken.deleteMany({ where: { userId: squatter.id } });
  });

  it("never creates an account", async () => {
    const before = await db.user.count();
    const result = await signInWithSso("google", {
      subject: "zz-sub-3",
      email: "zz.sso.stranger@riverside.test",
      emailVerified: true,
      name: "A Stranger",
    });
    expect(result).toEqual({ ok: false, reason: "no-account" });
    expect(await db.user.count()).toBe(before);
  });

  it("a Google button is not a side door past a suspension", async () => {
    const result = await signInWithSso("google", {
      subject: "zz-sub-4",
      email: DISABLED_EMAIL,
      emailVerified: true,
      name: null,
    });
    expect(result).toEqual({ ok: false, reason: "disabled" });
  });
});

describe("⚠ what Microsoft's email claim is worth", () => {
  const base = { sub: "ms-sub", email: "Head@School.example", name: "Head" };

  it("nothing on its own: without xms_edov the address is not verified, so it links nobody", () => {
    const identity = claimsToIdentity("microsoft", { ...base, tid: "11111111-1111-1111-1111-111111111111" });
    expect(identity.email).toBe("head@school.example");
    expect(identity.emailVerified).toBe(false);
  });

  it("verified when the token carries xms_edov true", () => {
    expect(claimsToIdentity("microsoft", { ...base, xms_edov: true }).emailVerified).toBe(true);
    expect(claimsToIdentity("microsoft", { ...base, xms_edov: "true" }).emailVerified).toBe(false);
  });

  it("or when the tenant is one the operator listed", () => {
    const before = process.env.SSO_MICROSOFT_TENANTS;
    process.env.SSO_MICROSOFT_TENANTS = "aaaaaaaa-0000-0000-0000-000000000000, BBBBBBBB-0000-0000-0000-000000000000";
    try {
      expect(claimsToIdentity("microsoft", { ...base, tid: "bbbbbbbb-0000-0000-0000-000000000000" }).emailVerified).toBe(true);
      expect(claimsToIdentity("microsoft", { ...base, tid: "cccccccc-0000-0000-0000-000000000000" }).emailVerified).toBe(false);
    } finally {
      if (before === undefined) delete process.env.SSO_MICROSOFT_TENANTS;
      else process.env.SSO_MICROSOFT_TENANTS = before;
    }
  });

  it("Google is still its own boolean", () => {
    expect(claimsToIdentity("google", { ...base, email_verified: true }).emailVerified).toBe(true);
    expect(claimsToIdentity("google", { ...base }).emailVerified).toBe(false);
  });
});

describe("ID-token verification", () => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = { ...(publicKey.export({ format: "jwk" }) as object), kid: "zz-key" } as never;
  const fetchKeys = async () => ({ keys: [jwk] });

  function mint(claims: Record<string, unknown>, header: Record<string, unknown> = { alg: "RS256", kid: "zz-key" }) {
    const h = b64url(JSON.stringify(header));
    const p = b64url(JSON.stringify(claims));
    const signature = cryptoSign("RSA-SHA256", Buffer.from(`${h}.${p}`), privateKey);
    return `${h}.${p}.${b64url(signature)}`;
  }

  const good = {
    iss: "https://accounts.google.com",
    aud: "client-1",
    sub: "sub-1",
    exp: Math.floor(Date.now() / 1000) + 300,
    nonce: "n-1",
    email: "x@example.com",
  };
  const opts = {
    jwksUrl: "https://example.test/jwks",
    issuer: { exact: "https://accounts.google.com" },
    audience: "client-1",
    nonce: "n-1",
    fetchKeys,
  };

  it("accepts a properly signed token", async () => {
    const claims = await verifyIdToken(mint(good), opts);
    expect(claims?.sub).toBe("sub-1");
  });

  it("refuses every downgrade and mismatch", async () => {
    // alg "none" — the classic forgery — and any non-RS256.
    expect(await verifyIdToken(mint(good, { alg: "none", kid: "zz-key" }), opts)).toBeNull();
    // A tampered payload under the old signature.
    const [h, , s] = mint(good).split(".");
    const tampered = `${h}.${b64url(JSON.stringify({ ...good, sub: "evil" }))}.${s}`;
    expect(await verifyIdToken(tampered, opts)).toBeNull();
    // Wrong issuer, wrong audience, wrong nonce, expired.
    expect(await verifyIdToken(mint({ ...good, iss: "https://evil.test" }), opts)).toBeNull();
    expect(await verifyIdToken(mint({ ...good, aud: "someone-else" }), opts)).toBeNull();
    expect(await verifyIdToken(mint({ ...good, nonce: "other" }), opts)).toBeNull();
    expect(
      await verifyIdToken(mint({ ...good, exp: Math.floor(Date.now() / 1000) - 10 }), opts),
    ).toBeNull();
  });
});

describe("Apple's client secret", () => {
  it("is a five-minute ES256 JWT Apple could verify", () => {
    const { privateKey, publicKey } = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const jwt = appleClientSecret({
      clientId: "test.service.id",
      teamId: "TEAM123456",
      keyId: "KEY1234567",
      privateKeyPem: privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    });

    const [h, p, s] = jwt.split(".") as [string, string, string];
    const header = JSON.parse(Buffer.from(h, "base64url").toString());
    const payload = JSON.parse(Buffer.from(p, "base64url").toString());
    expect(header).toEqual({ alg: "ES256", kid: "KEY1234567" });
    expect(payload.iss).toBe("TEAM123456");
    expect(payload.sub).toBe("test.service.id");
    expect(payload.aud).toBe("https://appleid.apple.com");
    expect(payload.exp - payload.iat).toBe(300);

    const ok = cryptoVerify(
      "sha256",
      Buffer.from(`${h}.${p}`),
      { key: publicKey, dsaEncoding: "ieee-p1363" },
      Buffer.from(s, "base64url"),
    );
    expect(ok).toBe(true);
  });
});
