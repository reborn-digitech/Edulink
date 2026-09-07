import { weekQuerySchema, staffTimetableSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffTimetable } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/timetable?week= — the teacher's own week, covers and all. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = weekQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffTimetableSchema.parse(await staffTimetable(ctx, parsed.data.week)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/timetable");
  }
}
