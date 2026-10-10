import { previousSchoolsViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { previousSchoolsFor } from "@/lib/previous-schools";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/pupil-records/{membershipId}/previous-schools — the schools a pupil on this roll has left: each leaving certificate and the published report cards it opens (R-70). */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    return ok(previousSchoolsViewSchema.parse(await previousSchoolsFor(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records/[membershipId]/previous-schools");
  }
}
