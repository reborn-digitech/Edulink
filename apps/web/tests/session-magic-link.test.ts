import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { generateToken, hashToken } from "@/lib/crypto";
import { GET as magicGet, POST as magicPost } from "@/app/magic/route";
import { __resetCookies } from "../tests/stubs/next-headers";

/**
 * The magic link: shown on GET, spent on POST.
 *
 * A mail scanner, a link preview and a prefetch all GET. None of them may
 * burn the link, and none of them may be signed in by it. The person
 * presses the button; the POST spends the token once, and only from this
 * site's own page, and only while the link's address is still the account's.
 */

const db = new PrismaClient();
const STAMP = Date.now();
const EMAIL = `zz-magic-${STAMP}@test.invalid`;
let userId = "";
let schoolId = "";

async function mint(email = EMAIL): Promise<string> {
  const token = generateToken();
  await db.authToken.create({
    data: { userId, email, purpose: "MAGIC_LINK", tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 20 * 60_000) },
  });
  return token;
}

const spent = async (token: string) => (await db.authToken.findUniqueOrThrow({ where: { tokenHash: hashToken(token) } })).consumedAt !== null;

const post = (token: string, origin: string | null = "http://localhost") =>
  magicPost(
    new NextRequest("http://localhost/magic", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", ...(origin ? { origin } : {}) },
      body: new URLSearchParams({ token }).toString(),
    }),
  );

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ Magic School ${STAMP}`, slug: `zz-magic-${STAMP}`, code: `ZMG${String(STAMP).slice(-6)}`, contactEmail: `zz-magic-s-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  userId = (await db.user.create({ data: { name: "ZZ Magic", email: EMAIL, emailVerifiedAt: new Date() }, select: { id: true } })).id;
  await db.membership.create({ data: { userId, schoolId, role: "TEACHER", status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId } });
  await db.authToken.deleteMany({ where: { userId } });
  await db.auditLog.deleteMany({ where: { actorUserId: userId } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

describe("the magic link", () => {
  it("⚠ GET shows a page with a button and spends nothing; POST spends it and signs in", async () => {
    __resetCookies();
    const token = await mint();

    const shown = await magicGet(new NextRequest(`http://localhost/magic?token=${token}`));
    expect(shown.status).toBe(200);
    expect(shown.headers.get("content-type")).toContain("text/html");
    const html = await shown.text();
    expect(html).toContain('method="post"');
    expect(html).toContain(`value="${token}"`);
    expect(await spent(token)).toBe(false);
    expect(await db.session.count({ where: { userId } })).toBe(0);

    const done = await post(token);
    expect(done.status).toBe(303);
    expect(done.headers.get("location")).toBe("http://localhost/teacher");
    expect(await spent(token)).toBe(true);
    expect(await db.session.count({ where: { userId, revokedAt: null } })).toBe(1);

    // Pressed again: used, and nothing more is minted.
    const again = await post(token);
    expect(again.headers.get("location")).toBe("http://localhost/login?link=used");
    expect(await db.session.count({ where: { userId, revokedAt: null } })).toBe(1);
  });

  it("a POST from another site is refused before the token is looked at", async () => {
    __resetCookies();
    const token = await mint();
    const res = await post(token, "https://evil.invalid");
    expect(res.headers.get("location")).toBe("http://localhost/login?link=bad");
    expect(await spent(token)).toBe(false);
  });

  it("a link minted for an address the account no longer has does not sign in", async () => {
    __resetCookies();
    const token = await mint(`zz-magic-old-${STAMP}@test.invalid`);
    const before = await db.session.count({ where: { userId, revokedAt: null } });
    const res = await post(token);
    expect(res.headers.get("location")).toBe("http://localhost/login?link=bad");
    expect(await db.session.count({ where: { userId, revokedAt: null } })).toBe(before);
  });

  it("no token at all goes to the login form", async () => {
    const res = await magicGet(new NextRequest("http://localhost/magic"));
    expect(res.headers.get("location")).toBe("http://localhost/login?link=bad");
  });
});
