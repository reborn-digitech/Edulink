import { getSession } from "@/lib/session";
import { authorizeFileRead } from "@/lib/files";
import { etagFor, readStoredFile } from "@/lib/storage";

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

  // A logo is public, so the session is only fetched when it might be needed —
  // authorizeFileRead checks the logo case before anything else.
  const session = await getSession();
  const access = await authorizeFileRead(fileId, session);

  if (!access.allowed) return new Response("Not found", { status: 404 });

  const stored = await readStoredFile(fileId);
  if (!stored) return new Response("Not found", { status: 404 });

  const etag = etagFor(stored.bytes);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cacheControl(access.public) },
    });
  }

  return new Response(new Uint8Array(stored.bytes), {
    headers: {
      "Content-Type": stored.mime,
      ETag: etag,
      "Cache-Control": cacheControl(access.public),
      // Never let a stored file be interpreted as something executable.
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
    },
  });
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
