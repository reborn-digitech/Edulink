import { postPinBodySchema, postPinnedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setPinned } from "@/lib/bulletin";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/shared/bulletin/{postId}/pin — pin a post to the top of the
 * school's feed, or unpin it (the web's pin button, R-50). The body says
 * which (`{ pinned }`), so a call replayed from the phone's outbox changes
 * nothing the second time (the web's button stays a toggle); answers the
 * post's state after the call; audited post.pin or post.unpin when it
 * changes. The office's alone: pinning is a whole-school editorial decision.
 * A post of another school, or not approved, is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { postId } = await params;
    const parsed = postPinBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(postPinnedSchema.parse({ pinned: await setPinned(ctx, postId, parsed.data.pinned) }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/[postId]/pin");
  }
}
