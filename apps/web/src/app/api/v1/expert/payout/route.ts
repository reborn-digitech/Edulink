import { expertPayeeBodySchema, expertPayoutSchema } from "@edulink/contracts";
import { savePayee } from "@/lib/gig-payments";
import { expertPayoutStanding } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireApiExpertRole } from "../guard";

/** GET /api/v1/expert/payout — where the company pays the expert (the sealed account never returned, its last four digits only) and the four conditions before a seat may be priced (decision 0004 as amended). */
export async function GET() {
  try {
    const ctx = await requireApiExpertRole();
    return ok(expertPayoutSchema.parse(await expertPayoutStanding(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/payout");
  }
}

/** POST /api/v1/expert/payout — save the payee details: a name, a UPI id or a bank account with its IFSC, the GST state, a GSTIN if any. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiExpertRole();
    const parsed = expertPayeeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await savePayee(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(expertPayoutSchema.parse(await expertPayoutStanding(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/payout");
  }
}
