import { gigDisputeDecideBodySchema, gigDisputeDecidedSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { decideDispute } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/**
 * POST /api/v1/operator/gigs/disputes/{bookingId}/decide — the operator decides a family's dispute of a marked seat
 * (TA-122): REFUND, not held (the seat UNHELD, a paid seat refunded in full); RELEASE, the provider's mark stands and
 * the pay-out goes. Both sides are told; a dispute already decided is not found.
 */
export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { bookingId } = await params;
    const parsed = gigDisputeDecideBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await decideDispute(ctx, bookingId, parsed.data.decision);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigDisputeDecidedSchema.parse({ status: result.status }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/disputes/[bookingId]/decide");
  }
}
