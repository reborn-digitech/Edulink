/**
 * End-to-end security checks that the role matrix (the API sweep) and the
 * cross-tenant probes (api-sweep --cross) do not cover: the life of a
 * session, an anonymous door's rate limit, and a client that sends fields
 * it may not set.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { CODE_LOOKUPS } from "@/lib/rate-limit";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as verifyGet } from "@/app/api/v1/public/certificates/[code]/route";
import { GET as familyChildrenGet } from "@/app/api/v1/family/children/route";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { POST as familyChangePost } from "@/app/api/v1/family/record/changes/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let parentUserId = "";
let teacherUserId = "";
let pupil = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Sec School ${STAMP}`, slug: `zz-sec-${STAMP}`, code: `ZS${suffix}`, contactEmail: `zz-sec-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Sec ${who}`, email: `zz-sec-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, parent, teacher, p] = await Promise.all([mk("Admin"), mk("Parent"), mk("Teacher"), mk("Pupil")]);
  adminUserId = admin.id; parentUserId = parent.id; teacherUserId = teacher.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  pupil = (await db.membership.create({ data: { userId: p.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZSA${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupil, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, parentUserId, teacherUserId] } } });
  await db.rateLimit.deleteMany({ where: { bucket: { contains: `zz-sec-${STAMP}` } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the life of a session", () => {
  it("an expired session, a revoked one and a session for a school the person has left are all refused", async () => {
    __resetCookies();
    await createSession(parentUserId, { schoolId: null, role: "PARENT" });
    expect((await familyChildrenGet()).status).toBe(200);
    // Expired: the row says so, the door refuses.
    await db.session.updateMany({ where: { userId: parentUserId }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    expect((await familyChildrenGet()).status).toBe(401);
    // Revoked: the same.
    __resetCookies();
    await createSession(parentUserId, { schoolId: null, role: "PARENT" });
    await db.session.updateMany({ where: { userId: parentUserId, revokedAt: null }, data: { revokedAt: new Date() } });
    expect((await familyChildrenGet()).status).toBe(401);
    // A session naming a school role the membership no longer holds cannot use it.
    __resetCookies();
    await createSession(teacherUserId, { schoolId, role: "TEACHER" });
    await db.membership.updateMany({ where: { userId: teacherUserId, schoolId }, data: { status: "SUSPENDED" } });
    const res = await recordGet(get(`/api/v1/office/pupil-records/${pupil}`), params({ membershipId: pupil }));
    expect([401, 403]).toContain(res.status);
    await db.membership.updateMany({ where: { userId: teacherUserId, schoolId }, data: { status: "ACTIVE" } });
  });
});

describe("a door open to anyone is counted", () => {
  it("the certificate check answers a hundred and twenty times from one address, then 429 with Retry-After", async () => {
    __resetCookies();
    const ip = `203.0.113.${STAMP % 250}`;
    __setHeaders({ "x-forwarded-for": ip });
    await db.rateLimit.deleteMany({ where: { bucket: `certificate-check:${ip}` } });
    let last = 0;
    for (let i = 0; i < CODE_LOOKUPS.limit; i += 1) {
      last = (await verifyGet(get("/api/v1/public/certificates/NOSUCHCODE1"), params({ code: "NOSUCHCODE1" }))).status;
      expect(last).not.toBe(429);
    }
    const blocked = await verifyGet(get("/api/v1/public/certificates/NOSUCHCODE1"), params({ code: "NOSUCHCODE1" }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toMatch(/^\d+$/);
    await db.rateLimit.deleteMany({ where: { bucket: `certificate-check:${ip}` } });
    __setHeaders({});
  });
});

describe("fields a client may not set", () => {
  it("a guardian cannot set the PEN or the roll number through the record, and a body naming another school changes nothing", async () => {
    __resetCookies();
    await createSession(parentUserId, { schoolId: null, role: "PARENT" });
    // A guardian writes nothing on the record; what they may ask for leaves out the PEN and the roll number, and a body naming a key the ask does not have is refused whole.
    const res = await familyChangePost(json(`/api/v1/family/record/changes?childId=${pupil}`, { changes: { fatherName: "R", penNumber: "27000000001", rollNumber: "3", schoolId: "someone-else", role: "ADMIN" }, reason: "ZZ test" }));
    expect(res.status).toBe(422);
    expect(await db.recordChangeRequest.count({ where: { studentMembershipId: pupil } })).toBe(0);
    __resetCookies();
    await createSession(adminUserId, { schoolId, role: "ADMIN" });
    const ok = await recordPost(json(`/api/v1/office/pupil-records/${pupil}`, { fatherName: "R", schoolId: "someone-else", studentMembershipId: "someone-else" }), params({ membershipId: pupil }));
    expect(ok.status).toBe(200);
    const row = await db.pupilRecord.findUniqueOrThrow({ where: { studentMembershipId: pupil }, select: { schoolId: true, studentMembershipId: true } });
    expect(row).toEqual({ schoolId, studentMembershipId: pupil });
  });
});
