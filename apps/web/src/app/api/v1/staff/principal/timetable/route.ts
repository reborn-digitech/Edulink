import { principalTimetableQuerySchema, principalTimetableSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { principalTimetable } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/principal/timetable?week=&classId= — one class's week as the office sees it, with the uncovered and unstaffed lessons counted. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const parsed = principalTimetableQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(principalTimetableSchema.parse(await principalTimetable(ctx, parsed.data.week, parsed.data.classId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/principal/timetable");
  }
}
