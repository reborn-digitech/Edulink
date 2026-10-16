import { siteVersionsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { siteVersions } from "@/lib/site-admin";

/** GET /api/v1/admin/site/versions — every version of the website kept, newest first, with who published it (website-two, 16 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const rows = await siteVersions(ctx);
    return ok(siteVersionsSchema.parse({ versions: rows.map((r) => ({ ...r, renderedAt: r.renderedAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/versions");
  }
}
