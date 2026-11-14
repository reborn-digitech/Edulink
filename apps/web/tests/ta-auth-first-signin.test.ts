/**
 * The first sign-in (testing analysis of 13 November 2026, auth batch).
 *
 * TA-278 (Medium, Functional): the web form and the phone's door charged every submit against the login's ten a
 * quarter-hour per caller address, so a class doing its first sign-in together from the school's one address was
 * refused at the eleventh pupil. The allowance is now a computer room's (CODE_LOOKUPS, as the class code's lookup);
 * the five tries on each code still bound guessing.
 *
 * TA-502 (Low, Functional): the door answered a password the rule refuses, after a right code, with 401 and no
 * field, and its contract let through passwords under the rule's ten. Now the contract's floor is ten and the
 * refusal is a 422 against the password, with the try given back.
 *
 * Every row is one this suite makes (a stamped ZZ school, stamped @edulink.local handles) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { firstSignInSchema } from "@edulink/contracts";
import { hashToken } from "@/lib/crypto";
import { FIRST_SIGNIN_PURPOSE } from "@/lib/first-signin";
import { completeFirstSignIn } from "@/app/first-signin/actions";
import { POST as firstSignInPost } from "@/app/api/v1/auth/first-signin/route";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";

const db = new PrismaClient();
const STAMP = Date.now();
// A documentation-range address (2001:db8::/32) under the prefix tests/setup.ts leaves alone, so a second vitest
// process's set-up cannot wipe this suite's per-address bucket while it is counting.
const CALLER = `2001:db8:7a:80:${Math.floor(STAMP / 65536).toString(16).slice(-4)}:${(STAMP % 65536).toString(16)}::1`;
const CLASS = 15;
const CODE = "ABCD2345";
const handle = (i: number) => `zz-taauth-fs${i}-${STAMP}`;
let schoolId = "";
const userIds: string[] = [];

async function pupilWithCode(i: number): Promise<string> {
  const id = (await db.user.create({ data: { name: `ZZ TA Auth Pupil ${i}`, email: `${handle(i)}@edulink.local`, prefs: "{}", isMinor: true }, select: { id: true } })).id;
  userIds.push(id);
  await db.membership.create({ data: { userId: id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `STU-ZTAF-${String(STAMP).slice(-5)}-${i}` } });
  await db.authToken.create({
    data: { userId: id, purpose: FIRST_SIGNIN_PURPOSE, tokenHash: hashToken(`${id}:${CODE}`), meta: JSON.stringify({ attempts: 0, schoolId }), expiresAt: new Date(Date.now() + 86_400_000) },
  });
  return id;
}

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ TA Auth First ${STAMP}`, slug: `zz-taauth-fs-${STAMP}`, code: `ZTAF${String(STAMP).slice(-6)}`, contactEmail: `zz-taauth-fs-school-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  for (let i = 0; i < CLASS + 1; i++) await pupilWithCode(i);
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.rateLimit.deleteMany({ where: { bucket: `first-signin:${CALLER}` } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.authToken.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: userIds } }] } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe.sequential("TA-278: a class signs in for the first time together from one address", () => {
  it(`TA-278: ${CLASS} pupils behind the school's one address all get in`, { timeout: 120_000 }, async () => {
    __setHeaders({ "x-forwarded-for": CALLER });
    await db.rateLimit.deleteMany({ where: { bucket: `first-signin:${CALLER}` } });
    const results: { ok: boolean }[] = [];
    for (let i = 0; i < CLASS; i++) {
      __resetCookies();
      results.push(await completeFirstSignIn({ handle: handle(i), code: CODE, password: `Zz-Kingfisher-${STAMP}-${i}` }));
    }
    expect(results.filter((r) => r.ok).length).toBe(CLASS);
    expect(await db.session.count({ where: { userId: { in: userIds.slice(0, CLASS) }, revokedAt: null } })).toBe(CLASS);
  });
});

describe.sequential("TA-502: the door answers a refused password as the password's problem", () => {
  it("TA-502: the contract refuses a nine-character password, as the rule does", () => {
    expect(firstSignInSchema.safeParse({ handle: "zz.pupil", code: CODE, password: "zzriver77" }).success).toBe(false);
    expect(firstSignInSchema.safeParse({ handle: "zz.pupil", code: CODE, password: "Zz-river-7731" }).success).toBe(true);
  });

  it("TA-502: a right code with a password the rule refuses is 422 against the password, and the try is given back", async () => {
    __resetCookies();
    __setHeaders({ "x-forwarded-for": CALLER });
    const last = userIds[CLASS]!;
    await db.rateLimit.deleteMany({ where: { bucket: `first-signin:${CALLER}` } });
    const res = await firstSignInPost(
      new Request("http://localhost/api/v1/auth/first-signin", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": CALLER },
        body: JSON.stringify({ handle: handle(CLASS), code: CODE, password: `${handle(CLASS)}-Kite` }),
      }),
    );
    expect(res.status).toBe(422);
    const body = (await res.json()) as { code: string; issues?: Record<string, string> };
    expect(body.code).toBe("BAD_REQUEST");
    expect(body.issues?.password).toBeTruthy();
    const token = await db.authToken.findFirstOrThrow({ where: { userId: last, purpose: FIRST_SIGNIN_PURPOSE }, select: { attempts: true, consumedAt: true } });
    expect(token.attempts).toBe(0);
    expect(token.consumedAt).toBeNull();
  });
});
