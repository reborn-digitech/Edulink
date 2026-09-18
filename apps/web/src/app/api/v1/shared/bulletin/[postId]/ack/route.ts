import { okSchema } from "@edulink/contracts";
import { acknowledgePost } from "@/lib/bulletin";
import { requireApiSession } from "@/lib/api-reads/shared";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/shared/bulletin/{postId}/ack — seen and understood. Idempotent; a post that asks for no acknowledgement is 404. */
export async function POST(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { postId } = await params;
    await acknowledgePost(ctx, postId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/ack");
  }
}
