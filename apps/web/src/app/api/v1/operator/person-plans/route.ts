import { operatorPersonPlanAnswerSchema, operatorPersonPlanBodySchema, operatorPersonPlansSchema } from "@edulink/contracts";
import { operatorRefused } from "@/lib/api-reads/operator-school";
import { requireApiOperator } from "@/lib/tenancy";
import { listPersonPlans } from "@/lib/person-plans";
import { changePersonPlan } from "@/lib/plan-ask";
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

/**
 * PUT /api/v1/operator/person-plans — one plan's prices or active switch; audited, a no-op when nothing changes. `preview`
 * writes nothing; moving the Student or Teacher plan's switch answers what it does through premium, and, saved, tells the
 * offices whose bill moved (plan-ask.ts; decision 0010).
 */
export async function PUT(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorPersonPlanBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await changePersonPlan(ctx, parsed.data);
    // A switch that no longer stands as the caller read it (`expect`), or that moved between the read and the write: 422 by name.
    if ("ok" in result) return operatorRefused(result);
    return ok(operatorPersonPlanAnswerSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/person-plans");
  }
}
