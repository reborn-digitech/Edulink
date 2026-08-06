"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { AccessError, assertAssignmentAccess } from "@/lib/tenancy";
import { deleteStoredFile } from "@/lib/storage";
import { storeAttachments, discard, AttachmentError, MAX_ATTACHMENTS } from "@/lib/uploads";
import { readAttachments } from "@/lib/files";
import { writeJson, type Attachment } from "@/lib/json";
import { audit } from "@/lib/audit";
import { getT } from "@/lib/i18n/server";

/**
 * Attachment uploads for assignments and submissions.
 *
 * One action per target rather than a generic "upload anything" endpoint,
 * because the authorisation question is different in each case and a generic
 * endpoint would have to guess. The cost is a little repetition; the benefit is
 * that neither path can be reached with the wrong permission.
 */

export type AttachResult = { ok: boolean; error?: string; attachments?: Attachment[] };

/** Files a teacher attaches to a piece of work they set. */
export async function attachToAssignment(formData: FormData): Promise<AttachResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string") return { ok: false, error: (await getT())("ui.missingAssignment") };

  const { schoolId, membershipId, role } = session;
  if (!schoolId || !membershipId || (role !== "TEACHER" && role !== "ADMIN")) {
    return { ok: false, error: (await getT())("ui.onlyTeacherAttaches") };
  }

  let assignment;
  try {
    // Re-checks the assignment belongs to this school AND (for a teacher) to a
    // class they teach.
    assignment = await assertAssignmentAccess({ schoolId, membershipId, role }, assignmentId);
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())("ui.workNotFound") };
    throw error;
  }

  const existing = readAttachments(
    (await db.assignment.findUniqueOrThrow({
      where: { id: assignment.id },
      select: { attachments: true },
    })).attachments,
  );

  const result = await storeAll(formData.getAll("files"), existing.length);
  if ("error" in result) return { ok: false, error: result.error };

  const attachments = [...existing, ...result.stored];

  try {
    await db.assignment.update({
      where: { id: assignment.id },
      data: { attachments: writeJson(attachments) },
    });
  } catch (error) {
    await discard(result.stored.map((a) => a.fileId));
    console.error("[attachToAssignment]", error);
    return { ok: false, error: (await getT())("ui.couldNotSaveFiles") };
  }

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "assignment.attach",
    targetType: "Assignment",
    targetId: assignment.id,
    meta: { added: result.stored.length },
  });

  revalidatePath(`/teacher/assignments/${assignment.id}`);
  return { ok: true, attachments };
}

/** Files a student attaches to their own submission. */
export async function attachToSubmission(formData: FormData): Promise<AttachResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  const assignmentId = formData.get("assignmentId");
  if (typeof assignmentId !== "string") return { ok: false, error: (await getT())("ui.missingAssignment") };

  const { schoolId, membershipId, role } = session;
  if (role !== "STUDENT" || !schoolId || !membershipId) {
    return { ok: false, error: (await getT())("ui.onlyStudentHandsIn") };
  }

  try {
    // Restricts to published assignments for classes they are enrolled in.
    await assertAssignmentAccess({ schoolId, membershipId, role }, assignmentId);
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, error: (await getT())("student.workNotAvailable") };
    throw error;
  }

  // Already marked? Attaching now would orphan the grade the teacher gave.
  const graded = await db.grade.findUnique({
    where: {
      assignmentId_studentMembershipId: { assignmentId, studentMembershipId: membershipId },
    },
    select: { id: true },
  });
  if (graded) {
    return {
      ok: false,
      error: (await getT())("student.alreadyMarked"),
    };
  }

  const submission = await db.submission.findUnique({
    where: {
      assignmentId_studentMembershipId: { assignmentId, studentMembershipId: membershipId },
    },
    select: { id: true, attachments: true },
  });

  const existing = readAttachments(submission?.attachments);
  const result = await storeAll(formData.getAll("files"), existing.length);
  if ("error" in result) return { ok: false, error: result.error };

  const attachments = [...existing, ...result.stored];

  try {
    await db.submission.upsert({
      where: {
        assignmentId_studentMembershipId: { assignmentId, studentMembershipId: membershipId },
      },
      create: {
        schoolId,
        assignmentId,
        studentMembershipId: membershipId,
        status: "DRAFT",
        attachments: writeJson(attachments),
      },
      update: { attachments: writeJson(attachments) },
    });
  } catch (error) {
    await discard(result.stored.map((a) => a.fileId));
    console.error("[attachToSubmission]", error);
    return { ok: false, error: (await getT())("ui.couldNotSaveFiles") };
  }

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "submission.attach",
    targetType: "Submission",
    targetId: submission?.id ?? assignmentId,
    meta: { added: result.stored.length },
  });

  revalidatePath("/student/work");
  return { ok: true, attachments };
}

/**
 * Removes one attachment.
 *
 * Deletes the row reference first, then the file — the reverse order would leave
 * a reference pointing at nothing, which `authorizeFileRead` would then deny,
 * showing the owner a broken attachment they cannot clear.
 */
export async function detach(input: {
  target: "assignment" | "submission";
  id: string;
  fileId: string;
}): Promise<AttachResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: (await getT())("common.logInAgain") };

  const { schoolId, membershipId, role } = session;
  if (!schoolId || !membershipId) return { ok: false, error: (await getT())("ui.noActiveSchool") };

  if (input.target === "assignment") {
    if (role !== "TEACHER" && role !== "ADMIN") {
      return { ok: false, error: (await getT())("ui.onlyTeacherRemoves") };
    }
    try {
      await assertAssignmentAccess({ schoolId, membershipId, role }, input.id);
    } catch {
      return { ok: false, error: (await getT())("ui.workNotFound") };
    }
    const row = await db.assignment.findUniqueOrThrow({
      where: { id: input.id },
      select: { attachments: true },
    });
    const remaining = readAttachments(row.attachments).filter((a) => a.fileId !== input.fileId);
    await db.assignment.update({
      where: { id: input.id },
      data: { attachments: writeJson(remaining) },
    });
    await deleteStoredFile(input.fileId);
    revalidatePath(`/teacher/assignments/${input.id}`);
    return { ok: true, attachments: remaining };
  }

  // A student may only detach from their OWN submission.
  const submission = await db.submission.findFirst({
    where: { id: input.id, studentMembershipId: membershipId },
    select: { id: true, attachments: true },
  });
  if (!submission) return { ok: false, error: (await getT())("ui.workNotFound") };

  const remaining = readAttachments(submission.attachments).filter(
    (a) => a.fileId !== input.fileId,
  );
  await db.submission.update({
    where: { id: submission.id },
    data: { attachments: writeJson(remaining) },
  });
  await deleteStoredFile(input.fileId);
  revalidatePath("/student/work");
  return { ok: true, attachments: remaining };
}

/* -------------------------------------------------------------------------- */

/**
 * Stores a batch against the remaining room on a record.
 *
 * The all-or-nothing behaviour lives in `uploads.ts`, which is where the
 * bulletin and the new-assignment form get it too — three call sites reinventing
 * "delete what you already wrote if a later file fails" is three chances to get
 * it wrong, and the failure is invisible when it happens.
 */
async function storeAll(
  entries: FormDataEntryValue[],
  existingCount: number,
): Promise<{ stored: Attachment[] } | { error: string }> {
  const files = entries.filter((entry): entry is File => entry instanceof File && entry.size > 0);
  if (files.length === 0) return { error: (await getT())("ui.chooseOneFile") };
  if (existingCount + files.length > MAX_ATTACHMENTS) {
    return { error: (await getT())("ui.upToFiles", { max: MAX_ATTACHMENTS, have: existingCount }) };
  }

  try {
    return { stored: await storeAttachments(files, { max: MAX_ATTACHMENTS - existingCount }) };
  } catch (error) {
    if (error instanceof AttachmentError) return { error: (await getT())(error.key, error.vars) };
    console.error("[storeAll]", error);
    return { error: (await getT())("ui.couldNotSaveFiles") };
  }
}
