"use server";

import { revalidatePath } from "next/cache";
import { incidentCreateSchema, incidentNoteCreateSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { addIncidentNote, closeIncident, recordIncident } from "@/lib/incidents";

/**
 * The incident log's three writes — record, add a note, close — as the web
 * forms call them. Who may do which is settled inside src/lib/incidents.ts;
 * this file only validates the shape and turns a refusal into a key the form
 * can say in the reader's language. Only async functions and types may be
 * exported from a "use server" file — see tests/use-server-exports.test.ts.
 */
export type IncidentActionResult = { ok: boolean; id?: string; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function refresh(incidentId: string, studentMembershipId: string) {
  revalidatePath(`/incidents/${incidentId}`);
  revalidatePath("/admin/incidents");
  revalidatePath("/teacher/incidents");
  revalidatePath("/parent/incidents");
  revalidatePath(`/people/${studentMembershipId}`);
}

function failure(error: unknown): IncidentActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[incidents]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

export async function recordIncidentAction(input: unknown): Promise<IncidentActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = incidentCreateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const view = await recordIncident(ctx, parsed.data);
    refresh(view.id, view.studentMembershipId);
    return { ok: true, id: view.id };
  } catch (error) {
    return failure(error);
  }
}

export async function addIncidentNoteAction(incidentId: string, input: unknown): Promise<IncidentActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = incidentNoteCreateSchema.safeParse(input);
    if (!parsed.success || typeof incidentId !== "string" || !incidentId) return { ok: false, errorKey: "common.checkTheForm" };
    const view = await addIncidentNote(ctx, incidentId, parsed.data.body);
    refresh(view.id, view.studentMembershipId);
    return { ok: true, id: view.id };
  } catch (error) {
    return failure(error);
  }
}

export async function closeIncidentAction(incidentId: string): Promise<IncidentActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof incidentId !== "string" || !incidentId) return { ok: false, errorKey: "common.checkTheForm" };
    const view = await closeIncident(ctx, incidentId);
    refresh(view.id, view.studentMembershipId);
    return { ok: true, id: view.id };
  } catch (error) {
    return failure(error);
  }
}
