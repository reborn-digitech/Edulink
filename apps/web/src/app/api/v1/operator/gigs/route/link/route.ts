import { gigRouteLinkAllSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { linkAllExperts } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/route/link — link every expert who is ready and not yet activated at Razorpay, and ask after every review still open. */
export async function POST() {
  try {
    const ctx = await requireApiOperator();
    const result = await linkAllExperts(ctx);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigRouteLinkAllSchema.parse({ run: result.run }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/route/link");
  }
}
