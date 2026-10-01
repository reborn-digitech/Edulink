import { operatorPlanBodySchema, operatorPlanCreatedSchema, operatorPlansSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { createPlan, listPlans } from "@/lib/plans";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** GET /api/v1/operator/plans — every plan, oldest first, with how many live schools are on each. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    const plans = await listPlans(ctx);
    return ok(operatorPlansSchema.parse({ items: plans.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/plans");
  }
}

/** POST /api/v1/operator/plans — add a plan; 201 with its id. A taken code is a 422 with the lib's sentence. Audited as superuser.plan.create. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorPlanBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createPlan(ctx, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(operatorPlanCreatedSchema.parse({ ok: true, planId: result.planId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/operator/plans");
  }
}
