import { getSession } from "@/lib/session";
import { authorizeFileRead, type FileAccess } from "@/lib/files";
import { verifyFileLink } from "@/lib/file-links";
import { FILE_SLICE_BYTES, hasSizedCopies, readStoredFile, readStoredVariant, storedFileEtag, streamStoredRange, VARIANT_WIDTHS, type VariantWidth } from "@/lib/storage";
import { resolveRange, type ByteRange } from "@/lib/blob-store";
// meta-posting (16 Oct 2026)
import { asJpeg, socialPictureOpen } from "@/lib/social";
// end meta-posting
// website-two (16 Oct 2026)
import { siteReviewFileOpen } from "@/lib/site-share";
// end website-two

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
  // meta-posting (16 Oct 2026): ?social= is the link a queued copy of a school post hands Instagram, which fetches the
  // picture itself with no session (src/lib/social.ts socialPictureOpen): open while the copy is QUEUED and for a
  // day after it is SENT, and served as a JPEG, the only kind Instagram takes.
  const social = !linked && url.searchParams.has("social") ? await socialPictureOpen(fileId, url.searchParams.get("social")) : false;
  if (social) {
    const picture = await readStoredFile(fileId);
    if (!picture || !picture.mime.startsWith("image/")) return new Response("Not found", { status: 404 });
    const jpeg = await asJpeg(picture.bytes, picture.mime);
    return new Response(new Uint8Array(jpeg.bytes), {
      headers: { "Content-Type": jpeg.mime, "Cache-Control": cacheControl(false, "social"), "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline", "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox", "X-Robots-Tag": "noindex" },
    });
  }
  // end meta-posting

  // A logo is public, so the session is only fetched when it might be needed —
  // authorizeFileRead checks the logo case before anything else.
  // website-two (16 Oct 2026): ?review= is a review link's token (src/lib/site-share.ts): a picture or PDF the school's
  // website draft names opens, privately and uncached, while the link is open, to a reader with no account.
  const reviewing = !linked && url.searchParams.has("review") && /^[A-Za-z0-9._-]{1,200}$/.test(fileId) ? await siteReviewFileOpen(fileId, url.searchParams.get("review")) : false;
  // end website-two
  const access: FileAccess = linked
    ? { allowed: true, kind: "submission", public: false }
    : reviewing
      ? { allowed: true, kind: "site", public: false }
      : await authorizeFileRead(fileId, await getSession());

  if (!access.allowed) return new Response("Not found", { status: 404 });

  // ?w=640 asks for a sized copy — the feed's tiles, which used to download
  // every phone photo at full size. Off the allow-list means the original.
  // TA-137: only a picture has sized copies. A video, a PDF or a GIF asked with a width is the original, and is
  // served as one below, in slices; it used to be read whole to find that out.
  const wanted = Number(url.searchParams.get("w"));
  const width = (VARIANT_WIDTHS as readonly number[]).includes(wanted) && hasSizedCopies(fileId) ? (wanted as VariantWidth) : null;

  // TA-341: the ETag is the stored name's (a name is never written twice), so a revalidation is answered before any
  // byte is read, and a range below reads only the bytes it names.
  const etag = storedFileEtag(fileId, width);
  if (!etag) return new Response("Not found", { status: 404 });
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cacheControl(access.public, access.kind) },
    });
  }

  const headersFor = (mime: string) => ({
    "Content-Type": mime,
    ETag: etag,
    "Cache-Control": cacheControl(access.public, access.kind),
    // Never let a stored file be interpreted as something executable.
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": "inline",
    "Content-Security-Policy": "default-src 'none'; img-src 'self'; media-src 'self'; sandbox",
    // Video elements probe with Range requests; advertising support is what
    // makes seeking work at all.
    "Accept-Ranges": "bytes",
  });

  /**
   * Range requests, for <video>. A player that cannot seek re-downloads from
   * zero on every scrub, and Safari refuses to play a source whose server
   * ignores Range entirely. Single-range only — multipart ranges are a
   * complexity nobody's <video> sends — and a malformed or unsatisfiable range
   * gets 416 with the total size, per the RFC, rather than a silent full body.
   * Authorisation already happened above; a range of a file is the same
   * disclosure as the file. TA-341: only the range is read (by offset from the
   * disk, by Range from a bucket), never the whole object for every request.
   *
   * IN SLICES (TA-137 and TA-244, decided 14 November 2026). The upload door
   * takes videos of up to 100 MB, and a browser's player asks "bytes=0-": to
   * the end. That was read whole into memory and copied, for every play, since
   * a file is served no-store. A range is now answered in slices of
   * FILE_SLICE_BYTES (streamStoredRange): each is read from the store only when
   * the player has taken the one before, and a player that stops stops the
   * reading. The answer is still the whole range asked, never a shorter one: a
   * player may take a short 206 for the end of the file. A request with no range
   * is the whole file, streamed the same way and never read whole.
   */
  const range = request.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  const asked: ByteRange = match ? { first: match[1] ? Number(match[1]) : null, last: match[2] ? Number(match[2]) : null } : null;
  const partial = (bytes: Buffer, mime: string, start: number, end: number, total: number) =>
    new Response(new Uint8Array(bytes), {
      status: 206,
      headers: {
        ...headersFor(mime),
        "Content-Range": `bytes ${start}-${end}/${total}`,
        "Content-Length": String(bytes.byteLength),
      },
    });
  const unsatisfiable = (total: number) =>
    new Response(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${total}`, ETag: etag },
    });

  if (range && !width) {
    const read = await streamStoredRange(fileId, asked, FILE_SLICE_BYTES);
    if (!read) return new Response("Not found", { status: 404 });
    if ("unsatisfiable" in read) return unsatisfiable(read.total);
    return new Response(read.stream, {
      status: 206,
      headers: {
        ...headersFor(read.mime),
        "Content-Range": `bytes ${read.start}-${read.end}/${read.total}`,
        "Content-Length": String(read.end - read.start + 1),
      },
    });
  }

  if (!width) {
    // The original, with no range asked: streamed slice by slice, so a video is never held whole (TA-137).
    const whole = await streamStoredRange(fileId, { first: 0, last: null }, FILE_SLICE_BYTES);
    if (!whole) return new Response("Not found", { status: 404 });
    // A file of no bytes names no range: an empty body.
    if ("unsatisfiable" in whole) return new Response(null, { headers: { ...headersFor(whole.mime), "Content-Length": "0" } });
    return new Response(whole.stream, { headers: { ...headersFor(whole.mime), "Content-Length": String(whole.total) } });
  }

  // A sized copy of a picture: a picture is at most MAX_UPLOAD_BYTES and its copy smaller.
  const stored = await readStoredVariant(fileId, width);
  if (!stored) return new Response("Not found", { status: 404 });
  if (range) {
    // A sized copy is cut from its picture on the first ask, so its range comes from the copy.
    const total = stored.bytes.byteLength;
    const span = resolveRange(asked, total);
    if (!span) return unsatisfiable(total);
    return partial(stored.bytes.subarray(span.start, span.end + 1), stored.mime, span.start, span.end, total);
  }

  return new Response(new Uint8Array(stored.bytes), { headers: headersFor(stored.mime) });
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
function cacheControl(isPublic: boolean, kind?: string): string {
  // figures (10 Oct 2026): a quiz figure is the same for every reader and a changed figure is a new
  // fileId, so the phone and the browser may keep it for a day instead of fetching it per question.
  if (kind === "quiz") return "private, max-age=86400, immutable";
  return isPublic
    ? "public, max-age=31536000, immutable"
    : "private, no-store, max-age=0, must-revalidate";
}
