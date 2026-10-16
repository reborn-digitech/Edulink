import { siteRestoreBodySchema, siteRestoredSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { restoreSiteVersion } from "@/lib/site-admin";

/** POST /api/v1/admin/site/versions/{versionId}/restore — make a version's config the draft ({ confirm: true }); nothing is published; audited (website-two, 16 Oct 2026). */
export async function POST(request: Request, { params }: { params: Promise<{ versionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteRestoreBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const config = await restoreSiteVersion(ctx, (await params).versionId);
    return ok(siteRestoredSchema.parse({ ok: true, config }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/versions/restore");
  }
}
