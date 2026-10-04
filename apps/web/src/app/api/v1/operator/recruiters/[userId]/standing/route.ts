import { operatorRecruiterStandingBodySchema, operatorRecruiterStandingSchema } from "@edulink/contracts";
import { AccessError, requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { setRecruiterStanding } from "@/lib/operator-college";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/recruiters/{userId}/standing — disable a recruiter across every college (sessions ended) or enable them again; audited superuser.recruiter.disable|enable. */
export async function POST(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { userId } = await params;
    const parsed = operatorRecruiterStandingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setRecruiterStanding(ctx, userId, parsed.data);
    if (!result.ok && result.errorKey === "operatorCollege.refuseNoRecruiter") throw new AccessError(result.errorKey, "NOT_FOUND");
    if (!result.ok) return operatorRefused(result);
    return ok(operatorRecruiterStandingSchema.parse({ ok: true, sessionsEnded: result.sessionsEnded }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/recruiters/[userId]/standing");
  }
}
