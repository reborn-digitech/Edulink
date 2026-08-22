import "server-only";
import { db } from "./db";
import { toMilli } from "./validation";
import { readAttachments } from "./files";
import { writeJson, type Attachment } from "./json";
import { publish, channel } from "./realtime";
import { notify, notifyGuardians } from "./notify";
import { audit } from "./audit";
import { AccessError, assertAssignmentAccess, assertClassAccess, assertGuardianAccess } from "./tenancy";
import type { ActiveContext } from "./session";

/**
 * Assignments and grading.
 *
 * Scores are integer thousandths of a point end to end (`scoreMilli`): 87.5
 * becomes 87500. Averages are computed as (sum earned × 100) ÷ sum available in
 * integers, never by averaging percentages — averaging percentages weights a
 * 5-point quiz the same as a 100-point exam, which is simply the wrong number
 * and the sort of thing a parent notices before you do. (§10)
 */

/**
 * Overall percentage across pieces of work with DIFFERENT maximums.
 *
 * Sums points earned and points available, then divides once. The tempting
 * alternative — average the per-assignment percentages — weights a 5-point
 * spelling quiz exactly the same as a 100-point exam, so one bad quiz can move
 * a term grade further than a bad exam. That is not a rounding nit; it is a
 * different and wrong number, and it is the one a parent will query.
 *
 * Work with no maximum is excluded rather than counted as zero.
 */
export function overallPercent(
  entries: { scoreMilli: number | null; maxMilli: number | null }[],
): number | null {
  let earned = 0;
  let available = 0;
  for (const entry of entries) {
    if (entry.scoreMilli === null || !entry.maxMilli) continue;
    earned += entry.scoreMilli;
    available += entry.maxMilli;
  }
  if (available === 0) return null;
  return Math.round((earned * 100) / available);
}

/* -------------------------------------------------------------------------- */
/* Weighted categories                                                         */
/* -------------------------------------------------------------------------- */

/** 10000 basis points = 100%. Integers, like every other number in here. */
export const WEIGHT_SCALE = 10_000;

export type CategoryWeight = { name: string; weightBps: number };

export type WeightedEntry = {
  scoreMilli: number | null;
  maxMilli: number | null;
  /** `Assignment.category`. Null means the teacher never set one. */
  category: string | null;
};

export type WeightedResult = {
  /** The overall figure, or null when nothing counts towards it yet. */
  percent: number | null;
  /** Per-category detail, in the order the weights were given. */
  parts: {
    name: string;
    /** The weight as declared. */
    weightBps: number;
    /** The weight actually applied after empty categories were dropped. */
    effectiveBps: number;
    percent: number | null;
    counted: number;
  }[];
  /**
   * Graded work that matched no declared category.
   *
   * COUNTED AND RETURNED, never silently discarded. If a teacher weights three
   * categories and then sets an assignment's category to "Project", that work
   * contributes nothing to the total — which is defensible, but only if
   * somebody is told. A number here is what lets the UI say so.
   */
  uncategorised: number;
};

/**
 * Overall percentage when a class weights its categories.
 *
 * Each category is scored on its own by the same points-weighted rule
 * `overallPercent` uses — a 5-point quiz and a 100-point quiz inside "Quiz" do
 * not count equally — and then the categories are combined by their weights.
 * Two different questions, answered separately, which is the whole point of
 * having categories at all.
 *
 * EMPTY CATEGORIES ARE DROPPED AND THE REST RENORMALISED. In October a class
 * has homework marks and no exam marks, and an exam category weighted 50% with
 * nothing in it would otherwise drag every child to half of what they have
 * earned. Treating an unsat exam as zero is not a strict reading of the rules,
 * it is a wrong number. So a term with only homework marked reports the
 * homework percentage, and the exam starts counting the day it is marked.
 *
 * Renormalising is done ONCE over the surviving weights rather than by scaling
 * each in turn, so three categories of 3333 bps each still total exactly 100%
 * and no child loses a point to rounding drift.
 */
export function weightedPercent(
  entries: WeightedEntry[],
  weights: CategoryWeight[],
): WeightedResult {
  const declared = weights.filter((w) => w.weightBps > 0);
  const known = new Set(declared.map((w) => w.name));

  let uncategorised = 0;
  for (const entry of entries) {
    if (entry.scoreMilli === null || !entry.maxMilli) continue;
    if (entry.category === null || !known.has(entry.category)) uncategorised++;
  }

  const parts = declared.map((weight) => {
    const mine = entries.filter(
      (e) => e.category === weight.name && e.scoreMilli !== null && e.maxMilli,
    );
    let earned = 0;
    let available = 0;
    for (const entry of mine) {
      earned += entry.scoreMilli!;
      available += entry.maxMilli!;
    }
    return {
      name: weight.name,
      weightBps: weight.weightBps,
      effectiveBps: 0,
      percent: available === 0 ? null : (earned * 100) / available,
      counted: mine.length,
    };
  });

  const live = parts.filter((p) => p.percent !== null);
  const liveTotal = live.reduce((sum, p) => sum + p.weightBps, 0);
  if (liveTotal === 0) {
    return { percent: null, parts, uncategorised };
  }

  let combined = 0;
  for (const part of live) {
    part.effectiveBps = Math.round((part.weightBps * WEIGHT_SCALE) / liveTotal);
    combined += part.percent! * part.weightBps;
  }

  return {
    // Divided by the LIVE total, not by WEIGHT_SCALE — that is the
    // renormalisation, and doing it here keeps it in one place.
    percent: Math.round(combined / liveTotal),
    parts,
    uncategorised,
  };
}

/**
 * True when a class has usable weights.
 *
 * Weights that do not add up to 100% are treated as ABSENT rather than applied
 * as given. A class holding a half-finished set — Homework 20, Quiz 30, and the
 * exam not yet added — would otherwise report every child on a 50-point scale
 * that nobody chose. Falling back to the points-weighted total is the safe
 * wrong-way-round: it is the number the school had before categories existed.
 */
export function weightsAreUsable(weights: CategoryWeight[]): boolean {
  if (weights.length === 0) return false;
  const total = weights.reduce((sum, w) => sum + Math.max(0, w.weightBps), 0);
  return total === WEIGHT_SCALE;
}

export type ClassEntry = WeightedEntry & { classId: string };

export type OverallResult = {
  percent: number | null;
  /** Which rule produced it, so the UI can say. */
  method: "points" | "weighted";
  /** Graded work in no declared category, across every weighted class. */
  uncategorised: number;
};

/**
 * One child's overall percentage across every class they are in.
 *
 * THE HARD PART IS THAT WEIGHTS ARE PER CLASS. Maths may weight exams at 50%
 * and History may not weight anything, and there is no single sum that honours
 * both. So:
 *
 *   - If NO class the child is in has usable weights, this is byte-for-byte
 *     today's number: one points-weighted total across all their work. Schools
 *     that never touch categories see nothing change, which is the only
 *     acceptable behaviour for a number already printed on report cards.
 *
 *   - If ANY class has usable weights, each class is scored on its own — by its
 *     own weights where it has them, points-weighted where it does not — and
 *     the class percentages are then averaged EQUALLY.
 *
 * Equally, and not by points, because once each class is on its own 0–100 scale
 * they are already comparable, and points-weighting them again would let a class
 * that happens to set more homework count for more of a child's overall mark
 * than a class that sets less. That is a fact about a teacher's habits, not
 * about the child.
 *
 * The discontinuity between the two rules is real: the first class to adopt
 * weights changes how every OTHER class contributes to the same child's total.
 * It is reported in `method` rather than hidden, because a parent who sees the
 * number move deserves to be told which rule produced it.
 */
export function overallForStudent(
  entries: ClassEntry[],
  weightsByClass: Map<string, CategoryWeight[]>,
): OverallResult {
  const classIds = [...new Set(entries.map((e) => e.classId))];
  const anyWeighted = classIds.some((id) => weightsAreUsable(weightsByClass.get(id) ?? []));

  if (!anyWeighted) {
    return { percent: overallPercent(entries), method: "points", uncategorised: 0 };
  }

  const perClass: number[] = [];
  let uncategorised = 0;

  for (const classId of classIds) {
    const mine = entries.filter((e) => e.classId === classId);
    const weights = weightsByClass.get(classId) ?? [];

    if (weightsAreUsable(weights)) {
      const result = weightedPercent(mine, weights);
      uncategorised += result.uncategorised;
      if (result.percent !== null) perClass.push(result.percent);
    } else {
      const flat = overallPercent(mine);
      if (flat !== null) perClass.push(flat);
    }
  }

  if (perClass.length === 0) return { percent: null, method: "weighted", uncategorised };

  const mean = perClass.reduce((sum, p) => sum + p, 0) / perClass.length;
  return { percent: Math.round(mean), method: "weighted", uncategorised };
}

/* -------------------------------------------------------------------------- */
/* Reading and writing a class's weights                                       */
/* -------------------------------------------------------------------------- */

/**
 * The weights a class uses, in display order.
 *
 * Returns `[]` for a class that has never set any, which `weightsAreUsable`
 * then reads as "not weighted" — so every caller gets today's points-weighted
 * behaviour without having to ask whether weighting is switched on.
 */
export async function listGradeCategories(
  session: ActiveContext,
  classId: string,
): Promise<{ id: string; name: string; weightBps: number; position: number }[]> {
  if (!session.schoolId) return [];
  return db.gradeCategory.findMany({
    where: { schoolId: session.schoolId, classId },
    select: { id: true, name: true, weightBps: true, position: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
}

/** The one delegate the grade-category save touches. */
type CategoryTx = {
  gradeCategory: {
    deleteMany(args: unknown): Promise<unknown>;
    createMany(args: unknown): Promise<unknown>;
  };
};

/**
 * Replaces a class's whole set of weights in one call.
 *
 * WHOLE SET, NOT ONE ROW AT A TIME, because the invariant that matters spans
 * the set: the weights have to total 100%. Saving one category at a time means
 * every intermediate save is a set that does not add up, and either the write
 * is refused (so the teacher cannot get from one valid set to another) or it is
 * allowed (so the class sits on an invalid set between saves). Replacing the
 * lot makes the valid state the only state that is ever stored.
 *
 * An empty list clears weighting entirely and returns the class to the
 * points-weighted total, which is a legitimate thing to want and must not
 * require deleting rows one by one.
 */
export async function saveGradeCategories(
  session: ActiveContext,
  classId: string,
  categories: { name: string; weightBps: number }[],
): Promise<void> {
  if (session.role !== "TEACHER" && session.role !== "ADMIN") {
    throw new AccessError("access.onlyATeacherOrAnAdminCan3");
  }
  const klass = await assertClassAccess(
    { schoolId: session.schoolId!, membershipId: session.membershipId!, role: session.role },
    classId,
    { write: true },
  );

  const clean = categories
    .map((c) => ({ name: c.name.trim(), weightBps: Math.round(c.weightBps) }))
    .filter((c) => c.name.length > 0);

  for (const category of clean) {
    if (category.name.length > 40) throw new AccessError("access.categoryNamesMustBe40CharactersOr");
    if (category.weightBps < 0) throw new AccessError("access.aWeightCannotBeNegative");
    if (category.weightBps > WEIGHT_SCALE) throw new AccessError("access.aSingleWeightCannotExceed100");
  }

  const names = new Set(clean.map((c) => c.name.toLowerCase()));
  if (names.size !== clean.length) {
    // Two categories of the same name would both match the same assignments,
    // so the work would be counted twice under two different weights.
    throw new AccessError("access.twoCategoriesCannotShareAName");
  }

  const total = clean.reduce((sum, c) => sum + c.weightBps, 0);
  if (clean.length > 0 && total !== WEIGHT_SCALE) {
    throw new AccessError(
      "access.weightsMustTotal",
      "FORBIDDEN",
      { total: (total / 100).toFixed(2) },
    );
  }

  /**
   * `$tenantTransaction`, not `db.$transaction`. See db.ts: on this extended
   * client both `db.$transaction` forms re-issue each statement in its own
   * transaction so the tenant can be bound, which leaves the outer one holding
   * nothing. Here that is delete-then-recreate, so a failure between the two
   * would leave a class with NO weighting categories at all and every mark
   * quietly re-weighted.
   */
  await db.$tenantTransaction(async (txUnknown: unknown) => {
    const tx = txUnknown as CategoryTx;
    await tx.gradeCategory.deleteMany({ where: { schoolId: klass.schoolId, classId } });
    if (clean.length === 0) return;
    await tx.gradeCategory.createMany({
      data: clean.map((c, index) => ({
        schoolId: klass.schoolId,
        classId,
        name: c.name,
        weightBps: c.weightBps,
        position: index,
      })),
    });
  });

  await audit({
    schoolId: klass.schoolId,
    actorUserId: session.user.id,
    action: "gradeCategories.save",
    targetType: "Class",
    targetId: classId,
    meta: { count: clean.length, names: clean.map((c) => c.name) },
  });
}

export type GradeInput = {
  studentMembershipId: string;
  /** Points as the teacher typed them, e.g. 17.5. Null clears the grade. */
  score: number | null;
  letter?: string;
  comment?: string;
};

export async function createAssignment(
  ctx: { schoolId: string; membershipId: string; role: "TEACHER" | "ADMIN"; userId: string },
  input: {
    classId: string;
    title: string;
    body: string;
    category?: string;
    points?: number;
    dueAt?: string;
    publish: boolean;
    /** Already stored by the caller — see the fileId convention in uploads.ts. */
    attachments?: Attachment[];
  },
): Promise<{ assignmentId: string; notified: number }> {
  await assertClassAccess(ctx, input.classId, { write: true });

  const assignment = await db.assignment.create({
    data: {
      schoolId: ctx.schoolId,
      classId: input.classId,
      authorMembershipId: ctx.membershipId,
      title: input.title,
      body: input.body,
      category: input.category || null,
      pointsMilli: input.points === undefined ? null : toMilli(input.points),
      dueAt: input.dueAt ? new Date(input.dueAt) : null,
      publishedAt: input.publish ? new Date() : null,
      attachments: writeJson(input.attachments ?? []),
    },
  });

  let notified = 0;

  // A draft notifies nobody. Publishing is the act that tells families.
  if (input.publish) {
    const enrollments = await db.enrollment.findMany({
      where: { classId: input.classId, status: "ACTIVE" },
      include: { student: { select: { id: true, userId: true } } },
    });

    await Promise.all(
      enrollments.map(async (enrollment) => {
        await notify({
          userId: enrollment.student.userId,
          schoolId: ctx.schoolId,
          kind: "ASSIGNMENT",
          title: "New work set",
          body: input.title,
          url: "/student/assignments",
        });
        await notifyGuardians(enrollment.studentMembershipId, () => ({
          kind: "ASSIGNMENT",
          schoolId: ctx.schoolId,
          title: "New work set",
          body: input.title,
          url: "/parent",
        }));
      }),
    );
    notified = enrollments.length;

    publish([channel.class(input.classId), channel.school(ctx.schoolId)], {
      type: "assignment.published",
      classId: input.classId,
      assignmentId: assignment.id,
    });
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.userId,
    action: input.publish ? "assignment.publish" : "assignment.draft",
    targetType: "Assignment",
    targetId: assignment.id,
    meta: { classId: input.classId, title: input.title },
  });

  return { assignmentId: assignment.id, notified };
}

/** Roster for one assignment, with each student's submission and grade. */
export async function getGradebook(
  ctx: { schoolId: string; membershipId: string; role: "TEACHER" | "ADMIN" },
  assignmentId: string,
) {
  const assignment = await assertAssignmentAccess(ctx, assignmentId);

  const [enrollments, submissions, grades] = await Promise.all([
    db.enrollment.findMany({
      where: { classId: assignment.classId, status: "ACTIVE" },
      include: {
        student: {
          include: { user: { select: { name: true, preferredName: true, avatarKey: true } } },
        },
      },
    }),
    db.submission.findMany({ where: { assignmentId } }),
    db.grade.findMany({ where: { assignmentId } }),
  ]);

  const submissionBy = new Map(submissions.map((s) => [s.studentMembershipId, s]));
  const gradeBy = new Map(grades.map((g) => [g.studentMembershipId, g]));

  const rows = enrollments
    .map((enrollment) => {
      const submission = submissionBy.get(enrollment.studentMembershipId);
      const grade = gradeBy.get(enrollment.studentMembershipId);
      return {
        membershipId: enrollment.studentMembershipId,
        name: enrollment.student.user.preferredName ?? enrollment.student.user.name,
        fullName: enrollment.student.user.name,
        avatarKey: enrollment.student.user.avatarKey,
        submittedAt: submission?.submittedAt ?? null,
        submissionStatus: submission?.status ?? null,
        scoreMilli: grade?.scoreMilli ?? null,
        letter: grade?.letter ?? null,
        comment: grade?.comment ?? null,
        gradedAt: grade?.gradedAt ?? null,
        // A late hand-in is a fact worth surfacing, not a punishment.
        late: Boolean(
          submission?.submittedAt && assignment.dueAt && submission.submittedAt > assignment.dueAt,
        ),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  const graded = rows.filter((r) => r.scoreMilli !== null);
  const earned = graded.reduce((sum, r) => sum + r.scoreMilli!, 0);
  const available = graded.length * (assignment.pointsMilli ?? 0);

  return {
    assignment: {
      id: assignment.id,
      title: assignment.title,
      body: assignment.body,
      category: assignment.category,
      pointsMilli: assignment.pointsMilli,
      dueAt: assignment.dueAt,
      publishedAt: assignment.publishedAt,
      className: assignment.class.name,
      classId: assignment.classId,
      attachments: readAttachments(assignment.attachments),
    },
    rows,
    stats: {
      total: rows.length,
      submitted: rows.filter((r) => r.submittedAt).length,
      graded: graded.length,
      // Null rather than 0 when nothing is graded — a class average of "0%"
      // before any marking is a lie a parent would act on.
      averagePercent: available === 0 ? null : Math.round((earned * 100) / available),
    },
  };
}

/**
 * Records grades for one assignment.
 *
 * Written as a batch because grading is done in one pass down a roster, and a
 * per-row round trip would mean a teacher's connection dropping half way
 * leaves half a class marked with no indication which half.
 */
export async function saveGrades(
  ctx: { schoolId: string; membershipId: string; role: "TEACHER" | "ADMIN"; userId: string },
  assignmentId: string,
  inputs: GradeInput[],
  opts: { notifyStudents?: boolean } = {},
): Promise<{ saved: number; cleared: number; rejected: string[] }> {
  const assignment = await assertAssignmentAccess(ctx, assignmentId);
  const maxMilli = assignment.pointsMilli;

  // Only students actually enrolled in this assignment's class.
  const enrolled = await db.enrollment.findMany({
    where: {
      classId: assignment.classId,
      status: "ACTIVE",
      studentMembershipId: { in: inputs.map((i) => i.studentMembershipId) },
    },
    select: { studentMembershipId: true },
  });
  const allowed = new Set(enrolled.map((e) => e.studentMembershipId));

  const rejected: string[] = [];
  let saved = 0;
  let cleared = 0;
  const newlyGraded: string[] = [];

  for (const input of inputs) {
    if (!allowed.has(input.studentMembershipId)) {
      rejected.push(input.studentMembershipId);
      continue;
    }

    if (input.score === null) {
      const removed = await db.grade.deleteMany({
        where: { assignmentId, studentMembershipId: input.studentMembershipId },
      });
      cleared += removed.count;
      continue;
    }

    if (!Number.isFinite(input.score) || input.score < 0) {
      rejected.push(input.studentMembershipId);
      continue;
    }

    const scoreMilli = toMilli(input.score);

    // Over-marking is allowed (bonus points are real) but wildly out-of-range
    // input is almost always a typo — 175 into a 20-point task.
    if (maxMilli && scoreMilli > maxMilli * 2) {
      rejected.push(input.studentMembershipId);
      continue;
    }

    const existing = await db.grade.findUnique({
      where: {
        assignmentId_studentMembershipId: {
          assignmentId,
          studentMembershipId: input.studentMembershipId,
        },
      },
      select: { id: true },
    });

    const submission = await db.submission.findUnique({
      where: {
        assignmentId_studentMembershipId: {
          assignmentId,
          studentMembershipId: input.studentMembershipId,
        },
      },
      select: { id: true },
    });

    await db.grade.upsert({
      where: {
        assignmentId_studentMembershipId: {
          assignmentId,
          studentMembershipId: input.studentMembershipId,
        },
      },
      create: {
        schoolId: ctx.schoolId,
        assignmentId,
        studentMembershipId: input.studentMembershipId,
        submissionId: submission?.id ?? null,
        scoreMilli,
        letter: input.letter?.trim() || null,
        comment: input.comment?.trim() || null,
        gradedByMembershipId: ctx.membershipId,
      },
      update: {
        scoreMilli,
        letter: input.letter?.trim() || null,
        comment: input.comment?.trim() || null,
        gradedByMembershipId: ctx.membershipId,
        gradedAt: new Date(),
      },
    });

    if (submission) {
      await db.submission.update({
        where: { id: submission.id },
        data: { status: "RETURNED" },
      });
    }

    saved++;
    if (!existing) newlyGraded.push(input.studentMembershipId);

    publish([channel.student(input.studentMembershipId), channel.school(ctx.schoolId)], {
      type: "grade.updated",
      studentMembershipId: input.studentMembershipId,
      assignmentId,
    });
  }

  // Only notify on a FIRST grade. Fixing a typo three times should not send a
  // family three "new grade" pushes.
  if (opts.notifyStudents !== false && newlyGraded.length > 0) {
    const students = await db.membership.findMany({
      where: { id: { in: newlyGraded } },
      select: { id: true, userId: true },
    });

    await Promise.all(
      students.map(async (student) => {
        await notify({
          userId: student.userId,
          schoolId: ctx.schoolId,
          kind: "GRADE",
          title: "Your work has been marked",
          body: assignment.title,
          url: "/student/assignments?tab=marked",
        });
        await notifyGuardians(student.id, (childName) => ({
          kind: "GRADE",
          schoolId: ctx.schoolId,
          title: `${childName}'s work has been marked`,
          body: assignment.title,
          url: "/parent/assignments?tab=marked",
        }));
      }),
    );
  }

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.userId,
    action: "grade.save",
    targetType: "Assignment",
    targetId: assignmentId,
    meta: { saved, cleared, rejected: rejected.length },
  });

  return { saved, cleared, rejected };
}

export async function publishAssignment(
  ctx: { schoolId: string; membershipId: string; role: "TEACHER" | "ADMIN"; userId: string },
  assignmentId: string,
): Promise<void> {
  const assignment = await assertAssignmentAccess(ctx, assignmentId);
  if (assignment.publishedAt) throw new AccessError("access.thatIsAlreadyPublished");

  await db.assignment.update({
    where: { id: assignmentId },
    data: { publishedAt: new Date() },
  });

  const enrollments = await db.enrollment.findMany({
    where: { classId: assignment.classId, status: "ACTIVE" },
    select: { studentMembershipId: true, student: { select: { userId: true } } },
  });

  await Promise.all(
    enrollments.map(async (enrollment) => {
      await notify({
        userId: enrollment.student.userId,
        schoolId: ctx.schoolId,
        kind: "ASSIGNMENT",
        title: "New work set",
        body: assignment.title,
        url: "/student/assignments",
      });
      await notifyGuardians(enrollment.studentMembershipId, () => ({
        kind: "ASSIGNMENT",
        schoolId: ctx.schoolId,
        title: "New work set",
        body: assignment.title,
        url: "/parent",
      }));
    }),
  );

  publish([channel.class(assignment.classId), channel.school(ctx.schoolId)], {
    type: "assignment.published",
    classId: assignment.classId,
    assignmentId,
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.userId,
    action: "assignment.publish",
    targetType: "Assignment",
    targetId: assignmentId,
  });
}

/** A student's own work, upcoming first. */
export async function getStudentWork(session: ActiveContext) {
  const { schoolId, membershipId } = session;
  if (!schoolId || !membershipId) return { upcoming: [], past: [], todo: [], handedIn: [], marked: [] };

  const assignments = await db.assignment.findMany({
    where: {
      schoolId,
      publishedAt: { not: null },
      class: { enrollments: { some: { studentMembershipId: membershipId, status: "ACTIVE" } } },
    },
    include: {
      class: { select: { name: true, color: true } },
      submissions: { where: { studentMembershipId: membershipId } },
      grades: { where: { studentMembershipId: membershipId } },
    },
    orderBy: { dueAt: "asc" },
    take: 100,
  });

  const now = Date.now();
  const mapped = assignments.map((assignment) => ({
    id: assignment.id,
    isExam: assignment.examSlotId !== null,
    title: assignment.title,
    body: assignment.body,
    category: assignment.category,
    className: assignment.class.name,
    classColor: assignment.class.color,
    pointsMilli: assignment.pointsMilli,
    dueAt: assignment.dueAt,
    submittedAt: assignment.submissions[0]?.submittedAt ?? null,
    submissionBody: assignment.submissions[0]?.body ?? "",
    submissionId: assignment.submissions[0]?.id ?? null,
    submissionAttachments: readAttachments(assignment.submissions[0]?.attachments),
    attachments: readAttachments(assignment.attachments),
    scoreMilli: assignment.grades[0]?.scoreMilli ?? null,
    comment: assignment.grades[0]?.comment ?? null,
    overdue: Boolean(
      assignment.dueAt &&
        assignment.dueAt.getTime() < now &&
        !assignment.submissions[0]?.submittedAt,
    ),
  }));

  /* THREE STATES, ONE RULE, everywhere a pupil's assignments are listed:
   *   to do      — published, not handed in, not marked; dated ones first,
   *                undated last (a thing with no date is still owed)
   *   handed in  — sent, waiting for a mark
   *   marked     — has a score
   * Exam sittings are not assignments and are left out: they live on Exams. */
  const homework = mapped.filter((a) => !a.isExam);
  const byDue = (a: (typeof mapped)[number], b: (typeof mapped)[number]) =>
    (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
  return {
    upcoming: homework.filter((a) => a.scoreMilli === null),
    past: homework.filter((a) => a.scoreMilli !== null).reverse(),
    todo: homework.filter((a) => a.scoreMilli === null && !a.submittedAt).sort(byDue),
    handedIn: homework.filter((a) => a.scoreMilli === null && a.submittedAt).sort(byDue),
    marked: homework.filter((a) => a.scoreMilli !== null).reverse(),
  };
}

/**
 * A child's homework diary, for their guardian. The same rows the child's own
 * work page reads, minus the submission bodies — a parent needs "what is due,
 * did it go in, was it late", not the text of the essay. Guardianship is
 * asserted, not assumed.
 */
export async function childWork(parentUserId: string, studentMembershipId: string) {
  const link = await assertGuardianAccess(parentUserId, studentMembershipId);
  const schoolId = link.student.school.id;
  const childName = link.student.user.preferredName ?? link.student.user.name;

  const assignments = await db.assignment.findMany({
    where: {
      schoolId,
      publishedAt: { not: null },
      class: { enrollments: { some: { studentMembershipId, status: "ACTIVE" } } },
    },
    include: {
      class: { select: { name: true } },
      submissions: {
        where: { studentMembershipId },
        select: { submittedAt: true, status: true },
      },
      grades: {
        where: { studentMembershipId },
        select: { scoreMilli: true, comment: true },
      },
    },
    orderBy: { dueAt: "asc" },
    take: 100,
  });

  const now = Date.now();
  const rows = assignments.map((assignment) => ({
    id: assignment.id,
    isExam: assignment.examSlotId !== null,
    title: assignment.title,
    category: assignment.category,
    className: assignment.class.name,
    pointsMilli: assignment.pointsMilli,
    dueAt: assignment.dueAt,
    submittedAt: assignment.submissions[0]?.submittedAt ?? null,
    returned: assignment.submissions[0]?.status === "RETURNED",
    scoreMilli: assignment.grades[0]?.scoreMilli ?? null,
    comment: assignment.grades[0]?.comment ?? null,
    overdue: Boolean(
      assignment.dueAt &&
        assignment.dueAt.getTime() < now &&
        !assignment.submissions[0]?.submittedAt,
    ),
  }));

  const homework = rows.filter((row) => !row.isExam);
  const byDue = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
    (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
  return {
    childName,
    upcoming: homework.filter((row) => row.scoreMilli === null),
    past: homework.filter((row) => row.scoreMilli !== null).reverse(),
    // The same three states the pupil's own page uses — see getStudentWork.
    todo: homework.filter((row) => row.scoreMilli === null && !row.submittedAt).sort(byDue),
    handedIn: homework.filter((row) => row.scoreMilli === null && row.submittedAt).sort(byDue),
    marked: homework.filter((row) => row.scoreMilli !== null).reverse(),
  };
}
