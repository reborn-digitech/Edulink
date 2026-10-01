import { healthCardReadsSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { healthCardReadsFor } from "@/lib/health";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/students/{membershipId}/health/reads — who at the school opened the child's health card in the last ninety days. */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiParent();
    const { membershipId } = await params;
    return ok(healthCardReadsSchema.parse(await healthCardReadsFor(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/students/health/reads");
  }
}
