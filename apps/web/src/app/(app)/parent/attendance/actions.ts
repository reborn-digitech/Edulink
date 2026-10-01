"use server";

import { revalidatePath } from "next/cache";
import { absenceNoteCreateSchema, type AbsenceNotes } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { deleteAbsenceNote, fileAbsenceNote } from "@/lib/absence-notes";

/**
 * The family's absence notes, from the guardian's attendance page and the
 * pupil's own. Who may file for whom, which days, and when a note may be
 * taken back are settled in src/lib/absence-notes.ts; this shapes the
 * result. Only async functions and types may be exported from a "use
 * server" file — see tests/use-server-exports.test.ts.
 */
export type AbsenceNoteResult = { ok: true; data: AbsenceNotes } | { ok: false; errorKey: TranslationKey; errorVars?: Record<string, string | number> };

function refresh() {
  revalidatePath("/parent/attendance");
  revalidatePath("/student");
}

function failure(error: unknown): AbsenceNoteResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[absence-notes]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function fileAbsenceNoteAction(studentMembershipId: string, input: unknown): Promise<AbsenceNoteResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = absenceNoteCreateSchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    const data = await fileAbsenceNote(ctx, studentMembershipId, parsed.data);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteAbsenceNoteAction(studentMembershipId: string, noteId: string): Promise<AbsenceNoteResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof studentMembershipId !== "string" || typeof noteId !== "string" || !noteId) return { ok: false, errorKey: "common.checkTheForm" };
    const data = await deleteAbsenceNote(ctx, studentMembershipId, noteId);
    refresh();
    return { ok: true, data };
  } catch (error) {
    return failure(error);
  }
}
