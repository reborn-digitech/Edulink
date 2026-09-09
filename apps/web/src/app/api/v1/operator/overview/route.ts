import { operatorOverviewQuerySchema, operatorOverviewSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { operatorOverview } from "@/lib/api-reads/operator";

/** GET /api/v1/operator/overview — the web's /root on a phone: the schools (q, state), the counts, the jobs' health. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorOverviewQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorOverviewSchema.parse(await operatorOverview(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/overview");
  }
}
