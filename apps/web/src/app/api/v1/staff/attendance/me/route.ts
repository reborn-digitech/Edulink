import { myStaffAttendanceSchema, staffMonthQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { myStaffAttendance } from "@/lib/staff-attendance";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/attendance/me?month= — my own days. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole(...SCHOOL_STAFF_ROLES);
    const parsed = staffMonthQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(myStaffAttendanceSchema.parse(await myStaffAttendance(ctx, parsed.data.month)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/attendance/me");
  }
}
