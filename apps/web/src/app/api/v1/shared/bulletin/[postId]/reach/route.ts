import { circularReachSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { circularReach } from "@/lib/circulars";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/shared/bulletin/{postId}/reach — told, seen, acknowledged, family by family. */
export async function GET(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { postId } = await params;
    return ok(circularReachSchema.parse(await circularReach(ctx, postId)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/reach");
  }
}
