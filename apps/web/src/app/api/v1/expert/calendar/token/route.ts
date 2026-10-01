import { expertCalendarTokenSchema } from "@edulink/contracts";
import { calendarTokenUrl, rotateCalendarToken } from "@/lib/expert-kyc";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpertRole } from "../../guard";

/** GET /api/v1/expert/calendar/token — the feed URL as it stands, or null until one is minted. */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertCalendarTokenSchema.parse(await calendarTokenUrl(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/calendar/token");
  }
}

/** POST /api/v1/expert/calendar/token — mint the feed's token, or rotate it; the old URL stops answering at once. */
export async function POST() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertCalendarTokenSchema.parse(await rotateCalendarToken(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/calendar/token");
  }
}
