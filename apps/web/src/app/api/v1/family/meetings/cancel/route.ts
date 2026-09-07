import { familyCancelMeetingSchema, okSchema } from "@edulink/contracts";
import { cancelBooking } from "@/lib/meetings";
import { requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/family/meetings/cancel — the family steps back; the slot opens again and the teacher is told. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyCancelMeetingSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await cancelBooking(ctx.user.id, parsed.data.bookingId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/meetings/cancel");
  }
}
