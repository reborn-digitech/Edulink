import { operatorRecruiterStandingBodySchema, operatorRecruiterStandingSchema } from "@edulink/contracts";
import { AccessError, requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { setExpertAccess } from "@/lib/operator-college";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/** POST /api/v1/operator/experts/{profileId}/access — close an expert's account (no sign-in, no bookings, sessions ended, told by email) or open it again; audited superuser.expert.disable|enable (G4-28). */
export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { profileId } = await params;
    const parsed = operatorRecruiterStandingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setExpertAccess(ctx, profileId, parsed.data);
    if (!result.ok && result.errorKey === "riskDecisions.refuseNoExpert") throw new AccessError(result.errorKey, "NOT_FOUND");
    if (!result.ok) return operatorRefused(result);
    return ok(operatorRecruiterStandingSchema.parse({ ok: true, sessionsEnded: result.sessionsEnded }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/experts/[profileId]/access");
  }
}
