import { expertPayoutSchema } from "@edulink/contracts";
import { expertPayoutStanding } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/payout — where the expert is paid, and the four conditions before a seat may be priced (decision 0004 as amended). */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertPayoutSchema.parse(await expertPayoutStanding(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/payout");
  }
}
