import { collegeApplicationSchema, headDecisionSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { getApplication } from "@/lib/college-admissions";
import { decideRefundException } from "@/lib/head-approvals";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/refund-exception/decide — the principal approves or refuses a refund outside the slab (5 Oct 2026). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("PRINCIPAL");
    const { applicationId } = await params;
    const parsed = headDecisionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await decideRefundException(ctx, applicationId, parsed.data);
    return ok(collegeApplicationSchema.parse(await getApplication(ctx, applicationId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/applications/[applicationId]/refund-exception/decide");
  }
}
