import { cancelSlotSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { cancelSlot } from "@/lib/meetings";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/meetings/cancel — withdraw one of my slots; a booked family is told. Not mine, or not here, is a 404. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = cancelSlotSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await cancelSlot(ctx, parsed.data.slotId);
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/staff/meetings/cancel");
  }
}
