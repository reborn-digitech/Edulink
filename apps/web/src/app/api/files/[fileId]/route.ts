import { getSession } from "@/lib/session";
import { authorizeFileRead, type FileAccess } from "@/lib/files";
import { verifyFileLink } from "@/lib/file-links";
import { etagFor, readStoredFile, readStoredVariant, VARIANT_WIDTHS, type VariantWidth } from "@/lib/storage";

/**
 * Serves a stored file.
 *
 * Uploads deliberately live OUTSIDE ./public, because anything under public/ is
 * served with no authorisation check at all — fine for a school logo, a
 * disclosure for a child's uploaded work. So every read comes through here and
 * through `authorizeFileRead`, which reverse-looks-up the record referencing the
 * file and applies that record's own access rules. Default is deny.
 *
 * Every refusal is 404, never 403: a distinguishable error confirms the file
 * exists, which is itself a disclosure.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  const url = new URL(request.url);

  // ?t= is a five-minute link made by POST /api/v1/files/{id}/link, which ran
  // the read rule below for the person who asked (see lib/file-links.ts). It
  // opens this one file, privately cached, and nothing else.
  const linked = verifyFileLink(fileId, url.searchParams.get("t"));

  // A logo is public, so the session is only fetched when it might be needed —
  // authorizeFileRead checks the logo case before anything else.
  const access: FileAccess = linked
    ? { allowed: true, kind: "submission", public: false }
    : await authorizeFileRead(fileId, await getSession());

  if (!access.allowed) return new Response("Not found", { status: 404 });

  // ?w=640 asks for a sized copy — the feed's tiles, which used to download
  // every phone photo at full size. Off the allow-list means the original.
  const wanted = Number(url.searchParams.get("w"));
  const width = (VARIANT_WIDTHS as readonly number[]).includes(wanted) ? (wanted as VariantWidth) : null;
  const stored = width ? await readStoredVariant(fileId, width) : await readStoredFile(fileId);
  if (!stored) return new Response("Not found", { status: 404 });

  const etag = etagFor(stored.bytes);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cacheControl(access.public) },
    });
  }

  const baseHeaders = {
    "Content-Type": stored.mime,
    ETag: etag,
    "Cache-Control": cacheControl(access.public),
    // Never let a stored file be interpreted as something executable.
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; sandbox",
    // Video elements probe with Range requests; advertising support is what
    // makes seeking work at all.
    "Accept-Ranges": "bytes",
  };

  /**
   * Range requests, for <video>. A player that cannot seek re-downloads from
   * zero on every scrub, and Safari refuses to play a source whose server
   * ignores Range entirely. Single-range only — multipart ranges are a
   * complexity nobody's <video> sends — and a malformed or unsatisfiable range
   * gets 416 with the total size, per the RFC, rather than a silent full body.
   * Authorisation already happened above; a range of a file is the same
   * disclosure as the file.
   */
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    const total = stored.bytes.byteLength;
    const start = match?.[1] ? Number(match[1]) : match?.[2] ? total - Number(match[2]) : NaN;
    const end = match?.[1] && match?.[2] ? Math.min(Number(match[2]), total - 1) : total - 1;
    if (!match || Number.isNaN(start) || start < 0 || start > end || start >= total) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${total}`, ETag: etag },
      });
    }
    return new Response(new Uint8Array(stored.bytes.subarray(start, end + 1)), {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(end - start + 1),
      },
    });
  }

  return new Response(new Uint8Array(stored.bytes), { headers: baseHeaders });
}

/**
 * A school logo is immutable per fileId and public, so it caches hard.
 *
 * An authorised file gets `no-store`, which is stronger than it first looks
 * necessary — and it is here because of a real leak found by testing it:
 *
 * with `private, max-age=3600`, one pupil opened their own submitted homework,
 * then a CLASSMATE signed in on the same browser and fetched the same URL. The
 * server correctly refuses them — `authorizeFileRead` returns not-found — but
 * the browser never asked, because `private` means "the browser may keep this"
 * and the copy was still fresh. On a family tablet or a classroom iPad, the next
 * child to sign in within the hour reads the previous child's work.
 *
 * Re-authorising on every read costs a request. That is the correct trade.
 */
function cacheControl(isPublic: boolean): string {
  return isPublic
    ? "public, max-age=31536000, immutable"
    : "private, no-store, max-age=0, must-revalidate";
}
