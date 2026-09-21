"use server";

import { revalidatePath } from "next/cache";
import { certificateRequestSaveSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { cancelRequest, requestCertificate } from "@/lib/certificate-requests";

/**
 * The family's writes on certificate requests — an ask sent, an ask taken
 * back — as the parent's and the pupil's certificate pages call them. Whose
 * pupil it is and whether the school offers the kind is settled inside
 * src/lib/certificate-requests.ts; this file checks the shape and turns a
 * refusal into a key the page can say in the reader's language. Only async
 * functions and types may be exported from a "use server" file — see
 * tests/use-server-exports.test.ts.
 */
export type CertificateRequestActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number>; id?: string };

function failure(error: unknown): CertificateRequestActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[certificate-requests]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function revalidateFamily() {
  revalidatePath("/parent/certificates");
  revalidatePath("/student/certificates");
  revalidatePath("/admin/certificates/issue");
}

/** A pupil asks for themselves; a guardian names the child. */
export async function requestCertificateAction(input: unknown, childId?: string): Promise<CertificateRequestActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = certificateRequestSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const created = await requestCertificate(ctx, parsed.data, typeof childId === "string" && childId ? childId : undefined);
    revalidateFamily();
    return { ok: true, id: created.id };
  } catch (error) {
    return failure(error);
  }
}

export async function cancelRequestAction(requestId: string): Promise<CertificateRequestActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof requestId !== "string" || !requestId) return { ok: false, errorKey: "common.checkTheForm" };
    await cancelRequest(ctx, requestId);
    revalidateFamily();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
