import { attendanceHistoryQuerySchema, attendanceHistorySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminAttendanceHistory } from "@/lib/api-reads/admin";

/**
 * GET /api/v1/admin/attendance/history — the registers already taken: one
 * class, one month (this month unless asked). Without a class, the classes
 * to choose from. The office and the head read any class of the school's.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = attendanceHistoryQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(attendanceHistorySchema.parse(await adminAttendanceHistory(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/attendance/history");
  }
}
