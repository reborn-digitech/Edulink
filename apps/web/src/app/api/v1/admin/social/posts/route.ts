import { socialPostListSchema, socialPostsQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { socialPostsFor } from "@/lib/social";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/admin/social/posts?postId= — the copies of one school post sent (or being sent) to Facebook and Instagram (meta-posting, 16 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = socialPostsQuerySchema.safeParse({ postId: new URL(request.url).searchParams.get("postId") ?? "" });
    if (!parsed.success) return apiInvalid(parsed);
    return ok(socialPostListSchema.parse({ items: await socialPostsFor(ctx, parsed.data.postId) }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/social/posts");
  }
}
