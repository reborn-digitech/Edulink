import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Five-minute links to one stored file, for opening it OUTSIDE the app.
 *
 * The phone reads a picture with its bearer token in a header (expo-image can
 * send one). A PDF or a Word file has to be opened by the phone's browser,
 * which has no token and no cookie — so /api/files/{id} refused it, and a
 * teacher could see that a pupil had handed in a PDF but never read it. The
 * app now asks POST /api/v1/files/{id}/link, which runs the SAME read rule as
 * the file route (authorizeFileRead) for the signed-in person, and gets back a
 * URL carrying a signature over the file id and an expiry. The file route
 * serves that one file for those five minutes to whoever holds the URL — the
 * standard presigned-link bargain: authorisation happens when the link is
 * made, and the link is short-lived, bound to one file, and never a session.
 */
export const FILE_LINK_TTL_SECONDS = 300;

let devKey: Buffer | null = null;

/**
 * The signing key: FILE_LINK_SECRET, 32+ characters. Until 2026-10-01 a
 * deployment without one derived a key from the push private key; the
 * review that day called it one secret guarding two things, so a deployed
 * server now signs no links without a key of its own (env.ts says so at
 * boot). In development and tests: a random key for this process.
 */
export function fileLinkKey(): Buffer | null {
  const own = process.env.FILE_LINK_SECRET?.trim();
  if (own && own.length >= 32) return Buffer.from(own, "utf8");
  // No longer derived from the push key (the review of 2026-10-01): one secret
  // guarded two unrelated things. Production without its own key signs no links.
  if (process.env.NODE_ENV === "production") return null;
  devKey ??= randomBytes(32);
  return devKey;
}

function signature(key: Buffer, fileId: string, exp: number): string {
  return createHmac("sha256", key).update(`${fileId}.${exp}`).digest("base64url");
}

/** A token for one file, valid for `ttlSeconds`; null when links are not configured. */
export function signFileLink(fileId: string, now = Date.now(), ttlSeconds = FILE_LINK_TTL_SECONDS): { token: string; expiresAt: Date } | null {
  const key = fileLinkKey();
  if (!key) return null;
  const exp = Math.floor(now / 1000) + ttlSeconds;
  return { token: `${exp}.${signature(key, fileId, exp)}`, expiresAt: new Date(exp * 1000) };
}

/** True only for an unexpired token signed for exactly this file. Constant-time on the signature. */
export function verifyFileLink(fileId: string, token: string | null | undefined, now = Date.now()): boolean {
  if (!token) return false;
  const key = fileLinkKey();
  if (!key) return false;
  const match = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match) return false;
  const exp = Number(match[1]);
  if (exp * 1000 <= now) return false;
  // A token claiming to live longer than any link can was not made here.
  if (exp * 1000 > now + (FILE_LINK_TTL_SECONDS + 60) * 1000) return false;
  const want = Buffer.from(signature(key, fileId, exp));
  const got = Buffer.from(match[2]!);
  return want.length === got.length && timingSafeEqual(want, got);
}
