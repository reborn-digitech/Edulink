import { operatorUsageQuerySchema, operatorUsageSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { listUsage } from "@/lib/plans";

/** GET /api/v1/operator/usage?month=YYYY-MM — every live school's month against its plan's caps, over-cap first; this month by default. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorUsageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const usage = await listUsage(ctx, parsed.data.month);
    return ok(operatorUsageSchema.parse({ ...usage, items: usage.items.map((i) => ({ ...i, computedAt: i.computedAt?.toISOString() ?? null })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/usage");
  }
}
