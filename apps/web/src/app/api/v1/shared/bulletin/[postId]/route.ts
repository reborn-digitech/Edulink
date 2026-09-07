import { bulletinPostDetailSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readPost, requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound } from "../../helpers";

/** GET /api/v1/shared/bulletin/{postId} — one post with its comments; another school's, or a pending one you may not see, is a 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { postId } = await params;
    return ok(bulletinPostDetailSchema.parse(await asNotFound(() => readPost(ctx, postId))));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]");
  }
}
