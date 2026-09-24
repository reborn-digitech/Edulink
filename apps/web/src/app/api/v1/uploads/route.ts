import { NextResponse } from "next/server";
import { apiErrorSchema, uploadResultSchema } from "@edulink/contracts";
import { MAX_VIDEO_BYTES, deleteStoredFile, storeFile, UploadError } from "@/lib/storage";
import { getT } from "@/lib/i18n/server";
import { apiFailure, ok } from "@/lib/api-v1";
import { db } from "@/lib/db";
import { consume, UPLOADS, UPLOAD_BYTES_DAILY } from "@/lib/rate-limit";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/uploads — multipart form, one `file` field.
 *
 * The bytes go through `storeFile`, which sniffs the type, applies the caps
 * and strips EXIF before anything reaches disk. What comes back is the id the
 * caller then names in a post's media; the file is read back through
 * /api/files/{fileId}, which already accepts a bearer session.
 *
 * REFUSED BEFORE IT IS READ. `request.formData()` buffers the whole body
 * before `storeFile` can look at a byte of it, so a two-gigabyte upload was
 * two gigabytes of memory before the cap said no. The declared Content-Length
 * is checked first — a body above the largest thing this endpoint ever
 * accepts is 413 without reading it — and then the person's day: the sizes
 * of what they stored in the last twenty-four hours, plus this one, must fit
 * UPLOAD_BYTES_DAILY. A body with no declared length still goes through the
 * caps inside storeFile once read.
 */
/** Multipart framing around the file itself: boundaries, headers, a field or two. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

function declaredLength(request: Request): number | null {
  const raw = request.headers.get("content-length");
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const t = await getT();
    // A file is up to a hundred megabytes; sixty an hour per person is a busy
    // teacher on sports day, not a disk-filling loop.
    const gate = await consume(`uploads:${ctx.user.id}`, UPLOADS.limit, UPLOADS.windowMs);
    if (!gate.allowed) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds }),
        { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } },
      );
    }
    const declared = declaredLength(request);
    if (declared !== null && declared > MAX_VIDEO_BYTES + MULTIPART_OVERHEAD_BYTES) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues: { file: t("refusal.fileTooLargeLimit", { mb: Math.floor(MAX_VIDEO_BYTES / (1024 * 1024)) }) } }),
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    }
    const usedToday = (await db.uploadTicket.aggregate({ where: { userId: ctx.user.id, createdAt: { gte: new Date(Date.now() - UPLOAD_BYTES_DAILY.windowMs) } }, _sum: { size: true } }))._sum.size ?? 0;
    if (usedToday >= UPLOAD_BYTES_DAILY.limit || (declared !== null && usedToday + declared > UPLOAD_BYTES_DAILY.limit + MULTIPART_OVERHEAD_BYTES)) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("refusal.uploadDayFull", { mb: Math.floor(UPLOAD_BYTES_DAILY.limit / (1024 * 1024)) }), code: "RATE_LIMITED", retryAfterSeconds: 3600 }),
        { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
      );
    }
    const form = await request.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues: { file: t("refusal.fileEmpty") } }),
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    }
    try {
      const stored = await storeFile(file);
      // Read now, so a body that lied about its length still counts.
      if (usedToday + stored.size > UPLOAD_BYTES_DAILY.limit) {
        await deleteStoredFile(stored.fileId).catch(() => {});
        return NextResponse.json(
          apiErrorSchema.parse({ error: t("refusal.uploadDayFull", { mb: Math.floor(UPLOAD_BYTES_DAILY.limit / (1024 * 1024)) }), code: "RATE_LIMITED", retryAfterSeconds: 3600 }),
          { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
        );
      }
      // The ticket is what lets this person, and only this person, attach the
      // file to a post later; see the UploadTicket model for why.
      await db.uploadTicket.create({ data: { userId: ctx.user.id, fileId: stored.fileId, mime: stored.mime, size: stored.size } });
      return ok(uploadResultSchema.parse({ fileId: stored.fileId, mime: stored.mime, size: stored.size }), 201);
    } catch (error) {
      if (error instanceof UploadError) {
        return NextResponse.json(
          apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues: { file: t(error.key, error.vars) } }),
          { status: 422, headers: { "Cache-Control": "no-store" } },
        );
      }
      throw error;
    }
  } catch (error) {
    return apiFailure(error, "api/v1/uploads");
  }
}
