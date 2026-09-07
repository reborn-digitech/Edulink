import { attendanceClassesQuerySchema, attendanceClassesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { attendanceClasses } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/attendance/classes?date= — the classes this person is down to mark that day, with which registers are already taken. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = attendanceClassesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(attendanceClassesSchema.parse(await attendanceClasses(ctx, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/attendance/classes");
  }
}
