import { trendsQuerySchema, trendsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { longitudinalTrends } from "@/lib/analytics-longitudinal";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/principal/trends?years=2 — the school per term across the last years: attendance, marks by subject and teacher, pass rate, fees, incidents, and this year's grades against last year's. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const parsed = trendsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trendsSchema.parse(await longitudinalTrends(ctx, parsed.data.years)));
  } catch (error) {
    return apiFailure(error, "api/v1/principal/trends");
  }
}
