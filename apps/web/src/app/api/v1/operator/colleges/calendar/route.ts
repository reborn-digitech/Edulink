import { operatorCollegeCalendarSchema, operatorCollegesQuerySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { regulatorCalendar } from "@/lib/operator-college";

/** GET /api/v1/operator/colleges/calendar?test=1 — the regulators' windows of the next 120 days across the colleges. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorCollegesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorCollegeCalendarSchema.parse(await regulatorCalendar(ctx, { fixtures: parsed.data.test === "1" })));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/colleges/calendar");
  }
}
