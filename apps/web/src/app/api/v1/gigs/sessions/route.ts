import { gigFamilySessionsSchema } from "@edulink/contracts";
import { familySessions } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireGigRole } from "../guard";

/** GET /api/v1/gigs/sessions — for a pupil, or each of a guardian's children: the free allowance, their seats, and what is open to book. */
export async function GET() {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    return ok(gigFamilySessionsSchema.parse(await familySessions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions");
  }
}
