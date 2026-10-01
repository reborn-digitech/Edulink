/**
 * The timetable in bulk, against the database: a pasted sheet previewed
 * (an unknown teacher, a clash with a lesson already on the grid, an
 * unknown class, a break, a cell twice) and written once — the same sheet
 * twice leaves the same grid — and one section's week copied to its
 * sister sections with the teachers left blank.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { commitTimetableImport, copyWeekToSections, createPeriod, parseWeekdayWord, previewTimetableImport, setSlot } from "@/lib/timetable";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let rao = "";
let khanA = "";
let classA = "";
let classB = "";
let classC = "";
let period1 = "";
let period2 = "";
let breakId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return { sessionId: "t", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null, user: { id: over.userId, name: "ZZ TT Import", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const slots = (classId: string) => db.timetableSlot.findMany({ where: { schoolId, classId }, orderBy: [{ weekday: "asc" }, { periodId: "asc" }], select: { weekday: true, periodId: true, subject: true, teacherMembershipId: true, room: true } });

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ TT Import ${STAMP}`, slug: `zz-ttimp-${STAMP}`, code: `ZTI${String(STAMP).slice(-5)}`, contactEmail: `zz-ttimp-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string, name = `ZZ TT ${who}`) => db.user.create({ data: { name, email: `zz-ttimp-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, r, k1, k2] = await Promise.all([mk("Admin"), mk("Rao", "ZZ Rao"), mk("KhanA", "ZZ Khan"), mk("KhanB", "ZZ Khan")]);
  adminUserId = a.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  rao = (await db.membership.create({ data: { userId: r.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  khanA = (await db.membership.create({ data: { userId: k1.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: k2.id, schoolId, role: "TEACHER", status: "ACTIVE" } });
  const suffix = String(STAMP).slice(-6);
  classA = (await db.class.create({ data: { schoolId, name: "ZZ Class 5", section: "A", gradeLevel: "5", joinCode: `ZA${suffix}` }, select: { id: true } })).id;
  classB = (await db.class.create({ data: { schoolId, name: "ZZ Class 5 B", section: "B", gradeLevel: "5", joinCode: `ZB${suffix}` }, select: { id: true } })).id;
  classC = (await db.class.create({ data: { schoolId, name: "ZZ Class 5 C", section: "C", gradeLevel: "5", joinCode: `ZC${suffix}` }, select: { id: true } })).id;
  const p = async (name: string, start: number, kind: "LESSON" | "BREAK" = "LESSON") => {
    const r = await createPeriod(admin(), { name, startMinute: start, endMinute: start + 40, kind });
    if (!r.ok || !r.id) throw new Error(r.errorKey);
    return r.id;
  };
  period1 = await p("Period 1", 540);
  breakId = await p("Short break", 580, "BREAK");
  period2 = await p("Period 2", 620);
  // Khan A already teaches 5 B at Monday period 1: the sheet's Rao-free cell for 5 A that names Khan clashes.
  const set = await setSlot(admin(), { classId: classB, periodId: period1, weekday: 1, subject: "Science", teacherMembershipId: khanA });
  if (!set.ok) throw new Error(set.errorKey);
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the sheet", () => {
  it("reads a day as a word, a short word, a number or a Devanagari name", () => {
    expect([parseWeekdayWord("Monday"), parseWeekdayWord("tue"), parseWeekdayWord("3"), parseWeekdayWord("शनिवार"), parseWeekdayWord("Someday")]).toEqual([1, 2, 3, 6, null]);
  });

  it("previews every row: the unknown teacher and the clash keep the lesson without one; the unknown class, the break and the second cell are refused by line", async () => {
    const csv = [
      "day,period,class,subject,teacher,room",
      `Monday,1,ZZ Class 5 A,Maths,zz-ttimp-rao-${STAMP}@test.invalid,12`,
      "Monday,Period 2,ZZ Class 5 A,English,Mrs Nobody,12",
      "Tuesday,1,ZZ Class 5 A,Science,ZZ Khan,",
      "Monday,1,ZZ Class 5 C,Science,ZZ Khan,",
      "Monday,2,ZZ Class 9,History,,",
      "Monday,Short break,ZZ Class 5 A,Milk,,",
      "Monday,1,ZZ Class 5 A,Maths again,,",
      "Funday,1,ZZ Class 5 A,Art,,",
    ].join("\n");
    const preview = await previewTimetableImport(admin(), csv);
    expect(preview.recognised).toEqual({ day: true, period: true, className: true, subject: true, teacher: true, room: true });
    expect(preview.rows.map((r) => [r.line, r.className, r.subject, r.teacherMembershipId, r.teacherIssueKey])).toEqual([
      [2, "ZZ Class 5", "Maths", rao, null],
      [3, "ZZ Class 5", "English", null, "timetable.notTeachingStaff"],
      [4, "ZZ Class 5", "Science", null, "officeBulk.timetableTeacherAmbiguous"],
      [5, "ZZ Class 5 C", "Science", null, "officeBulk.timetableTeacherAmbiguous"],
    ]);
    expect(preview.rows[0]).toMatchObject({ periodId: period1, weekday: 1, room: "12", replaces: false });
    expect(preview.problems.map((p) => [p.line, p.reasonKey])).toEqual([
      [6, "officeBulk.timetableUnknownClass"],
      [7, "timetable.isABreak"],
      [8, "officeBulk.timetableCellTwice"],
      [9, "officeBulk.timetableUnknownDay"],
    ]);
    expect(await slots(classA)).toEqual([]);
  });

  it("a teacher named by email who is already teaching another class then is a clash, and the lesson is written without them", async () => {
    const csv = `day,period,class,subject,teacher\nMon,Period 1,ZZ Class 5 A,Maths,zz-ttimp-khana-${STAMP}@test.invalid\n`;
    const preview = await previewTimetableImport(admin(), csv);
    expect(preview.rows[0]).toMatchObject({ teacherMembershipId: null, teacherIssueKey: "timetable.teacherClash", teacherIssueVars: { class: "ZZ Class 5 B", subject: "Maths" } });
  });

  it("commit writes once; the same sheet again replaces the same cells and writes nothing new", async () => {
    const csv = [
      "day,period,class,subject,teacher,room",
      `Monday,1,ZZ Class 5 A,Maths,zz-ttimp-rao-${STAMP}@test.invalid,12`,
      "Monday,2,ZZ Class 5 A,English,ZZ Rao,12",
      "Tuesday,1,ZZ Class 5 A,Science,Mrs Nobody,",
      "Monday,1,ZZ Class 9,History,,",
    ].join("\n");
    const first = await commitTimetableImport(admin(), csv);
    expect(first).toMatchObject({ written: 3, replaced: 0, unstaffed: 1, classes: 1 });
    expect(first.problems.map((p) => p.reasonKey)).toEqual(["officeBulk.timetableUnknownClass"]);
    const after = await slots(classA);
    expect(after.map((s) => [s.weekday, s.subject, s.teacherMembershipId, s.room])).toEqual([
      [1, "Maths", rao, "12"],
      [1, "English", rao, "12"],
      [2, "Science", null, null],
    ]);
    const second = await commitTimetableImport(admin(), csv);
    expect(second).toMatchObject({ written: 3, replaced: 3, unstaffed: 1 });
    expect(await slots(classA)).toEqual(after);
    expect(await db.timetableSlot.count({ where: { schoolId } })).toBe(4);
    expect(await db.auditLog.count({ where: { schoolId, action: "timetable.import" } })).toBe(2);
  });

  it("only the office writes", async () => {
    await expect(previewTimetableImport(ctx({ userId: adminUserId, membershipId: "x", schoolId, role: "PRINCIPAL" }), "day,period,class,subject\n")).rejects.toThrow("access.onlyAnAdminCanChangeTheTimetable");
  });
});

describe("copy to sister sections", () => {
  it("fills 5 B and 5 C from 5 A's week, subjects and periods kept, teachers and rooms blank, each sister's old week gone", async () => {
    expect((await slots(classB)).map((s) => s.subject)).toEqual(["Science"]);
    const result = await copyWeekToSections(admin(), classA, [classB, classC, classA]);
    expect(result).toMatchObject({ ok: true, copied: 6, unstaffed: 6 });
    expect(result.classes.map((c) => [c.className, c.copied])).toEqual([
      ["ZZ Class 5 B", 3],
      ["ZZ Class 5 C", 3],
    ]);
    for (const sister of [classB, classC]) {
      expect((await slots(sister)).map((s) => [s.weekday, s.periodId, s.subject, s.teacherMembershipId, s.room])).toEqual([
        [1, period1, "Maths", null, null],
        [1, period2, "English", null, null],
        [2, period1, "Science", null, null],
      ]);
    }
    // The source is untouched.
    expect((await slots(classA)).map((s) => s.teacherMembershipId)).toEqual([rao, rao, null]);
    expect(await db.auditLog.count({ where: { schoolId, action: "timetable.sections.copy" } })).toBe(1);
  });

  it("refuses itself alone, another school's class and an empty week", async () => {
    expect(await copyWeekToSections(admin(), classA, [classA])).toMatchObject({ ok: false, errorKey: "officeBulk.copyNeedSections" });
    expect(await copyWeekToSections(admin(), classA, ["not-a-class"])).toMatchObject({ ok: false, errorKey: "timetable.classNotHere" });
    await db.timetableSlot.deleteMany({ where: { schoolId, classId: classC } });
    expect(await copyWeekToSections(admin(), classC, [classB])).toMatchObject({ ok: false, errorKey: "timetable.nothingToCopy" });
    expect(breakId).toBeTruthy();
  });
});
