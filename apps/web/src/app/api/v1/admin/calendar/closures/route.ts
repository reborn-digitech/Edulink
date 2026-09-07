import { closureCreateBodySchema, createdIdSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createHoliday } from "@/lib/holidays";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/calendar/closures — add a holiday, exam window or event to the calendar. The admin's alone: the head reads the calendar, the office sets it. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = closureCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const id = await createHoliday(ctx, parsed.data);
    return ok(createdIdSchema.parse({ id }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/closures");
  }
}
