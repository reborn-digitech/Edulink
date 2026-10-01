import { operatorSchoolSupportSchema } from "@edulink/contracts";
import { AccessError, requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { operatorSchoolSupport } from "@/lib/api-reads/operator-support";

/** GET /api/v1/operator/schools/{schoolId}/support — the school's active admins and head (with their live sessions), its plan, and this month's usage against it. */
export async function GET(_request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const body = await operatorSchoolSupport(ctx, schoolId);
    if (!body) throw new AccessError("root.noSuchSchool", "NOT_FOUND");
    return ok(operatorSchoolSupportSchema.parse(body));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]/support");
  }
}
