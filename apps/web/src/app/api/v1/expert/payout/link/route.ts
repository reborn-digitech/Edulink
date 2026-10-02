import { expertPayoutSchema } from "@edulink/contracts";
import { linkPayoutAccount } from "@/lib/gig-payments";
import { expertPayoutStanding } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireApiExpertRole } from "../../guard";

/** POST /api/v1/expert/payout/link — link the account the expert is paid into; refused with the reason until KYC is verified. */
export async function POST() {
  try {
    const ctx = await requireApiExpertRole();
    const result = await linkPayoutAccount(ctx);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(expertPayoutSchema.parse(await expertPayoutStanding(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/payout/link");
  }
}
