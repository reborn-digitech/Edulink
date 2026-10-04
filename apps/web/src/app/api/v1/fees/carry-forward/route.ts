import { feeCarryForwardBodySchema, feeCarryForwardResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { carryForward } from "@/lib/fees-reports";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/carry-forward — every pupil's outstanding from one year becomes an opening balance in the next; the old rows are marked carried. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeCarryForwardBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeCarryForwardResultSchema.parse(await carryForward(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/carry-forward");
  }
}
