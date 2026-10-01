import { moderationPostSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { readPlatformPost } from "@/lib/bulletin";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/moderation/{postId} — one live global post and its approved comments. */
export async function GET(_request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { postId } = await params;
    const post = await readPlatformPost(ctx, postId);
    return ok(moderationPostSchema.parse({ ...post, createdAt: post.createdAt.toISOString(), comments: post.comments.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/moderation/[postId]");
  }
}
