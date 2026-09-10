import { officeSlotClearBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { clearSlot } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/office/timetable/slots/clear — take the lesson out of one cell of a class's week. An empty cell, or another school's class, is refused with the reason. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeSlotClearBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { classId, weekday, periodId } = parsed.data;
    const result = await clearSlot(ctx, classId, weekday, periodId);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/timetable/slots/clear");
  }
}
