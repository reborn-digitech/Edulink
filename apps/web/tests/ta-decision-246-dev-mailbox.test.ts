/**
 * The owner's decision on TA-246 of the testing analysis of 13 November 2026.
 *
 * TA-246 (Medium, Security): /dev/mailbox, which lists the sign-in links and codes a dev server "sent", skipped the
 * operator check when the caller's address read as loopback, and that address came from X-Forwarded-For, which Next
 * fills from the socket only when the caller sent none. `next dev` listened on every address of the Mac, so anyone on
 * the same network could write `X-Forwarded-For: 127.0.0.1` and read them.
 *
 * Decided (14 November 2026): the dev server listens on this Mac only, a second start command opens it to the network
 * for the days a phone must reach it, and on those days the mailbox asks for the operator. The sign-in redirects were
 * to be fixed if a server named 127.0.0.1 landed them without the cookie; they do not: Next folds a loopback name in a
 * route handler's URL to "localhost" (next/dist/server/web/next-url.js, REGEX_LOCALHOST_HOSTNAME), so `/magic` and
 * sign-out still answer on http://localhost:3000, the address the mailbox's links name. The cases below hold that.
 *
 * Every row is one this suite makes (a stamped ZZ school, @test.invalid accounts, their tokens and sessions) and
 * removes.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { generateToken, hashToken } from "@/lib/crypto";
import { GET as magicGet, POST as magicPost } from "@/app/magic/route";
import { POST as logoutPost } from "@/app/api/auth/logout/route";
import MailboxPage from "@/app/dev/mailbox/page";
import { TWO_FACTOR_COOKIE } from "@/lib/two-factor";
import { __resetCookies, __setHeaders, cookies } from "../tests/stubs/next-headers";
import * as React from "react";

// Server components compiled with the classic JSX runtime here need React in scope.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta246-${who}-${STAMP}@test.invalid`;
const ROOT = join(__dirname, "..", "..", "..");
const ENV_KEYS = ["EDULINK_DEV_LOOPBACK", "NEXT_PUBLIC_APP_URL"] as const;
const saved: Record<string, string | undefined> = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));

let schoolId = "";
const made: string[] = [];

async function account(who: string, totp = false): Promise<string> {
  const id = (
    await db.user.create({
      data: {
        name: `ZZ TA246 ${who}`,
        email: MAIL(who),
        emailVerifiedAt: new Date(),
        ...(totp ? { totpEnabledAt: new Date(), totpSecretEnc: "sealed-in-test", totpRecoveryHashes: ["zz-recovery"] } : {}),
        prefs: "{}",
      },
      select: { id: true },
    })
  ).id;
  made.push(id);
  await db.membership.create({ data: { userId: id, schoolId, role: "TEACHER", status: "ACTIVE" } });
  return id;
}

async function mint(userId: string, email: string): Promise<string> {
  const token = generateToken();
  await db.authToken.create({ data: { userId, email, purpose: "MAGIC_LINK", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 20 * 60_000) } });
  return token;
}

const spent = async (token: string) => (await db.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(token) } })).consumedAt !== null;

/**
 * A request as `next dev -H 127.0.0.1` hands it to a route handler: the URL carries the name the server was started
 * with (next's resolve-routes builds it from the bind name), while the browser addressed localhost:3000. The handler
 * gets a NextRequest, as here, whose URL Next has folded back to localhost.
 */
const boundPost = (token: string, origin: string) =>
  magicPost(
    new NextRequest("http://127.0.0.1:3000/magic", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", host: "localhost:3000", origin },
      body: new URLSearchParams({ token }).toString(),
    }),
  );

/** The page's render, or the redirect it threw (requireSuperuser sends a signed-out caller to /login). */
async function renderMailbox(headers: Record<string, string>): Promise<{ redirect: string | null }> {
  __resetCookies();
  __setHeaders(headers);
  try {
    await MailboxPage();
    return { redirect: null };
  } catch (error) {
    const digest = (error as { digest?: unknown }).digest;
    if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) return { redirect: digest.split(";")[2] ?? digest };
    throw error;
  }
}

function restoreEnv(): void {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA246 Mailbox ${STAMP}`, slug: `zz-ta246-${STAMP}`, code: `ZT246${String(STAMP).slice(-6)}`, contactEmail: MAIL("school"), timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
});

afterEach(() => {
  restoreEnv();
  __setHeaders({});
  __resetCookies();
});

afterAll(async () => {
  restoreEnv();
  __resetCookies();
  __setHeaders({});
  const ids = (await db.user.findMany({ where: { OR: [{ id: { in: made } }, { email: { startsWith: "zz-ta246-", endsWith: `-${STAMP}@test.invalid` } }] }, select: { id: true } })).map((u) => u.id);
  await db.twoFactorChallenge.deleteMany({ where: { userId: { in: ids } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.authToken.deleteMany({ where: { userId: { in: ids } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: ids } }, { schoolId }] } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe.sequential("TA-246: the dev mailbox trusts no header to mean 'this Mac'", () => {
  it("TA-246: a caller on the network who writes X-Forwarded-For: 127.0.0.1 is sent to sign in, on a server open to the network", async () => {
    delete process.env.EDULINK_DEV_LOOPBACK;
    const seen = await renderMailbox({ "x-forwarded-for": "127.0.0.1", host: "192.168.1.20:3000" });
    expect(seen.redirect).toBe("/login");
  });

  it("TA-246: a server open to the network asks for the operator even of a caller on this Mac", async () => {
    delete process.env.EDULINK_DEV_LOOPBACK;
    const seen = await renderMailbox({ "x-forwarded-for": "::1", host: "localhost:3000" });
    expect(seen.redirect).toBe("/login");
    // And with no forwarded address at all, on a localhost Host header.
    expect((await renderMailbox({ host: "localhost:3000" })).redirect).toBe("/login");
  });

  it("TA-246: on the server bound to this Mac a loopback caller still reads the mailbox with no sign-in (the sweep's ordinary day)", async () => {
    process.env.EDULINK_DEV_LOOPBACK = "1";
    expect((await renderMailbox({ "x-forwarded-for": "127.0.0.1", host: "localhost:3000" })).redirect).toBeNull();
    expect((await renderMailbox({ "x-forwarded-for": "::ffff:127.0.0.1", host: "127.0.0.1:3000" })).redirect).toBeNull();
  });

  it("TA-246: on the server bound to this Mac a forwarded outside address (a tunnel in front of it) still asks for the operator", async () => {
    process.env.EDULINK_DEV_LOOPBACK = "1";
    expect((await renderMailbox({ "x-forwarded-for": "203.0.113.9", host: "localhost:3000" })).redirect).toBe("/login");
  });

  it("TA-246: npm run dev listens on 127.0.0.1 and says so; dev:network is the second command that opens it to the network", () => {
    const web = JSON.parse(readFileSync(join(ROOT, "apps", "web", "package.json"), "utf8")) as { scripts: Record<string, string> };
    const root = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as { scripts: Record<string, string> };
    expect(web.scripts.dev).toMatch(/(^|\s)EDULINK_DEV_LOOPBACK=1\s/);
    expect(web.scripts.dev).toMatch(/\bnext dev\b.*\s-H 127\.0\.0\.1(\s|$)/);
    const network = web.scripts["dev:network"] ?? "";
    expect(network).toMatch(/\bnext dev\b/);
    expect(network).not.toContain("EDULINK_DEV_LOOPBACK");
    expect(network).not.toContain("127.0.0.1");
    expect(root.scripts["dev:network"]).toBe("pnpm --filter @edulink/web dev:network");
  });
});

describe.sequential("TA-246: sign-in and sign-out land on the address the browser used", () => {
  it("TA-246: a mailbox link pressed on localhost:3000 signs in and lands on localhost, with the cookie, when the server is named 127.0.0.1", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const userId = await account("bound");
    const token = await mint(userId, MAIL("bound"));
    const done = await boundPost(token, "http://localhost:3000");
    expect(done.status).toBe(303);
    expect(done.headers.get("location")).toBe("http://localhost:3000/teacher");
    expect(await spent(token)).toBe(true);
    expect(await db.session.count({ where: { userId, revokedAt: null } })).toBe(1);
    const jar = await cookies();
    expect(jar.get("edulink_session")?.value ?? jar.get("__Host-edulink_session")?.value).toBeTruthy();
  });

  it("TA-246: the two-step code page is reached on the same address, with its cookie", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const userId = await account("twostep", true);
    const done = await boundPost(await mint(userId, MAIL("twostep")), "http://localhost:3000");
    expect(done.status).toBe(303);
    expect(done.headers.get("location")).toBe("http://localhost:3000/login/code");
    expect(done.cookies.get(TWO_FACTOR_COOKIE)?.value).toBeTruthy();
  });

  it("TA-246: a form on another site is still refused before the token is looked at, on the same address", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const userId = await account("cross");
    const token = await mint(userId, MAIL("cross"));
    const res = await boundPost(token, "https://evil.invalid");
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?link=bad");
    expect(await spent(token)).toBe(false);
  });

  it("TA-246: a link with no token goes to the login form on the address the browser used", async () => {
    const res = await magicGet(new NextRequest("http://127.0.0.1:3000/magic", { headers: { host: "localhost:3000" } }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?link=bad");
  });

  it("TA-246: sign-out lands on the login page of the address the browser used", async () => {
    const res = await logoutPost(new NextRequest("http://127.0.0.1:3000/api/auth/logout", { method: "POST", headers: { host: "localhost:3000" } }));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login");
  });
});
