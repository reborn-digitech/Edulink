/**
 * The syllabus findings of the testing analysis of 13 November 2026, batch gradebook-exams-reportcards:
 *
 *   TA-144  The head's coverage counted every list of a grade against every class of it, whether or not the class
 *           takes the subject: 11 Commerce sat at 0 % on Physics, behind all year, in "classes behind".
 *   TA-342  A lesson could name a chapter of another subject; marked taught, it moved that subject's progress.
 *
 * One scratch ZZ school of this suite's own (made through the owner connection, removed after): a current year
 * with today at its middle; 11 Science (Physics on its timetable), 11 Commerce (Accountancy), 11 Arts (no timetable
 * and no subject); 7A with English (the English teacher's) and Mathematics; four chapters of Physics and of
 * Accountancy for grade 11, one of English and of Mathematics for grade 7.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { applyPlanTemplate, saveLessonPlan, syllabusCoverage } from "@/lib/syllabus";

const db = new PrismaClient();
const STAMP = Date.now();
const TAIL = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tagsy-${who}-${STAMP}@test.invalid`;
const DAY = 24 * 3600 * 1000;
const ids: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.school!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}
const progressOf = async (classId: string, unitId: string) =>
  (await db.syllabusProgress.findUnique({ where: { classId_unitId: { classId, unitId } }, select: { status: true } }))?.status ?? "NOT_STARTED";

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TA Gradebook Syllabus ${STAMP}`, slug: `zz-tagsy-${STAMP}`, code: `ZTGS${TAIL}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  const S = ids.school;
  for (const [who, role] of [["head", "PRINCIPAL"], ["english", "TEACHER"], ["form", "TEACHER"]] as const) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA Syllabus ${who}`, email: MAIL(who) }, select: { id: true } })).id;
    ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: S, role, status: "ACTIVE" }, select: { id: true } })).id;
  }
  const now = Date.now();
  await db.academicYear.create({ data: { schoolId: S, name: "ZZ TA Syllabus year", startDate: new Date(now - 100 * DAY), endDate: new Date(now + 100 * DAY), isCurrent: true } });
  const klass = async (key: string, name: string, gradeLevel: string) => {
    ids[key] = (await db.class.create({ data: { schoolId: S, name, gradeLevel, joinCode: `ZS${key.slice(0, 2).toUpperCase()}${TAIL}` }, select: { id: true } })).id;
  };
  await klass("sci", "ZZ TA Syllabus 11 Science", "11");
  await klass("com", "ZZ TA Syllabus 11 Commerce", "11");
  await klass("arts", "ZZ TA Syllabus 11 Arts", "11");
  await klass("seven", "ZZ TA Syllabus 7A", "7");
  await db.classTeacher.create({ data: { classId: ids.seven!, schoolId: S, teacherMembershipId: ids.formM!, role: "LEAD" } });
  const period = await db.timetablePeriod.create({ data: { schoolId: S, name: "Period 1", startMinute: 480, endMinute: 525, position: 1 }, select: { id: true } });
  const lesson = (classId: string, weekday: number, subject: string, teacherMembershipId: string | null = null) =>
    db.timetableSlot.create({ data: { schoolId: S, classId, periodId: period.id, weekday, subject, teacherMembershipId } });
  await lesson(ids.sci!, 1, "Physics");
  await lesson(ids.com!, 1, "accountancy");
  await lesson(ids.seven!, 1, "English", ids.englishM!);
  await lesson(ids.seven!, 2, "Mathematics", ids.formM!);
  const units = async (gradeLevel: string, subject: string, count: number) => {
    const made: string[] = [];
    for (let position = 1; position <= count; position++) {
      made.push((await db.syllabusUnit.create({ data: { schoolId: S, gradeLevel, subject, position, title: `ZZ ${subject} ${position}` }, select: { id: true } })).id);
    }
    return made;
  };
  const physics = await units("11", "Physics", 4);
  const accounts = await units("11", "Accountancy", 4);
  ids.englishUnit = (await units("7", "English", 1))[0]!;
  ids.mathsUnit = (await units("7", "Mathematics", 1))[0]!;
  // Each stream is on track with its own subject: two of four done, half the year gone.
  for (const [classId, list] of [[ids.sci!, physics], [ids.com!, accounts]] as const) {
    for (const unitId of list.slice(0, 2)) await db.syllabusProgress.create({ data: { schoolId: S, classId, unitId, status: "DONE", doneOn: "2026-08-01" } });
  }
}, 60_000);

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = ["head", "english", "form"].map((w) => ids[w]).filter((id): id is string => Boolean(id));
  await db.session.deleteMany({ where: { userId: { in: users } } });
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
}, 60_000);

describe("TA-144: coverage measures a class on the subjects it takes", () => {
  it("TA-144: each stream has a row for its own subject only, and neither counts as behind", async () => {
    const coverage = await syllabusCoverage(await as("head", "PRINCIPAL"));
    const rowsOf = (classId: string) => coverage.rows.filter((r) => r.classId === classId).map((r) => r.subject).sort();
    expect(rowsOf(ids.sci!)).toEqual(["Physics"]);
    // The timetable's spelling differs in case; the list is still the class's.
    expect(rowsOf(ids.com!)).toEqual(["Accountancy"]);
    expect(coverage.rows.filter((r) => r.classId === ids.sci! || r.classId === ids.com!).every((r) => !r.behind && r.percent === 50)).toBe(true);
    // A class whose timetable and subject say nothing of what it takes is measured on every list of its grade, as before.
    expect(rowsOf(ids.arts!)).toEqual(["Accountancy", "Physics"]);
    expect(coverage.classesBehind).toBe(1);
  });
});

describe("TA-342: a lesson's chapter is one of its own subject's", () => {
  const lessonOf = (unitId: string) => ({ classId: ids.seven!, subject: "English", unitId, dateKey: "2026-11-10", topic: "ZZ lesson", notes: "", homework: "", status: "TAUGHT" as const });

  it("TA-342: an English lesson naming a Mathematics chapter is refused and the chapter does not move", async () => {
    const english = await as("english", "TEACHER");
    await expect(saveLessonPlan(english, lessonOf(ids.mathsUnit!))).rejects.toMatchObject({ key: "syllabus.refuseUnknownUnit" });
    expect(await progressOf(ids.seven!, ids.mathsUnit!)).toBe("NOT_STARTED");
    expect(await db.lessonPlan.count({ where: { classId: ids.seven!, unitId: ids.mathsUnit! } })).toBe(0);
    // Its own subject's chapter is taken, and moves as before.
    await saveLessonPlan(english, lessonOf(ids.englishUnit!));
    expect(await progressOf(ids.seven!, ids.englishUnit!)).toBe("IN_PROGRESS");
  });

  it("TA-342: an English template applied under a Mathematics chapter is refused", async () => {
    const template = await db.lessonPlanTemplate.create({ data: { schoolId: ids.school!, authorUserId: ids.english!, subject: "English", grade: "7", title: "ZZ template", body: JSON.stringify({ topic: "ZZ topic", notes: "", homework: "" }) }, select: { id: true } });
    const english = await as("english", "TEACHER");
    await expect(applyPlanTemplate(english, template.id, { classId: ids.seven!, unitId: ids.mathsUnit! })).rejects.toMatchObject({ key: "syllabus.refuseUnknownUnit" });
    expect(await db.lessonPlan.count({ where: { classId: ids.seven!, unitId: ids.mathsUnit! } })).toBe(0);
  });
});
