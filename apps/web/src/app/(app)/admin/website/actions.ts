"use server";

import { revalidatePath } from "next/cache";
import { siteConfigSchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { markSiteEnquiry, publishSite, saveSite, unpublishSite } from "@/lib/site-admin";

/**
 * The website flow's actions (website-builder A, 15 Oct 2026): each screen's Continue saves the fields it
 * shows into the draft; Publish and Unpublish. Every rule, check and audit row is the library's (site-admin.ts).
 */
type Result = { ok: boolean; error?: string; field?: string; address?: string | null };

async function refusal(error: unknown, where: string): Promise<Result> {
  const t = await getT();
  if (error instanceof AccessError) return { ok: false, error: t(error.key, error.vars) };
  console.error(`[${where}]`, error);
  return { ok: false, error: t("common.tryAgain") };
}

/** Save the fields of one screen (a partial draft); refused, it names the field. */
export async function saveSiteDraftAction(patch: Record<string, unknown>): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteConfigSchema.partial().safeParse(patch);
    if (!parsed.success) return { ok: false, error: (await getT())("website.refuseForm"), field: String(parsed.error.issues[0]?.path[0] ?? "") };
    const saved = await saveSite(ctx, parsed.data);
    if (!saved.ok) return { ok: false, error: (await getT())(saved.errorKey), field: saved.field };
    revalidatePath("/admin/website", "layout");
    return { ok: true };
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

export async function markSiteEnquiryAction(enquiryId: string, read: boolean): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    await markSiteEnquiry(ctx, String(enquiryId), Boolean(read));
    revalidatePath("/admin/website/publish");
    return { ok: true };
  } catch (error) {
    return refusal(error, "markSiteEnquiryAction");
  }
}
