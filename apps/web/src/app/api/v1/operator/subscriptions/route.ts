import { subscriptionsAnswerSchema, subscriptionsQuerySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { listSubscriptions } from "@/lib/school-terms";

/** GET /api/v1/operator/subscriptions — every school not removed with its terms, premium and state, narrowed by q, premium, terms, renewal and recording; the year billed over the real schools. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = subscriptionsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(subscriptionsAnswerSchema.parse(await listSubscriptions(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/subscriptions");
  }
}
