import "server-only";
import { db } from "./db";
import { toMilli } from "./validation";
import { readAttachments } from "./files";
import { publish, channel } from "./realtime";
import { notify, notifyGuardians } from "./notify";
import { audit } from "./audit";
import { AccessError, assertAssignmentAccess, assertClassAccess } from "./tenancy";
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
          url: "/student/work",
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
          url: "/student/grades",
        });
        await notifyGuardians(student.id, (childName) => ({
          kind: "GRADE",
          schoolId: ctx.schoolId,
          title: `${childName}'s work has been marked`,
          body: assignment.title,
          url: "/parent/grades",
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
  if (assignment.publishedAt) throw new AccessError("That is already published.");

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
        url: "/student/work",
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
  if (!schoolId || !membershipId) return { upcoming: [], past: [] };

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

  return {
    upcoming: mapped.filter((a) => a.scoreMilli === null),
    past: mapped.filter((a) => a.scoreMilli !== null).reverse(),
  };
}
