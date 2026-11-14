import { joinDecisionBodySchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { decideClaim } from "@/lib/guardian-claims";
import { studentConsentBody } from "@/lib/student-consent-view";

/**
 * POST /api/v1/student/guardian-claims/{claimId}/decide — an adult student at a college accepts or declines somebody
 * asking to be their guardian (TA-555): theirs alone to decide, and a guardian they accept sees nothing until they
 * share it. Who may is `decideClaim`'s rule (a claim that is not this student's own to decide is 404). Answers the
 * student's consent list as it now stands.
 */
export async function POST(request: Request, { params }: { params: Promise<{ claimId: string }> }) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const { claimId } = await params;
    const parsed = joinDecisionBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await decideClaim(ctx, claimId, parsed.data.decision, parsed.data.reason);
    return ok(await studentConsentBody(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/student/guardian-claims/[claimId]/decide");
  }
}
