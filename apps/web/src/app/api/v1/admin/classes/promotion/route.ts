import { promotionBodySchema, promotionDoneSchema, promotionPlanSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminPromotionPlan } from "@/lib/api-reads/admin";
import { promoteSchool } from "@/lib/promotion";
import { underRules } from "@/lib/api-rule-failure";

/** GET /api/v1/admin/classes/promotion — the year-end plan: every class, its pupils, where they would most likely go. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(promotionPlanSchema.parse(await adminPromotionPlan(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/promotion");
  }
}

/**
 * POST /api/v1/admin/classes/promotion — move the school up by the plan as
 * decided (the web's promoteSchoolAction, A3-inventory-7): the office's
 * alone. One way: classes are created and archived, pupils move, graduates
 * leave with their certificate on `lastDayKey` (today when absent). A plan
 * that names a class twice, a class into itself, a repeater who also moves,
 * or leavers whose last day is before they joined is a 422 in words; a class
 * of another school is a 404.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = promotionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { moves, lastDayKey } = parsed.data;
    return await underRules("api/v1/admin/classes/promotion", async () => ok(promotionDoneSchema.parse(await promoteSchool(ctx, moves, { lastDayKey }))));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/promotion");
  }
}
