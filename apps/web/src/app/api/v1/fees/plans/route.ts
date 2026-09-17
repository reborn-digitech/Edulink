import { feeAssignBodySchema, feeAssignResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assignPlans } from "@/lib/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/plans — a class or named pupils onto a published structure; their dues are generated, refusals named. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeAssignBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeAssignResultSchema.parse(await assignPlans(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/plans");
  }
}
