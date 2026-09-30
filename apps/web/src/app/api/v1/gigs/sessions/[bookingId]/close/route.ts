import { gigCloseBodySchema, okSchema } from "@edulink/contracts";
import { closeBooking } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/sessions/{bookingId}/close — after it has begun, the provider says how a seat of their own went; another provider's is a 404. */
export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    const { bookingId } = await params;
    const parsed = gigCloseBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await closeBooking(ctx, bookingId, parsed.data.outcome);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/close");
  }
}
