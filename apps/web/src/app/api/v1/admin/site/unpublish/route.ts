import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { unpublishSite } from "@/lib/site-admin";

/**
 * POST /api/v1/admin/site/unpublish — take the website down (website-builder A, 15 Oct 2026): the public address
 * answers 404 with noindex from the next request; the versions are kept and Publish puts it back. The office and
 * the head; audited site.unpublish when something was live. No body; idempotent.
 */
export async function POST() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    await unpublishSite(ctx);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/unpublish");
  }
}
