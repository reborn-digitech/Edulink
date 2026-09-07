import { bulletinHideBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { hideGlobalPost, unhideGlobalPost } from "@/lib/global-feed";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/shared/bulletin/{postId}/hide — an admin hides a global post from their own school's people, or unhides it. */
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { postId } = await params;
    const parsed = bulletinHideBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    if (parsed.data.hidden) await hideGlobalPost(ctx, postId, parsed.data.reason);
    else await unhideGlobalPost(ctx, postId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/hide");
  }
}
