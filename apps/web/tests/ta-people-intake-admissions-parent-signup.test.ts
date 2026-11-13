/**
 * TA-287 (testing analysis of 13 November 2026, Low, Security): the parent's
 * sign-up still said whether an address had an account.
 *
 * signUpParent looked the address up in the whole User table and answered
 * "An account already uses this email" for a taken one, so a signed-out caller
 * could test any pupil's, parent's or staff member's address, twenty an hour;
 * and a free address was taken by the probe, with a session, at once. QA-25
 * fixed the school's and the recruiter's sign-ups and left this one. Now it
 * answers as they do: one sentence either way and no session; after the answer
 * a free address gets its account and the confirmation link, and the holder of
 * a taken one is told by email that somebody tried.
 *
 * Every row is one this suite makes (@test.invalid addresses) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/constants";
import { signUpParent } from "@/app/join/actions";
import { __resetCookies, __setHeaders, cookies } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-tapia-signup-${who}-${STAMP}@test.invalid`;
const PASSWORD = `Zz-tapia-${STAMP}-Kingfisher`;
let holderId = "";

async function until<T>(read: () => Promise<T | null | undefined>, ms = 15_000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const value = await read();
    if (value) return value;
    if (Date.now() > end) throw new Error("the deferred work never landed");
    await new Promise((r) => setTimeout(r, 100));
  }
}
const form = (email: string) => ({ name: "ZZ TAPIA Signup Parent", email, password: PASSWORD, consentSharing: true, consentNotifications: true });

beforeAll(async () => {
  process.env.EMAIL_TRANSPORT ??= "devbox";
  holderId = (await db.user.create({ data: { name: "ZZ TAPIA Signup Holder", email: MAIL("holder"), prefs: "{}", emailVerifiedAt: new Date() }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const made = await db.user.findMany({ where: { email: { startsWith: "zz-tapia-signup-", endsWith: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const ids = made.map((u) => u.id);
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`signup-notice:${MAIL("holder")}`, `signup-notice:${MAIL("free")}`] } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.authToken.deleteMany({ where: { userId: { in: ids } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.outboundEmail.deleteMany({ where: { to: { in: [MAIL("holder"), MAIL("free")] } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
});

describe.sequential("TA-287: the parent's sign-up answers the same whether or not the address has an account", () => {
  it("TA-287: a taken and a free address get the same answer and no session either way", async () => {
    __resetCookies();
    __setHeaders({});
    const taken = await signUpParent(form(MAIL("holder")));
    expect((await cookies()).get(SESSION_COOKIE)).toBeUndefined();
    __resetCookies();
    const free = await signUpParent(form(MAIL("free")));
    expect((await cookies()).get(SESSION_COOKIE)).toBeUndefined();

    expect(taken.ok).toBe(true);
    expect(taken.errors).toEqual({});
    expect(Object.keys(taken).sort()).toEqual(Object.keys(free).sort());
    expect(JSON.stringify(taken).replace(MAIL("holder"), "<email>")).toBe(JSON.stringify(free).replace(MAIL("free"), "<email>"));
  });

  it("TA-287: after the answer the holder is told by email and nothing is made under their address", { timeout: 30_000 }, async () => {
    const notice = await until(() => db.outboundEmail.findFirst({ where: { to: MAIL("holder"), purpose: "SIGNUP_EXISTING" }, select: { text: true } }));
    expect(notice.text).toContain("sign up as a parent");
    expect(await db.user.count({ where: { email: MAIL("holder") } })).toBe(1);
    expect((await db.user.findUniqueOrThrow({ where: { id: holderId }, select: { passwordHash: true } })).passwordHash).toBeNull();
  });

  it("TA-287: the free address gets its account, unconfirmed, and the confirmation link", { timeout: 30_000 }, async () => {
    const made = await until(() => db.user.findUnique({ where: { email: MAIL("free") }, select: { id: true, emailVerifiedAt: true, passwordHash: true } }));
    expect(made.emailVerifiedAt).toBeNull();
    expect(made.passwordHash).toBeTruthy();
    await until(() => db.outboundEmail.findFirst({ where: { to: MAIL("free"), purpose: "EMAIL_VERIFY" }, select: { id: true } }));
    expect(await db.authToken.count({ where: { userId: made.id, purpose: "EMAIL_VERIFY" } })).toBe(1);
  });
});
