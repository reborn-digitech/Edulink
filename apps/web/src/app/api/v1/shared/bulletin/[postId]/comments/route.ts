import { bulletinCommentBodySchema, bulletinCommentResultSchema } from "@edulink/contracts";
import { addComment } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/bulletin/{postId}/comments — a pupil's comment on a school post is held for review (`held: true`). */
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { postId } = await params;
    const parsed = bulletinCommentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await addComment(ctx, postId, parsed.data.body, parsed.data.parentCommentId);
    return ok(bulletinCommentResultSchema.parse({ held: result.status === "PENDING" }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/comments");
  }
}
