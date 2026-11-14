import { NextResponse } from "next/server";
import { apiErrorSchema, uploadResultSchema } from "@edulink/contracts";
import { MAX_VIDEO_BYTES, deleteStoredFile, storeFile, UploadError } from "@/lib/storage";
import { getT } from "@/lib/i18n/server";
import { apiFailure, ok } from "@/lib/api-v1";
import { db } from "@/lib/db";
import { consume, UPLOADS, UPLOAD_BYTES_DAILY } from "@/lib/rate-limit";
import { requireApiSession } from "@/lib/api-reads/shared";
import { allowedOrigins, crossSiteCookieWrite, hasSessionCookie, preflightHeaders } from "@/lib/api-cors";
import { asUploadDoor } from "@/lib/door-route";
import { UPLOAD_DOOR_PATH } from "@/lib/route-header";
import { appHosts, appHostsKnown, isDevelopment, processSiteEnv } from "@/lib/site-env";
import { siteRewritePath } from "@/lib/site-host-match";
import { siteNotFound } from "@/lib/site-host-routes";
import { takeUploadSlot, UPLOAD_SLOT_RETRY_SECONDS } from "@/lib/upload-slots";

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
 * UPLOAD_BYTES_DAILY. A body with no declared length is counted as it arrives
 * (below) and still goes through the caps inside storeFile once read.
 *
 * OUTSIDE THE MIDDLEWARE (TA-137 and TA-244, decided 14 November 2026). The
 * framework copies the body of every request the middleware sees, 10 MB at
 * most, and hands the route the cut copy: a phone's video of 10 to 100 MB
 * arrived cut short, the multipart parse failed, and the phone was told the
 * file was empty. This one path is left out of the middleware's matcher (every
 * other path keeps the copy, and the global limit is not raised), so the door
 * does the middleware's jobs itself, in the middleware's order:
 *
 *   1. A school website's host has no API: the site's own 404, as the rewrite
 *      would have answered.
 *   2. The browser's pre-check (OPTIONS) and the allow-origin header, for the
 *      origins named in API_CORS_ORIGINS and nobody else (lib/api-cors.ts).
 *   3. The cross-site lock: a write carrying the session cookie from another
 *      site is 403 before the session is read.
 *   4. Its own route stamp: everything below runs inside `asUploadDoor`, so the
 *      session's gate judges this request as POST /api/v1/uploads and never by
 *      the x-edulink-route header, which here is whatever the client sent
 *      (lib/door-route.ts).
 *   5. A cap on the body AS IT ARRIVES. The middleware's copy was, by accident,
 *      the only limit on a body that states no size; now the bytes are counted
 *      on their way in and the read is abandoned, 413, past the largest file
 *      the door takes.
 *
 * AND ONE GUARD OF ITS OWN: uploads in flight (lib/upload-slots.ts). A person
 * has at most two arriving at once and the process holds a ceiling of declared
 * bytes; past either the answer is 429 "try again shortly" before a byte of
 * the body is read. The place is taken last, after every cheaper refusal, and
 * given back whatever happens.
 */
/** Multipart framing around the file itself: boundaries, headers, a field or two. */
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
/** The largest body the door reads: the largest file it stores, and its framing. */
const MAX_BODY_BYTES = MAX_VIDEO_BYTES + MULTIPART_OVERHEAD_BYTES;

function declaredLength(request: Request): number | null {
  const raw = request.headers.get("content-length");
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Whether this request came in on a school website's host, where the app's API is not (the middleware's own reading). */
function onSiteHost(request: Request): boolean {
  const env = processSiteEnv();
  return siteRewritePath(request.headers.get("host"), UPLOAD_DOOR_PATH, { appHosts: appHosts(env), appHostsKnown: appHostsKnown(env), dev: isDevelopment(env) }) !== null;
}

/**
 * The multipart form, read with the bytes counted as they arrive: past `maxBytes` the read is abandoned (the source
 * is cancelled, so nothing more is taken off the connection) and `tooLarge` says so. A body that does not parse is
 * no form, as before.
 */
async function readForm(request: Request, maxBytes: number): Promise<{ form: FormData | null; tooLarge: boolean }> {
  if (!request.body) return { form: await request.formData().catch(() => null), tooLarge: false };
  let seen = 0;
  let tooLarge = false;
  const counted = request.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        seen += chunk.byteLength;
        if (seen > maxBytes) {
          tooLarge = true;
          controller.error(new Error("upload body over the door's cap"));
          return;
        }
        controller.enqueue(chunk);
      },
    }),
  );
  const form = await new Response(counted, { headers: { "content-type": request.headers.get("content-type") ?? "" } }).formData().catch(() => null);
  return { form, tooLarge };
}

/** The browser's pre-check, which the middleware answered while this door was inside its matcher. */
export async function OPTIONS(request: Request) {
  if (onSiteHost(request)) return siteNotFound(request);
  const origin = request.headers.get("origin");
  const allowed = origin !== null && allowedOrigins().has(origin);
  if (!allowed) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: preflightHeaders(origin) });
}

export async function POST(request: Request) {
  if (onSiteHost(request)) return siteNotFound(request);
  const origin = request.headers.get("origin");
  const allowed = origin !== null && allowedOrigins().has(origin);
  const crossSite = crossSiteCookieWrite({
    method: request.method,
    origin,
    hasSessionCookie: hasSessionCookie(request.headers.get("cookie")),
    selfHost: request.headers.get("x-forwarded-host") ?? request.headers.get("host"),
    allowed,
  });
  if (crossSite) return new NextResponse(null, { status: 403 });
  // Every answer below, a refusal included, names a named origin back: without it the browser hides the sentence.
  const response = await asUploadDoor(() => upload(request));
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

async function upload(request: Request): Promise<NextResponse> {
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
    const tooLarge = () =>
      NextResponse.json(
        apiErrorSchema.parse({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues: { file: t("refusal.fileTooLargeLimit", { mb: Math.floor(MAX_VIDEO_BYTES / (1024 * 1024)) }) } }),
        { status: 413, headers: { "Cache-Control": "no-store" } },
      );
    const declared = declaredLength(request);
    if (declared !== null && declared > MAX_BODY_BYTES) return tooLarge();
    const usedToday = (await db.uploadTicket.aggregate({ where: { userId: ctx.user.id, createdAt: { gte: new Date(Date.now() - UPLOAD_BYTES_DAILY.windowMs) } }, _sum: { size: true } }))._sum.size ?? 0;
    if (usedToday >= UPLOAD_BYTES_DAILY.limit || (declared !== null && usedToday + declared > UPLOAD_BYTES_DAILY.limit + MULTIPART_OVERHEAD_BYTES)) {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t("refusal.uploadDayFull", { mb: Math.floor(UPLOAD_BYTES_DAILY.limit / (1024 * 1024)) }), code: "RATE_LIMITED", retryAfterSeconds: 3600 }),
        { status: 429, headers: { "Retry-After": "3600", "Cache-Control": "no-store" } },
      );
    }
    // IN FLIGHT (TA-137): a place for this body before a byte of it is read; one that states no size is counted as
    // the largest the door takes. Refused, the person is told to try again shortly, in a sentence that says which.
    const slot = takeUploadSlot(ctx.user.id, declared ?? MAX_BODY_BYTES);
    if (slot === "person" || slot === "process") {
      return NextResponse.json(
        apiErrorSchema.parse({ error: t(slot === "person" ? "refusal.uploadStillSending" : "refusal.uploadsBusy"), code: "RATE_LIMITED", retryAfterSeconds: UPLOAD_SLOT_RETRY_SECONDS }),
        { status: 429, headers: { "Retry-After": String(UPLOAD_SLOT_RETRY_SECONDS), "Cache-Control": "no-store" } },
      );
    }
    try {
      const { form, tooLarge: overCap } = await readForm(request, MAX_BODY_BYTES);
      if (overCap) return tooLarge();
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
    } finally {
      slot.release();
    }
  } catch (error) {
    return apiFailure(error, "api/v1/uploads");
  }
}
