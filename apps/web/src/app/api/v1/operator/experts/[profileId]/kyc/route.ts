import { okSchema, operatorExpertKycBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { decideKyc } from "@/lib/expert-kyc";
import { operatorRefused } from "@/lib/api-reads/operator-school";

/**
 * POST /api/v1/operator/experts/{profileId}/kyc — the operator's answer to an
 * expert's papers: VERIFIED sets the marketplace's badge, REJECTED needs its
 * reason and clears it; the expert is told either way. Audited as
 * expert.kyc.verify / expert.kyc.reject.
 */
export async function POST(request: Request, { params }: { params: Promise<{ profileId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { profileId } = await params;
    const parsed = operatorExpertKycBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await decideKyc(ctx, profileId, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/experts/[profileId]/kyc");
  }
}
