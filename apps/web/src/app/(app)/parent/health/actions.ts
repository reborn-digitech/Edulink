"use server";

import { revalidatePath } from "next/cache";
import { healthCardSaveSchema, healthCheckSaveSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { recordHealthCheck, saveHealthCard } from "@/lib/health";
import { RuleRefusal } from "@/lib/rule-refusal";

/**
 * The health card's two writes, shared by the guardian's page and the
 * pupil's person page: who may do what is settled inside src/lib/health.ts
 * (the office, the head and a guardian write the card; the office and the
 * head record a check-up), so both doors call the same two functions and
 * only the result shape lives here. Only async functions and types may be
 * exported from a "use server" file — see tests/use-server-exports.test.ts.
 */
export type HealthActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function refresh(studentMembershipId: string) {
  revalidatePath("/parent/health");
  revalidatePath(`/people/${studentMembershipId}`);
  revalidatePath(`/health/cards/${studentMembershipId}`);
}

function failure(error: unknown): HealthActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  // The card changed since the form was drawn (TA-111).
  if (error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[health]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function saveHealthCardAction(studentMembershipId: string, input: unknown): Promise<HealthActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = healthCardSaveSchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) return { ok: false, errorKey: "common.checkTheForm" };
    await saveHealthCard(ctx, studentMembershipId, parsed.data);
    refresh(studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function recordHealthCheckAction(studentMembershipId: string, input: unknown): Promise<HealthActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = healthCheckSaveSchema.safeParse(input);
    if (!parsed.success || typeof studentMembershipId !== "string" || !studentMembershipId) {
      // The one refusal the schema makes on its own: a check-up with nothing on it.
      const empty = !parsed.success && parsed.error.issues.some((i) => i.message === "empty");
      return { ok: false, errorKey: empty ? "health.checkNeedsSomething" : "common.checkTheForm" };
    }
    await recordHealthCheck(ctx, studentMembershipId, parsed.data);
    refresh(studentMembershipId);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
