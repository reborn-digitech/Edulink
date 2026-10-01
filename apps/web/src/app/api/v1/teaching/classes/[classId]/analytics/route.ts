import { classAnalyticsQuerySchema, classAnalyticsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { classAnalytics } from "@/lib/class-analytics";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/teaching/classes/{classId}/analytics?window=term|month — the class as numbers, computed on read. */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = classAnalyticsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(classAnalyticsSchema.parse(await classAnalytics(ctx, classId, parsed.data.window)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/classes/analytics");
  }
}
