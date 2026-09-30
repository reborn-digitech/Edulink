import { gigCancelBodySchema, gigCancelledSchema } from "@edulink/contracts";
import { cancelBooking } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/**
 * POST /api/v1/gigs/sessions/{bookingId}/cancel — the pupil or a guardian
 * gives a seat up; the provider or the pupil's school cancels it with a
 * reason. A booking that is none of the caller's is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT", "ADMIN", "PRINCIPAL", "TEACHER", "EXPERT");
    const { bookingId } = await params;
    const parsed = gigCancelBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await cancelBooking(ctx, bookingId, parsed.data.reason);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigCancelledSchema.parse({ status: result.status, lateCancel: result.lateCancel }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/cancel");
  }
}
