import { operatorOnboardBodySchema, operatorOnboardedSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { onboardSchool } from "@/lib/subscriptions";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/onboard — the guided flow's one call: the school, its plan, its subscription, its contact, its partner and its first administrator's invitation; 201 with the id, join code and slug. Audited as superuser.school.onboard and as each of the steps it reuses. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = operatorOnboardBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await onboardSchool(ctx, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(operatorOnboardedSchema.parse({ ok: true, schoolId: result.schoolId, code: result.code, slug: result.slug, partnerId: result.partnerId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/operator/onboard");
  }
}
