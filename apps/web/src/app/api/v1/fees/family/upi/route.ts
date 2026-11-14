import { familyPayBodySchema, familyUpiStartSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { startUpiPayment } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, budget, ok, readJson } from "@/lib/api-v1";

/** UPI intents a guardian may open in an hour (TA-449): a few presses a term is a family; hundreds is a script. */
const UPI_START_BUDGET = { limit: 30, windowMs: 60 * 60 * 1000 };

/** POST /api/v1/fees/family/upi — an intent link to the school's own UPI id, and the reference the office will look for. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const refused = await budget(`fee-upi:${ctx.user.id}`, UPI_START_BUDGET.limit, UPI_START_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = familyPayBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyUpiStartSchema.parse(await startUpiPayment(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/upi");
  }
}
