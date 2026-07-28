"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { createAssignment, saveGrades, publishAssignment } from "@/lib/grading";
import { assignmentSchema, gradeSchema, fieldErrors, type FieldErrors } from "@/lib/validation";

export type AssignmentState = {
  ok: boolean;
  errors: FieldErrors;
  assignmentId?: string;
  notified?: number;
};

export async function newAssignment(input: unknown): Promise<AssignmentState> {
  let ctx;
  try {
    ctx = await requireApiRole("TEACHER", "ADMIN");
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: error.message } };
    throw error;
  }

  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  try {
    const result = await createAssignment(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      { ...parsed.data, dueAt: parsed.data.dueAt || undefined },
    );
    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher");
    return { ok: true, errors: {}, ...result };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: error.message } };
    console.error("[newAssignment]", error);
    return { ok: false, errors: { _form: "We could not create that. Please try again." } };
  }
}

const batchSchema = z.object({
  assignmentId: z.string().cuid(),
  grades: z.array(gradeSchema.omit({ assignmentId: true })).min(1).max(500),
});

export type GradeSaveState = {
  ok: boolean;
  error?: string;
  saved?: number;
  cleared?: number;
  rejected?: number;
};

export async function submitGrades(input: unknown): Promise<GradeSaveState> {
  let ctx;
  try {
    ctx = await requireApiRole("TEACHER", "ADMIN");
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    throw error;
  }

  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Some of those marks are not valid numbers." };
  }

  try {
    const result = await saveGrades(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      parsed.data.assignmentId,
      parsed.data.grades,
    );
    revalidatePath(`/teacher/assignments/${parsed.data.assignmentId}`);
    revalidatePath("/teacher/assignments");
    return {
      ok: true,
      saved: result.saved,
      cleared: result.cleared,
      rejected: result.rejected.length,
    };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[submitGrades]", error);
    return { ok: false, error: "We could not save those marks." };
  }
}

export async function publishNow(assignmentId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    await publishAssignment(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      assignmentId,
    );
    revalidatePath("/teacher/assignments");
    revalidatePath(`/teacher/assignments/${assignmentId}`);
    return { ok: true };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: error.message };
    console.error("[publishNow]", error);
    return { ok: false, error: "Something went wrong." };
  }
}
