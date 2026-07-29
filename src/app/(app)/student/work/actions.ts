"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireApiRole, assertAssignmentAccess, AccessError } from "@/lib/tenancy";
import { notify } from "@/lib/notify";
import { audit } from "@/lib/audit";
import { publish, channel } from "@/lib/realtime";

const submitSchema = z.object({
  assignmentId: z.string().cuid(),
  body: z.string().trim().max(20_000),
});

export type SubmitState = { ok: boolean; error?: string; submittedAt?: string };

/**
 * Hands a piece of work in.
 *
 * `assertAssignmentAccess` with a STUDENT role already restricts this to
 * published assignments for classes the student is actively enrolled in, so a
 * copied assignment id from another class matches nothing.
 *
 * Re-submitting is allowed and simply replaces the body: a child who realises
 * they pasted the wrong paragraph should be able to fix it, and locking the
 * first attempt would just generate a message to the teacher instead.
 */
export async function submitWork(input: unknown): Promise<SubmitState> {
  let ctx;
  try {
    ctx = await requireApiRole("STUDENT");
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }

  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That submission is not valid." };

  const { assignmentId, body } = parsed.data;
  if (body.length === 0) return { ok: false, error: "Write something before handing it in." };

  let assignment;
  try {
    assignment = await assertAssignmentAccess(ctx, assignmentId);
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: "That work is not available." };
    throw error;
  }

  // Already marked? Re-submitting would silently orphan the grade the teacher
  // gave. Refuse and say why, rather than accepting and quietly diverging.
  const existingGrade = await db.grade.findUnique({
    where: {
      assignmentId_studentMembershipId: {
        assignmentId,
        studentMembershipId: ctx.membershipId,
      },
    },
    select: { id: true },
  });
  if (existingGrade) {
    return {
      ok: false,
      error: "This has already been marked, so it cannot be changed. Message your teacher instead.",
    };
  }

  const submittedAt = new Date();

  const submission = await db.submission.upsert({
    where: {
      assignmentId_studentMembershipId: {
        assignmentId,
        studentMembershipId: ctx.membershipId,
      },
    },
    create: {
      schoolId: ctx.schoolId,
      assignmentId,
      studentMembershipId: ctx.membershipId,
      body,
      status: "SUBMITTED",
      submittedAt,
    },
    update: { body, status: "SUBMITTED", submittedAt },
  });

  // Tell the author of the assignment, not every teacher at the school.
  const author = await db.membership.findUnique({
    where: { id: assignment.authorMembershipId },
    select: { userId: true },
  });
  const student = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    select: { user: { select: { name: true, preferredName: true } } },
  });

  if (author) {
    await notify({
      userId: author.userId,
      schoolId: ctx.schoolId,
      kind: "ASSIGNMENT",
      title: `${student.user.preferredName ?? student.user.name} handed work in`,
      body: assignment.title,
      url: `/teacher/assignments/${assignmentId}`,
    });
  }

  publish([channel.class(assignment.classId), channel.school(ctx.schoolId)], {
    type: "assignment.published",
    classId: assignment.classId,
    assignmentId,
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "submission.create",
    targetType: "Submission",
    targetId: submission.id,
    meta: { assignmentId, late: Boolean(assignment.dueAt && submittedAt > assignment.dueAt) },
  });

  revalidatePath("/student/work");
  revalidatePath(`/teacher/assignments/${assignmentId}`);

  return { ok: true, submittedAt: submittedAt.toISOString() };
}
