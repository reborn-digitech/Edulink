"use server";

import { revalidatePath } from "next/cache";
import { siteDomainConfirmBodySchema, siteDomainSaveBodySchema } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { removeSiteDomain, saveSiteDomain, verifySiteDomain } from "@/lib/site-domains";
import { consume } from "@/lib/rate-limit";
import { RuleRefusal } from "@/lib/rule-refusal";

/**
 * The website flow's sixth screen (website-builder B, 15 Oct 2026): save, verify and remove the school's own
 * domain. Every rule, the module check and the audit row are the library's (src/lib/site-domains.ts).
 */
type Result = { ok: true } | { ok: false; error: string };

async function refusal(error: unknown, where: string): Promise<Result> {
  const t = await getT();
  if (error instanceof AccessError || error instanceof RuleRefusal) return { ok: false, error: t(error.key, error.vars) };
  console.error(`[${where}]`, error);
  return { ok: false, error: t("common.tryAgain") };
}

export async function saveDomainAction(domain: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteDomainSaveBodySchema.safeParse({ domain });
    if (!parsed.success) return { ok: false, error: (await getT())("siteDomains.refuseEmpty") };
    await saveSiteDomain(ctx, parsed.data.domain);
    revalidatePath("/admin/website/domain");
    return { ok: true };
  } catch (error) {
    return refusal(error, "saveDomainAction");
  }
}

export async function verifyDomainAction(domain: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteDomainConfirmBodySchema.safeParse({ domain });
    if (!parsed.success) return { ok: false, error: (await getT())("siteDomains.refuseStale") };
    // The door's budget (api/v1/admin/site/domain/verify): each press asks the DNS and the hosting platform.
    const gate = await consume(`site-domain-verify:${ctx.user.id}`, 60, 60 * 60 * 1000);
    if (!gate.allowed) return { ok: false, error: (await getT())("common.tryAgainMoment") };
    await verifySiteDomain(ctx, parsed.data.domain);
    revalidatePath("/admin/website/domain");
    return { ok: true };
  } catch (error) {
    return refusal(error, "verifyDomainAction");
  }
}

export async function removeDomainAction(domain: string): Promise<Result> {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteDomainConfirmBodySchema.safeParse({ domain });
    if (!parsed.success) return { ok: false, error: (await getT())("siteDomains.refuseStale") };
    await removeSiteDomain(ctx, parsed.data.domain);
    revalidatePath("/admin/website/domain");
    return { ok: true };
  } catch (error) {
    return refusal(error, "removeDomainAction");
  }
}
