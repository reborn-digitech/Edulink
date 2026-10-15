import { adminSitePublishedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { publishSite } from "@/lib/site-admin";

/**
 * POST /api/v1/admin/site/publish — render the draft in every language the site offers and make it the live
 * version (website-builder A, 15 Oct 2026); the office and the head; audited site.publish. No body.
 */
export async function POST() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const made = await publishSite(ctx);
    return ok(adminSitePublishedSchema.parse({ ok: true, versionId: made.versionId, renderedAt: made.renderedAt.toISOString(), address: made.address }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/publish");
  }
}
