import { gigSchoolSessionsSchema } from "@edulink/contracts";
import { schoolSessions } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireGigRole } from "../guard";

/** GET /api/v1/gigs/school — the office reads every session of its pupils, without the meeting link, and whether its teachers may offer guidance. */
export async function GET() {
  try {
    const ctx = await requireGigRole("ADMIN", "PRINCIPAL");
    return ok(gigSchoolSessionsSchema.parse(await schoolSessions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/school");
  }
}
