"use server";

import { revalidatePath } from "next/cache";
import { SITE_ENQUIRY_STATUSES, siteConfigSchema, type SiteConfig, type SiteEnquiryRow, type SiteEnquiryStatus } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { UploadError } from "@/lib/storage";
import { publishSite, restoreSiteVersion, saveSite, setPostOnSite, unpublishSite } from "@/lib/site-admin";
import { uploadSiteFile, type SiteFileRow } from "@/lib/site-files";
import { createSiteShare, revokeSiteShare } from "@/lib/site-share";
import { replyToSiteEnquiry, setSiteEnquiryStatus } from "@/lib/site-inbox";

/**
 * The website editor's actions (website-builder A, 15 Oct 2026; website-two, 16 Oct 2026): save the draft (the editor's
 * Save, and its autosave when a field loses focus), Publish and Unpublish, upload a picture or a PDF, restore a version,
 * make and revoke a review link, answer and close an enquiry, and the post page's "Show on the website" tick. Every
 * rule, check and audit row is the library's (site-admin.ts, site-files.ts, site-share.ts, site-inbox.ts).
 */
type Result = { ok: boolean; error?: string; field?: string; address?: string | null };

async function refusal(error: unknown, where: string): Promise<Result> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  if (error instanceof UploadError) return { ok: false, error: t(error.key, error.vars) };
  console.error(`[${where}]`, error);
  return { ok: false, error: t("common.tryAgain") };
}

/** Save the draft (a part of it, or the whole); refused, it names the field. */
export async function saveSiteDraftAction(patch: Record<string, unknown>): Promise<Result & { savedAt?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteConfigSchema.partial().safeParse(patch);
    if (!parsed.success) return { ok: false, error: (await getT())("website.refuseForm"), field: String(parsed.error.issues[0]?.path[0] ?? "") };
    const saved = await saveSite(ctx, parsed.data);
    if (!saved.ok) return { ok: false, error: (await getT())(saved.errorKey), field: saved.field };
    revalidatePath("/admin/website", "layout");
    return { ok: true, savedAt: new Date().toISOString() };
  } catch (error) {
    return refusal(error, "saveSiteDraftAction");
  }
}

export async function publishSiteAction(): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const made = await publishSite(ctx);
    revalidatePath("/admin/website", "layout");
    return { ok: true, address: made.address };
  } catch (error) {
    return refusal(error, "publishSiteAction");
  }
}

export async function unpublishSiteAction(): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    await unpublishSite(ctx);
    revalidatePath("/admin/website", "layout");
    return { ok: true };
  } catch (error) {
    return refusal(error, "unpublishSiteAction");
  }
}

/** Upload a picture (kind IMAGE) or a PDF (kind PDF) for the site: stored, named for the school, not yet on any page. */
export async function uploadSiteFileAction(form: FormData): Promise<Result & { file?: Omit<SiteFileRow, "createdAt"> & { createdAt: string } }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const file = form.get("file");
    const kind = form.get("kind") === "PDF" ? "PDF" : "IMAGE";
    if (!(file instanceof File)) return { ok: false, error: (await getT())("refusal.fileEmpty") };
    const made = await uploadSiteFile(ctx, file, kind);
    if (!made.ok) return { ok: false, error: (await getT())(made.errorKey, made.vars) };
    return { ok: true, file: { ...made.file, createdAt: made.file.createdAt.toISOString() } };
  } catch (error) {
    return refusal(error, "uploadSiteFileAction");
  }
}

/** Restore a version as the draft (`versionId`), or "Back to published" (null). The draft is returned for the editor to hold. */
export async function restoreSiteVersionAction(versionId: string | null): Promise<Result & { config?: SiteConfig }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const config = await restoreSiteVersion(ctx, versionId === null ? null : String(versionId));
    revalidatePath("/admin/website", "layout");
    return { ok: true, config };
  } catch (error) {
    return refusal(error, "restoreSiteVersionAction");
  }
}

/** Make a link to review the draft for `days` days (one to seven); the URL is returned this once. */
export async function createSiteShareAction(days: number): Promise<Result & { url?: string; expiresAt?: string }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const made = await createSiteShare(ctx, Number(days) || 7);
    revalidatePath("/admin/website", "layout");
    return { ok: true, url: made.url, expiresAt: made.expiresAt.toISOString() };
  } catch (error) {
    return refusal(error, "createSiteShareAction");
  }
}

export async function revokeSiteShareAction(shareId: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    await revokeSiteShare(ctx, String(shareId));
    revalidatePath("/admin/website", "layout");
    return { ok: true };
  } catch (error) {
    return refusal(error, "revokeSiteShareAction");
  }
}

/** Reply to an enquiry by email in the enquirer's language. */
export async function replySiteEnquiryAction(enquiryId: string, text: string): Promise<Result & { enquiry?: SiteEnquiryRow }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const made = await replyToSiteEnquiry(ctx, String(enquiryId), String(text ?? ""));
    if (!made.ok) return { ok: false, error: (await getT())(made.errorKey) };
    revalidatePath("/admin/website", "layout");
    return { ok: true, enquiry: made.enquiry };
  } catch (error) {
    return refusal(error, "replySiteEnquiryAction");
  }
}

/** Close an enquiry, or open it again. */
export async function siteEnquiryStatusAction(enquiryId: string, status: SiteEnquiryStatus): Promise<Result & { enquiry?: SiteEnquiryRow }> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    if (!(SITE_ENQUIRY_STATUSES as readonly string[]).includes(status)) return { ok: false, error: (await getT())("website.refuseForm") };
    const enquiry = await setSiteEnquiryStatus(ctx, String(enquiryId), status);
    revalidatePath("/admin/website", "layout");
    return { ok: true, enquiry };
  } catch (error) {
    return refusal(error, "siteEnquiryStatusAction");
  }
}

/** The post page's "Show on the website" tick: the post into, or out of, the draft's news. */
export async function setPostOnSiteAction(postId: string, on: boolean): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const saved = await setPostOnSite(ctx, String(postId), Boolean(on));
    if (!saved.ok) return { ok: false, error: (await getT())(saved.errorKey) };
    revalidatePath(`/bulletin/${postId}`);
    revalidatePath("/admin/website", "layout");
    return { ok: true };
  } catch (error) {
    return refusal(error, "setPostOnSiteAction");
  }
}
