import { okSchema, operatorPlanUpdateBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { deletePlan, updatePlan } from "@/lib/plans";
import { operatorRefused } from "@/lib/api-reads/operator-school";

type Params = { params: Promise<{ planId: string }> };

/** PATCH /api/v1/operator/plans/{planId} — correct a plan; only the fields sent change, a null cap is "no cap". Audited as superuser.plan.update. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiOperator();
    const { planId } = await params;
    const parsed = operatorPlanUpdateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await updatePlan(ctx, planId, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/plans/[planId]");
  }
}

/** DELETE /api/v1/operator/plans/{planId} — remove a plan no school is on; one with schools is refused. Audited as superuser.plan.delete. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiOperator();
    const { planId } = await params;
    const result = await deletePlan(ctx, planId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/plans/[planId]");
  }
}
