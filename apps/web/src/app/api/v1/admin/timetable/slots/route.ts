import { slotSaveBodySchema, savedIdSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setSlot } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/timetable/slots — put a lesson in a cell, or change the
 * one there. Replay-safe: the cell is keyed by class, weekday and period.
 * A teacher already in another room at that time is refused by name.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = slotSaveBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setSlot(ctx, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(savedIdSchema.parse({ ok: true, id: result.id }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/timetable/slots");
  }
}
