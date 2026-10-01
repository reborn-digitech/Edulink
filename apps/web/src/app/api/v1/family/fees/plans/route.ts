import { familyChildFeesQuerySchema, familyFeePlansSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { familyPlans } from "@/lib/fees-family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../../_shared";

/** GET /api/v1/family/fees/plans?student= — the fee structures the office has opened to families, for this child's grade, with their instalments and dates. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyChildFeesQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyFeePlansSchema.parse(await familyPlans(ctx, parsed.data.student ?? parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/fees/plans");
  }
}
