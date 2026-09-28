import { okSchema, bulletinCommentReviewBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { moderateComment } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/shared/bulletin/comments/{commentId}/review — approve or remove a held comment; who may is `moderateComment`'s rule. */
export async function POST(request: Request, { params }: { params: Promise<{ commentId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { commentId } = await params;
    const parsed = bulletinCommentReviewBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await moderateComment(ctx, commentId, parsed.data.decision, parsed.data.reason);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/comments/[commentId]/review");
  }
}
