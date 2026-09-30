import { gigPaymentBodySchema, gigPaymentSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { recordGigPayment } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/**
 * POST /api/v1/operator/gigs/payments — the reference of a UPI transfer the
 * operator has already made to a contributor. The amount is the server's sum
 * of what they are owed for the months that have ended; nothing is sent by
 * the platform.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = gigPaymentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await recordGigPayment(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPaymentSchema.parse({ payment: result.payment }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/payments");
  }
}
