import { schoolAdmissionsSchema } from "@edulink/contracts";
import { requireApiSession } from "@/lib/api-reads/shared";
import { schoolAdmissions } from "@/lib/admissions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/shared/schools/{schoolId}/admissions — the open door on a school's page. */
export async function GET(_request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { schoolId } = await params;
    return ok(schoolAdmissionsSchema.parse(await schoolAdmissions(ctx, schoolId)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/schools/[schoolId]/admissions");
  }
}
