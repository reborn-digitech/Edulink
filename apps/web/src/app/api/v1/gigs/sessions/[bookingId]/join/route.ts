import { gigJoinSchema } from "@edulink/contracts";
import { joinLink } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireGigRole } from "../../../guard";

/**
 * GET /api/v1/gigs/sessions/{bookingId}/join — the meeting link of one booking (seats, 17 Oct 2026): the provider's own
 * always; the pupil's and their guardians' once the seat is confirmed and, when priced, paid (403 with the reason
 * before then); anybody else's is not found. The office is refused by role: it never reads the link.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT", "EXPERT", "TEACHER");
    const { bookingId } = await params;
    return ok(gigJoinSchema.parse(await joinLink(ctx, bookingId)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/join");
  }
}
