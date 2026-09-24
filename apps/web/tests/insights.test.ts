import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { classInsights, pupilInsights, schoolSummary, type Window } from "@/lib/insights";
import type { ActiveContext } from "@/lib/session";

/**
 * The principal's figures.
 *
 * TWO CLAIMS WORTH TESTING, and neither is "the query returns rows".
 *
 * The first is arithmetic: a class average is the mean of each PUPIL's own
 * overall, and a pupil with no marks is excluded rather than counted as zero. A
 * dashboard that quietly scores the unmarked as nought reports a school as
 * failing when what has actually happened is that nobody has marked the work
 * yet — and it does it in the one place a principal will act on.
 *
 * The second is that none of this ranks a child. `pupilInsights` returns pupils
 * in alphabetical order whatever their marks, because ordering thirty children
 * by attainment is the thing this app has said in several places it will not
 * build. That is asserted below rather than left to a comment.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: {
      id: over.userId,
      name: "Test",
      preferredName: null,
      email: null,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: false, email: false },
        quietHours: null,
      },
    },
  };
}

const TEACHER_EMAIL = "insight.teacher.unit@riverside.test";
const PUPIL_EMAILS = ["insight.a.unit@riverside.test", "insight.b.unit@riverside.test", "insight.c.unit@riverside.test"];
const MADE = [TEACHER_EMAIL, ...PUPIL_EMAILS];

const WINDOW: Window = { fromDateKey: "2026-02-01", toDateKey: "2026-02-28" };
/** The head's shortest span: the window's last week. */
const WINDOW_7: Window = { fromDateKey: "2026-02-22", toDateKey: "2026-02-28" };
/** Inside every window this suite uses. Riverside is Europe/London. */
const GRADED_AT = new Date("2026-02-25T12:00:00.000Z");

let riversideId: string;
let oakfieldId: string;
let classId: string;
let assignmentId: string;
let teacherMembershipId: string;
let pupilIds: string[] = [];

let principal: ActiveContext;
let admin: ActiveContext;
let teacher: ActiveContext;
let otherSchoolAdmin: ActiveContext;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  riversideId = riverside.id;
  oakfieldId = oakfield.id;

  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riversideId, role: "ADMIN" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfieldId, role: "ADMIN" },
  });

  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riversideId, role: "ADMIN" });
  principal = ctx({
    userId: priya.id,
    membershipId: priyaAdmin.id,
    schoolId: riversideId,
    role: "PRINCIPAL",
  });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfieldId,
    role: "ADMIN",
  });

  const teacherUser =
    (await db.user.findUnique({ where: { email: TEACHER_EMAIL } })) ??
    (await db.user.create({ data: { email: TEACHER_EMAIL, name: "Insight Teacher", prefs: "{}" } }));
  const teacherMembership = await db.membership.upsert({
    where: {
      userId_schoolId_role: { userId: teacherUser.id, schoolId: riversideId, role: "TEACHER" },
    },
    create: { userId: teacherUser.id, schoolId: riversideId, role: "TEACHER", status: "ACTIVE" },
    update: { status: "ACTIVE" },
  });
  teacherMembershipId = teacherMembership.id;
  teacher = ctx({
    userId: teacherUser.id,
    membershipId: teacherMembership.id,
    schoolId: riversideId,
    role: "TEACHER",
  });

  // This suite's own class and pupils, named so the alphabetical assertion has
  // something to bite on: Zara sorts last but scores best.
  const klass = await db.class.upsert({
    where: { joinCode: "ZZZ-INSIGHT" },
    create: {
      schoolId: riversideId,
      name: "ZZ Insight Test Class",
      gradeLevel: "5",
      joinCode: "ZZZ-INSIGHT",
    },
    update: {},
  });
  classId = klass.id;

  const names = ["Aaron Best", "Mira Middle", "Zara Zenith"];
  pupilIds = [];
  for (const [index, email] of PUPIL_EMAILS.entries()) {
    const user =
      (await db.user.findUnique({ where: { email } })) ??
      (await db.user.create({ data: { email, name: names[index]!, prefs: "{}" } }));
    const membership = await db.membership.upsert({
      where: { userId_schoolId_role: { userId: user.id, schoolId: riversideId, role: "STUDENT" } },
      create: { userId: user.id, schoolId: riversideId, role: "STUDENT", status: "ACTIVE" },
      update: { status: "ACTIVE" },
    });
    pupilIds.push(membership.id);
    await db.enrollment.upsert({
      where: {
        classId_studentMembershipId: { classId, studentMembershipId: membership.id },
      },
      create: {
        classId,
        schoolId: riversideId,
        studentMembershipId: membership.id,
        status: "ACTIVE",
      },
      update: { status: "ACTIVE", removedAt: null },
    });
  }

  const assignment = await db.assignment.create({
    data: {
      schoolId: riversideId,
      classId,
      authorMembershipId: teacherMembershipId,
      title: "ZZ Insight test",
      pointsMilli: 100_000,
      publishedAt: new Date(),
    },
  });
  assignmentId = assignment.id;
});

afterEach(async () => {
  await db.grade.deleteMany({ where: { assignmentId } });
  await db.attendanceRecord.deleteMany({ where: { session: { classId } } });
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.reportCard.deleteMany({ where: { classId } });
});

afterAll(async () => {
  await db.grade.deleteMany({ where: { assignmentId } });
  await db.attendanceRecord.deleteMany({ where: { session: { classId } } });
  await db.attendanceSession.deleteMany({ where: { classId } });
  await db.reportCard.deleteMany({ where: { classId } });
  await db.assignment.deleteMany({ where: { classId } });
  await db.enrollment.deleteMany({ where: { classId } });
  await db.class.deleteMany({ where: { id: classId } });
  await db.membership.deleteMany({ where: { user: { email: { in: MADE } } } });
  await db.user.deleteMany({ where: { email: { in: MADE } } });
  await db.$disconnect();
});

async function markRegister(dateKey: string, statuses: string[]) {
  const session = await db.attendanceSession.create({
    data: { schoolId: riversideId, classId, dateKey },
  });
  for (const [index, status] of statuses.entries()) {
    await db.attendanceRecord.create({
      data: {
        sessionId: session.id,
        schoolId: riversideId,
        studentMembershipId: pupilIds[index]!,
        status,
      },
    });
  }
}

async function grade(index: number, scoreMilli: number, gradedAt: Date = GRADED_AT) {
  await db.grade.upsert({
    where: {
      assignmentId_studentMembershipId: {
        assignmentId,
        studentMembershipId: pupilIds[index]!,
      },
    },
    create: {
      schoolId: riversideId,
      assignmentId,
      studentMembershipId: pupilIds[index]!,
      gradedByMembershipId: teacherMembershipId,
      scoreMilli,
      gradedAt,
    },
    update: { scoreMilli, gradedAt },
  });
}

function mine(rows: Awaited<ReturnType<typeof classInsights>>) {
  return rows.find((r) => r.classId === classId)!;
}

describe("⚠ only the principal and an admin may see the whole school", () => {
  it("refuses a teacher", async () => {
    await expect(classInsights(teacher, WINDOW)).rejects.toBeInstanceOf(AccessError);
    await expect(pupilInsights(teacher, classId, WINDOW)).rejects.toBeInstanceOf(AccessError);
  });

  it("lets the principal and the admin", async () => {
    await expect(classInsights(principal, WINDOW)).resolves.toBeInstanceOf(Array);
    await expect(classInsights(admin, WINDOW)).resolves.toBeInstanceOf(Array);
  });

  it("⚠ never shows another school's class", async () => {
    const rows = await classInsights(otherSchoolAdmin, WINDOW);
    expect(rows.map((r) => r.classId)).not.toContain(classId);
  });

  it("⚠ refuses to open a class from another school", async () => {
    await expect(pupilInsights(otherSchoolAdmin, classId, WINDOW)).rejects.toBeInstanceOf(
      AccessError,
    );
  });
});

describe("attendance by class", () => {
  it("counts what was actually marked in the window", async () => {
    await markRegister("2026-02-10", ["PRESENT", "PRESENT", "ABSENT"]);
    const klass = mine(await classInsights(principal, WINDOW));

    expect(klass.sessionsTaken).toBe(1);
    expect(klass.attendance.marks).toBe(3);
    expect(klass.attendance.percent).toBe(67);
  });

  it("⚠ counts LATE as present", async () => {
    // A child who arrived is not absent, and a percentage that says otherwise
    // makes lateness look like truancy.
    await markRegister("2026-02-10", ["LATE", "LATE", "LATE"]);
    expect(mine(await classInsights(principal, WINDOW)).attendance.percent).toBe(100);
  });

  it("⚠ ignores registers outside the window", async () => {
    await markRegister("2026-01-05", ["ABSENT", "ABSENT", "ABSENT"]);
    await markRegister("2026-02-10", ["PRESENT", "PRESENT", "PRESENT"]);
    const klass = mine(await classInsights(principal, WINDOW));
    expect(klass.sessionsTaken).toBe(1);
    expect(klass.attendance.percent).toBe(100);
  });

  it("⚠ reports null rather than 0% when no register was taken", async () => {
    // 0% would read as "nobody came in", which is a very different statement
    // from "nobody took the register".
    const klass = mine(await classInsights(principal, WINDOW));
    expect(klass.attendance.percent).toBeNull();
    expect(klass.sessionsTaken).toBe(0);
  });
});

describe("⚠ academic progress", () => {
  it("averages the pupils' own overalls", async () => {
    await grade(0, 60_000);
    await grade(1, 70_000);
    await grade(2, 80_000);

    const klass = mine(await classInsights(principal, WINDOW));
    expect(klass.progress.percent).toBe(70);
    expect(klass.progress.pupilsCounted).toBe(3);
    expect(klass.progress.pupilsWithNoMarks).toBe(0);
  });

  it("⚠ leaves an unmarked pupil OUT rather than counting them as zero", async () => {
    // The failure this test exists for: a class where two thirds of the work is
    // unmarked reporting a third of the real figure, in the one place a
    // principal will act on it.
    await grade(0, 90_000);
    await grade(1, 90_000);
    // The third pupil has no mark at all.

    const klass = mine(await classInsights(principal, WINDOW));
    expect(klass.progress.percent).toBe(90);
    expect(klass.progress.pupilsCounted).toBe(2);
    // ⚠ Counted separately, so the figure cannot pretend to cover everybody.
    expect(klass.progress.pupilsWithNoMarks).toBe(1);
  });

  it("⚠ reports null when nobody has any marks", async () => {
    const klass = mine(await classInsights(principal, WINDOW));
    expect(klass.progress.percent).toBeNull();
    expect(klass.progress.pupilsWithNoMarks).toBe(3);
  });

  /**
   * ⚠ THE SPAN BESIDE THE NUMBER IS THE SPAN OF THE NUMBER. The page says
   * "last 7 days" and the attendance column obeyed it while the progress
   * column averaged every mark the class ever had. A mark graded thirty days
   * ago is outside a week; one graded at 23:30 on the window's last day, on
   * the school's clock, is inside it.
   */
  it("⚠ counts only marks graded inside the span", async () => {
    await grade(0, 10_000, new Date("2026-01-29T12:00:00.000Z")); // thirty days before the week
    await grade(1, 80_000, new Date("2026-02-25T12:00:00.000Z")); // inside the week
    await grade(2, 60_000, new Date("2026-02-28T23:30:00.000Z")); // the last evening, London time

    const week = mine(await classInsights(principal, WINDOW_7));
    expect(week.progress).toEqual({ percent: 70, pupilsCounted: 2, pupilsWithNoMarks: 1 });

    const month = mine(await classInsights(principal, WINDOW));
    expect(month.progress).toEqual({ percent: 70, pupilsCounted: 2, pupilsWithNoMarks: 1 });

    const all = mine(await classInsights(principal, { fromDateKey: "2026-01-01", toDateKey: "2026-02-28" }));
    expect(all.progress).toEqual({ percent: 50, pupilsCounted: 3, pupilsWithNoMarks: 0 });

    // A span with no marks in it: null, not 0, and nobody counted.
    const empty = mine(await classInsights(principal, { fromDateKey: "2026-03-01", toDateKey: "2026-03-07" }));
    expect(empty.progress).toEqual({ percent: null, pupilsCounted: 0, pupilsWithNoMarks: 3 });

    // The pupil view follows the same span.
    const { pupils } = await pupilInsights(principal, classId, WINDOW_7);
    expect(pupils.find((p) => p.name === "Aaron Best")).toMatchObject({ overallPercent: null, hasMarks: false });
    expect(pupils.find((p) => p.name === "Mira Middle")).toMatchObject({ overallPercent: 80, hasMarks: true });
    expect(pupils.find((p) => p.name === "Zara Zenith")).toMatchObject({ overallPercent: 60, hasMarks: true });
  });
});

describe("⚠ nothing ranks a child", () => {
  it("returns pupils alphabetically, whatever their marks", async () => {
    // Zara sorts last and scores best. If this ever comes back sorted by
    // attainment, somebody has built a league table of children.
    await grade(0, 10_000); // Aaron
    await grade(1, 50_000); // Mira
    await grade(2, 99_000); // Zara

    const { pupils } = await pupilInsights(principal, classId, WINDOW);
    expect(pupils.map((p) => p.name)).toEqual(["Aaron Best", "Mira Middle", "Zara Zenith"]);
  });

  it("keeps that order when attendance differs too", async () => {
    await markRegister("2026-02-10", ["ABSENT", "PRESENT", "PRESENT"]);
    const { pupils } = await pupilInsights(principal, classId, WINDOW);
    expect(pupils.map((p) => p.name)).toEqual(["Aaron Best", "Mira Middle", "Zara Zenith"]);
  });
});

describe("one class, pupil by pupil", () => {
  it("gives each pupil their own attendance and overall", async () => {
    await markRegister("2026-02-10", ["PRESENT", "ABSENT", "PRESENT"]);
    await markRegister("2026-02-11", ["PRESENT", "PRESENT", "PRESENT"]);
    await grade(0, 75_000);

    const { pupils } = await pupilInsights(principal, classId, WINDOW);
    const aaron = pupils.find((p) => p.name === "Aaron Best")!;
    const mira = pupils.find((p) => p.name === "Mira Middle")!;

    expect(aaron.attendancePercent).toBe(100);
    expect(aaron.overallPercent).toBe(75);
    expect(aaron.hasMarks).toBe(true);

    expect(mira.attendancePercent).toBe(50);
    expect(mira.overallPercent).toBeNull();
    expect(mira.hasMarks).toBe(false);
  });

  it("hangs the latest report card off each pupil, draft or not", async () => {
    await db.reportCard.create({
      data: {
        schoolId: riversideId,
        classId,
        studentMembershipId: pupilIds[0]!,
        title: "ZZ Term",
        status: "DRAFT",
        fromDateKey: WINDOW.fromDateKey,
        toDateKey: WINDOW.toDateKey,
      },
    });

    const { pupils } = await pupilInsights(principal, classId, WINDOW);
    const aaron = pupils.find((p) => p.name === "Aaron Best")!;
    expect(aaron.latestCard).toMatchObject({ title: "ZZ Term", status: "DRAFT" });
    expect(pupils.find((p) => p.name === "Mira Middle")!.latestCard).toBeNull();
  });

  it("counts report cards per class, by title and status", async () => {
    await db.reportCard.createMany({
      data: pupilIds.map((id) => ({
        schoolId: riversideId,
        classId,
        studentMembershipId: id,
        title: "ZZ Term",
        status: "PUBLISHED",
        fromDateKey: WINDOW.fromDateKey,
        toDateKey: WINDOW.toDateKey,
      })),
    });

    const klass = mine(await classInsights(principal, WINDOW));
    expect(klass.reportCards).toEqual([{ title: "ZZ Term", published: 3, drafts: 0 }]);
  });
});

describe("the school in one line", () => {
  it("sums attendance across the school rather than averaging classes", async () => {
    // The unit here really is the mark: a class of 5 and a class of 40 must not
    // count equally towards "how well is this school attending?".
    await markRegister("2026-02-10", ["PRESENT", "PRESENT", "ABSENT"]);
    const insights = await classInsights(principal, WINDOW);
    const summary = await schoolSummary(principal, insights);

    expect(summary.classes).toBe(insights.length);
    expect(summary.pupils).toBeGreaterThanOrEqual(3);
    expect(summary.attendancePercent).not.toBeNull();
  });

  /**
   * "Registers missing today" is what the school EXPECTS and has not got.
   * Nothing is expected on a day the school is shut, and nothing from a class
   * with nobody in it — the plain "classes minus sessions" subtraction chased
   * the principal for both. The clock is pinned to dates in 2025-07, a month no
   * other suite writes registers on, so today's real registers cannot leak in.
   */
  describe("⚠ registers missing today", () => {
    // Riverside is Europe/London; noon UTC is the same calendar day there.
    const at = (dateKey: string) => new Date(`${dateKey}T12:00:00Z`);
    const HOLIDAY_KEY = "2025-07-16"; // a Wednesday
    const SUNDAY_KEY = "2025-07-20";
    const SCHOOL_DAY_KEY = "2025-07-15"; // a Tuesday
    let emptyClassId: string;

    beforeAll(async () => {
      await db.holiday.deleteMany({ where: { schoolId: riversideId, name: "ZZ Insight Holiday" } });
      await db.holiday.create({
        data: { schoolId: riversideId, name: "ZZ Insight Holiday", startDateKey: HOLIDAY_KEY, endDateKey: HOLIDAY_KEY, kind: "HOLIDAY" },
      });
      const empty = await db.class.upsert({
        where: { joinCode: "ZZZ-INSIGHT-EMPTY" },
        create: { schoolId: riversideId, name: "ZZ Insight Empty Class", gradeLevel: "5", joinCode: "ZZZ-INSIGHT-EMPTY" },
        update: { archivedAt: null },
      });
      emptyClassId = empty.id;
      await db.enrollment.deleteMany({ where: { classId: emptyClassId } });
    });

    afterAll(async () => {
      await db.holiday.deleteMany({ where: { schoolId: riversideId, name: "ZZ Insight Holiday" } });
      await db.class.deleteMany({ where: { id: emptyClassId } });
    });

    it("is 0 on a closing holiday, whatever the classes", async () => {
      const insights = await classInsights(principal, WINDOW);
      expect(insights.length).toBeGreaterThan(0);
      const summary = await schoolSummary(principal, insights, at(HOLIDAY_KEY));
      expect(summary.registersMissingToday).toBe(0);
    });

    it("is 0 on a day the school does not teach", async () => {
      const school = await db.school.findUniqueOrThrow({ where: { id: riversideId }, select: { teachingDays: true } });
      expect(school.teachingDays.split(",")).not.toContain("0");
      const insights = await classInsights(principal, WINDOW);
      const summary = await schoolSummary(principal, insights, at(SUNDAY_KEY));
      expect(summary.registersMissingToday).toBe(0);
    });

    it("does not count a class with nobody in it on a school day", async () => {
      const insights = await classInsights(principal, WINDOW);
      // The empty class is a class of the school — it is on the insights list…
      expect(insights.some((k) => k.classId === emptyClassId)).toBe(true);

      // …but not a register anybody can take. The expected figure is every
      // non-archived class with an active enrolment, less the registers taken.
      const withPupils = await db.class.findMany({
        where: { schoolId: riversideId, archivedAt: null, enrollments: { some: { status: "ACTIVE" } } },
        select: { id: true },
      });
      const taken = await db.attendanceSession.count({
        where: { schoolId: riversideId, dateKey: SCHOOL_DAY_KEY, classId: { in: withPupils.map((c) => c.id) } },
      });
      const summary = await schoolSummary(principal, insights, at(SCHOOL_DAY_KEY));
      expect(summary.registersMissingToday).toBe(withPupils.length - taken);
      expect(summary.registersMissingToday).toBeLessThan(insights.length);
      expect(summary.registersMissingToday).toBeGreaterThan(0);
    });
  });

  it("⚠ refuses a teacher", async () => {
    const insights = await classInsights(principal, WINDOW);
    await expect(schoolSummary(teacher, insights)).rejects.toBeInstanceOf(AccessError);
  });
});
