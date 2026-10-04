import { collegeApplicationSchema, collegeRefundBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recordRefund } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/refund — The college's bank paid the refund: its reference closes the case. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN", "ACCOUNTS");
    const { applicationId } = await params;
    const parsed = collegeRefundBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await recordRefund(ctx, applicationId, b.reference)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications/[applicationId]/refund");
  }
}
