import { siteSummarySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { siteSummary } from "@/lib/site-summary";

/** GET /api/v1/admin/site/summary — the website at a glance for the phone's read-only screen (website-three, 17 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(siteSummarySchema.parse(await siteSummary(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/summary");
  }
}
