import { okSchema, bulletinReviewBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { moderatePost } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/shared/bulletin/{postId}/review — approve or reject a pending pupil post; who may is `moderatePost`'s rule. */
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { postId } = await params;
    const parsed = bulletinReviewBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await moderatePost(ctx, postId, parsed.data.decision, parsed.data.reason);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/review");
  }
}
