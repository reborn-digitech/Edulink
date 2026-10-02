import { expertEarningsSchema } from "@edulink/contracts";
import { expertEarnings } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/earnings — on hold, paid out and refunded, seat by seat, with the settlement reference once the gateway names it. */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertEarningsSchema.parse(await expertEarnings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/earnings");
  }
}
