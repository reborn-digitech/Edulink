/**
 * The operator's pause of a person inside a school (testing analysis of 13 November 2026, operator-console batch).
 *
 * TA-170 (Medium, Security): setMembershipSuspension only flipped the membership to SUSPENDED and audited it, where
 * the school's own pause (membership.ts) also re-syncs the stand-in guardianships the person holds and takes a college
 * teacher's public page down. So a class teacher the operator paused kept the ACTIVE relation SCHOOL guardianships
 * they held for pupils with no family on the app, and with them the parent context for those pupils; a paused faculty
 * member's public page stayed up; and an invited (not yet ACTIVE) membership could be paused. Now the operator's door
 * does what the school's does: refuses a target that is not ACTIVE, takes the school's row lock, re-syncs the
 * stand-ins after a pause and after a reinstatement, and takes the public page down.
 *
 * Every row is one this suite makes (a stamped ZZ school, @test.invalid accounts) and removes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { setMembershipSuspension } from "@/lib/operator-oversight";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-taopc-ov-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
let operator: ActiveContext;

function ctx(userId: string): ActiveContext {
  return {
    sessionId: `zz-taopc-ov-${STAMP}`,
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "ZZ TA Operator",
      preferredName: null,
      email: MAIL("operator"),
      avatarKey: null,
      isMinor: false,
      isSuperuser: true,
      isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function user(who: string): Promise<string> {
  return (await db.user.create({ data: { name: `ZZ TA OPC ${who}`, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
}

async function member(userId: string, role: string, status = "ACTIVE"): Promise<string> {
  return (await db.membership.create({ data: { userId, schoolId: ids.school!, role, status }, select: { id: true } })).id;
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA OPC Oversight ${STAMP}`, slug: `zz-taopc-ov-${STAMP}`, code: `ZOPV${String(STAMP).slice(-6)}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  ids.operator = (await db.user.create({ data: { name: "ZZ TA Operator", email: MAIL("operator"), isSuperuser: true, prefs: "{}" }, select: { id: true } })).id;
  operator = ctx(ids.operator);

  ids.adminUser = await user("admin");
  ids.adminM = await member(ids.adminUser, "ADMIN");
  ids.teacherUser = await user("teacher");
  ids.teacherM = await member(ids.teacherUser, "TEACHER");
  ids.facultyUser = await user("faculty");
  ids.facultyM = await member(ids.facultyUser, "FACULTY");
  ids.invitedUser = await user("invited");
  ids.invitedM = await member(ids.invitedUser, "TEACHER", "PENDING");
  ids.pupilUser = await user("pupil");
  ids.pupilM = await member(ids.pupilUser, "STUDENT");

  ids.class = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ TA OPC 7A", gradeLevel: "7", joinCode: `ZOPV-${STAMP}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.class, schoolId: ids.school, teacherMembershipId: ids.teacherM, role: "LEAD" } });
  await db.enrollment.create({ data: { classId: ids.class, schoolId: ids.school, studentMembershipId: ids.pupilM, status: "ACTIVE" } });
  // The pupil has no family on the app, so their class teacher stands in.
  await db.guardianship.create({ data: { parentUserId: ids.teacherUser, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, relation: "SCHOOL", status: "ACTIVE" } });

  // A faculty member's published page.
  ids.facultyRecord = (
    await db.facultyRecord.create({
      data: { schoolId: ids.school, membershipId: ids.facultyM, designation: "ASSISTANT_PROFESSOR", appointment: "REGULAR", highestQualification: "PHD", publicProfileAt: new Date() },
      select: { id: true },
    })
  ).id;
  await db.facultyPublicProfile.create({ data: { schoolId: ids.school, schoolSlug: `zz-taopc-ov-${STAMP}`, facultyRecordId: ids.facultyRecord, snapshotJson: "{}" } });
}, 60_000);

afterAll(async () => {
  const members = await db.membership.findMany({ where: { schoolId: ids.school! }, select: { userId: true } });
  const userIds = [...new Set([...members.map((m) => m.userId), ids.operator!])];
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school! } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school! }, { actorUserId: { in: userIds } }] } });
  await db.operatorAccess.deleteMany({ where: { schoolId: ids.school! } });
  await db.school.deleteMany({ where: { id: ids.school! } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe.sequential("TA-170: the operator's pause does what the school's own pause does", () => {
  it("TA-170: an invited membership that never became ACTIVE is refused, and nothing is written", async () => {
    const out = await setMembershipSuspension(operator, ids.school!, ids.invitedM!, { suspended: true, reason: "ZZ safeguarding report" });
    expect(out.ok).toBe(false);
    const row = await db.membership.findUniqueOrThrow({ where: { id: ids.invitedM! }, select: { status: true } });
    expect(row.status).toBe("PENDING");
  });

  it("TA-170: a class teacher the operator pauses stops standing in for the pupils they held", async () => {
    const out = await setMembershipSuspension(operator, ids.school!, ids.teacherM!, { suspended: true, reason: "ZZ safeguarding report" });
    expect(out).toEqual({ ok: true });
    const held = await db.guardianship.count({ where: { parentUserId: ids.teacherUser!, studentSchoolId: ids.school!, relation: "SCHOOL", status: "ACTIVE" } });
    expect(held).toBe(0);
    // The admin is the fallback that stands in now.
    const admin = await db.guardianship.count({ where: { parentUserId: ids.adminUser!, studentMembershipId: ids.pupilM!, relation: "SCHOOL", status: "ACTIVE" } });
    expect(admin).toBe(1);
  });

  it("TA-170: reinstated by the operator, the class teacher takes their pupil back from the fallback", async () => {
    const out = await setMembershipSuspension(operator, ids.school!, ids.teacherM!, { suspended: false, reason: "" });
    expect(out).toEqual({ ok: true });
    const teacher = await db.guardianship.count({ where: { parentUserId: ids.teacherUser!, studentMembershipId: ids.pupilM!, relation: "SCHOOL", status: "ACTIVE" } });
    const admin = await db.guardianship.count({ where: { parentUserId: ids.adminUser!, studentMembershipId: ids.pupilM!, relation: "SCHOOL", status: "ACTIVE" } });
    expect(teacher).toBe(1);
    expect(admin).toBe(0);
  });

  it("TA-170: a faculty member the operator pauses has their public page taken down", async () => {
    const out = await setMembershipSuspension(operator, ids.school!, ids.facultyM!, { suspended: true, reason: "ZZ safeguarding report" });
    expect(out).toEqual({ ok: true });
    expect(await db.facultyPublicProfile.count({ where: { facultyRecordId: ids.facultyRecord! } })).toBe(0);
    const record = await db.facultyRecord.findUniqueOrThrow({ where: { id: ids.facultyRecord! }, select: { publicProfileAt: true } });
    expect(record.publicProfileAt).toBeNull();
  });

  it("TA-170: the last-admin rule still holds under the lock", async () => {
    const out = await setMembershipSuspension(operator, ids.school!, ids.adminM!, { suspended: true, reason: "ZZ safeguarding report" });
    expect(out).toEqual({ ok: false, errorKey: "root.onlyAdmin" });
  });
});
