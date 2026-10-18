import { viduraRenderingReviewSchema, viduraRenderingSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { reviewRendering } from "@/lib/assistant/renderings";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/operator/vidura/renderings/{renderingId} — approve, edit or reject one rendering of the guide (Vidura pass 2); audited, the same act again a no-op. */
export async function POST(request: Request, { params }: { params: Promise<{ renderingId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { renderingId } = await params;
    const parsed = viduraRenderingReviewSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(viduraRenderingSchema.parse(await reviewRendering(ctx, renderingId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/vidura/renderings/[renderingId]");
  }
}
