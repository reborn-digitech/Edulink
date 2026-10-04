import { collegeApplicationSchema, collegeCancelBodySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { cancelAdmission } from "@/lib/college-admissions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** POST /api/v1/college/admissions/applications/{applicationId}/cancel — Cancel the seat; the refund the authority's slab allows is recorded, not paid. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const { applicationId } = await params;
    const parsed = collegeCancelBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(collegeApplicationSchema.parse(await cancelAdmission(ctx, applicationId, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications/[applicationId]/cancel");
  }
}
