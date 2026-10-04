"use server";

import { revalidatePath } from "next/cache";
import { certificateIssueSchema, certificateRequestDeclineSchema, certificateRevokeSchema, certificateTemplateSaveSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { archiveTemplate, issueCertificate, revokeCertificate, saveTemplate } from "@/lib/certificates";
import { declineRequest, setRequestFee } from "@/lib/certificate-requests";
import { RuleRefusal } from "@/lib/rule-refusal";
import { parseRupees } from "@edulink/i18n";

/**
 * The office's writes on certificates — a template saved or retired, a
 * certificate issued or revoked, a family's request declined — as the web
 * pages call them. Who may do
 * what is settled inside src/lib/certificates.ts; this file only checks the
 * shape and turns a refusal into a key the page can say in the reader's
 * language. Only async functions and types may be exported from a
 * "use server" file — see tests/use-server-exports.test.ts.
 */
export type CertificateActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number>; id?: string; serial?: string };

function failure(error: unknown): CertificateActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  if (error instanceof RuleRefusal) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[certificates]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

function revalidateTemplates() {
  revalidatePath("/admin/certificates");
  revalidatePath("/admin/certificates/[templateId]", "page");
  revalidatePath("/admin/certificates/issue");
}

export async function saveTemplateAction(input: unknown, templateId?: string): Promise<CertificateActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = certificateTemplateSaveSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    const saved = await saveTemplate(ctx, parsed.data, typeof templateId === "string" && templateId ? templateId : undefined);
    revalidateTemplates();
    return { ok: true, id: saved.id };
  } catch (error) {
    return failure(error);
  }
}

export async function archiveTemplateAction(templateId: string): Promise<CertificateActionResult> {
  try {
    const ctx = await requireApiUser();
    if (typeof templateId !== "string" || !templateId) return { ok: false, errorKey: "common.checkTheForm" };
    await archiveTemplate(ctx, templateId);
    revalidateTemplates();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function issueAction(input: unknown): Promise<CertificateActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = certificateIssueSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    // `requestId` rides along in the parsed body: the library marks the
    // request issued and takes its purpose when the form gave none.
    const issued = await issueCertificate(ctx, parsed.data);
    revalidatePath("/admin/certificates");
    revalidatePath("/admin/certificates/issue");
    revalidatePath("/admin/certificates/issued");
    revalidatePath("/parent/certificates");
    revalidatePath("/student/certificates");
    return { ok: true, id: issued.id, serial: issued.serial };
  } catch (error) {
    return failure(error);
  }
}

export async function revokeAction(certificateId: string, reason: string): Promise<CertificateActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = certificateRevokeSchema.safeParse({ reason });
    if (!parsed.success || typeof certificateId !== "string" || !certificateId) return { ok: false, errorKey: "common.checkTheForm" };
    await revokeCertificate(ctx, certificateId, parsed.data.reason);
    revalidatePath(`/certificates/${certificateId}`);
    revalidatePath("/admin/certificates/issued");
    revalidatePath("/parent/certificates");
    revalidatePath("/student/certificates");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The office declines a family's request with a reason; the family is told. */
export async function declineRequestAction(requestId: string, reason: string): Promise<CertificateActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = certificateRequestDeclineSchema.safeParse({ reason });
    if (!parsed.success || typeof requestId !== "string" || !requestId) return { ok: false, errorKey: "common.checkTheForm" };
    await declineRequest(ctx, requestId, parsed.data.reason);
    revalidatePath("/admin/certificates/issue");
    revalidatePath("/parent/certificates");
    revalidatePath("/student/certificates");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

/** The office sets what a paper costs, in rupees as typed (G-6); a demand on the pupil's ledger, paid at the office. */
export async function setRequestFeeAction(requestId: string, rupees: string): Promise<CertificateActionResult> {
  try {
    const ctx = await requireApiUser();
    const paise = parseRupees(rupees);
    if (typeof requestId !== "string" || !requestId || paise === null || paise < 100) return { ok: false, errorKey: "common.checkTheForm" };
    await setRequestFee(ctx, requestId, paise);
    revalidatePath("/admin/certificates/issue");
    revalidatePath("/alumni/papers");
    revalidatePath("/student/certificates");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
