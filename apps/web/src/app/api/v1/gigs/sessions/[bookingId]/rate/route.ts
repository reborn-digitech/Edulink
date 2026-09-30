import { gigRateBodySchema, okSchema } from "@edulink/contracts";
import { rateBooking } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/sessions/{bookingId}/rate — the family rates a session out of five, once, after it was held. */
export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    const { bookingId } = await params;
    const parsed = gigRateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await rateBooking(ctx, bookingId, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/rate");
  }
}
