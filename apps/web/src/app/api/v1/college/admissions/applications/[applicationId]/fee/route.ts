import { admissionFeeBodySchema, collegeApplicationSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recordAdmissionFee } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/fee — The admission fee as the college's counter or bank received it (recorded, never collected here). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN", "ACCOUNTS");
    const { applicationId } = await params;
    const parsed = admissionFeeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await recordAdmissionFee(ctx, applicationId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications/[applicationId]/fee");
  }
}
