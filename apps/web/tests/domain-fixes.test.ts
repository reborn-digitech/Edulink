import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError, assertClassAccess } from "@/lib/tenancy";
import { arrangeCover, assertClassAccessForRegister, registerDuty } from "@/lib/register-duty";
import { createThread } from "@/lib/remarks";
import { applyForLeave, decideLeave } from "@/lib/leave";
import { cardsForChild } from "@/lib/report-cards";
import { windowFor } from "@/lib/insights";
import { closeAcademicYear, createAcademicYear, currentAcademicYear } from "@/lib/academic-year";
import { inQuietHours } from "@/lib/notify";
import { saveAttendanceBatch } from "@/lib/attendance";
import { openSlotsFor, publishSlots } from "@/lib/meetings";
import { forSchool } from "@/lib/tenant-context";
import type { ActiveContext } from "@/lib/session";

/**
 * Pins for the findings of the adversarial library review — each one a
 * behaviour a person would meet, reproduced on a school built here and torn
 * down after.
 */
const db = new PrismaClient();
const STAMP = Date.now();

let schoolId = "";
let classId = "";
let pupilMembershipId = "";
let adminMembershipId = "";
let teacherAMembershipId = "";
let teacherBMembershipId = "";
let adminCtx: ActiveContext;
let principalCtx: ActiveContext;
let teacherACtx: ActiveContext;
let teacherBCtx: ActiveContext;
let parentCtx: ActiveContext;

function ctx(over: { userId: string; membershipId?: string | null; role: ActiveContext["role"]; schoolId?: string | null }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId === undefined ? schoolId : over.schoolId,
    role: over.role,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
    },
  } as ActiveContext;
}

beforeAll(async () => {
  const school = await db.school.create({
    data: {
      name: `ZZ Domain School ${STAMP}`,
      slug: `zz-domain-${STAMP}`,
      code: `ZD${String(STAMP).slice(-6)}`,
      contactEmail: `zz-domain-school-${STAMP}@test.invalid`,
      // West of UTC on purpose: the year-window finding only shows there.
      timezone: "America/Toronto",
    },
    select: { id: true },
  });
  schoolId = school.id;
  const mkUser = (name: string) =>
    db.user.create({ data: { name, email: `zz-domain-${name.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacherA, teacherB, pupil, parent] = await Promise.all([
    mkUser("Admin"), mkUser("Principal"), mkUser("Teacher A"), mkUser("Teacher B"), mkUser("Pupil"), mkUser("Parent"),
  ]);
  const mk = (userId: string, role: string, code?: string) =>
    db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE", studentCode: code ?? null }, select: { id: true } });
  const [adminM, principalM, aM, bM, pM] = await Promise.all([
    mk(admin.id, "ADMIN"), mk(principal.id, "PRINCIPAL"), mk(teacherA.id, "TEACHER"), mk(teacherB.id, "TEACHER"), mk(pupil.id, "STUDENT", `ZDP${STAMP}`),
  ]);
  adminMembershipId = adminM.id;
  teacherAMembershipId = aM.id;
  teacherBMembershipId = bM.id;
  pupilMembershipId = pM.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Domain 6", joinCode: `ZD${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: aM.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pM.id, status: "ACTIVE" } });
  await db.guardianship.create({
    data: { parentUserId: parent.id, studentMembershipId: pM.id, studentSchoolId: schoolId, relation: "PARENT", status: "ACTIVE" },
  });
  adminCtx = ctx({ userId: admin.id, membershipId: adminM.id, role: "ADMIN" });
  principalCtx = ctx({ userId: principal.id, membershipId: principalM.id, role: "PRINCIPAL" });
  teacherACtx = ctx({ userId: teacherA.id, membershipId: aM.id, role: "TEACHER" });
  teacherBCtx = ctx({ userId: teacherB.id, membershipId: bM.id, role: "TEACHER" });
  // A real guardian's session names no school.
  parentCtx = ctx({ userId: parent.id, membershipId: null, role: "PARENT", schoolId: null });
});

afterAll(async () => {
  await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a covering teacher who does not teach the class", () => {
  it("passes the register's tenant boundary on the strength of the cover row", async () => {
    const cover = await arrangeCover(adminCtx, {
      classId,
      coveringMembershipId: teacherBMembershipId,
      fromDateKey: "2026-06-01",
      toDateKey: "2026-06-05",
      reason: "test",
    });
    expect(cover.ok).toBe(true);
    const duty = await registerDuty(teacherBCtx, classId, "2026-06-03");
    expect(duty).toMatchObject({ may: true, reason: "COVER" });
    // The old boundary refused them — this is the failure people met.
    await expect(assertClassAccess(teacherBCtx as never, classId)).rejects.toBeInstanceOf(AccessError);
    // The cover-aware boundary lets them through, for a write too.
    await expect(assertClassAccessForRegister(teacherBCtx as never, classId, duty, { write: true })).resolves.toBeUndefined();
    // …and refuses somebody with no duty at all, and a class in no school of theirs.
    const none = await registerDuty(teacherBCtx, classId, "2026-07-01");
    expect(none.may).toBe(false);
    await expect(assertClassAccessForRegister(teacherBCtx as never, classId, none)).rejects.toBeInstanceOf(AccessError);
  });
});

describe("a guardian whose session names no school", () => {
  it("can still open a thread with the child's teacher", async () => {
    const { threadId } = await forSchool(schoolId, () =>
      createThread(parentCtx, { studentMembershipId: pupilMembershipId, teacherMembershipId: teacherAMembershipId, subject: "Reading", body: "How is she doing?" }),
    );
    const thread = await db.remarkThread.findUniqueOrThrow({ where: { id: threadId } });
    expect(thread.schoolId).toBe(schoolId);
    // Still not with a teacher who does not teach the child.
    await expect(
      forSchool(schoolId, () =>
        createThread(parentCtx, { studentMembershipId: pupilMembershipId, teacherMembershipId: teacherBMembershipId, subject: "x", body: "y" }),
      ),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("deciding leave", () => {
  it("two simultaneous approvals produce one decision and one set of cover", async () => {
    const applied = await applyForLeave(teacherACtx, { fromDateKey: "2026-08-03", toDateKey: "2026-08-04", kind: "SICK", reason: "test" });
    expect(applied.ok).toBe(true);
    const id = (await db.leaveRequest.findFirstOrThrow({ where: { teacherMembershipId: teacherAMembershipId, fromDateKey: "2026-08-03" } })).id;
    const results = await Promise.all([
      decideLeave(principalCtx, id, "APPROVED", { coverMembershipId: teacherBMembershipId }),
      decideLeave(principalCtx, id, "APPROVED", { coverMembershipId: teacherBMembershipId }),
    ]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(results.find((r) => !r.ok)).toMatchObject({ errorKey: "leaveKind.alreadyDecided" });
    expect(await db.attendanceCover.count({ where: { leaveRequestId: id } })).toBe(1);
  });

  it("an admin named as the substitute for a class is honoured, not silently dropped", async () => {
    const applied = await applyForLeave(teacherACtx, { fromDateKey: "2026-08-10", toDateKey: "2026-08-11", kind: "CASUAL", reason: "test" });
    expect(applied.ok).toBe(true);
    const id = (await db.leaveRequest.findFirstOrThrow({ where: { teacherMembershipId: teacherAMembershipId, fromDateKey: "2026-08-10" } })).id;
    const result = await decideLeave(principalCtx, id, "APPROVED", {
      coverAssignments: [{ classId, subject: "Maths", coverMembershipId: adminMembershipId }],
    });
    expect(result.ok).toBe(true);
    expect(result.coversCreated).toBe(1);
    expect(await db.attendanceCover.count({ where: { leaveRequestId: id, coveringMembershipId: adminMembershipId } })).toBe(1);
  });
});

describe("report cards by teacher", () => {
  it("lists a pupil's cards for their own teacher, and refuses a teacher across the corridor", async () => {
    await expect(cardsForChild(teacherACtx, pupilMembershipId)).resolves.toEqual([]);
    await expect(cardsForChild(teacherBCtx, pupilMembershipId)).rejects.toBeInstanceOf(AccessError);
    await expect(cardsForChild(parentCtx, pupilMembershipId)).resolves.toEqual([]);
  });
});

describe("the academic year", () => {
  let first = "";
  let second = "";
  it("the head's 'year so far' starts on the year's own first day, west of UTC too", async () => {
    first = await createAcademicYear(adminCtx, { name: "2025–26", startDate: new Date("2025-04-01T00:00:00Z"), endDate: new Date("2026-03-31T00:00:00Z") });
    second = await createAcademicYear(adminCtx, { name: "2026–27", startDate: new Date("2026-04-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z") });
    await db.academicYear.updateMany({ where: { schoolId }, data: { isCurrent: false } });
    await db.academicYear.update({ where: { id: first }, data: { isCurrent: true } });
    expect((await currentAcademicYear(schoolId))?.id).toBe(first);
    const window = await windowFor(schoolId, "year");
    expect(window.fromDateKey).toBe("2025-04-01");
  });

  it("only the running year closes, and never into a year already closed", async () => {
    await expect(closeAcademicYear(adminCtx, second, first)).rejects.toMatchObject({ key: "access.onlyTheCurrentYearCloses" });
    await closeAcademicYear(adminCtx, first, second);
    expect((await currentAcademicYear(schoolId))?.id).toBe(second);
    await expect(closeAcademicYear(adminCtx, second, first)).rejects.toMatchObject({ key: "access.cannotMoveIntoAClosedYear" });
  });
});

describe("quiet hours", () => {
  it("are read in the person's zone, not the server's", () => {
    const quiet = { start: "22:00", end: "07:00" };
    const at = new Date("2026-09-07T20:00:00Z"); // 01:30 in Kolkata, 21:00 in London
    expect(inQuietHours(quiet, at, "Asia/Kolkata")).toBe(true);
    expect(inQuietHours(quiet, at, "Europe/London")).toBe(false);
    expect(inQuietHours(quiet, new Date("2026-09-07T12:00:00Z"), "Asia/Kolkata")).toBe(false);
  });
});

describe("attendance marks", () => {
  it("a device that sends garbage for its clock still gets its mark saved, and told once per change into an absence", async () => {
    const teacherA = teacherACtx;
    const first = await saveAttendanceBatch({
      schoolId, classId, dateKey: "2026-06-10", takenByMembershipId: teacherAMembershipId, actorUserId: teacherA.user.id, notify: false,
      marks: [{ studentMembershipId: pupilMembershipId, status: "LATE", clientId: `c1-${STAMP}`, markedAt: "not a date" }],
    });
    expect(first.applied).toBe(1);
    const second = await saveAttendanceBatch({
      schoolId, classId, dateKey: "2026-06-10", takenByMembershipId: teacherAMembershipId, actorUserId: teacherA.user.id,
      marks: [{ studentMembershipId: pupilMembershipId, status: "ABSENT", clientId: `c2-${STAMP}` }],
    });
    expect(second.applied).toBe(1);
    // Late → absent is a change into an absence, and the guardian is told.
    const told = await db.notification.count({ where: { schoolId, kind: "ATTENDANCE" } });
    expect(told).toBe(1);
  });
});

describe("meeting slots reach the families the teacher teaches", () => {
  it("a subject teacher on the timetable, on no class-teacher row, is offered — for the taught child only", async () => {
    // Teacher B teaches class X one period a week on the timetable and marks no register.
    const period = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ P1", position: 1, startMinute: 540, endMinute: 585 }, select: { id: true } });
    await db.timetableSlot.create({ data: { schoolId, classId, periodId: period.id, weekday: 1, subject: "Hindi", teacherMembershipId: teacherBMembershipId } });
    const created = await publishSlots(teacherBCtx, { startsAt: new Date(Date.now() + 7 * 86_400_000), durationMinutes: 15, count: 1, location: "Room 9" });
    expect(created.created).toBe(1);
    const open = await openSlotsFor(parentCtx.user.id);
    const theirs = open.filter((slot) => slot.location === "Room 9");
    expect(theirs).toHaveLength(1);
    expect(theirs[0]!.forStudentMembershipIds).toEqual([pupilMembershipId]);
  });
});
