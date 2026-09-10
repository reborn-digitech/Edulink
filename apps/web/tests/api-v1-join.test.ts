/**
 * POST /api/v1/join/lookup and POST /api/v1/join, invoked directly with a
 * primed session the way api-v1-operator.test.ts does: 401 signed out; a ZZ
 * person with no school looks up a ZZ school's code and a ZZ class code,
 * then joins with the class code — 200 with /me showing the school and
 * STUDENT active, a pupil membership and the enrolment on their own id; a
 * too-short code and a parent's account are 422s with the lib's sentence;
 * the code-guessing limit is a 429. Every row is a ZZ row made here and
 * deleted afterwards; the requests carry an address of their own, so the
 * limit's bucket is this file's alone.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { apiErrorSchema, joinLookupSchema, meSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { CODE_LOOKUPS } from "@/lib/rate-limit";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { POST as lookupPost } from "@/app/api/v1/join/lookup/route";
import { POST as joinPost } from "@/app/api/v1/join/route";

const db = new PrismaClient();
const STAMP = Date.now();
const DIGITS = String(STAMP).slice(-6);
const SCHOOL_CODE = `ZJ${DIGITS}`;
const CLASS_CODE = `ZJC-${DIGITS.slice(-4)}`;
const IP = `198.51.100.${(STAMP % 250) + 1}`;
const LIMITED_IP = `198.51.100.${((STAMP + 1) % 250) + 1}`;

let schoolId = "";
let classId = "";
let joinerUserId = "";
let parentUserId = "";
let pupilUserId = "";

const post = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function signInAs(userId: string | null) {
  __resetCookies();
  if (userId) await createSession(userId);
}

beforeAll(async () => {
  __setHeaders({ "x-forwarded-for": IP });
  const school = await db.school.create({
    data: { name: `ZZ V1J School ${STAMP}`, slug: `zz-v1j-${STAMP}`, code: SCHOOL_CODE, contactEmail: `zz-v1j-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "ZZ Town" },
    select: { id: true },
  });
  schoolId = school.id;
  const klass = await db.class.create({ data: { schoolId, name: `ZZ V1J Class ${STAMP}`, gradeLevel: "5", joinCode: CLASS_CODE }, select: { id: true } });
  classId = klass.id;

  const [joiner, parent, pupil] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1J Joiner", email: `zz-v1j-joiner-${STAMP}@test.invalid`, birthdate: new Date("2014-02-02T00:00:00Z") }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1J Parent", email: `zz-v1j-parent-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1J Pupil", email: `zz-v1j-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  joinerUserId = joiner.id;
  parentUserId = parent.id;
  pupilUserId = pupil.id;
  // The parent guards a ZZ pupil, which is what makes theirs a parent's account.
  const pupilMembership = await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilMembership.id, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const ids = [joinerUserId, parentUserId, pupilUserId].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: { in: [`code-lookup:${IP}`, `code-lookup:${LIMITED_IP}`] } } });
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  if (schoolId) {
    await db.auditLog.deleteMany({ where: { schoolId } });
    await db.enrollment.deleteMany({ where: { schoolId } });
    await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
    await db.membership.deleteMany({ where: { schoolId } });
    await db.class.deleteMany({ where: { schoolId } });
  }
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("is a 401 on both", async () => {
    await signInAs(null);
    expect((await lookupPost(post("/api/v1/join/lookup", { code: CLASS_CODE }))).status).toBe(401);
    expect((await joinPost(post("/api/v1/join", { code: CLASS_CODE }))).status).toBe(401);
  });
});

describe("a person with no school", () => {
  it("looks up a school's code and a class's code", async () => {
    await signInAs(joinerUserId);
    const school = await lookupPost(post("/api/v1/join/lookup", { code: SCHOOL_CODE.toLowerCase() }));
    expect(school.status).toBe(200);
    expect(joinLookupSchema.parse(await school.json())).toEqual({ kind: "school", schoolName: `ZZ V1J School ${STAMP}`, className: null });

    const klass = await lookupPost(post("/api/v1/join/lookup", { code: CLASS_CODE }));
    expect(klass.status).toBe(200);
    expect(joinLookupSchema.parse(await klass.json())).toEqual({ kind: "class", schoolName: `ZZ V1J School ${STAMP}`, className: `ZZ V1J Class ${STAMP}` });
  });

  it("a too-short code is a 422 with the sentence on the code, on both; an empty body is a 422", async () => {
    await signInAs(joinerUserId);
    for (const [path, handler] of [["/api/v1/join/lookup", lookupPost], ["/api/v1/join", joinPost]] as const) {
      const res = await handler(post(path, { code: "AB" }));
      expect(res.status).toBe(422);
      const body = apiErrorSchema.parse(await res.json());
      expect(body.error).toBe("That code looks too short.");
      expect(body.issues?.code).toBe("That code looks too short.");
      expect((await handler(post(path, {}))).status).toBe(422);
    }
  });

  it("joins with the class code: 200, /me shows the school and STUDENT active, a membership and the enrolment exist", async () => {
    await signInAs(joinerUserId);
    const res = await joinPost(post("/api/v1/join", { code: CLASS_CODE }));
    expect(res.status).toBe(200);
    const me = meSchema.parse(await res.json());
    expect(me.user.id).toBe(joinerUserId);
    expect(me.active).toMatchObject({ schoolId, role: "STUDENT" });
    expect(me.active.membershipId).toBeTruthy();
    expect(me.contexts).toContainEqual({ schoolId, schoolName: `ZZ V1J School ${STAMP}`, role: "STUDENT" });

    const membership = await db.membership.findFirstOrThrow({ where: { userId: joinerUserId, schoolId, role: "STUDENT", status: "ACTIVE" } });
    expect(me.active.membershipId).toBe(membership.id);
    expect(await db.enrollment.count({ where: { classId, studentMembershipId: membership.id, status: "ACTIVE" } })).toBe(1);
    // The session itself moved: the row says so, not only the answer.
    const session = await db.session.findFirstOrThrow({ where: { userId: joinerUserId }, orderBy: { createdAt: "desc" } });
    expect(session).toMatchObject({ activeSchoolId: schoolId, activeRole: "STUDENT" });
    // No second account: still exactly one user by that address.
    expect(await db.user.count({ where: { email: `zz-v1j-joiner-${STAMP}@test.invalid` } })).toBe(1);
  });

  it("a parent's account is refused with the parent sentence, and joins nothing", async () => {
    await signInAs(parentUserId);
    const res = await joinPost(post("/api/v1/join", { code: CLASS_CODE }));
    expect(res.status).toBe(422);
    const body = apiErrorSchema.parse(await res.json());
    expect(body.error).toBe("This account is linked to a child as a parent, so it cannot join a class as a pupil. Sign out and use the pupil's own account.");
    expect(body.issues).toBeUndefined();
    expect(await db.membership.count({ where: { userId: parentUserId } })).toBe(0);
  });
});

describe("⚠ guessing codes", () => {
  it("counts against the web's allowance per caller, and is a 429 with Retry-After at the limit", async () => {
    await signInAs(joinerUserId);
    __setHeaders({ "x-forwarded-for": LIMITED_IP });
    try {
      await db.rateLimit.upsert({
        where: { bucket: `code-lookup:${LIMITED_IP}` },
        create: { bucket: `code-lookup:${LIMITED_IP}`, hits: CODE_LOOKUPS.limit, windowEndsAt: new Date(Date.now() + CODE_LOOKUPS.windowMs) },
        update: { hits: CODE_LOOKUPS.limit, windowEndsAt: new Date(Date.now() + CODE_LOOKUPS.windowMs) },
      });
      const res = await lookupPost(post("/api/v1/join/lookup", { code: CLASS_CODE }));
      expect(res.status).toBe(429);
      expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
      const body = apiErrorSchema.parse(await res.json());
      expect(body.code).toBe("RATE_LIMITED");
      expect(body.error).toMatch(/^Too many tries\. Wait /);
    } finally {
      __setHeaders({ "x-forwarded-for": IP });
    }
  });
});
