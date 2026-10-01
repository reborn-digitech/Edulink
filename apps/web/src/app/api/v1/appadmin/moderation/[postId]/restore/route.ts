import { okSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { platformRestore } from "@/lib/bulletin";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/appadmin/moderation/{postId}/restore — back as it was, for every school. */
export async function POST(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { postId } = await params;
    await platformRestore(ctx, postId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/moderation/[postId]/restore");
  }
}
