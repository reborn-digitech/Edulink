import { calendarImportBodySchema, calendarImportResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { importCalendar } from "@/lib/college-campus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/admin/calendar/import — The university's academic calendar, pasted: entries added once by first day and name. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = calendarImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(calendarImportResultSchema.parse(await importCalendar(ctx, b.text)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/import");
  }
}
