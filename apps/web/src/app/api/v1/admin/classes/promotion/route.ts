import { promotionPlanSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { adminPromotionPlan } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/classes/promotion — the year-end plan: every class, its pupils, where they would most likely go. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(promotionPlanSchema.parse(await adminPromotionPlan(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/promotion");
  }
}
