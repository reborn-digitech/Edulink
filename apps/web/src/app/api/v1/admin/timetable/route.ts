import { adminTimetableQuerySchema, adminTimetableSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminTimetable } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/timetable — the school day's periods, the classes, and one class's week with the staff who could take each cell. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = adminTimetableQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminTimetableSchema.parse(await adminTimetable(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/timetable");
  }
}
