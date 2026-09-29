import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createAssignment,
  getGradebook,
  overallPercent,
  saveGrades,
  weightedPercent,
  weightsAreUsable,
  overallForStudent,
} from "@/lib/grading";
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

  /**
   * ⚠ THE CLASS WITH ENOUGH CHILDREN IN IT, not whichever row came back first.
   *
   * Priya teaches three classes and this was `findFirst` with no `orderBy`, so
   * which one it picked was up to Postgres. The seed puts 18 pupils in one and
   * 3 in each of the others, and the assertion below needs four — so the suite
   * passed or failed depending on row order, and re-seeding was enough to flip
   * it. Selecting on the property the test actually depends on is the fix; an
   * `orderBy` would only have made the coin-toss repeatable.
   */
  const priyaClasses = await db.classTeacher.findMany({
    where: { teacherMembershipId: priyaMembership.id },
    select: { classId: true },
  });
  let best: { classId: string; count: number } | null = null;
  for (const row of priyaClasses) {
    const count = await db.enrollment.count({
      where: { classId: row.classId, status: "ACTIVE" },
    });
    if (!best || count > best.count) best = { classId: row.classId, count };
  }
  classId = best!.classId;

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

  it("⚠ keeps the letter when a save says nothing of it, sets it when one is sent, and clears it on an empty one", async () => {
    const pupil = students[0]!;
    const letterOf = async () => (await db.grade.findUniqueOrThrow({ where: { assignmentId_studentMembershipId: { assignmentId, studentMembershipId: pupil } } })).letter;
    await saveGrades(teacher, assignmentId, [{ studentMembershipId: pupil, score: 17, letter: " B1 " }], { notifyStudents: false });
    expect(await letterOf()).toBe("B1");
    // The web's gradebook: a score and a comment, no letter.
    await saveGrades(teacher, assignmentId, [{ studentMembershipId: pupil, score: 18, comment: "Better." }], { notifyStudents: false });
    expect(await letterOf()).toBe("B1");
    await saveGrades(teacher, assignmentId, [{ studentMembershipId: pupil, score: 18, letter: "A2" }], { notifyStudents: false });
    expect(await letterOf()).toBe("A2");
    await saveGrades(teacher, assignmentId, [{ studentMembershipId: pupil, score: 18, letter: "" }], { notifyStudents: false });
    expect(await letterOf()).toBeNull();
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

describe("weightedPercent — categories with different weights", () => {
  const W = [
    { name: "Homework", weightBps: 2000 },
    { name: "Quiz", weightBps: 3000 },
    { name: "Exam", weightBps: 5000 },
  ];

  it("combines categories by weight, not by points across the whole class", () => {
    // Homework 100% (10/10), Quiz 50% (5/10), Exam 80% (80/100).
    //   weighted   : 100*0.2 + 50*0.3 + 80*0.5 = 20 + 15 + 40 = 75
    //   unweighted : (10 + 5 + 80) * 100 / (10 + 10 + 100) = 79
    // Hand-computed. The two methods genuinely disagree, which is the point.
    const result = weightedPercent(
      [
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Homework" },
        { scoreMilli: toMilli(5), maxMilli: toMilli(10), category: "Quiz" },
        { scoreMilli: toMilli(80), maxMilli: toMilli(100), category: "Exam" },
      ],
      W,
    );
    expect(result.percent).toBe(75);
    expect(result.percent).not.toBe(79);
  });

  it("weights by points WITHIN a category", () => {
    // Two quizzes, 1/5 and 90/100, alone in a 100%-weighted category:
    // (1 + 90) * 100 / 105 = 86.67 -> 87. Same rule as overallPercent.
    const result = weightedPercent(
      [
        { scoreMilli: toMilli(1), maxMilli: toMilli(5), category: "Quiz" },
        { scoreMilli: toMilli(90), maxMilli: toMilli(100), category: "Quiz" },
      ],
      [{ name: "Quiz", weightBps: 10000 }],
    );
    expect(result.percent).toBe(87);
  });

  it("⚠ drops an empty category and renormalises rather than scoring it zero", () => {
    // Only homework marked, in October. Homework is 20% of the year, but it is
    // 100% of what has been marked.
    //   right : 90
    //   wrong : 90 * 0.2 = 18, as if the unsat exam were a zero
    const result = weightedPercent(
      [{ scoreMilli: toMilli(9), maxMilli: toMilli(10), category: "Homework" }],
      W,
    );
    expect(result.percent).toBe(90);
    expect(result.percent).not.toBe(18);
  });

  it("renormalises the survivors to exactly 100% of the remaining weight", () => {
    // Homework (2000) and Quiz (3000) marked, Exam empty. Live total 5000, so
    // the effective split is 40/60.
    //   100*0.4 + 50*0.6 = 40 + 30 = 70
    const result = weightedPercent(
      [
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Homework" },
        { scoreMilli: toMilli(5), maxMilli: toMilli(10), category: "Quiz" },
      ],
      W,
    );
    expect(result.percent).toBe(70);
    const live = result.parts.filter((p) => p.percent !== null);
    expect(live.map((p) => p.effectiveBps)).toEqual([4000, 6000]);
    expect(live.reduce((s, p) => s + p.effectiveBps, 0)).toBe(10000);
  });

  it("keeps three equal categories summing to 100% without rounding drift", () => {
    const thirds = [
      { name: "A", weightBps: 3333 },
      { name: "B", weightBps: 3333 },
      { name: "C", weightBps: 3334 },
    ];
    const result = weightedPercent(
      [
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "A" },
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "B" },
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "C" },
      ],
      thirds,
    );
    // All three perfect, so the answer must be exactly 100 whatever the weights.
    expect(result.percent).toBe(100);
    expect(result.parts.reduce((s, p) => s + p.effectiveBps, 0)).toBe(10000);
  });

  it("⚠ counts work that matches no declared category instead of hiding it", () => {
    const result = weightedPercent(
      [
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Homework" },
        { scoreMilli: toMilli(0), maxMilli: toMilli(50), category: "Project" },
        { scoreMilli: toMilli(0), maxMilli: toMilli(50), category: null },
      ],
      W,
    );
    // The two zeroes are outside the weights, so they cannot drag the total.
    expect(result.percent).toBe(100);
    // But they are REPORTED, so the UI can say two pieces do not count.
    expect(result.uncategorised).toBe(2);
  });

  it("does not count unmarked or maximum-less work as uncategorised", () => {
    const result = weightedPercent(
      [
        { scoreMilli: null, maxMilli: toMilli(10), category: "Nonsense" },
        { scoreMilli: toMilli(3), maxMilli: null, category: "Nonsense" },
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Homework" },
      ],
      W,
    );
    expect(result.uncategorised).toBe(0);
    expect(result.percent).toBe(100);
  });

  it("returns null, not 0, when nothing in any weighted category is marked", () => {
    expect(weightedPercent([], W).percent).toBeNull();
    expect(
      weightedPercent(
        [{ scoreMilli: toMilli(5), maxMilli: toMilli(10), category: "Project" }],
        W,
      ).percent,
    ).toBeNull();
  });

  it("ignores a category declared with zero weight", () => {
    const result = weightedPercent(
      [
        { scoreMilli: toMilli(0), maxMilli: toMilli(10), category: "Practice" },
        { scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Exam" },
      ],
      [
        { name: "Practice", weightBps: 0 },
        { name: "Exam", weightBps: 10000 },
      ],
    );
    expect(result.percent).toBe(100);
    // Zero-weighted work is outside the total, so it is reported like any other
    // work that does not count.
    expect(result.uncategorised).toBe(1);
  });

  it("carries bonus marks through a category", () => {
    const result = weightedPercent(
      [{ scoreMilli: toMilli(22), maxMilli: toMilli(20), category: "Exam" }],
      [{ name: "Exam", weightBps: 10000 }],
    );
    expect(result.percent).toBe(110);
  });
});

describe("weightsAreUsable — when to weight at all", () => {
  it("accepts a set totalling exactly 100%", () => {
    expect(
      weightsAreUsable([
        { name: "Homework", weightBps: 4000 },
        { name: "Exam", weightBps: 6000 },
      ]),
    ).toBe(true);
  });

  it("⚠ refuses a half-finished set rather than scaling it up", () => {
    // Homework 20 + Quiz 30 and the exam not added yet. Applying this as given
    // would silently put every child on a 50-point scale nobody chose.
    expect(
      weightsAreUsable([
        { name: "Homework", weightBps: 2000 },
        { name: "Quiz", weightBps: 3000 },
      ]),
    ).toBe(false);
  });

  it("refuses a set totalling more than 100%", () => {
    expect(
      weightsAreUsable([
        { name: "Homework", weightBps: 6000 },
        { name: "Exam", weightBps: 6000 },
      ]),
    ).toBe(false);
  });

  it("treats no categories as no weighting", () => {
    expect(weightsAreUsable([])).toBe(false);
  });
});

describe("overallForStudent — across classes that weight differently", () => {
  const maths = [
    { name: "Homework", weightBps: 2000 },
    { name: "Exam", weightBps: 8000 },
  ];

  it("⚠ is byte-for-byte the old number when NO class weights anything", () => {
    // The guarantee schools rely on: adopting the feature and not using it must
    // not move a single report card.
    const entries = [
      { classId: "c1", scoreMilli: toMilli(1), maxMilli: toMilli(5), category: null },
      { classId: "c2", scoreMilli: toMilli(90), maxMilli: toMilli(100), category: "Exam" },
    ];
    const result = overallForStudent(entries, new Map());
    expect(result.percent).toBe(overallPercent(entries));
    expect(result.percent).toBe(87);
    expect(result.method).toBe("points");
  });

  it("scores a weighted class by its weights and an unweighted one by points", () => {
    // Maths: Homework 10/10 (100%) at 20%, Exam 50/100 (50%) at 80%
    //        -> 100*0.2 + 50*0.8 = 20 + 40 = 60
    // History (no weights): 30/100 -> 30
    // Combined equally: (60 + 30) / 2 = 45
    const result = overallForStudent(
      [
        { classId: "maths", scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Homework" },
        { classId: "maths", scoreMilli: toMilli(50), maxMilli: toMilli(100), category: "Exam" },
        { classId: "history", scoreMilli: toMilli(30), maxMilli: toMilli(100), category: null },
      ],
      new Map([["maths", maths]]),
    );
    expect(result.percent).toBe(45);
    expect(result.method).toBe("weighted");
  });

  it("⚠ does not let a class that sets more work count for more of the child", () => {
    // Class A: one 10-point piece at 100%. Class B: one 200-point piece at 0%.
    //   equal per class : (100 + 0) / 2 = 50
    //   points-weighted : 10 * 100 / 210 = 5
    // The child is perfect in one subject and lost in the other; 50 says that.
    const result = overallForStudent(
      [
        { classId: "a", scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Exam" },
        { classId: "b", scoreMilli: toMilli(0), maxMilli: toMilli(200), category: null },
      ],
      new Map([["a", [{ name: "Exam", weightBps: 10000 }]]]),
    );
    expect(result.percent).toBe(50);
    expect(result.percent).not.toBe(5);
  });

  it("ignores a class whose weights do not total 100% and uses points there", () => {
    // Half-entered weights on 'maths' must not put that class on a 50-point
    // scale — it falls back to points WITHIN the class.
    const half = [{ name: "Homework", weightBps: 2000 }];
    const result = overallForStudent(
      [
        { classId: "maths", scoreMilli: toMilli(8), maxMilli: toMilli(10), category: "Homework" },
        { classId: "art", scoreMilli: toMilli(6), maxMilli: toMilli(10), category: "Exam" },
      ],
      new Map([
        ["maths", half],
        ["art", [{ name: "Exam", weightBps: 10000 }]],
      ]),
    );
    // maths -> 80 by points, art -> 60 by its weights, mean 70.
    expect(result.percent).toBe(70);
  });

  it("adds up uncategorised work from every weighted class", () => {
    const result = overallForStudent(
      [
        { classId: "maths", scoreMilli: toMilli(5), maxMilli: toMilli(10), category: "Project" },
        { classId: "maths", scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Exam" },
        { classId: "sci", scoreMilli: toMilli(5), maxMilli: toMilli(10), category: "Fieldwork" },
        { classId: "sci", scoreMilli: toMilli(10), maxMilli: toMilli(10), category: "Exam" },
      ],
      new Map([
        ["maths", [{ name: "Exam", weightBps: 10000 }]],
        ["sci", [{ name: "Exam", weightBps: 10000 }]],
      ]),
    );
    expect(result.uncategorised).toBe(2);
    expect(result.percent).toBe(100);
  });

  it("returns null rather than 0 when a weighted class has nothing marked", () => {
    const result = overallForStudent(
      [{ classId: "maths", scoreMilli: null, maxMilli: toMilli(10), category: "Exam" }],
      new Map([["maths", [{ name: "Exam", weightBps: 10000 }]]]),
    );
    expect(result.percent).toBeNull();
  });
});
