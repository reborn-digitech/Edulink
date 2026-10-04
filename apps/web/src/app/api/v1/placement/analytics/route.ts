import { placementAnalyticsQuerySchema, placementAnalyticsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { placementAnalytics } from "@/lib/placement-analytics";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/placement/analytics — The placement table and the published seasons. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL", "IQAC");
    const parsed = placementAnalyticsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(placementAnalyticsSchema.parse(await placementAnalytics(ctx, q.batchYear)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/analytics");
  }
}
