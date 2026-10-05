"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { z } from "zod";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { createAssignment, saveGrades, publishAssignment } from "@/lib/grading";
import { assignmentSchema, gradeSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { storeAttachments, discard, AttachmentError } from "@/lib/uploads";

export type AssignmentState = {
  ok: boolean;
  errors: FieldErrors;
  assignmentId?: string;
  notified?: number;
};

/**
 * Create an assignment, with optional handouts.
 *
 * FormData, and the files are stored here rather than named by the caller —
 * same reason as the bulletin: `files.ts` authorises a file by finding the
 * record that mentions it, so a client-supplied id could point this assignment
 * at somebody else's attachment and publish it to the class. (§6)
 */
export async function newAssignment(formData: FormData): Promise<AssignmentState> {
  let ctx;
  try {
    ctx = await requireApiRole("TEACHER", "ADMIN");
  } catch (error) {
    if (error instanceof AccessError)
      return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
    throw error;
  }

  const points = formData.get("points");
  const parsed = assignmentSchema.safeParse({
    classId: String(formData.get("classId") ?? ""),
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    category: String(formData.get("category") ?? ""),
    points: points === null || points === "" ? undefined : Number(points),
    dueAt: String(formData.get("dueAt") ?? ""),
    publish: formData.get("publish") === "true",
    confirmPastDue: formData.get("confirmPastDue") === "true",
  });
  // Validate the assignment before writing any bytes, so a rejected form does
  // not leave handouts on disk.
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, await getT()) };

  let attachments;
  try {
    attachments = await storeAttachments(formData.getAll("files").filter(isFile));
  } catch (error) {
    if (error instanceof AttachmentError) return { ok: false, errors: { files: (await getT())(error.key, error.vars) } };
    console.error("[newAssignment] upload failed", error);
    return { ok: false, errors: { files: (await getT())("teacher.filesNotSaved") } };
  }

  try {
    const result = await createAssignment(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      { ...parsed.data, dueAt: parsed.data.dueAt || undefined, attachments },
    );
    revalidatePath("/teacher/assignments");
    revalidatePath("/teacher");
    return { ok: true, errors: {}, ...result };
  } catch (error) {
    // Nothing will reference these now, and nothing can reach them either.
    await discard(attachments.map((a) => a.fileId));
    // A due date already past, not confirmed (A3-journeys-25): said beside the date, where the tick box is.
    if (error instanceof RuleRefusal) return { ok: false, errors: { dueDate: (await getT())(error.key, error.vars) } };
    if (error instanceof AccessError)
      return { ok: false, errors: { _form: (await getT())(error.key, error.vars) } };
    console.error("[newAssignment]", error);
    return { ok: false, errors: { _form: (await getT())("teacher.couldNotCreate") } };
  }
}

function isFile(value: FormDataEntryValue): value is File {
  return value instanceof File;
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
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    throw error;
  }

  const parsed = batchSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: (await getT())("teacher.marksNotNumbers") };
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
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[submitGrades]", error);
    return { ok: false, error: (await getT())("teacher.couldNotSaveMarks") };
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
    if (error instanceof AccessError)
      return { ok: false, error: (await getT())(error.key, error.vars) };
    console.error("[publishNow]", error);
    return { ok: false, error: (await getT())("common.somethingWrong") };
  }
}
