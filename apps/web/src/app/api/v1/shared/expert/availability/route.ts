import { expertAddSlotSchema, expertAvailabilitySchema, okSchema } from "@edulink/contracts";
import { addSlot, listOwnSlots } from "@/lib/experts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiExpert } from "@/lib/api-reads/shared";

/** GET /api/v1/shared/expert/availability — the windows the expert offers, booked ones marked. */
export async function GET() {
  try {
    const ctx = await requireApiExpert();
    const slots = (await listOwnSlots(ctx)).map((s) => ({
      id: s.id,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      note: s.note,
      bookedAt: s.bookedAt?.toISOString() ?? null,
      booking: s.booking ? { id: s.booking.id, topic: s.booking.topic, schoolName: s.booking.school.name } : null,
    }));
    return ok(expertAvailabilitySchema.parse({ slots }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/expert/availability");
  }
}

/** POST /api/v1/shared/expert/availability — offer a window; the past, back-to-front and overlaps refuse. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiExpert();
    const parsed = expertAddSlotSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await addSlot(ctx, { startsAt: new Date(parsed.data.startsAt), endsAt: new Date(parsed.data.endsAt), note: parsed.data.note });
    return ok(okSchema.parse({ ok: true }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/expert/availability");
  }
}
