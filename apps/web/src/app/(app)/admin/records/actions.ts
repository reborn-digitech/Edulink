"use server";

import { revalidatePath } from "next/cache";
import { penChangeDecideSchema, penChangeProposeSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { decidePenChange, proposePenChange, withdrawPenChange } from "@/lib/pen-changes";

/**
 * The writes on a PEN correction, as the pupil's record page calls them
 * from every side: the admin proposes and withdraws, the head decides, a
 * guardian decides. Who may do which is settled inside
 * src/lib/pen-changes.ts by the caller's role — one decide function serves
 * the head and the guardian, as the library does — so this file checks the
 * shape and turns a refusal into a key the page can say in the reader's
 * language. Only async functions and types may be exported from a
 * "use server" file — see tests/use-server-exports.test.ts.
 */
export type PenChangeActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number>; id?: string };

function failure(error: unknown): PenChangeActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[pen-changes]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function refresh(studentMembershipId: string) {
  revalidatePath("/parent");
  revalidatePath("/parent/record");
  revalidatePath("/student/record");
  revalidatePath("/principal");
  revalidatePath("/admin/records");
  revalidatePath(`/admin/records/${studentMembershipId}`);
}

/** The admin proposes the corrected number, or its removal, with a reason. */
export async function proposePenChangeAction(studentMembershipId: string, input: unknown): Promise<PenChangeActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = penChangeProposeSchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    const created = await proposePenChange(ctx, studentMembershipId, parsed.data);
    refresh(studentMembershipId);
    return { ok: true, id: created.id };
  } catch (error) {
    return failure(error);
  }
}

/** The head or a guardian approves or rejects; the library knows which the caller is. */
export async function decidePenChangeAction(requestId: string, input: unknown): Promise<PenChangeActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = penChangeDecideSchema.safeParse(input);
    if (!parsed.success || typeof requestId !== "string" || !requestId) return { ok: false, errorKey: "common.checkTheForm" };
    const decided = await decidePenChange(ctx, requestId, parsed.data);
    refresh(decided.studentMembershipId);
    return { ok: true, id: decided.id };
  } catch (error) {
    return failure(error);
  }
}

/** The admin takes a pending proposal back. */
export async function withdrawPenChangeAction(requestId: string): Promise<PenChangeActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof requestId !== "string" || !requestId) return { ok: false, errorKey: "common.checkTheForm" };
    const withdrawn = await withdrawPenChange(ctx, requestId);
    refresh(withdrawn.studentMembershipId);
    return { ok: true, id: withdrawn.id };
  } catch (error) {
    return failure(error);
  }
}
