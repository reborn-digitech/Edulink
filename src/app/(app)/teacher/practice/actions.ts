"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { createPracticeAssignment, archivePracticeAssignment } from "@/lib/practice-insights";
import { getT } from "@/lib/i18n/server";

/**
 * Setting practice for a class. The class id and topic slug travel in the
 * form, and both are re-checked server-side against THIS teacher's classes —
 * a forged class id from another school is a NOT_FOUND, not an assignment.
 */
export async function setPractice(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("TEACHER");
  const classId = String(formData.get("classId") ?? "");
  const topicSlug = String(formData.get("topicSlug") ?? "");
  const targetLevel = Number(formData.get("targetLevel") ?? 0);
  const note = String(formData.get("note") ?? "");
  const dueRaw = String(formData.get("dueAt") ?? "");
  const dueAt = dueRaw ? new Date(`${dueRaw}T23:59:59`) : null;

  try {
    await createPracticeAssignment(ctx, {
      classId,
      topicSlug,
      targetLevel,
      note,
      dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null,
    });
  } catch (error) {
    if (error instanceof AccessError) {
      const t = await getT();
      redirect(`/teacher/practice?classId=${classId}&error=${encodeURIComponent(t(error.key, error.vars))}`);
    }
    throw error;
  }
  revalidatePath("/teacher/practice");
  redirect(`/teacher/practice?classId=${classId}`);
}

export async function removePractice(formData: FormData): Promise<void> {
  const ctx = await requireApiRole("TEACHER");
  const id = String(formData.get("id") ?? "");
  const classId = String(formData.get("classId") ?? "");
  await archivePracticeAssignment(ctx, id);
  revalidatePath("/teacher/practice");
  redirect(`/teacher/practice?classId=${classId}`);
}
