import { socialPostSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { retrySocialPost } from "@/lib/social";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/social/posts/{socialPostId}/retry — a FAILED copy queued again with three fresh attempts; audited (meta-posting, 16 Oct 2026). */
export async function POST(_request: Request, { params }: { params: Promise<{ socialPostId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { socialPostId } = await params;
    return ok(socialPostSchema.parse(await retrySocialPost(ctx, socialPostId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/social/posts/retry");
  }
}
