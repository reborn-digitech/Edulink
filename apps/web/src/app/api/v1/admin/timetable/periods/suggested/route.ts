import { suggestedDayAppliedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { applySuggestedDay } from "@/lib/timetable";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/timetable/periods/suggested — lay out the suggested first
 * school day for a school that has none (the web's seedSuggestedDay, R-50);
 * audited timetable.period.seed. The office's alone. Refused (422) once the
 * school has any period, retired ones included, so it is never an "append
 * eight more" button. No body: the call is the act.
 */
export async function POST() {
  try {
    const ctx = await requireApiRole("ADMIN");
    const result = await applySuggestedDay(ctx);
    if (!result.ok) return apiRefused(result);
    return ok(suggestedDayAppliedSchema.parse({ created: result.created ?? 0 }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/timetable/periods/suggested");
  }
}
