import { gigPayeeSuspendBodySchema, gigPayeeSuspendedSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { suspendPayee } from "@/lib/gig-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/payees/{expertUserId}/suspend — the operator stops paying an expert, with a reason they can read, or lifts the stop. */
export async function POST(request: Request, { params }: { params: Promise<{ expertUserId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { expertUserId } = await params;
    const parsed = gigPayeeSuspendBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await suspendPayee(ctx, expertUserId, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPayeeSuspendedSchema.parse({ payout: result.payout }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/payees/[expertUserId]/suspend");
  }
}
