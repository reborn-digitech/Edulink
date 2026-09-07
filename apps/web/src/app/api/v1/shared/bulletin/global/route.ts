import { globalFeedSchema, sharedPageQuerySchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { asCategory, readGlobalFeed, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../../helpers";

/** GET /api/v1/shared/bulletin/global — every school's shared posts, `?category=`, `?q=`, `?tag=`, cursor paged. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    const paging = sharedPageQuerySchema.safeParse({ cursor: text(params, "cursor"), limit: params.get("limit") ?? undefined });
    if (!paging.success) return apiInvalid(paging);
    const feed = await readGlobalFeed(ctx, {
      category: asCategory(params.get("category")),
      q: text(params, "q"),
      tag: text(params, "tag")?.replace(/^#/, "").slice(0, 40) || undefined,
      ...paging.data,
    });
    return ok(globalFeedSchema.parse(feed));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin/global");
  }
}
