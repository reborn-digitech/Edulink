"use server";

import { revalidatePath } from "next/cache";
import { pupilRecordSaveSchema, recordChangeDecideSchema, recordChangeFileSchema, recordRequestSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { requestRecords, savePupilRecord } from "@/lib/pupil-records";
import { decideRecordChange, fileRecordChange, withdrawRecordChange } from "@/lib/record-changes";

/**
 * The pupil record's writes — the office's save, and the family's ask and
 * the office's answer to it — shared by the guardian's page, the pupil's own
 * and the office's: who may write which record is settled inside
 * src/lib/pupil-records.ts, so every door calls the same function and only
 * the result shape lives here. Only async functions and types may be
 * exported from a "use server" file — see tests/use-server-exports.test.ts.
 */
export type PupilRecordActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number>; asked?: number; families?: number };

function failure(error: unknown): PupilRecordActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  // A refused value (TA-602) reads the same on the form: its sentence.
  if (error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[pupil record]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function refresh(studentMembershipId: string) {
  revalidatePath("/parent");
  revalidatePath("/parent/record");
  revalidatePath("/student");
  revalidatePath("/student/record");
  revalidatePath("/admin/records");
  revalidatePath(`/admin/records/${studentMembershipId}`);
  revalidatePath("/admin/certificates/issue");
}

export async function savePupilRecordAction(studentMembershipId: string, input: unknown): Promise<PupilRecordActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = pupilRecordSaveSchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    await savePupilRecord(ctx, studentMembershipId, parsed.data);
    refresh(studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The office asks the families: every incomplete pupil, or the ones named. */
export async function requestRecordsAction(membershipIds?: string[]): Promise<PupilRecordActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = recordRequestSchema.safeParse({ membershipIds });
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const result = await requestRecords(ctx, parsed.data.membershipIds);
    revalidatePath("/admin/records");
    return { ok: true, asked: result.asked, families: result.families };
  } catch (error) {
    return failure(error);
  }
}

/** A guardian or the pupil asks the office to change the record. */
export async function fileRecordChangeAction(studentMembershipId: string, input: unknown): Promise<PupilRecordActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = recordChangeFileSchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    await fileRecordChange(ctx, studentMembershipId, parsed.data);
    refresh(studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The office applies the family's values, or declines. */
export async function decideRecordChangeAction(requestId: string, input: unknown): Promise<PupilRecordActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = recordChangeDecideSchema.safeParse(input);
    if (!parsed.success || typeof requestId !== "string" || !requestId) return { ok: false, errorKey: "common.checkTheForm" };
    const decided = await decideRecordChange(ctx, requestId, parsed.data);
    refresh(decided.studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The family takes a waiting ask back. */
export async function withdrawRecordChangeAction(requestId: string): Promise<PupilRecordActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof requestId !== "string" || !requestId) return { ok: false, errorKey: "common.checkTheForm" };
    const taken = await withdrawRecordChange(ctx, requestId);
    refresh(taken.studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
