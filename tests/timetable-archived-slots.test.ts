import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { promoteSchool } from "@/lib/promotion";
import { setSlot } from "@/lib/timetable";
import type { ActiveContext } from "@/lib/session";

/**
 * An archived class holds nobody's Tuesday.
 *
 * Both the clash check and the database unique on (school, weekday, period,
 * teacher) count EVERY slot row, so a class archived at year-end kept its
 * teachers' hours forever: year two of a three-year simulation could not put
 * its own timetable on the same periods at all — the app refused with a clash
 * naming a class no page still shows, and a direct write died on the unique.
 * What must hold now: promotion releases the teachers of the classes it
 * archives; setSlot ignores archived classes when it looks for a clash; and a
 * class archived BEFORE releasing existed (deployed data) is healed lazily,
 * exactly where its dead claim is contested.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId, name: "Test", preferredName: null, email: null, avatarKey: null,
      isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

const CODES = ["ZZZ-TAS1", "ZZZ-TAS2", "ZZZ-TAS3", "ZZZ-TAS4"];
const PUPIL_EMAIL = "p1.tas.unit@riverside.test";

let schoolId: string;
let admin: ActiveContext;
let teacherMembershipId: string;
let periodId: string;
let departing: string; // archived by promotion in the first test
let legacy: string;    // archived by hand WITH its teacher still held — the pre-fix state
let living: string;
let livingToo: string;

async function cleanup() {
  // By NAME, not by join code: the promotion under test may create a
  // destination class of its own, and a leftover unarchived empty class
  // poisons any suite that grabs "the school's first class".
  const classes = await db.class.findMany({ where: { name: { startsWith: "ZZ TAS" } }, select: { id: true } });
  const ids = classes.map((c) => c.id);
  await db.timetableSlot.deleteMany({ where: { classId: { in: ids } } });
  await db.enrollment.deleteMany({ where: { classId: { in: ids } } });
  await db.class.deleteMany({ where: { id: { in: ids } } });
  await db.membership.deleteMany({ where: { user: { email: PUPIL_EMAIL } } });
  await db.user.deleteMany({ where: { email: PUPIL_EMAIL } });
  await db.timetablePeriod.deleteMany({ where: { name: "ZZ TAS Period" } });
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  schoolId = riverside.id;
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId, role: "ADMIN" });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  teacherMembershipId = (await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId, role: "TEACHER" } })).id;

  await cleanup();

  periodId = (await db.timetablePeriod.create({ data: { schoolId, name: "ZZ TAS Period", startMinute: 8 * 60, endMinute: 9 * 60, kind: "LESSON", position: 90 } })).id;
  const mk = async (code: string, name: string, grade: string, archived = false) =>
    (await db.class.create({ data: { schoolId, name, gradeLevel: grade, section: "A", joinCode: code, archivedAt: archived ? new Date() : null } })).id;
  departing = await mk(CODES[0]!, "ZZ TAS Departing", "4");
  legacy = await mk(CODES[1]!, "ZZ TAS Legacy", "5", true);
  living = await mk(CODES[2]!, "ZZ TAS Living", "5");
  livingToo = await mk(CODES[3]!, "ZZ TAS Living Too", "5");

  const pupil = await db.user.create({ data: { email: PUPIL_EMAIL, name: "ZZ TAS Pupil", prefs: "{}" } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE" } });
  await db.enrollment.create({ data: { classId: departing, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });

  // Monday: the class promotion will archive. Tuesday: the legacy class,
  // archived above with its teacher still held — the state every database
  // that predates the release carries.
  await db.timetableSlot.create({ data: { schoolId, classId: departing, periodId, weekday: 1, subject: "Maths", teacherMembershipId } });
  await db.timetableSlot.create({ data: { schoolId, classId: legacy, periodId, weekday: 2, subject: "History", teacherMembershipId } });
});

afterAll(async () => {
  await db.schoolRecord.deleteMany({ where: { student: { email: PUPIL_EMAIL } } });
  await cleanup();
  await db.$disconnect();
});

describe("⚠ archived classes and the timetable", () => {
  it("promotion releases the teachers of the classes it archives", async () => {
    const result = await promoteSchool(admin, [
      { fromClassId: departing, to: { kind: "CLASS", classId: living }, holdBack: [] },
    ]);
    expect(result.ok).toBe(true);
    const klass = await db.class.findUniqueOrThrow({ where: { id: departing } });
    expect(klass.archivedAt).not.toBeNull();
    const slot = await db.timetableSlot.findFirstOrThrow({ where: { classId: departing } });
    // the shape survives; the person is released
    expect(slot.subject).toBe("Maths");
    expect(slot.teacherMembershipId).toBeNull();
  });

  it("setSlot heals a legacy archived claim instead of crashing on the unique", async () => {
    // Before the fix: the clash check named "ZZ TAS Legacy" (a class no page
    // shows), and with the check filtered the upsert died on the DB unique.
    const result = await setSlot(admin, { classId: living, periodId, weekday: 2, subject: "Maths", teacherMembershipId });
    expect(result.ok).toBe(true);
    const stuck = await db.timetableSlot.findFirstOrThrow({ where: { classId: legacy } });
    expect(stuck.teacherMembershipId).toBeNull();
  });

  it("still refuses a real clash between living classes, by name", async () => {
    const result = await setSlot(admin, { classId: livingToo, periodId, weekday: 2, subject: "Science", teacherMembershipId });
    expect(result.ok).toBe(false);
    expect(result.errorKey).toBe("timetable.teacherClash");
  });
});
