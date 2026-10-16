import { siteVisitsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { siteVisits } from "@/lib/site-visits";

/** GET /api/v1/admin/site/visits — the website's page views of the last thirty days, counted on the server with no cookie and no address (website-two, 16 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(siteVisitsSchema.parse(await siteVisits(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/visits");
  }
}
