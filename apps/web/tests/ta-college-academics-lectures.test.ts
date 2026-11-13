/**
 * THE COLLEGE'S ACADEMICS, the lectures half of the batch (testing analysis of 13 November 2026, batch
 * college-academics), at a ZZ college of this suite's own that teaches every day of the week, made here and
 * removed after.
 *
 *   - TA-057: lectures were made from today's timetable for whatever day was read and never removed, so an
 *     hour moved after the board for next week was opened left the old hour's lecture beside the new one, and
 *     a past day read after the move gained a lecture never taught; an hour edited in place kept its old kind.
 *   - TA-059: the faculty home listed today alone, so a lecture not marked on its own day could not be reached
 *     again; the home now takes an earlier day.
 *   - TA-300: a re-mark overwrote every row with its own clientId and kept nothing of what it replaced, so a
 *     late replay of the first batch was written over the correction.
 *   - TA-493: the "may miss N more" projection counted timetable days before the term began and left out
 *     today's lectures until they were marked.
 *   - TA-061: registration refused every student of a division whose lab hour rotates two batches at one hour.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";
import { addDaysToKey, todayKey, weekdayOfKey } from "@/lib/dates";
import { lectureSubstitutions, removeTimetableSlot, saveTimetableSlot } from "@/lib/academics";
import { attendanceRows, markLecture, myLectures } from "@/lib/academics-attendance";
import { facultyDaySteps, facultyHome } from "@/lib/academics-homes";
import { saveRegistration } from "@/lib/academics-registration";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const W = weekdayOfKey(TODAY);
const NEXT = addDaysToKey(TODAY, 7);
const PAST = addDaysToKey(TODAY, -7);
const PAST2 = addDaysToKey(TODAY, -14);
const MAIL = (who: string) => `zz-tacl-${who.toLowerCase()}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const RULES = JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 40 });

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error(`no session for ${who}`);
  return ctx;
}

async function person(who: string, role: string): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TACL ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZTL${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
}

/** The days from `from` to `to`, both counted, that fall on `weekday`. */
function weekdaysBetween(from: string, to: string, weekday: number): number {
  let n = 0;
  for (let d = from; d <= to; d = addDaysToKey(d, 1)) if (weekdayOfKey(d) === weekday) n += 1;
  return n;
}

beforeAll(async () => {
  const c = (ids.college = (await db.school.create({ data: { name: `ZZ TACL College ${STAMP}`, slug: `zz-tacl-${STAMP}`, code: `ZTL${SUFFIX}`, contactEmail: MAIL("contact"), timezone: TZ, kind: "COLLEGE", teachingDays: "1,2,3,4,5,6,0" }, select: { id: true } })).id);
  await db.schoolModule.create({ data: { schoolId: c, module: "ACADEMICS" } });
  for (const [who, role] of [["admin", "ADMIN"], ["hod", "HOD"], ["fac", "FACULTY"], ["fac2", "FACULTY"], ["fac3", "FACULTY"]] as const) await person(who, role);
  for (let n = 1; n <= 4; n += 1) await person(`s${n}`, "STUDENT");
  ids.dept = (await db.department.create({ data: { schoolId: c, code: "ZTL", name: "ZZ TACL Physics", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  ids.prog = (await db.programme.create({ data: { schoolId: c, departmentId: ids.dept, code: "ZTLB", name: "ZZ TACL BSc", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
  ids.prog2 = (await db.programme.create({ data: { schoolId: c, departmentId: ids.dept, code: "ZTLE", name: "ZZ TACL BTech", level: "UG", durationYears: 4, regulator: "AICTE", attendanceThreshold: 75 }, select: { id: true } })).id;
  ids.scheme = (await db.scheme.create({ data: { schoolId: c, programmeId: ids.prog, name: "ZZ TACL scheme", effectiveYear: 2024, passingRules: RULES }, select: { id: true } })).id;
  ids.scheme2 = (await db.scheme.create({ data: { schoolId: c, programmeId: ids.prog2, name: "ZZ TACL scheme 2", effectiveYear: 2024, passingRules: RULES }, select: { id: true } })).id;
  const course = async (scheme: string, code: string, kind = "CORE") => (await db.course.create({ data: { schoolId: c, schemeId: ids[scheme]!, code, name: `ZZ ${code}`, semester: 1, creditsL: 3, kind }, select: { id: true } })).id;
  ids.term = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ TACL term ${STAMP}`, academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -40), endsOn: addDaysToKey(TODAY, 40), registrationOpensOn: addDaysToKey(TODAY, -5), registrationClosesOn: addDaysToKey(TODAY, 5) }, select: { id: true } })).id;
  // A term that starts a fortnight from now and runs four weeks (TA-493).
  ids.later = (await db.academicTerm.create({ data: { schoolId: c, name: `ZZ TACL later ${STAMP}`, academicYear: "2026–27", startsOn: addDaysToKey(TODAY, 50), endsOn: addDaysToKey(TODAY, 77), registrationOpensOn: addDaysToKey(TODAY, 41), registrationClosesOn: addDaysToKey(TODAY, 49) }, select: { id: true } })).id;
  const period = async (name: string, start: number, position: number) => (await db.timetablePeriod.create({ data: { schoolId: c, name, startMinute: start, endMinute: start + 50, kind: "LESSON", position }, select: { id: true } })).id;
  ids.p1 = await period("ZZ P1", 480, 1);
  ids.p2 = await period("ZZ P2", 540, 2);
  ids.p4 = await period("ZZ P4", 660, 4);
  ids.p6 = await period("ZZ P6", 780, 6);
  const offering = async (courseId: string, faculty: string, term = "term", divisionId: string | null = null) => (await db.courseOffering.create({ data: { schoolId: c, termId: ids[term]!, courseId, facultyMembershipId: ids[`${faculty}M`]!, lectureHours: 3, divisionId }, select: { id: true } })).id;
  ids.o1 = await offering(await course("scheme", `ZL1${SUFFIX}`), "fac");
  ids.o2 = await offering(await course("scheme", `ZL2${SUFFIX}`), "fac");
  ids.o3 = await offering(await course("scheme", `ZL3${SUFFIX}`), "fac2", "later");
  ids.o4 = await offering(await course("scheme", `ZL4${SUFFIX}`), "fac2");
  for (const s of ["s1", "s2"]) {
    await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: ids[`${s}M`]!, programmeId: ids.prog, schemeId: ids.scheme, entryYear: 2026 } });
    await db.courseRegistration.create({ data: { schoolId: c, studentMembershipId: ids[`${s}M`]!, offeringId: ids.o2!, termId: ids.term!, kind: "CORE" } });
  }
  await db.courseRegistration.create({ data: { schoolId: c, studentMembershipId: ids.s1M!, offeringId: ids.o3!, termId: ids.later!, kind: "CORE" } });
  await db.courseRegistration.create({ data: { schoolId: c, studentMembershipId: ids.s1M!, offeringId: ids.o4!, termId: ids.term!, kind: "CORE" } });

  // TA-061: a BTech division split into lab batches A and B, two core courses whose labs rotate the batches at one hour.
  const klass = await db.class.create({ data: { schoolId: c, name: `ZZ TACL FY ${STAMP}`, gradeLevel: "1", subject: "BTECH", joinCode: `ZTL${SUFFIX}` }, select: { id: true } });
  ids.division = (await db.division.create({ data: { schoolId: c, classId: klass.id, programmeId: ids.prog2, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } })).id;
  ids.batchA = (await db.labBatch.create({ data: { schoolId: c, divisionId: ids.division, name: "A" }, select: { id: true } })).id;
  ids.batchB = (await db.labBatch.create({ data: { schoolId: c, divisionId: ids.division, name: "B" }, select: { id: true } })).id;
  for (const [s, batch, roll] of [["s3", "batchA", 1], ["s4", "batchB", 2]] as const) {
    await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: ids[`${s}M`]!, programmeId: ids.prog2, schemeId: ids.scheme2, entryYear: 2026, divisionId: ids.division } });
    await db.enrollment.create({ data: { schoolId: c, classId: klass.id, studentMembershipId: ids[`${s}M`]!, rollNumber: roll } });
    await db.labBatchMember.create({ data: { schoolId: c, batchId: ids[batch]!, divisionId: ids.division, studentMembershipId: ids[`${s}M`]! } });
  }
  ids.core1 = await offering(await course("scheme2", `ZE1${SUFFIX}`), "fac3", "term", ids.division);
  ids.core2 = await offering(await course("scheme2", `ZE3${SUFFIX}`), "hod", "term", ids.division);
  ids.elective = await offering(await course("scheme2", `ZE9${SUFFIX}`, "ELECTIVE"), "fac", "term", ids.division);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  // Only what this suite made: its own stamped college (never an unscoped delete, should the set-up have failed) and its stamped people.
  const college = ids.college;
  if (college) {
    await db.auditLog.deleteMany({ where: { schoolId: college } });
    await db.school.deleteMany({ where: { id: college, name: `ZZ TACL College ${STAMP}` } });
  }
  await db.session.deleteMany({ where: { user: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-tacl-" } } } });
  await db.notification.deleteMany({ where: { user: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-tacl-" } } } });
  await db.user.deleteMany({ where: { email: { endsWith: `-${STAMP}@test.invalid`, startsWith: "zz-tacl-" } } });
  await db.$disconnect();
});

const startsOf = async (offering: string, dateKey: string) => (await db.lecture.findMany({ where: { offeringId: ids[offering]!, dateKey }, orderBy: { startMinute: "asc" }, select: { startMinute: true, kind: true } })).map((l) => `${l.startMinute}:${l.kind}`);

describe("an hour moved after its lectures were made (TA-057)", () => {
  it("TA-057: next week's day keeps the new hour alone, and a day already past gains nothing", async () => {
    const admin = await as("admin", "ADMIN");
    const slot = await saveTimetableSlot(admin, { offeringId: ids.o1!, weekday: W, periodId: ids.p2!, kind: "LECTURE", roomId: null });
    // Last week's day was read with the old hour; the office opens next week's board to plan cover.
    await myLectures(await as("fac", "FACULTY"), PAST);
    await lectureSubstitutions(await as("admin", "ADMIN"), NEXT);
    expect(await startsOf("o1", NEXT)).toEqual(["540:LECTURE"]);
    // The course moves from period 2 to period 4, the only way the page offers: remove the hour, add the new one.
    await removeTimetableSlot(await as("admin", "ADMIN"), slot.id);
    await saveTimetableSlot(await as("admin", "ADMIN"), { offeringId: ids.o1!, weekday: W, periodId: ids.p4!, kind: "LECTURE", roomId: null });
    const next = await myLectures(await as("fac", "FACULTY"), NEXT);
    expect(next.lectures.filter((l) => l.offeringId === ids.o1).map((l) => l.startMinute)).toEqual([660]);
    // The past day keeps the hour that was taught, and gains no lecture of the new timetable.
    await myLectures(await as("fac", "FACULTY"), PAST);
    expect(await startsOf("o1", PAST)).toEqual(["540:LECTURE"]);
  });

  it("TA-057: an hour edited in place carries its new kind to its unmarked lectures from today on", async () => {
    await saveTimetableSlot(await as("admin", "ADMIN"), { offeringId: ids.o1!, weekday: W, periodId: ids.p4!, kind: "TUTORIAL", roomId: null });
    expect(await startsOf("o1", NEXT)).toEqual(["660:TUTORIAL"]);
    expect(await startsOf("o1", PAST)).toEqual(["540:LECTURE"]);
  });
});

describe("a lecture not marked on its own day (TA-059)", () => {
  it("TA-059: the faculty home lists an earlier day's lectures when asked, made from the timetable if nobody opened that day", async () => {
    const fac = await as("fac", "FACULTY");
    const past = await facultyHome(fac, PAST);
    expect(past.today.dateKey).toBe(PAST);
    expect(past.today.lectures.filter((l) => l.offeringId === ids.o1).map((l) => l.startMinute)).toEqual([540]);
    // A day nobody opened: its lectures are made now, so its register can be reached.
    expect(await db.lecture.count({ where: { offeringId: ids.o1!, dateKey: PAST2 } })).toBe(0);
    const unopened = await facultyHome(await as("fac", "FACULTY"), PAST2);
    expect(unopened.today.dateKey).toBe(PAST2);
    expect(unopened.today.lectures.filter((l) => l.offeringId === ids.o1)).toHaveLength(1);
    // Never a day after today.
    expect((await facultyHome(await as("fac", "FACULTY"), NEXT)).today.dateKey).toBe(TODAY);
  });

  it("TA-059: ?day=<today> is today's own page, and Next day from yesterday leads there rather than to ?day=<today>", () => {
    const YESTERDAY = addDaysToKey(TODAY, -1);
    // Today asked by its date is today, not an earlier day (no Next day, the today wording).
    expect(facultyDaySteps(TODAY, TODAY)).toEqual({ day: TODAY, earlier: false, previous: YESTERDAY, next: null });
    expect(facultyDaySteps(undefined, TODAY)).toEqual({ day: TODAY, earlier: false, previous: YESTERDAY, next: null });
    expect(facultyDaySteps(NEXT, TODAY)).toMatchObject({ day: TODAY, earlier: false, next: null });
    expect(facultyDaySteps("2026-02-30", TODAY)).toMatchObject({ day: TODAY, earlier: false });
    // Yesterday is an earlier day, and its Next day is today's own page.
    expect(facultyDaySteps(YESTERDAY, TODAY)).toEqual({ day: YESTERDAY, earlier: true, previous: addDaysToKey(TODAY, -2), next: null });
    // Two days back steps forward to yesterday.
    expect(facultyDaySteps(addDaysToKey(TODAY, -2), TODAY)).toMatchObject({ earlier: true, next: YESTERDAY });
  });
});

describe("a re-mark and a late replay (TA-300)", () => {
  it("TA-300: a replay of the first batch after a correction is known as a replay, and the correction stands", async () => {
    const lecture = await db.lecture.create({ data: { schoolId: ids.college!, offeringId: ids.o2!, dateKey: TODAY, startMinute: 600, endMinute: 650 }, select: { id: true } });
    const all = (s2: "PRESENT" | "ABSENT") => [{ studentMembershipId: ids.s1M!, status: "PRESENT" as const }, { studentMembershipId: ids.s2M!, status: s2 }];
    const first = await markLecture(await as("fac", "FACULTY"), lecture.id, { clientId: `zz-tacl-a-${STAMP}`, entries: all("PRESENT") });
    expect(first.replay).toBe(false);
    const correction = await markLecture(await as("fac", "FACULTY"), lecture.id, { clientId: `zz-tacl-b-${STAMP}`, entries: all("ABSENT") });
    expect(correction).toMatchObject({ replay: false, absent: 1 });
    // The phone's kept batch arrives after the correction.
    const replay = await markLecture(await as("fac", "FACULTY"), lecture.id, { clientId: `zz-tacl-a-${STAMP}`, entries: all("PRESENT") });
    expect(replay.replay).toBe(true);
    expect(await db.lectureAttendance.findUniqueOrThrow({ where: { lectureId_studentMembershipId: { lectureId: lecture.id, studentMembershipId: ids.s2M! } }, select: { status: true } })).toEqual({ status: "ABSENT" });
  });

  it("TA-300: the re-mark's audit row names the student it changed with the mark before and after, and leaves the unchanged row's first marker", async () => {
    const rows = await db.auditLog.findMany({ where: { schoolId: ids.college!, action: "academics.lecture.mark" }, orderBy: { createdAt: "asc" }, select: { meta: true } });
    const metas = rows.map((r) => JSON.parse(r.meta) as { changes?: { student: string; from: string; to: string }[] });
    expect(metas.find((m) => m.changes)?.changes).toEqual([{ student: ids.s2M, from: "PRESENT", to: "ABSENT" }]);
    const s1 = await db.lectureAttendance.findFirstOrThrow({ where: { studentMembershipId: ids.s1M!, lecture: { offeringId: ids.o2! } }, select: { clientId: true } });
    expect(s1.clientId).toBe(`zz-tacl-a-${STAMP}`);
  });
});

describe("the 'may miss N more' projection (TA-493)", () => {
  it("TA-493: counts no day before the term starts", async () => {
    const admin = await as("admin", "ADMIN");
    const weekday = weekdayOfKey(addDaysToKey(TODAY, 52));
    await saveTimetableSlot(admin, { offeringId: ids.o3!, weekday, periodId: ids.p1!, kind: "LECTURE", roomId: null });
    const row = (await attendanceRows(ids.college!, ids.later!, { studentMembershipId: ids.s1M! }))[0]!;
    expect(row.remaining).toBe(weekdaysBetween(addDaysToKey(TODAY, 50), addDaysToKey(TODAY, 77), weekday));
  });

  it("TA-493: counts today's lecture until it is marked, then moves it to held", async () => {
    await saveTimetableSlot(await as("admin", "ADMIN"), { offeringId: ids.o4!, weekday: W, periodId: ids.p6!, kind: "LECTURE", roomId: null });
    const expected = weekdaysBetween(TODAY, addDaysToKey(TODAY, 40), W);
    const before = (await attendanceRows(ids.college!, ids.term!, { studentMembershipId: ids.s1M!, offeringIds: [ids.o4!] }))[0]!;
    expect(before).toMatchObject({ held: 0, remaining: expected });
    const today = await myLectures(await as("fac2", "FACULTY"), TODAY);
    const lecture = today.lectures.find((l) => l.offeringId === ids.o4)!;
    await markLecture(await as("fac2", "FACULTY"), lecture.lectureId, { clientId: `zz-tacl-c-${STAMP}`, entries: [{ studentMembershipId: ids.s1M!, status: "PRESENT" }] });
    const after = (await attendanceRows(ids.college!, ids.term!, { studentMembershipId: ids.s1M!, offeringIds: [ids.o4!] }))[0]!;
    expect(after).toMatchObject({ held: 1, remaining: expected - 1 });
  });
});

describe("registration in a division whose labs rotate two batches at one hour (TA-061)", () => {
  const LAB_DAY = (W + 1) % 7;

  it("TA-061: registers a batch A student on both core courses", async () => {
    const admin = await as("admin", "ADMIN");
    await saveTimetableSlot(admin, { offeringId: ids.core1!, weekday: LAB_DAY, periodId: ids.p1!, kind: "LAB", roomId: null, labBatchId: ids.batchA! });
    await saveTimetableSlot(await as("admin", "ADMIN"), { offeringId: ids.core2!, weekday: LAB_DAY, periodId: ids.p1!, kind: "LAB", roomId: null, labBatchId: ids.batchB! });
    const view = await saveRegistration(await as("s3", "STUDENT"), { termId: ids.term!, offeringIds: [] });
    expect(view.offerings.filter((o) => o.chosen).map((o) => o.offeringId).sort()).toEqual([ids.core1!, ids.core2!].sort());
    expect(await db.courseRegistration.count({ where: { studentMembershipId: ids.s3M!, status: "REGISTERED" } })).toBe(2);
  });

  it("TA-061: still refuses an elective of no batch at the student's own batch's lab hour", async () => {
    await db.offeringSlot.create({ data: { schoolId: ids.college!, offeringId: ids.elective!, weekday: LAB_DAY, periodId: ids.p1!, kind: "LECTURE" } });
    await expect(saveRegistration(await as("s3", "STUDENT"), { termId: ids.term!, offeringIds: [ids.elective!] })).rejects.toMatchObject({ key: "academics.refuseClash", status: 409 });
  });
});
