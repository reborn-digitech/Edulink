/**
 * A guardian ends their own link to a child (guardianship.ts, through
 * DELETE /api/v1/family/children/{membershipId}/link): one of two guardians
 * simply leaves; the last one hands over to the school's stand-in; a school
 * with nobody to stand in refuses and keeps the link; the office is told;
 * nobody else may use the door, and the school's own stand-in link is not
 * a parent's to end.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { DELETE as unlink } from "@/app/api/v1/family/children/[membershipId]/link/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let bareSchoolId = "";
let adminUserId = "";
let teacherUserId = "";
let parentAUserId = "";
let parentBUserId = "";
let strangerUserId = "";
let loneParentUserId = "";
let pupilMembershipId = "";
let barePupilMembershipId = "";

const call = (membershipId: string, body: unknown = { confirm: true }) =>
  unlink(new Request(`http://localhost/api/v1/family/children/${membershipId}/link`, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ membershipId }) });

async function as(userId: string | null, role: "PARENT" | "TEACHER" = "PARENT") {
  __resetCookies();
  if (userId) await createSession(userId, role === "PARENT" ? { schoolId: null, role } : { schoolId, role });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Unlink School ${STAMP}`, slug: `zz-unlink-${STAMP}`, code: `ZU${suffix}`, contactEmail: `zz-unlink-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  bareSchoolId = (await db.school.create({ data: { name: `ZZ Unlink Bare ${STAMP}`, slug: `zz-unlink-b-${STAMP}`, code: `ZV${suffix}`, contactEmail: `zz-unlink-b-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Unlink ${who}`, email: `zz-unlink-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, teacher, parentA, parentB, stranger, lone, pupil, barePupil] = await Promise.all([mk("Admin"), mk("Teacher"), mk("Parent A"), mk("Parent B"), mk("Stranger"), mk("Lone Parent"), mk("Pupil"), mk("Bare Pupil")]);
  adminUserId = admin.id;
  teacherUserId = teacher.id;
  parentAUserId = parentA.id;
  parentBUserId = parentB.id;
  strangerUserId = stranger.id;
  loneParentUserId = lone.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZUP${STAMP}`, gradeLevel: "7" }, select: { id: true } });
  pupilMembershipId = pm.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Unlink 7A", gradeLevel: "7", joinCode: `ZU${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: pm.id, status: "ACTIVE" } });
  await db.guardianship.createMany({
    data: [
      { parentUserId: parentAUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" },
      { parentUserId: parentBUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "GUARDIAN" },
    ],
  });
  // A school with no class teacher and no admin: nobody can stand in.
  const bpm = await db.membership.create({ data: { userId: barePupil.id, schoolId: bareSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZUB${STAMP}` }, select: { id: true } });
  barePupilMembershipId = bpm.id;
  await db.guardianship.create({ data: { parentUserId: loneParentUserId, studentMembershipId: bpm.id, studentSchoolId: bareSchoolId, status: "ACTIVE", relation: "PARENT" } });
  // The stranger guards a child of their own, so the family gate lets them in; our pupil is still not theirs.
  const own = await db.membership.create({ data: { userId: (await mk("Stranger Child")).id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZUS${STAMP}` }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId: strangerUserId, studentMembershipId: own.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" } });
});

afterAll(async () => {
  __resetCookies();
  const users = [adminUserId, teacherUserId, parentAUserId, parentBUserId, strangerUserId, loneParentUserId];
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { slug: { in: [`zz-unlink-${STAMP}`, `zz-unlink-b-${STAMP}`] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the door", () => {
  it("401 signed out, 403 for a teacher, 422 without the confirmation, 404 for a parent the child is not linked to", async () => {
    await as(null);
    expect((await call(pupilMembershipId)).status).toBe(401);
    await as(teacherUserId, "TEACHER");
    expect((await call(pupilMembershipId)).status).toBe(403);
    await as(parentAUserId);
    expect((await call(pupilMembershipId, {})).status).toBe(422);
    expect((await call(pupilMembershipId, { confirm: false })).status).toBe(422);
    await as(strangerUserId);
    expect((await call(pupilMembershipId)).status).toBe(404);
    // Nothing moved.
    expect(await db.guardianship.count({ where: { studentMembershipId: pupilMembershipId, status: "ACTIVE" } })).toBe(2);
  });
});

describe("ending the link", () => {
  it("one of two guardians leaves: revoked not deleted, the other untouched, no stand-in, audited, the office told", async () => {
    await as(parentBUserId);
    const res = await call(pupilMembershipId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, schoolStandsIn: false, remaining: 0 });
    const rows = await db.guardianship.findMany({ where: { studentMembershipId: pupilMembershipId }, select: { parentUserId: true, status: true, relation: true } });
    expect(rows.find((r) => r.parentUserId === parentBUserId)).toMatchObject({ status: "REVOKED" });
    expect(rows.find((r) => r.parentUserId === parentAUserId)).toMatchObject({ status: "ACTIVE" });
    expect(rows.some((r) => r.relation === "SCHOOL")).toBe(false);
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "guardianship.unlinked", actorUserId: parentBUserId, targetId: pupilMembershipId } });
    expect(audit).not.toBeNull();
    expect(JSON.parse(audit!.meta)).toMatchObject({ relation: "GUARDIAN", schoolStandsIn: false });
    const told = await db.notification.findFirst({ where: { userId: adminUserId, schoolId, kind: "SYSTEM" }, orderBy: { createdAt: "desc" } });
    expect(told?.title).toBe("ZZ Unlink Parent B removed ZZ Unlink Pupil from their account");
    expect(told?.body).toBe("ZZ Unlink Pupil still has another guardian linked.");
    // Done is done: a second DELETE finds no active link.
    expect((await call(pupilMembershipId)).status).toBe(404);
  });

  it("the last family guardian hands over to the school's stand-in — the class teacher", async () => {
    await as(parentAUserId);
    const res = await call(pupilMembershipId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, schoolStandsIn: true, remaining: 0 });
    const standin = await db.guardianship.findFirst({ where: { studentMembershipId: pupilMembershipId, status: "ACTIVE" } });
    expect(standin).toMatchObject({ parentUserId: teacherUserId, relation: "SCHOOL" });
    const told = await db.notification.findFirst({ where: { userId: adminUserId, schoolId, kind: "SYSTEM" }, orderBy: { createdAt: "desc" } });
    expect(told?.body).toBe("ZZ Unlink Pupil has no family guardian on the app now; the school stands in until one links again.");
  });

  it("the school's own stand-in link is not a parent's to end", async () => {
    await as(teacherUserId);
    expect((await call(pupilMembershipId)).status).toBe(403);
    expect(await db.guardianship.count({ where: { studentMembershipId: pupilMembershipId, status: "ACTIVE", relation: "SCHOOL" } })).toBe(1);
  });

  it("with nobody at the school to stand in, the unlink is refused and the link stays", async () => {
    await as(loneParentUserId);
    const res = await call(barePupilMembershipId);
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("Nobody else is linked to ZZ Unlink Bare Pupil");
    const link = await db.guardianship.findFirst({ where: { parentUserId: loneParentUserId, studentMembershipId: barePupilMembershipId } });
    expect(link?.status).toBe("ACTIVE");
    expect(await db.auditLog.count({ where: { schoolId: bareSchoolId, action: "guardianship.unlinked" } })).toBe(0);
  });
});
