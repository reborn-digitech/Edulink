import { familyBookMeetingSchema, okSchema, familyParentMeetingsSchema } from "@edulink/contracts";
import { bookSlot } from "@/lib/meetings";
import { parentMeetings, requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/family/meetings — open windows of the children's teachers, and the family's own bookings. */
export async function GET() {
  try {
    const ctx = await requireApiParent();
    return ok(familyParentMeetingsSchema.parse(await parentMeetings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/meetings");
  }
}

/** POST /api/v1/family/meetings — claim a slot for one child. The child must be theirs and the teacher must teach that child; bookSlot re-checks both. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyBookMeetingSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await bookSlot(ctx.user.id, parsed.data.slotId, parsed.data.studentMembershipId, parsed.data.note);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/meetings");
  }
}
