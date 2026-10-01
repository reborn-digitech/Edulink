import { okSchema, operatorAssignPlanBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { assignPlan } from "@/lib/plans";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/schools/{schoolId}/plan — put the school on a plan, or (planId null) take it off every plan. Audited as superuser.school.plan; the school's office is told. */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorAssignPlanBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await assignPlan(ctx, schoolId, parsed.data.planId);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/plan");
  }
}
