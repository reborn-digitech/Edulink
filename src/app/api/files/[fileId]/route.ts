import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { etagFor, readStoredFile } from "@/lib/storage";

/**
 * Serves a stored file.
 *
 * Uploads deliberately live OUTSIDE ./public, because anything under public/ is
 * served with no authorisation check at all — fine for a school logo, a
 * disclosure for a child's uploaded work. So every read comes through here.
 *
 * Authorisation is per file *kind*, decided by what the file is attached to:
 *
 *   * a school logo is effectively public — it appears on the sign-in page and
 *     on invitation emails, so it is served to anyone;
 *   * anything else requires a session, and (once attachments exist) the same
 *     tenant checks the rest of the app uses.
 *
 * Unknown files are 404, never 403: a distinguishable error confirms the file
 * exists, which is itself a disclosure.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;

  // Is this file a school logo? That is the only kind currently public.
  const logoSchool = await db.school.findFirst({
    where: { logoPath: fileId },
    select: { id: true },
  });

  if (!logoSchool) {
    // Not a logo, so it must be an authorised read. There are no other file
    // kinds wired up yet, so anything reaching here is either a stale
    // reference or someone guessing.
    const session = await getSession();
    if (!session) return new Response("Not found", { status: 404 });
    return new Response("Not found", { status: 404 });
  }

  const stored = await readStoredFile(fileId);
  if (!stored) return new Response("Not found", { status: 404 });

  const etag = etagFor(stored.bytes);
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  return new Response(new Uint8Array(stored.bytes), {
    headers: {
      "Content-Type": stored.mime,
      ETag: etag,
      // Content is immutable per fileId (a new upload gets a new UUID), so this
      // can be cached hard. A logo change produces a different URL.
      "Cache-Control": "public, max-age=31536000, immutable",
      // Never let a stored file be interpreted as something executable.
      "X-Content-Type-Options": "nosniff",
      "Content-Disposition": "inline",
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; sandbox",
    },
  });
}
