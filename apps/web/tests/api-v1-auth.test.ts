/**
 * The phone's sign-in and session endpoints, invoked directly: password,
 * magic link, first sign-in, the SSO exchange, me, context switch, device
 * list and revoke, push device registration — each on its happy path and its
 * refusals — plus the bearer read in getSession with its sliding expiry.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { hashPassword, hashToken } from "@/lib/crypto";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as loginPost } from "@/app/api/v1/auth/login/route";
import { POST as consumePost } from "@/app/api/v1/auth/magic-link/consume/route";
import { POST as exchangePost } from "@/app/api/v1/auth/sso/exchange/route";
import { pkceChallengeOf } from "@/lib/auth-tokens";
import { POST as logoutPost } from "@/app/api/v1/auth/logout/route";
import { GET as meGet } from "@/app/api/v1/me/route";
import { POST as contextPost } from "@/app/api/v1/me/context/route";
import { GET as sessionsGet } from "@/app/api/v1/me/sessions/route";
import { DELETE as sessionDelete } from "@/app/api/v1/me/sessions/[sessionId]/route";
import { POST as devicePost, DELETE as deviceDelete } from "@/app/api/v1/me/devices/route";
import { sendExpoPush } from "@/lib/expo-push";

const db = new PrismaClient();
const STAMP = Date.now();
const PASSWORD = `Zz-api-${STAMP}-Kestrel`;
let schoolId = "";
let userId = "";
let email = "";

const json = (path: string, body: unknown, token?: string) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });

/** Route handlers read the bearer through next/headers, which the stub serves. */
function asBearer(token: string | null) {
  __resetCookies();
  __setHeaders(token ? { authorization: `Bearer ${token}` } : {});
}

beforeAll(async () => {
  email = `zz-api-auth-${STAMP}@test.invalid`;
  const school = await db.school.create({
    data: { name: `ZZ API Auth ${STAMP}`, slug: `zz-api-auth-${STAMP}`, code: `ZA${String(STAMP).slice(-6)}`, contactEmail: email, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const user = await db.user.create({
    data: { name: "ZZ API Teacher", email, passwordHash: await hashPassword(PASSWORD), emailVerifiedAt: new Date() },
    select: { id: true },
  });
  userId = user.id;
  await db.membership.create({ data: { userId, schoolId, role: "TEACHER", status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

let token = "";
let sessionId = "";

describe("password sign-in", () => {
  it("refuses a wrong password with 401 and no hint, and an empty body with 422", async () => {
    expect((await loginPost(json("/api/v1/auth/login", {}))).status).toBe(422);
    const wrong = await loginPost(json("/api/v1/auth/login", { identifier: email, password: "nope-nope-nope" }));
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("answers a bearer session with the resolved context, and the bearer opens /me", async () => {
    const res = await loginPost(json("/api/v1/auth/login", { identifier: email, password: PASSWORD, device: "Test phone" }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { token: string; sessionId: string; context: { schoolId: string | null; role: string | null } };
    expect(body.context).toEqual({ schoolId, role: "TEACHER" });
    token = body.token;
    sessionId = body.sessionId;

    asBearer(token);
    const me = await meGet();
    expect(me.status).toBe(200);
    const meBody = (await me.json()) as { user: { email: string }; active: { role: string }; contexts: { role: string }[] };
    expect(meBody.user.email).toBe(email);
    expect(meBody.active.role).toBe("TEACHER");
    expect(meBody.contexts.map((c) => c.role)).toEqual(["TEACHER"]);
    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId }, select: { userAgent: true } });
    expect(row.userAgent).toBe("Test phone");
  });

  it("a stale bearer read slides the expiry out again", async () => {
    const past = new Date(Date.now() - 20 * 86_400_000);
    await db.session.update({ where: { id: sessionId }, data: { lastSeenAt: past, expiresAt: new Date(Date.now() + 5 * 86_400_000) } });
    asBearer(token);
    expect((await meGet()).status).toBe(200);
    const row = await db.session.findUniqueOrThrow({ where: { id: sessionId }, select: { expiresAt: true, lastSeenAt: true } });
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now() + 25 * 86_400_000);
    expect(row.lastSeenAt.getTime()).toBeGreaterThan(past.getTime());
  });

  it("signed out, /me is 401; a garbage bearer is 401 too", async () => {
    asBearer(null);
    expect((await meGet()).status).toBe(401);
    asBearer("not-a-real-token-at-all-really");
    expect((await meGet()).status).toBe(401);
  });
});

describe("context and devices", () => {
  it("switching to a school I do not belong to is refused; my own is accepted", async () => {
    asBearer(token);
    const bad = await contextPost(json("/api/v1/me/context", { schoolId: "c" + "x".repeat(24), role: "ADMIN" }));
    expect(bad.status).toBe(403);
    const good = await contextPost(json("/api/v1/me/context", { schoolId, role: "TEACHER" }));
    expect(good.status).toBe(200);
  });

  it("lists my devices with this one marked, refuses to revoke a stranger's, revokes my own", async () => {
    asBearer(token);
    const list = await sessionsGet();
    const body = (await list.json()) as { sessions: { id: string; current: boolean; device: string | null }[] };
    expect(body.sessions.find((s) => s.current)?.id).toBe(sessionId);
    expect(body.sessions.find((s) => s.current)?.device).toBe("Test phone");

    const stranger = await db.session.create({
      data: { userId: (await db.user.findFirstOrThrow({ where: { email: "zz.admin@zz.test" } })).id, tokenHash: hashToken(`zz-stranger-${STAMP}`), expiresAt: new Date(Date.now() + 60_000), userAgent: "api-test" },
      select: { id: true },
    });
    const refused = await sessionDelete(new Request("http://localhost/x", { method: "DELETE" }), { params: Promise.resolve({ sessionId: stranger.id }) });
    expect(refused.status).toBe(404);
    await db.session.delete({ where: { id: stranger.id } });

    const second = await loginPost(json("/api/v1/auth/login", { identifier: email, password: PASSWORD, device: "Second phone" }));
    const other = (await second.json()) as { sessionId: string };
    asBearer(token);
    expect((await sessionDelete(new Request("http://localhost/x", { method: "DELETE" }), { params: Promise.resolve({ sessionId: other.sessionId }) })).status).toBe(200);
    expect((await db.session.findUniqueOrThrow({ where: { id: other.sessionId } })).revokedAt).not.toBeNull();
  });

  it("registers an Expo token, moves it on re-registration, and sends through it", async () => {
    asBearer(token);
    const tok = `ExponentPushToken[zz${STAMP}]`;
    expect((await devicePost(json("/api/v1/me/devices", { expoPushToken: "junk", platform: "ios" }))).status).toBe(422);
    expect((await devicePost(json("/api/v1/me/devices", { expoPushToken: tok, platform: "ios", device: "iPhone" }))).status).toBe(200);
    expect((await devicePost(json("/api/v1/me/devices", { expoPushToken: tok, platform: "android" }))).status).toBe(200);
    expect(await db.deviceToken.count({ where: { expoPushToken: tok } })).toBe(1);

    const calls: unknown[] = [];
    const fakeFetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 });
    }) as unknown as typeof fetch;
    const sent = await sendExpoPush(userId, { title: "Hi", body: "There" }, fakeFetch);
    expect(sent).toEqual({ delivered: 1, failed: 0, retired: 0, skipped: false });
    expect((calls[0] as { to: string }[])[0]!.to).toBe(tok);

    const dead = vi.fn(async () => new Response(JSON.stringify({ data: [{ status: "error", details: { error: "DeviceNotRegistered" } }] }), { status: 200 })) as unknown as typeof fetch;
    expect(await sendExpoPush(userId, { title: "Hi", body: "Gone" }, dead)).toMatchObject({ retired: 1 });
    expect(await db.deviceToken.count({ where: { expoPushToken: tok } })).toBe(0);

    expect((await deviceDelete(json("/api/v1/me/devices", { expoPushToken: tok }))).status).toBe(200);
  });

  it("forgets a phone's push token when that one session is revoked from another device, and sends nothing to a token whose session ended (campaign PH-4)", async () => {
    const lost = (await (await loginPost(json("/api/v1/auth/login", { identifier: email, password: PASSWORD, device: "Lost phone" }))).json()) as { token: string; sessionId: string };
    const kept = (await (await loginPost(json("/api/v1/auth/login", { identifier: email, password: PASSWORD, device: "Kept phone" }))).json()) as { token: string; sessionId: string };
    const lostTok = `ExponentPushToken[zz-lost-${STAMP}]`;
    const keptTok = `ExponentPushToken[zz-kept-${STAMP}]`;
    asBearer(lost.token);
    expect((await devicePost(json("/api/v1/me/devices", { expoPushToken: lostTok, platform: "ios" }))).status).toBe(200);
    asBearer(kept.token);
    expect((await devicePost(json("/api/v1/me/devices", { expoPushToken: keptTok, platform: "android" }))).status).toBe(200);
    expect((await db.deviceToken.findUniqueOrThrow({ where: { expoPushToken: lostTok } })).sessionId).toBe(lost.sessionId);
    // The kept phone revokes the lost one: its token goes, the kept phone's stays.
    expect((await sessionDelete(new Request("http://localhost/x", { method: "DELETE" }), { params: Promise.resolve({ sessionId: lost.sessionId }) })).status).toBe(200);
    expect(await db.deviceToken.count({ where: { expoPushToken: lostTok } })).toBe(0);
    expect(await db.deviceToken.count({ where: { expoPushToken: keptTok } })).toBe(1);
    // A session that simply expired: its phone is not sent to.
    await db.session.update({ where: { id: kept.sessionId }, data: { expiresAt: new Date(Date.now() - 1000) } });
    const calls: { to: string }[][] = [];
    const fakeFetch = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      calls.push(JSON.parse(String(init?.body)));
      return new Response(JSON.stringify({ data: [{ status: "ok" }] }), { status: 200 });
    }) as unknown as typeof fetch;
    await sendExpoPush(userId, { title: "Hi", body: "There" }, fakeFetch);
    expect(calls.flat().map((m) => m.to)).not.toContain(keptTok);
    await db.deviceToken.deleteMany({ where: { expoPushToken: keptTok } });
    asBearer(token);
  });
});

describe("one-time codes", () => {
  it("a magic-link token signs in once; the same token again is refused", async () => {
    const raw = `zz-magic-${STAMP}`;
    await db.authToken.create({ data: { userId, email, purpose: "MAGIC_LINK", tokenHash: hashToken(raw), expiresAt: new Date(Date.now() + 60_000) } });
    const first = await consumePost(json("/api/v1/auth/magic-link/consume", { token: raw }));
    expect(first.status).toBe(200);
    const again = await consumePost(json("/api/v1/auth/magic-link/consume", { token: raw }));
    expect(again.status).toBe(401);
  });

  it("an SSO exchange code signs in once, only for the app that holds its verifier, and dies after two minutes", async () => {
    const verifier = `zz-verifier-${STAMP}-${"v".repeat(32)}`;
    const mint = (raw: string, over: { meta?: string; expiresAt?: Date } = {}) =>
      db.authToken.create({ data: { userId, purpose: "APP_EXCHANGE", tokenHash: hashToken(raw), meta: over.meta ?? JSON.stringify({ challenge: pkceChallengeOf(verifier) }), expiresAt: over.expiresAt ?? new Date(Date.now() + 120_000) } });
    const exchange = (body: unknown) => exchangePost(json("/api/v1/auth/sso/exchange", body));
    const spent = async (raw: string) => (await db.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(raw) }, select: { consumedAt: true } })).consumedAt !== null;

    // RFC 7636's own example, so the hash is the one every other implementation computes.
    expect(pkceChallengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");

    const raw = `zz-exchange-${STAMP}`;
    await mint(raw);
    // No verifier, or one that is not a verifier: refused by shape, and the code is untouched.
    expect((await exchange({ code: raw })).status).toBe(422);
    expect((await exchange({ code: raw, verifier: "short" })).status).toBe(422);
    expect(await spent(raw)).toBe(false);
    expect((await exchange({ code: raw, verifier })).status).toBe(200);
    expect((await exchange({ code: raw, verifier })).status).toBe(401);

    // The code without its verifier: refused like a wrong code, and spent, so the right verifier is too late.
    const stolen = `zz-stolen-${STAMP}`;
    await mint(stolen);
    const wrong = await exchange({ code: stolen, verifier: `zz-another-apps-${"w".repeat(40)}` });
    const unknown = await exchange({ code: `zz-nobodys-code-${STAMP}`, verifier });
    expect(wrong.status).toBe(401);
    expect(await wrong.json()).toEqual(await unknown.json());
    expect(await spent(stolen)).toBe(true);
    expect((await exchange({ code: stolen, verifier })).status).toBe(401);

    // A code minted against no challenge signs nobody in.
    const bare = `zz-bare-${STAMP}`;
    await mint(bare, { meta: "{}" });
    expect((await exchange({ code: bare, verifier })).status).toBe(401);

    const stale = `zz-stale-${STAMP}`;
    await mint(stale, { expiresAt: new Date(Date.now() - 1_000) });
    expect((await exchange({ code: stale, verifier })).status).toBe(401);
  });
});

describe("logout", () => {
  it("revokes the session the request came with, and the bearer is dead afterwards", async () => {
    asBearer(token);
    expect((await logoutPost()).status).toBe(200);
    expect((await meGet()).status).toBe(401);
  });
});
