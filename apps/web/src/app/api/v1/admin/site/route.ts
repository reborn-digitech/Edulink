import { NextResponse } from "next/server";
import { adminSiteSchema, apiErrorSchema, siteConfigSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { loadSite, saveSite } from "@/lib/site-admin";
import type { ActiveContext } from "@/lib/session";

/**
 * A school's public website, the draft (website-builder A, 15 Oct 2026); the office and the head, with the
 * WEBSITE module on (the catalog's `module` answers 403 MODULE_OFF before these run while it is off).
 */
async function body(ctx: ActiveContext) {
  const view = await loadSite(ctx);
  return adminSiteSchema.parse({
    config: view.config,
    published: view.published,
    publishedAt: view.publishedAt?.toISOString() ?? null,
    address: view.address,
    warnings: view.warnings,
    checklist: view.checklist,
    unpublishedChanges: view.unpublishedChanges,
    draftSavedAt: view.draftSavedAt?.toISOString() ?? null,
  });
}

/** GET /api/v1/admin/site — the draft, whether a version is live and since when, the address, the preview's warnings. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site");
  }
}

/** PUT /api/v1/admin/site — replace the draft (the whole config); 422 naming the field that does not hold. Nothing is published. */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteConfigSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const saved = await saveSite(ctx, parsed.data);
    if (!saved.ok) {
      const t = await getT();
      return NextResponse.json(apiErrorSchema.parse({ error: t(saved.errorKey), code: "BAD_REQUEST", issues: { [saved.field]: t(saved.errorKey) } }), { status: 422 });
    }
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site");
  }
}
