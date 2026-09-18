import { staffCheckInSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { checkIn } from "@/lib/staff-attendance";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/staff/attendance/check-in — "I'm in". */
export async function POST() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { status, checkedInAt, late } = await checkIn(ctx);
    return ok(staffCheckInSchema.parse({ status, checkedInAt: checkedInAt.toISOString(), late }));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/attendance/check-in");
  }
}
