import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { signInWithPassword } from "@/lib/auth-login";
import { loginIdentityKey } from "@/lib/passwords";
import { LOGIN_ATTEMPTS, LOGIN_PER_ADDRESS } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/crypto";

/**
 * The three walls in front of a password guess.
 *
 * PER LOGIN, keyed on the NORMALISED identity. The bucket used to be keyed on
 * `identifier.toLowerCase()`, so `98765 43210`, `+919876543210` and
 * `+91 98765 43210` were three allowances of ten against one account, and a
 * pupil's `handle` and `handle@edulink.local` were two.
 *
 * PER ADDRESS, failures only, whatever the login — the wall against spraying
 * one password across a school's worth of logins, which the per-login bucket
 * never saw because each login was tried once.
 *
 * GLOBAL, failures only. Asserted here only as "a failure counts", because the
 * bucket is shared with every other suite running at the same time and its
 * ceiling is two thousand.
 *
 * `signInWithPassword` reads the request's address itself, and a test has no
 * request — so the address is passed in, which is the one seam these tests
 * need. Fixtures are this file's own and removed by id.
 */

const db = new PrismaClient();

const SUFFIX = "@zzloginlimits.test";
const PASSWORD = "correct horse battery";
const PHONE = "+919876511001";
const HANDLE = "zzlimits.h4nd";
/** TEST-NET-3, so it can never be a real caller's. */
const ADDRESS = "203.0.113.77";

const made: string[] = [];

async function makeUser(over: { email?: string; phone?: string | null } = {}): Promise<string> {
  const phone = over.phone === null ? null : (over.phone ?? PHONE);
  const user = await db.user.create({
    data: {
      email: over.email ?? `rhea${SUFFIX}`,
      phone,
      phoneVerifiedAt: phone ? new Date() : null,
      name: "Rhea",
      prefs: "{}",
      passwordHash: await hashPassword(PASSWORD),
    },
  });
  made.push(user.id);
  return user.id;
}

async function clearBuckets() {
  await db.rateLimit.deleteMany({
    where: {
      OR: [
        { bucket: { contains: SUFFIX } },
        { bucket: `login:${PHONE}` },
        { bucket: `login:${HANDLE}@edulink.local` },
        { bucket: `login-addr:${ADDRESS}` },
        // A spelling that must NOT get a bucket of its own; removed in case a
        // regression once gave it one.
        { bucket: { startsWith: "login:98765 11001" } },
        { bucket: { startsWith: `login:${HANDLE}` } },
      ],
    },
  });
}

beforeEach(async () => {
  await clearBuckets();
  await makeUser();
});

afterEach(async () => {
  await clearBuckets();
  await db.session.deleteMany({ where: { userId: { in: made } } });
  await db.user.deleteMany({ where: { id: { in: made } } });
  made.length = 0;
});

afterAll(async () => {
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */

describe("the login bucket is keyed on the identity, not the spelling", () => {
  it("resolves every spelling of a number, and of a handle, to one key", () => {
    expect(loginIdentityKey("98765 11001")).toBe(PHONE);
    expect(loginIdentityKey("+91 98765 11001")).toBe(PHONE);
    expect(loginIdentityKey(" +919876511001 ")).toBe(PHONE);
    expect(loginIdentityKey(HANDLE)).toBe(`${HANDLE}@edulink.local`);
    expect(loginIdentityKey(`${HANDLE.toUpperCase()}@edulink.local`)).toBe(`${HANDLE}@edulink.local`);
    expect(loginIdentityKey(`Rhea${SUFFIX}`)).toBe(`rhea${SUFFIX}`);
  });

  it("⚠ '98765 11001' and '+919876511001' share one bucket of ten", async () => {
    const spellings = ["98765 11001", "+919876511001", "+91 98765 11001"];
    for (let i = 0; i < LOGIN_ATTEMPTS.limit; i++) {
      expect(await signInWithPassword(spellings[i % spellings.length]!, "wrong", { caller: null })).toEqual({
        ok: false,
        reason: "noMatch",
      });
    }
    // The eleventh, in any spelling and with the RIGHT password, is refused.
    expect(await signInWithPassword("98765 11001", PASSWORD, { caller: null })).toMatchObject({ ok: false, reason: "rate" });
    expect(await signInWithPassword("+919876511001", PASSWORD, { caller: null })).toMatchObject({ ok: false, reason: "rate" });

    // One row, under the normalised number; none under the spelling typed.
    const row = await db.rateLimit.findUnique({ where: { bucket: `login:${PHONE}` } });
    expect(row?.hits).toBe(LOGIN_ATTEMPTS.limit + 2);
    expect(await db.rateLimit.findFirst({ where: { bucket: { startsWith: "login:98765 11001" } } })).toBeNull();
  });

  it("⚠ a bare handle and its full address share one bucket", async () => {
    for (let i = 0; i < LOGIN_ATTEMPTS.limit; i++) {
      await signInWithPassword(i % 2 === 0 ? HANDLE : `${HANDLE}@edulink.local`, "wrong", { caller: null });
    }
    expect(await signInWithPassword(HANDLE, "wrong", { caller: null })).toMatchObject({ ok: false, reason: "rate" });
    expect(await db.rateLimit.findFirst({ where: { bucket: `login:${HANDLE}` } })).toBeNull();
  });

  it("a person who signs in correctly is let through, and their own bucket forgives with the window", async () => {
    expect((await signInWithPassword("+91 98765 11001", PASSWORD, { caller: null })).ok).toBe(true);
    expect((await signInWithPassword(`Rhea${SUFFIX}`, PASSWORD, { caller: null })).ok).toBe(true);
  });
});

describe("⚠ failures from one address, whatever the login", () => {
  it("the fifty-first failure from one address is refused regardless of identifier; a success in between costs nothing", async () => {
    // Forty-nine different logins, one wrong password each: under the
    // per-login limit every time, which is exactly what a spray looks like.
    for (let i = 0; i < LOGIN_PER_ADDRESS.limit - 1; i++) {
      expect(await signInWithPassword(`spray${i}${SUFFIX}`, "Winter2026!", { caller: ADDRESS })).toEqual({
        ok: false,
        reason: "noMatch",
      });
    }
    // A success from the same address is not a failure and is not counted.
    expect((await signInWithPassword(`rhea${SUFFIX}`, PASSWORD, { caller: ADDRESS })).ok).toBe(true);
    expect((await db.rateLimit.findUnique({ where: { bucket: `login-addr:${ADDRESS}` } }))?.hits).toBe(LOGIN_PER_ADDRESS.limit - 1);

    // The fiftieth failure is the last one let through to the password check…
    expect(await signInWithPassword(`spray-last${SUFFIX}`, "Winter2026!", { caller: ADDRESS })).toEqual({
      ok: false,
      reason: "noMatch",
    });
    // …and from then on the address is refused before it, right password or not.
    const refused = await signInWithPassword(`rhea${SUFFIX}`, PASSWORD, { caller: ADDRESS });
    expect(refused).toMatchObject({ ok: false, reason: "rate" });
    expect((refused as { retryAfterSeconds: number }).retryAfterSeconds).toBeGreaterThan(0);

    // It is the ADDRESS that is refused: the same login from nowhere in
    // particular still gets its answer.
    expect((await signInWithPassword(`rhea${SUFFIX}`, PASSWORD, { caller: null })).ok).toBe(true);
  }, 60_000);

  it("a failure counts against the whole service; the global row moves", async () => {
    const before = (await db.rateLimit.findUnique({ where: { bucket: "login-global" } }))?.hits ?? 0;
    await signInWithPassword(`nobody${SUFFIX}`, "wrong", { caller: null });
    const after = (await db.rateLimit.findUnique({ where: { bucket: "login-global" } }))?.hits ?? 0;
    // At least one — other suites may be failing logins at the same moment,
    // and a window may have rolled over to 1, which is still "moved".
    expect(after === 1 || after >= before + 1).toBe(true);
  });
});
