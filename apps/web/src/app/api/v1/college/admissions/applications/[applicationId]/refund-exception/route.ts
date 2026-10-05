import { collegeApplicationSchema, refundExceptionAskSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { getApplication } from "@/lib/college-admissions";
import { askRefundException } from "@/lib/head-approvals";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/refund-exception — the office asks the principal for a refund outside the slab on a cancelled seat (5 Oct 2026). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { applicationId } = await params;
    const parsed = refundExceptionAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await askRefundException(ctx, applicationId, parsed.data);
    return ok(collegeApplicationSchema.parse(await getApplication(ctx, applicationId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/college/admissions/applications/[applicationId]/refund-exception");
  }
}
