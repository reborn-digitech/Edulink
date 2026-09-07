import { bulletinReactBodySchema, bulletinReactResultSchema } from "@edulink/contracts";
import { toggleReaction } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/bulletin/{postId}/react — toggle one of the seven reactions. */
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { postId } = await params;
    const parsed = bulletinReactBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(bulletinReactResultSchema.parse(await toggleReaction(ctx, postId, parsed.data.kind)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/react");
  }
}
