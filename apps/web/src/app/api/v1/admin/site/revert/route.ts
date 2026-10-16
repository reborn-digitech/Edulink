import { siteRestoreBodySchema, siteRestoredSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { restoreSiteVersion } from "@/lib/site-admin";

/** POST /api/v1/admin/site/revert — "Back to published": the live version's config becomes the draft ({ confirm: true }); audited (website-two, 16 Oct 2026). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteRestoreBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const config = await restoreSiteVersion(ctx, null);
    return ok(siteRestoredSchema.parse({ ok: true, config }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/revert");
  }
}
