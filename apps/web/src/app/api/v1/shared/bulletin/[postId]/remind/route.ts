import { circularRemindResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { remindCircular } from "@/lib/circulars";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/shared/bulletin/{postId}/remind — chase the outstanding families, once a day. */
export async function POST(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { postId } = await params;
    const { reminded, texted, remindedAt } = await remindCircular(ctx, postId);
    return ok(circularRemindResultSchema.parse({ reminded, texted, remindedAt: remindedAt.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/remind");
  }
}
