import { closureCreateBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { deleteHoliday, updateHoliday } from "@/lib/holidays";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/**
 * POST /api/v1/admin/calendar/closures/{holidayId} — correct a closure, exam
 * window or event (the web's editCalendarEntry), every field sent, as the add
 * (POST /api/v1/admin/calendar/closures) takes them. The office's alone: the
 * head reads the calendar, the office sets it. A name too short, an end
 * before the start, are a 422 in words; another school's entry is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ holidayId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { holidayId } = await params;
    const parsed = closureCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await underRules("api/v1/admin/calendar/closures/[holidayId]", async () => {
      await updateHoliday(ctx, holidayId, parsed.data);
      return ok(okSchema.parse({ ok: true }));
    });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/closures/[holidayId]");
  }
}

/** DELETE /api/v1/admin/calendar/closures/{holidayId} — take it off the calendar (the web's removeCalendarEntry). */
export async function DELETE(_request: Request, { params }: { params: Promise<{ holidayId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { holidayId } = await params;
    return await underRules("api/v1/admin/calendar/closures/[holidayId]", async () => {
      await deleteHoliday(ctx, holidayId);
      return ok(okSchema.parse({ ok: true }));
    });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/closures/[holidayId]");
  }
}
