import { bulletinFeedSchema, bulletinCreatePostSchema, bulletinPostCreatedSchema, sharedPageQuerySchema } from "@edulink/contracts";
import { createPost } from "@/lib/bulletin";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { asCategory, readBulletinFeed, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/**
 * GET /api/v1/shared/bulletin — the school feed as the page shows it:
 * `?filter=pending|mine`, `?category=`, `?q=`, `?tag=`, a guardian's
 * `?school=`, cursor paged. What each role may see is `listFeed`'s rule.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    const paging = sharedPageQuerySchema.safeParse({ cursor: text(params, "cursor"), limit: params.get("limit") ?? undefined });
    if (!paging.success) return apiInvalid(paging);
    const feed = await readBulletinFeed(ctx, {
      filter: text(params, "filter"),
      tag: text(params, "tag"),
      school: text(params, "school"),
      category: asCategory(params.get("category")),
      q: text(params, "q"),
      ...paging.data,
    });
    return ok(bulletinFeedSchema.parse(feed));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin");
  }
}

/**
 * POST /api/v1/shared/bulletin — compose a post. Media are ids the caller
 * got back from POST /api/v1/uploads; a pupil's post is created PENDING and
 * a guardian's refused, exactly as `createPost` decides.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = bulletinCreatePostSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    // Every file must be one THIS person uploaded and nobody has attached yet.
    // The web composes files and post in one request; the phone uploads
    // first, and a file id that was merely seen must not become an attachment
    // — files.ts would then grant the post's audience access to it.
    const fileIds = parsed.data.media.map((m) => m.fileId);
    let media = parsed.data.media;
    if (fileIds.length > 0) {
      const tickets = await db.uploadTicket.findMany({ where: { fileId: { in: fileIds }, userId: ctx.user.id, consumedAt: null }, select: { fileId: true, mime: true } });
      if (tickets.length !== new Set(fileIds).size) throw new AccessError("access.fileNotYours", "NOT_FOUND");
      // A post's media are pictures and videos, as the web's composer insists;
      // a PDF is an attachment elsewhere, not a feed item served to a whole
      // audience. The kind is the sniffed mime's, never the caller's word.
      const mimeOf = new Map(tickets.map((t) => [t.fileId, t.mime]));
      if (tickets.some((t) => !t.mime.startsWith("image/") && !t.mime.startsWith("video/"))) throw new AccessError("bulletin.allPictures");
      media = parsed.data.media.map((m) => ({ ...m, kind: mimeOf.get(m.fileId)!.startsWith("video/") ? ("video" as const) : ("image" as const) }));
    }
    const result = await createPost(ctx, { ...parsed.data, media });
    if (fileIds.length > 0) await db.uploadTicket.updateMany({ where: { fileId: { in: fileIds } }, data: { consumedAt: new Date() } });
    return ok(bulletinPostCreatedSchema.parse(result), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/bulletin");
  }
}
