import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AccessError } from "@/lib/tenancy";
import { buildProgressReport } from "@/lib/reports";
import { overallPercent } from "@/lib/grading";
import { getAttendanceSummary } from "@/lib/attendance";
import { addDaysToKey, zonedStartOfDay } from "@/lib/dates";
import type { ActiveContext } from "@/lib/session";

/**
 * The progress report, and the two ways a report goes wrong.
 *
 * IT DISAGREES WITH THE APP. A parent holding a printout saying 88% next to a
 * screen saying 86% has been given a reason to distrust both. So the tests that
 * matter most here do not assert a number at all — they assert that the report's
 * number is the SAME number the gradebook and the register produce, computed by
 * the same helpers. Re-deriving anything would let the old "average of the
 * percentages" mistake back in through the one document most likely to be read
 * aloud at a parents' evening.
 *
 * IT SHOWS SOMEBODY A CHILD THEY MAY NOT SEE. A summary must never be a way
 * around the rules protecting its parts, so a teacher who does not teach the
 * child, another school's admin, a parent who does not guard them and a
 * classmate are each checked by name.
 */

const db = new PrismaClient();

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test",
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

let child: ActiveContext;
let childMembershipId: string;
let childSchoolId: string;
let classmate: ActiveContext;
let owningTeacher: ActiveContext; // teaches the child's class
let otherTeacher: ActiveContext; // same school, different class
let admin: ActiveContext;
let otherSchoolAdmin: ActiveContext;
let guardian: ActiveContext;
let strangerParent: ActiveContext;
let childTimezone: string;

/**
 * The marks a report covers: graded inside its window on the school's clock,
 * [first day 00:00, day after the last 00:00). Recomputed here so the test
 * asserts the rule and not the helper's own reading of it.
 */
function gradedIn(window: { fromKey: string; toKey: string }) {
  return {
    gte: zonedStartOfDay(window.fromKey, childTimezone),
    lt: zonedStartOfDay(addDaysToKey(window.toKey, 1), childTimezone),
  };
}

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
  const oakfield = await db.school.findFirstOrThrow({ where: { name: "Oakfield Academy" } });
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
  const sam = await db.user.findUniqueOrThrow({ where: { email: "sam@oakfield.school" } });
  const parentUser = await db.user.findUniqueOrThrow({ where: { email: "parent@example.com" } });

  const guarded = await db.guardianship.findFirstOrThrow({
    where: { parentUserId: parentUser.id, status: "ACTIVE", student: { schoolId: riverside.id } },
    include: { student: { include: { user: true } } },
  });
  childMembershipId = guarded.studentMembershipId;
  childSchoolId = guarded.student.schoolId;
  childTimezone = riverside.timezone;

  const priyaTeacher = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const priyaAdmin = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "ADMIN" },
  });
  const tomTeacher = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const samAdmin = await db.membership.findFirstOrThrow({
    where: { userId: sam.id, schoolId: oakfield.id, role: "ADMIN" },
  });

  const other = await db.membership.findFirstOrThrow({
    where: {
      schoolId: riverside.id,
      role: "STUDENT",
      status: "ACTIVE",
      id: { not: childMembershipId },
    },
  });

  child = ctx({
    userId: guarded.student.userId,
    membershipId: childMembershipId,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  classmate = ctx({
    userId: other.userId,
    membershipId: other.id,
    schoolId: riverside.id,
    role: "STUDENT",
  });
  owningTeacher = ctx({
    userId: priya.id,
    membershipId: priyaTeacher.id,
    schoolId: riverside.id,
    role: "TEACHER",
  });
  otherTeacher = ctx({
    userId: tom.id,
    membershipId: tomTeacher.id,
    schoolId: riverside.id,
    role: "TEACHER",
  });
  admin = ctx({ userId: priya.id, membershipId: priyaAdmin.id, schoolId: riverside.id, role: "ADMIN" });
  otherSchoolAdmin = ctx({
    userId: sam.id,
    membershipId: samAdmin.id,
    schoolId: oakfield.id,
    role: "ADMIN",
  });
  guardian = ctx({ userId: parentUser.id, role: "PARENT" });
  strangerParent = ctx({ userId: sam.id, role: "PARENT" });
});

afterAll(async () => {
  await db.$disconnect();
});

describe("who may read a report", () => {
  it("the child themselves", async () => {
    const report = await buildProgressReport(child, childMembershipId);
    expect(report.student.membershipId).toBe(childMembershipId);
  });

  it("their guardian", async () => {
    const report = await buildProgressReport(guardian, childMembershipId);
    expect(report.student.membershipId).toBe(childMembershipId);
  });

  it("a teacher of a class they are in, and their school's admin", async () => {
    expect((await buildProgressReport(owningTeacher, childMembershipId)).student.name).toBeTruthy();
    expect((await buildProgressReport(admin, childMembershipId)).student.name).toBeTruthy();
  });

  it("⚠ NOT a teacher at the same school who does not teach them", async () => {
    // "Same school" is never sufficient for a teacher anywhere else in this
    // codebase, and a report must not be the exception.
    await expect(buildProgressReport(otherTeacher, childMembershipId)).rejects.toBeInstanceOf(
      AccessError,
    );
  });

  it("⚠ NOT another school's admin", async () => {
    await expect(buildProgressReport(otherSchoolAdmin, childMembershipId)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("⚠ NOT a parent who does not guard them", async () => {
    await expect(buildProgressReport(strangerParent, childMembershipId)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("⚠ NOT a classmate", async () => {
    await expect(buildProgressReport(classmate, childMembershipId)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});

describe("the figures", () => {
  it("⚠ reports the SAME attendance the register does", async () => {
    const report = await buildProgressReport(guardian, childMembershipId);
    const direct = await getAttendanceSummary(
      childSchoolId,
      childMembershipId,
      report.window.fromKey,
      report.window.toKey,
    );

    expect(report.attendance.percent).toBe(direct.percent);
    expect(report.attendance.total).toBe(direct.total);
    expect(report.attendance.counts).toEqual(direct.counts);
  });

  it("⚠ reports the SAME overall grade the gradebook does over the same window", async () => {
    const report = await buildProgressReport(guardian, childMembershipId);

    const grades = await db.grade.findMany({
      where: { studentMembershipId: childMembershipId, scoreMilli: { not: null }, gradedAt: gradedIn(report.window) },
      include: { assignment: { select: { pointsMilli: true } } },
    });
    const expected = overallPercent(
      grades.map((g) => ({ scoreMilli: g.scoreMilli, maxMilli: g.assignment.pointsMilli })),
    );

    expect(report.grades.overallPercent).toBe(expected);
  });

  it("⚠ weights by points and does NOT average the percentages", async () => {
    // Built rather than borrowed, because the seeded data is not guaranteed to
    // tell these two apart — and a check that only fails on some data is a check
    // that will one day pass while the bug is present. Here they CANNOT agree:
    // full marks on a 5-point quiz and half marks on a 100-point exam is 52% by
    // points and 75% by averaging.
    const klass = await db.class.findFirstOrThrow({
      where: { schoolId: childSchoolId, enrollments: { some: { studentMembershipId: childMembershipId } } },
    });
    const author = await db.membership.findFirstOrThrow({
      where: { schoolId: childSchoolId, role: "TEACHER" },
    });

    const quiz = await db.assignment.create({
      data: {
        schoolId: childSchoolId,
        classId: klass.id,
        authorMembershipId: author.id,
        title: "TEST tiny quiz",
        pointsMilli: 5_000,
        publishedAt: new Date(),
      },
    });
    const exam = await db.assignment.create({
      data: {
        schoolId: childSchoolId,
        classId: klass.id,
        authorMembershipId: author.id,
        title: "TEST big exam",
        pointsMilli: 100_000,
        publishedAt: new Date(),
      },
    });

    try {
      await db.grade.create({
        data: {
          schoolId: childSchoolId,
          assignmentId: quiz.id,
          studentMembershipId: childMembershipId,
          scoreMilli: 5_000, // 100%
          gradedByMembershipId: author.id,
        },
      });
      await db.grade.create({
        data: {
          schoolId: childSchoolId,
          assignmentId: exam.id,
          studentMembershipId: childMembershipId,
          scoreMilli: 50_000, // 50%
          gradedByMembershipId: author.id,
        },
      });

      const onlyThese = overallPercent([
        { scoreMilli: 5_000, maxMilli: 5_000 },
        { scoreMilli: 50_000, maxMilli: 100_000 },
      ]);
      expect(onlyThese).toBe(52); // 55 of 105 points
      // Averaging would say 75, and that is the number this must never be.
      expect(onlyThese).not.toBe(75);

      const report = await buildProgressReport(guardian, childMembershipId);
      const all = await db.grade.findMany({
        where: { studentMembershipId: childMembershipId, scoreMilli: { not: null }, gradedAt: gradedIn(report.window) },
        include: { assignment: { select: { pointsMilli: true } } },
      });
      const weighted = overallPercent(
        all.map((g) => ({ scoreMilli: g.scoreMilli, maxMilli: g.assignment.pointsMilli })),
      );
      const scored = all.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
      const averaged = Math.round(
        scored.reduce((sum, g) => sum + (g.scoreMilli! * 100) / g.assignment.pointsMilli!, 0) /
          scored.length,
      );

      // The fixtures above guarantee these differ, so this cannot pass by luck.
      expect(weighted).not.toBe(averaged);
      expect(report.grades.overallPercent).toBe(weighted);
    } finally {
      await db.grade.deleteMany({ where: { assignmentId: { in: [quiz.id, exam.id] } } });
      await db.assignment.deleteMany({ where: { id: { in: [quiz.id, exam.id] } } });
    }
  });

  it("lists every marked piece of work in the window, with the class it belongs to", async () => {
    const report = await buildProgressReport(guardian, childMembershipId);
    const marked = await db.grade.count({
      where: { studentMembershipId: childMembershipId, scoreMilli: { not: null }, gradedAt: gradedIn(report.window) },
    });

    expect(report.grades.marked).toHaveLength(marked);
    for (const row of report.grades.marked) {
      expect(row.title).toBeTruthy();
      expect(row.className).toBeTruthy();
    }
  });

  /**
   * ⚠ A TWELVE-WEEK REPORT IS TWELVE WEEKS OF MARKS. The overall used to be a
   * lifetime average under a term's heading, so a bad year two years back
   * dragged down every report the child was ever given. A nought graded two
   * years ago now moves nothing on the default window, and a report whose
   * window reaches back that far shows it.
   */
  it("⚠ a mark from two years ago does not move the 84-day overall", async () => {
    const before = await buildProgressReport(guardian, childMembershipId);
    const klass = await db.class.findFirstOrThrow({
      where: { schoolId: childSchoolId, enrollments: { some: { studentMembershipId: childMembershipId } } },
    });
    const author = await db.membership.findFirstOrThrow({ where: { schoolId: childSchoolId, role: "TEACHER" } });
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 86_400_000);
    const old = await db.assignment.create({
      data: {
        schoolId: childSchoolId, classId: klass.id, authorMembershipId: author.id,
        title: "TEST old exam", pointsMilli: 100_000, publishedAt: twoYearsAgo, createdAt: twoYearsAgo,
      },
    });
    try {
      await db.grade.create({
        data: {
          schoolId: childSchoolId, assignmentId: old.id, studentMembershipId: childMembershipId,
          scoreMilli: 0, gradedByMembershipId: author.id, gradedAt: twoYearsAgo,
        },
      });
      const after = await buildProgressReport(guardian, childMembershipId);
      expect(after.grades.overallPercent).toBe(before.grades.overallPercent);
      expect(after.grades.marked).toHaveLength(before.grades.marked.length);
      expect(after.grades.marked.map((m) => m.title)).not.toContain("TEST old exam");

      // A window that reaches back that far does count it.
      const reaching = await buildProgressReport(guardian, childMembershipId, {
        fromKey: addDaysToKey(twoYearsAgo.toISOString().slice(0, 10), -2),
        toKey: after.window.toKey,
      });
      expect(reaching.grades.marked.map((m) => m.title)).toContain("TEST old exam");
      if (before.grades.overallPercent !== null) {
        expect(reaching.grades.overallPercent!).toBeLessThan(before.grades.overallPercent);
      }
    } finally {
      await db.grade.deleteMany({ where: { assignmentId: old.id } });
      await db.assignment.deleteMany({ where: { id: old.id } });
    }
  });

  it("⚠ lists only badges actually earned", async () => {
    // A report is a record of what a child has done, not a list of ways they
    // fell short.
    const report = await buildProgressReport(guardian, childMembershipId);
    expect(report.badges.every((b) => b.labelKey.startsWith("practice."))).toBe(true);
  });

  it("says what window it covered, so two reports can be compared", async () => {
    const report = await buildProgressReport(guardian, childMembershipId, {
      fromKey: "2026-05-01",
      toKey: "2026-06-30",
    });
    expect(report.window).toEqual({ fromKey: "2026-05-01", toKey: "2026-06-30" });
  });

  it("⚠ a narrower window reports less, not the same", async () => {
    const wide = await buildProgressReport(guardian, childMembershipId, {
      fromKey: "2000-01-01",
      toKey: "2100-01-01",
    });
    const narrow = await buildProgressReport(guardian, childMembershipId, {
      fromKey: "2100-01-02",
      toKey: "2100-01-03",
    });

    expect(narrow.attendance.total).toBe(0);
    expect(narrow.attendance.percent).toBeNull();
    expect(wide.attendance.total).toBeGreaterThan(0);
  });

  it("refuses a range that runs backwards", async () => {
    await expect(
      buildProgressReport(guardian, childMembershipId, { fromKey: "2026-07-01", toKey: "2026-06-01" }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});
