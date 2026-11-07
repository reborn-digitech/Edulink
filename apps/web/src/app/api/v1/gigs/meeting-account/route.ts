import { gigMeetingAccountBodySchema, gigMeetingAccountSetSchema } from "@edulink/contracts";
import { setPremiumMeeting } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../guard";

/** POST /api/v1/gigs/meeting-account — the provider says once whether their Meet, Zoom, Teams or Jitsi account is premium (decision 0008); nothing verifies it. */
export async function POST(request: Request) {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    const parsed = gigMeetingAccountBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setPremiumMeeting(ctx, parsed.data.premium);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigMeetingAccountSetSchema.parse({ meeting: result.meeting }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/meeting-account");
  }
}
