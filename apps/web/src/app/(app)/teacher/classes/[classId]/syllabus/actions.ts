"use server";

import { revalidatePath } from "next/cache";
import { lessonPlanSaveSchema, lessonStatusSaveSchema, syllabusProgressSaveSchema } from "@edulink/contracts";
import { z } from "zod";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { saveLessonPlan, saveSyllabusProgress, setLessonStatus } from "@/lib/syllabus";

/**
 * A class's three writes on its syllabus — move a chapter along, plan or
 * log a lesson, change a lesson's status — as the web page calls them. Who
 * may write is settled inside src/lib/syllabus.ts (the class's teachers and
 * the office); this file only checks the shape and turns a refusal into a
 * key the page can say in the reader's language. Only async functions and
 * types may be exported from a "use server" file — see
 * tests/use-server-exports.test.ts.
 */
export type ClassSyllabusActionResult = { ok: boolean; id?: string; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

const cuid = z.string().regex(/^c[a-z0-9]{20,}$/);
const lessonStatusInput = z.object({ lessonId: cuid, status: lessonStatusSaveSchema.shape.status });

function failure(error: unknown): ClassSyllabusActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[class syllabus]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function refresh(classId: string) {
  revalidatePath(`/teacher/classes/${classId}/syllabus`);
  revalidatePath("/admin/syllabus/coverage");
  revalidatePath("/principal");
}

export async function saveSyllabusProgressAction(input: unknown): Promise<ClassSyllabusActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = syllabusProgressSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    await saveSyllabusProgress(ctx, parsed.data);
    refresh(parsed.data.classId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function saveLessonPlanAction(input: unknown): Promise<ClassSyllabusActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = lessonPlanSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const { id } = await saveLessonPlan(ctx, parsed.data);
    refresh(parsed.data.classId);
    return { ok: true, id };
  } catch (error) {
    return failure(error);
  }
}

export async function setLessonStatusAction(input: unknown): Promise<ClassSyllabusActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = lessonStatusInput.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    await setLessonStatus(ctx, parsed.data.lessonId, parsed.data.status);
    // The lesson's class is not in the input; the page that called this is.
    revalidatePath("/teacher/classes/[classId]/syllabus", "page");
    revalidatePath("/admin/syllabus/coverage");
    revalidatePath("/principal");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
