import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createAssignment, getGradebook, overallPercent, saveGrades } from "@/lib/grading";
import { formatMilli, fromMilli, toMilli } from "@/lib/validation";
import { AccessError } from "@/lib/tenancy";

/**
 * Grading arithmetic.
 *
 * Scores are money-shaped: a half mark is real, and a class average that drifts
 * by a fraction is the kind of thing a parent notices and a teacher cannot
 * explain. Everything here checks the integer-thousandths contract holds, and
 * that averages are computed from summed points rather than by averaging
 * percentages — which silently weights a 5-point quiz like a 100-point exam.
 */

const db = new PrismaClient();

type Ctx = {
  schoolId: string;
  membershipId: string;
  role: "TEACHER";
  userId: string;
};

let teacher: Ctx;
let otherTeacher: Ctx;
let classId: string;
let students: string[];
let outsider: string;
let assignmentId: string;

beforeAll(async () => {
  const riverside = await db.school.findFirstOrThrow({
    where: { name: "Riverside Primary School" },
  });
  const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
  const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });

  const priyaMembership = await db.membership.findFirstOrThrow({
    where: { userId: priya.id, schoolId: riverside.id, role: "TEACHER" },
  });
  const tomMembership = await db.membership.findFirstOrThrow({
    where: { userId: tom.id, schoolId: riverside.id, role: "TEACHER" },
  });

  const priyaClass = await db.classTeacher.findFirstOrThrow({
    where: { teacherMembershipId: priyaMembership.id },
  });
  classId = priyaClass.classId;

  teacher = {
    schoolId: riverside.id,
    membershipId: priyaMembership.id,
    role: "TEACHER",
    userId: priya.id,
  };
  otherTeacher = {
    schoolId: riverside.id,
    membershipId: tomMembership.id,
    role: "TEACHER",
    userId: tom.id,
  };

  const enrollments = await db.enrollment.findMany({
    where: { classId, status: "ACTIVE" },
    select: { studentMembershipId: true },
    take: 4,
  });
  students = enrollments.map((e) => e.studentMembershipId);
  expect(students.length).toBeGreaterThanOrEqual(4);

  outsider = (
    await db.membership.findFirstOrThrow({
      where: {
        schoolId: riverside.id,
        role: "STUDENT",
        enrollments: { none: { classId } },
      },
    })
  ).id;

  await cleanup();

  const created = await createAssignment(teacher, {
    classId,
    title: "TEST assignment — arithmetic",
    body: "",
    points: 20,
    publish: false, // draft: no notification fan-out during tests
  });
  assignmentId = created.assignmentId;
});

afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

async function cleanup() {
  const doomed = await db.assignment.findMany({
    where: { title: { startsWith: "TEST assignment" } },
    select: { id: true },
  });
  const ids = doomed.map((a) => a.id);
  if (ids.length === 0) return;
  await db.grade.deleteMany({ where: { assignmentId: { in: ids } } });
  await db.submission.deleteMany({ where: { assignmentId: { in: ids } } });
  await db.assignment.deleteMany({ where: { id: { in: ids } } });
}

describe("milli conversion", () => {
  it("round-trips whole and half points exactly", () => {
    for (const value of [0, 1, 17, 20, 87.5, 0.5, 99.999]) {
      expect(fromMilli(toMilli(value))).toBeCloseTo(value, 3);
    }
  });

  it("stores 87.5 as exactly 87500 — no float residue", () => {
    expect(toMilli(87.5)).toBe(87500);
    expect(Number.isInteger(toMilli(87.5))).toBe(true);
  });

  it("survives the classic 0.1 + 0.2 case that breaks float storage", () => {
    // 0.1 + 0.2 === 0.30000000000000004 in float. In milli it is exact.
    expect(toMilli(0.1) + toMilli(0.2)).toBe(300);
    expect(fromMilli(toMilli(0.1) + toMilli(0.2))).toBe(0.3);
  });

  it("formats without trailing zeros or float artefacts", () => {
    expect(formatMilli(20000)).toBe("20");
    expect(formatMilli(87500)).toBe("87.5");
    expect(formatMilli(0)).toBe("0");
    expect(formatMilli(null)).toBe("—");
  });
});

describe("saveGrades", () => {
  it("stores a half mark exactly", async () => {
    const result = await saveGrades(
      teacher,
      assignmentId,
      [{ studentMembershipId: students[0]!, score: 17.5 }],
      { notifyStudents: false },
    );
    expect(result.saved).toBe(1);

    const row = await db.grade.findFirstOrThrow({
      where: { assignmentId, studentMembershipId: students[0]! },
    });
    expect(row.scoreMilli).toBe(17500);
    expect(Number.isInteger(row.scoreMilli)).toBe(true);
  });

  it("updates rather than duplicating on a second save", async () => {
    await saveGrades(teacher, assignmentId, [{ studentMembershipId: students[0]!, score: 18 }], {
      notifyStudents: false,
    });
    const rows = await db.grade.findMany({
      where: { assignmentId, studentMembershipId: students[0]! },
    });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.scoreMilli).toBe(18000);
  });

  it("clears a grade when the score is null", async () => {
    const result = await saveGrades(
      teacher,
      assignmentId,
      [{ studentMembershipId: students[0]!, score: null }],
      { notifyStudents: false },
    );
    expect(result.cleared).toBe(1);
    const rows = await db.grade.findMany({
      where: { assignmentId, studentMembershipId: students[0]! },
    });
    expect(rows).toHaveLength(0);
  });

  it("stores a comment alongside the mark", async () => {
    await saveGrades(
      teacher,
      assignmentId,
      [{ studentMembershipId: students[1]!, score: 15, comment: "  Nice working out.  " }],
      { notifyStudents: false },
    );
    const row = await db.grade.findFirstOrThrow({
      where: { assignmentId, studentMembershipId: students[1]! },
    });
    expect(row.comment).toBe("Nice working out.");
  });

  it("allows bonus marks above the maximum", async () => {
    // 22 out of 20 is a real thing teachers do.
    const result = await saveGrades(
      teacher,
      assignmentId,
      [{ studentMembershipId: students[2]!, score: 22 }],
      { notifyStudents: false },
    );
    expect(result.saved).toBe(1);
    expect(result.rejected).toEqual([]);
  });

  it("rejects an absurd over-mark as a typo", async () => {
    // 175 into a 20-point task is a slipped decimal, not generosity.
    const result = await saveGrades(
      teacher,
      assignmentId,
      [{ studentMembershipId: students[3]!, score: 175 }],
      { notifyStudents: false },
    );
    expect(result.saved).toBe(0);
    expect(result.rejected).toContain(students[3]!);
  });

  it("rejects negative and non-finite scores", async () => {
    const result = await saveGrades(
      teacher,
      assignmentId,
      [
        { studentMembershipId: students[3]!, score: -5 },
        { studentMembershipId: students[2]!, score: Number.NaN },
      ],
      { notifyStudents: false },
    );
    expect(result.saved).toBe(0);
    expect(result.rejected).toHaveLength(2);
  });

  it("refuses a student who is not in this assignment's class", async () => {
    const result = await saveGrades(
      teacher,
      assignmentId,
      [{ studentMembershipId: outsider, score: 20 }],
      { notifyStudents: false },
    );
    expect(result.saved).toBe(0);
    expect(result.rejected).toContain(outsider);

    const leaked = await db.grade.count({ where: { assignmentId, studentMembershipId: outsider } });
    expect(leaked).toBe(0);
  });

  it("still applies the valid marks in a batch containing an invalid one", async () => {
    const result = await saveGrades(
      teacher,
      assignmentId,
      [
        { studentMembershipId: students[0]!, score: 19 },
        { studentMembershipId: outsider, score: 20 },
        { studentMembershipId: students[1]!, score: 16 },
      ],
      { notifyStudents: false },
    );
    // A poisoned row must not discard a teacher's legitimate marking.
    expect(result.saved).toBe(2);
    expect(result.rejected).toHaveLength(1);
  });

  it("refuses a teacher who does not teach this class", async () => {
    await expect(
      saveGrades(otherTeacher, assignmentId, [{ studentMembershipId: students[0]!, score: 10 }], {
        notifyStudents: false,
      }),
    ).rejects.toBeInstanceOf(AccessError);
  });
});

describe("overallPercent — averaging across different maximums", () => {
  it("weights by points available, NOT by averaging percentages", () => {
    // A 5-point quiz scored 1/5 (20%) and a 100-point exam scored 90/100 (90%).
    //   correct  : (1000 + 90000) * 100 / (5000 + 100000) = 87%
    //   the bug  : (20 + 90) / 2                          = 55%
    // A 32-point gap on a report card. Hand-computed, not derived from the code.
    const value = overallPercent([
      { scoreMilli: toMilli(1), maxMilli: toMilli(5) },
      { scoreMilli: toMilli(90), maxMilli: toMilli(100) },
    ]);
    expect(value).toBe(87);
    expect(value).not.toBe(55);
  });

  it("agrees with the naive method when every maximum is equal", () => {
    // 20/20 and 10/20 — both methods give 75. This is why the unequal case
    // above is the one that actually tests anything.
    expect(
      overallPercent([
        { scoreMilli: toMilli(20), maxMilli: toMilli(20) },
        { scoreMilli: toMilli(10), maxMilli: toMilli(20) },
      ]),
    ).toBe(75);
  });

  it("excludes unmarked work rather than counting it as zero", () => {
    expect(
      overallPercent([
        { scoreMilli: toMilli(10), maxMilli: toMilli(10) },
        { scoreMilli: null, maxMilli: toMilli(50) },
      ]),
    ).toBe(100);
  });

  it("excludes work with no maximum", () => {
    expect(
      overallPercent([
        { scoreMilli: toMilli(10), maxMilli: toMilli(10) },
        { scoreMilli: toMilli(3), maxMilli: null },
      ]),
    ).toBe(100);
  });

  it("returns null, not 0 or NaN, when there is nothing to average", () => {
    expect(overallPercent([])).toBeNull();
    expect(overallPercent([{ scoreMilli: null, maxMilli: toMilli(10) }])).toBeNull();
    expect(overallPercent([{ scoreMilli: toMilli(5), maxMilli: 0 }])).toBeNull();
  });

  it("handles half marks without drift", () => {
    // (17500 + 12500) * 100 / 40000 = 75 exactly.
    expect(
      overallPercent([
        { scoreMilli: toMilli(17.5), maxMilli: toMilli(20) },
        { scoreMilli: toMilli(12.5), maxMilli: toMilli(20) },
      ]),
    ).toBe(75);
  });

  it("copes with bonus marks pushing the total above 100%", () => {
    expect(
      overallPercent([{ scoreMilli: toMilli(22), maxMilli: toMilli(20) }]),
    ).toBe(110);
  });
});

describe("getGradebook averages", () => {
  it("computes the class average across the marked students", async () => {
    await db.grade.deleteMany({ where: { assignmentId } });

    await saveGrades(
      teacher,
      assignmentId,
      [
        { studentMembershipId: students[0]!, score: 20 },
        { studentMembershipId: students[1]!, score: 10 },
      ],
      { notifyStudents: false },
    );

    const book = await getGradebook(teacher, assignmentId);
    expect(book.stats.graded).toBe(2);
    expect(book.stats.averagePercent).toBe(75);
  });

  it("returns null, not 0, when nothing is marked", async () => {
    await db.grade.deleteMany({ where: { assignmentId } });
    const book = await getGradebook(teacher, assignmentId);
    expect(book.stats.graded).toBe(0);
    // A class average of "0%" before any marking is a lie a parent would act on.
    expect(book.stats.averagePercent).toBeNull();
  });

  it("handles half marks in the average without float drift", async () => {
    await db.grade.deleteMany({ where: { assignmentId } });
    await saveGrades(
      teacher,
      assignmentId,
      [
        { studentMembershipId: students[0]!, score: 17.5 },
        { studentMembershipId: students[1]!, score: 12.5 },
      ],
      { notifyStudents: false },
    );
    const book = await getGradebook(teacher, assignmentId);
    // (17500 + 12500) * 100 / (2 * 20000) = 75 exactly.
    expect(book.stats.averagePercent).toBe(75);
  });

  it("lists every enrolled student, marked or not", async () => {
    const book = await getGradebook(teacher, assignmentId);
    const enrolled = await db.enrollment.count({ where: { classId, status: "ACTIVE" } });
    expect(book.rows).toHaveLength(enrolled);
    expect(book.stats.total).toBe(enrolled);
  });

  it("sorts the roster by display name", async () => {
    const book = await getGradebook(teacher, assignmentId);
    const names = book.rows.map((r) => r.name);
    const sorted = [...names].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    expect(names).toEqual(sorted);
  });

  it("refuses a teacher who does not teach the class", async () => {
    await expect(getGradebook(otherTeacher, assignmentId)).rejects.toBeInstanceOf(AccessError);
  });
});
