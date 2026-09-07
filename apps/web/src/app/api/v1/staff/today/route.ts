import { staffTodaySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffToday } from "@/lib/api-reads/staff";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/today — the teacher's Today page: marks to enter, today's lessons, and for a form teacher the registers and the marking pile. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    return ok(staffTodaySchema.parse(await staffToday(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/today");
  }
}
