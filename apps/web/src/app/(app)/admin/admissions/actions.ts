"use server";

import { revalidatePath } from "next/cache";
import {
  admitSchema,
  applicationSaveSchema,
  cycleSaveSchema,
  cycleStatusSaveSchema,
  decisionSchema,
  entranceSlotsPublishSchema,
  offerSchema,
  testResultSchema,
} from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import {
  admit,
  cancelSlot,
  createCycle,
  decide,
  offer,
  officeApply,
  publishSlots,
  purgeCycle,
  recordTest,
  setCycleStatus,
  updateCycle,
  verifyDocuments,
  type Admitted,
} from "@/lib/admissions";

/**
 * The office's writes on admissions — a cycle saved, opened, closed or
 * purged, sittings published or cancelled, a walk-in entered, and the steps
 * on one application — as the web pages call them. Who may do what is
 * settled inside src/lib/admissions.ts; this file only checks the shape and
 * turns a refusal into a key the page can say in the reader's language.
 * Only async functions and types may be exported from a "use server" file —
 * see tests/use-server-exports.test.ts.
 */
export type AdmissionsActionResult = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  id?: string;
  count?: number;
  admitted?: Admitted;
};

const CUID = /^c[a-z0-9]{20,}$/;

function failure(error: unknown): AdmissionsActionResult {
  if (error instanceof AccessError)
    return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[admissions]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function revalidateCycles() {
  revalidatePath("/admin/admissions");
  revalidatePath("/admin/admissions/[cycleId]", "page");
  revalidatePath("/admin/admissions/applications");
  revalidatePath("/admin/admissions/applications/new");
  revalidatePath("/explore/[schoolId]", "page");
  revalidatePath("/explore/[schoolId]/apply", "page");
}

function revalidateApplication(applicationId: string) {
  revalidatePath("/admin/admissions");
  revalidatePath("/admin/admissions/applications");
  revalidatePath(`/admin/admissions/applications/${applicationId}`);
  revalidatePath("/parent/applications");
  revalidatePath(`/parent/applications/${applicationId}`);
}

export async function saveCycleAction(
  input: unknown,
  cycleId?: string,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = cycleSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const saved =
      typeof cycleId === "string" && CUID.test(cycleId)
        ? await updateCycle(ctx, cycleId, parsed.data)
        : await createCycle(ctx, parsed.data);
    revalidateCycles();
    return { ok: true, id: saved.id };
  } catch (error) {
    return failure(error);
  }
}

export async function setCycleStatusAction(
  cycleId: string,
  status: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = cycleStatusSaveSchema.safeParse({ status });
    if (!parsed.success || typeof cycleId !== "string" || !CUID.test(cycleId))
      return { ok: false, errorKey: "common.checkTheForm" };
    await setCycleStatus(ctx, cycleId, parsed.data.status);
    revalidateCycles();
    return { ok: true, id: cycleId };
  } catch (error) {
    return failure(error);
  }
}

export async function purgeCycleAction(
  cycleId: string,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof cycleId !== "string" || !CUID.test(cycleId))
      return { ok: false, errorKey: "common.checkTheForm" };
    const { removed } = await purgeCycle(ctx, cycleId);
    revalidateCycles();
    revalidatePath("/parent/applications");
    return { ok: true, id: cycleId, count: removed };
  } catch (error) {
    return failure(error);
  }
}

export async function publishSlotsAction(
  cycleId: string,
  input: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = entranceSlotsPublishSchema.safeParse(input);
    if (!parsed.success || typeof cycleId !== "string" || !CUID.test(cycleId))
      return { ok: false, errorKey: "common.checkTheForm" };
    const { created } = await publishSlots(ctx, cycleId, parsed.data);
    revalidatePath(`/admin/admissions/${cycleId}`);
    revalidatePath("/parent/applications/[applicationId]", "page");
    return { ok: true, id: cycleId, count: created };
  } catch (error) {
    return failure(error);
  }
}

export async function cancelSlotAction(
  slotId: string,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof slotId !== "string" || !CUID.test(slotId))
      return { ok: false, errorKey: "common.checkTheForm" };
    const { released } = await cancelSlot(ctx, slotId);
    revalidatePath("/admin/admissions/[cycleId]", "page");
    revalidatePath("/admin/admissions/applications");
    revalidatePath("/parent/applications/[applicationId]", "page");
    return { ok: true, id: slotId, count: released };
  } catch (error) {
    return failure(error);
  }
}

export async function officeApplyAction(
  input: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = applicationSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const view = await officeApply(ctx, parsed.data);
    revalidateCycles();
    return { ok: true, id: view.id };
  } catch (error) {
    return failure(error);
  }
}

export async function verifyDocumentsAction(
  applicationId: string,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof applicationId !== "string" || !CUID.test(applicationId))
      return { ok: false, errorKey: "common.checkTheForm" };
    await verifyDocuments(ctx, applicationId);
    revalidateApplication(applicationId);
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}

export async function recordTestAction(
  applicationId: string,
  input: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = testResultSchema.safeParse(input);
    if (
      !parsed.success ||
      typeof applicationId !== "string" ||
      !CUID.test(applicationId)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    await recordTest(ctx, applicationId, parsed.data);
    revalidateApplication(applicationId);
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}

export async function offerAction(
  applicationId: string,
  input: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = offerSchema.safeParse(input);
    if (
      !parsed.success ||
      typeof applicationId !== "string" ||
      !CUID.test(applicationId)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    await offer(ctx, applicationId, parsed.data);
    revalidateApplication(applicationId);
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}

export async function decideAction(
  applicationId: string,
  input: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = decisionSchema.safeParse(input);
    if (
      !parsed.success ||
      typeof applicationId !== "string" ||
      !CUID.test(applicationId)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    await decide(ctx, applicationId, parsed.data);
    revalidateApplication(applicationId);
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}

export async function admitAction(
  applicationId: string,
  input: unknown,
): Promise<AdmissionsActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = admitSchema.safeParse(input);
    if (
      !parsed.success ||
      typeof applicationId !== "string" ||
      !CUID.test(applicationId)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    const admitted = await admit(ctx, applicationId, parsed.data);
    revalidateApplication(applicationId);
    revalidatePath("/admin/people");
    revalidatePath("/admin/records");
    return { ok: true, id: applicationId, admitted };
  } catch (error) {
    return failure(error);
  }
}
