import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { unstaffedLessons } from "@/lib/timetable";

/**
 * The gap between a drawn timetable and a staffed one.
 *
 * A lesson slot with a subject and no teacher is the honest vacancy a school
 * of many grades and few teachers carries — the office's cue to hire. This
 * pins that the school-wide count sees only LIVING classes' LESSON periods:
 * an archived class's empty slots are history, a break is not a lesson, and a
 * staffed slot is not a gap. Reported as raw slots and distinct classes.
 */

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Staffing ${STAMP}`, slug: `zz-staffing-${STAMP}`, code: `ZS${String(STAMP).slice(-6)}`, contactEmail: `zz-staffing-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
  });
  schoolId = school.id;
  const teacherUser = await db.user.create({ data: { name: "ZZ Staffing Teacher", email: `zz-staffing-t-${STAMP}@test.invalid`, prefs: "{}" } });
  const teacher = await db.membership.create({ data: { userId: teacherUser.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });

  const lesson = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ SG P1", startMinute: 480, endMinute: 525, kind: "LESSON", position: 1 } });
  const lesson2 = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ SG P2", startMinute: 530, endMinute: 575, kind: "LESSON", position: 2 } });
  const brk = await db.timetablePeriod.create({ data: { schoolId, name: "ZZ SG Break", startMinute: 575, endMinute: 600, kind: "BREAK", position: 3 } });

  const live1 = await db.class.create({ data: { schoolId, name: "ZZ SG Live 1", gradeLevel: "5", section: "A", joinCode: `ZSG1${String(STAMP).slice(-5)}` } });
  const live2 = await db.class.create({ data: { schoolId, name: "ZZ SG Live 2", gradeLevel: "6", section: "A", joinCode: `ZSG2${String(STAMP).slice(-5)}` } });
  const dead = await db.class.create({ data: { schoolId, name: "ZZ SG Dead", gradeLevel: "7", section: "A", joinCode: `ZSG3${String(STAMP).slice(-5)}`, archivedAt: new Date() } });

  // live1: one staffed lesson, one unstaffed lesson, one unstaffed BREAK (not counted)
  await db.timetableSlot.create({ data: { schoolId, classId: live1.id, periodId: lesson.id, weekday: 1, subject: "Maths", teacherMembershipId: teacher.id } });
  await db.timetableSlot.create({ data: { schoolId, classId: live1.id, periodId: lesson2.id, weekday: 1, subject: "Science", teacherMembershipId: null } });
  await db.timetableSlot.create({ data: { schoolId, classId: live1.id, periodId: brk.id, weekday: 1, subject: "Break", teacherMembershipId: null } });
  // live2: two unstaffed lessons
  await db.timetableSlot.create({ data: { schoolId, classId: live2.id, periodId: lesson.id, weekday: 1, subject: "English", teacherMembershipId: null } });
  await db.timetableSlot.create({ data: { schoolId, classId: live2.id, periodId: lesson2.id, weekday: 2, subject: "History", teacherMembershipId: null } });
  // dead class: an unstaffed lesson that must NOT count
  await db.timetableSlot.create({ data: { schoolId, classId: dead.id, periodId: lesson.id, weekday: 1, subject: "Ghost", teacherMembershipId: null } });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("⚠ counting lessons nobody teaches", () => {
  it("counts unstaffed LESSON slots of LIVING classes only, across distinct classes", async () => {
    const gap = await unstaffedLessons(schoolId);
    // live1 has 1 unstaffed lesson (the break does not count); live2 has 2.
    // The dead class's unstaffed lesson is excluded.
    expect(gap.slots).toBe(3);
    expect(gap.classes).toBe(2);
  });
});
