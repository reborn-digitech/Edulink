"use server";

import { revalidatePath } from "next/cache";
import {
  applicationBookSchema,
  applicationRespondSchema,
  applyBodySchema,
} from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { AttachmentError, discard, storeAttachments } from "@/lib/uploads";
import type { Attachment } from "@/lib/json";
import {
  apply,
  attachDocuments,
  bookSlot,
  respond,
  withdraw,
} from "@/lib/admissions";

/**
 * The family's writes on an application — the form itself, a document
 * attached, a sitting booked, an offer answered, the application taken
 * back — as the web pages call them. Whose application it is and what may
 * still be done to it is settled inside src/lib/admissions.ts; this file
 * checks the shape and turns a refusal into a key the page can say in the
 * reader's language. The document upload is shared with the office's page:
 * the same action stores the file this request carried and hands it to the
 * library, which decides whether the caller is the applicant or the office.
 * Only async functions and types may be exported from a "use server" file —
 * see tests/use-server-exports.test.ts.
 */
export type ApplicationActionResult = {
  ok: boolean;
  errorKey?: TranslationKey;
  errorVars?: Record<string, string | number>;
  id?: string;
};

const CUID = /^c[a-z0-9]{20,}$/;
const DOCUMENT_KEY = /^[a-z][a-z0-9_-]{0,30}$/;

function failure(error: unknown): ApplicationActionResult {
  if (error instanceof AccessError)
    return { ok: false, errorKey: error.key, errorVars: error.vars };
  if (error instanceof AttachmentError)
    return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[applications]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function revalidateApplication(applicationId: string) {
  revalidatePath("/parent/applications");
  revalidatePath(`/parent/applications/${applicationId}`);
  revalidatePath("/admin/admissions");
  revalidatePath("/admin/admissions/applications");
  revalidatePath(`/admin/admissions/applications/${applicationId}`);
  revalidatePath("/explore/[schoolId]", "page");
}

/** A guardian applies for a child from a school's page. */
export async function applyAction(
  input: unknown,
): Promise<ApplicationActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = applyBodySchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const view = await apply(ctx, parsed.data);
    revalidateApplication(view.id);
    return { ok: true, id: view.id };
  } catch (error) {
    return failure(error);
  }
}

/**
 * One document, for one key of the cycle's list. The file arrives as
 * FormData and is stored HERE, so the caller never names a fileId: files.ts
 * authorises a stored document by finding the application that mentions it.
 * A key sent again replaces the earlier file.
 */
export async function uploadDocumentAction(
  applicationId: string,
  formData: FormData,
): Promise<ApplicationActionResult> {
  let stored: Attachment[] = [];
  try {
    const ctx = await requireApiUser();
    const key = formData.get("key");
    const file = formData.get("file");
    if (
      typeof applicationId !== "string" ||
      !CUID.test(applicationId) ||
      typeof key !== "string" ||
      !DOCUMENT_KEY.test(key)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    if (!(file instanceof File) || file.size === 0)
      return { ok: false, errorKey: "ui.chooseOneFile" };
    stored = await storeAttachments([file], { max: 1 });
    const attachment = stored[0];
    if (!attachment) return { ok: false, errorKey: "ui.chooseOneFile" };
    await attachDocuments(ctx, applicationId, [{ key, attachment }]);
    revalidateApplication(applicationId);
    return { ok: true, id: applicationId };
  } catch (error) {
    // The bytes landed but nothing references them: take them back.
    if (stored.length)
      await discard(stored.map((s) => s.fileId)).catch(() => undefined);
    return failure(error);
  }
}

export async function bookSlotAction(
  applicationId: string,
  slotId: string,
): Promise<ApplicationActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = applicationBookSchema.safeParse({ slotId });
    if (
      !parsed.success ||
      typeof applicationId !== "string" ||
      !CUID.test(applicationId)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    await bookSlot(ctx, applicationId, parsed.data.slotId);
    revalidateApplication(applicationId);
    revalidatePath("/admin/admissions/[cycleId]", "page");
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}

export async function respondAction(
  applicationId: string,
  input: unknown,
): Promise<ApplicationActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = applicationRespondSchema.safeParse(input);
    if (
      !parsed.success ||
      typeof applicationId !== "string" ||
      !CUID.test(applicationId)
    )
      return { ok: false, errorKey: "common.checkTheForm" };
    await respond(ctx, applicationId, parsed.data);
    revalidateApplication(applicationId);
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}

export async function withdrawAction(
  applicationId: string,
): Promise<ApplicationActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof applicationId !== "string" || !CUID.test(applicationId))
      return { ok: false, errorKey: "common.checkTheForm" };
    await withdraw(ctx, applicationId);
    revalidateApplication(applicationId);
    revalidatePath("/admin/admissions/[cycleId]", "page");
    return { ok: true, id: applicationId };
  } catch (error) {
    return failure(error);
  }
}
