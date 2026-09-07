import { NextResponse } from "next/server";
import { apiErrorSchema, uploadResultSchema } from "@edulink/contracts";
import { storeFile, UploadError } from "@/lib/storage";
import { getT } from "@/lib/i18n/server";
import { apiFailure, ok } from "@/lib/api-v1";
import { db } from "@/lib/db";
import { consume, UPLOADS } from "@/lib/rate-limit";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/uploads — multipart form, one `file` field.
 *
 * The bytes go through `storeFile`, which sniffs the type, applies the caps
 * and strips EXIF before anything reaches disk. What comes back is the id the
 * caller then names in a post's media; the file is read back through
 * /api/files/{fileId}, which already accepts a bearer session.
 */
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
