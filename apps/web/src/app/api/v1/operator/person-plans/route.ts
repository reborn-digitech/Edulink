import { operatorPersonPlanBodySchema, operatorPersonPlanSetSchema, operatorPersonPlansSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { listPersonPlans, setPersonPlan } from "@/lib/person-plans";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/operator/person-plans — the plans sold per person, their prices, active switch and how many hold each now (16 Oct 2026). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(operatorPersonPlansSchema.parse({ plans: await listPersonPlans(ctx) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/person-plans");
  }
}

/** PUT /api/v1/operator/person-plans — one plan's prices or active switch; audited, a no-op when nothing changes. */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorPersonPlanBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(operatorPersonPlanSetSchema.parse(await setPersonPlan(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/person-plans");
  }
}
