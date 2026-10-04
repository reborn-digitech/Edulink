import { examAnalyticsQuerySchema, examAnalyticsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { examAnalytics } from "@/lib/exam-cell-marks";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/exam-cell/analytics — Pass rates by course, faculty and division, the trend, the first-year figures. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const parsed = examAnalyticsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(examAnalyticsSchema.parse(await examAnalytics(ctx, q.termId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/analytics");
  }
}
