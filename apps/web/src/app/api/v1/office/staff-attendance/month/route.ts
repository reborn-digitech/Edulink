import { staffMonthQuerySchema, staffMonthSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffMonth } from "@/lib/staff-attendance";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/staff-attendance/month?month= — the month per person. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = staffMonthQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffMonthSchema.parse(await staffMonth(ctx, parsed.data.month)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/staff-attendance/month");
  }
}
