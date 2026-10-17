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
    // website-three (17 Oct 2026)
    draftVersion: view.draftVersion,
    alsoEditing: view.alsoEditing,
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

/**
 * PUT /api/v1/admin/site — replace the draft (the whole config); 422 naming the field that does not hold. Nothing is published.
 * website-three (17 Oct 2026): `If-Match: <draftVersion>` (GET's number) makes the save conditional — 409 CONFLICT when
 * someone else saved the draft since; a save never lands over one made while it was being checked, If-Match or not.
 */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteConfigSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const ifMatch = request.headers.get("if-match")?.replace(/"/g, "").trim();
    const baseVersion = ifMatch && /^\d{1,9}$/.test(ifMatch) ? Number(ifMatch) : null;
    const saved = await saveSite(ctx, parsed.data, { baseVersion });
    if (!saved.ok) {
      const t = await getT();
      if (saved.stale) return NextResponse.json(apiErrorSchema.parse({ error: t(saved.errorKey), code: "CONFLICT" }), { status: 409 });
      return NextResponse.json(apiErrorSchema.parse({ error: t(saved.errorKey), code: "BAD_REQUEST", issues: { [saved.field]: t(saved.errorKey) } }), { status: 422 });
    }
    return ok(await body(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site");
  }
}
