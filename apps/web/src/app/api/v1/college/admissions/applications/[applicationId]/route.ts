import { collegeApplicationSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { getApplication } from "@/lib/college-admissions";
import { apiFailure, ok } from "@/lib/api-v1";

type Params = { params: Promise<{ applicationId: string }> };

/** GET /api/v1/college/admissions/applications/{applicationId} — One application with its scrutiny checklist. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const { applicationId } = await params;
    return ok(collegeApplicationSchema.parse(await getApplication(ctx, applicationId)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/admissions/applications/[applicationId]");
  }
}
