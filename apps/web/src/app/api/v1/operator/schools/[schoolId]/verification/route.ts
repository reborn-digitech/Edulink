import { okSchema, operatorSchoolVerificationBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { setSchoolVerified } from "@/lib/superuser";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/**
 * POST /api/v1/operator/schools/{schoolId}/verification — give or withdraw
 * the operator's mark that the school has been checked. The mark is what
 * lets a school bring over a pupil who already has an account, by student
 * code or PEN. A removed school is refused; a school already in the state
 * asked for answers 200 and nothing moves. Audited as
 * superuser.school.verify or superuser.school.unverify.
 */
export async function POST(request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorSchoolVerificationBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setSchoolVerified(ctx, schoolId, parsed.data.verified);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/verification");
  }
}
