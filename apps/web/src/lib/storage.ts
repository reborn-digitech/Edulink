import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { stripImageMetadata } from "./image-metadata";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * Local file storage.
 *
 * Files are written OUTSIDE ./public on purpose. Anything under public/ is
 * served by the web server with no auth check at all, so a school logo would be
 * fine but a student's uploaded work would be world-readable to anyone who
 * guessed the URL. Everything is read back through an authorized route handler
 * instead. (§6 file uploads)
 *
 * Stored names are random UUIDs — never the user's filename — so a upload
 * called "../../.env" or "index.html" cannot escape the directory or be served
 * as something executable.
 */

const ROOT = resolve(process.cwd(), process.env.STORAGE_DIR ?? "./storage");

/** Whitelist. Anything not on this list is refused, rather than blacklisted. */
const ALLOWED: Record<string, { ext: string; kind: "image" | "file" | "video" }> = {
  "image/png": { ext: "png", kind: "image" },
  "image/jpeg": { ext: "jpg", kind: "image" },
  "image/webp": { ext: "webp", kind: "image" },
  "image/gif": { ext: "gif", kind: "image" },
  "application/pdf": { ext: "pdf", kind: "file" },
  "video/mp4": { ext: "mp4", kind: "video" },
  "video/webm": { ext: "webm", kind: "video" },
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Videos get their own ceiling because 5 MB is three seconds of phone footage.
 * The cap is enforced twice: `storeFile` admits bytes up to the LARGEST cap so
 * the browser-reported type cannot pick the limit, and then re-checks against
 * the cap of the kind the magic bytes actually proved — a 90 MB upload wearing
 * an image name is refused after detection, not stored under the video budget.
 */
export const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

export type StoredFile = {
  fileId: string;
  name: string;
  mime: string;
  size: number;
  kind: "image" | "file" | "video";
};

/**
 * ⚠ THE MESSAGE IS A KEY — the AccessError rule, because these ARE shown.
 * The audit skips thrown Error messages on the assumption nobody reads them;
 * these four are the exception: every catch boundary hands them straight to
 * the person uploading, so they carry a TranslationKey the boundary resolves.
 */
export class UploadError extends Error {
  constructor(
    readonly key: TranslationKey,
    readonly vars?: Record<string, string | number>,
  ) {
    super(key);
    this.name = "UploadError";
  }
}

/**
 * Magic-byte check. A browser-supplied Content-Type is attacker-controlled, so
 * an "image/png" that actually starts with `<?php` or `<svg onload=` must not
 * be trusted. SVG is deliberately absent from the whitelist — it is an
 * executable document, not an image.
 */
function sniff(bytes: Uint8Array): string | null {
  const startsWith = (...sig: number[]) => sig.every((byte, i) => bytes[i] === byte);
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x47, 0x49, 0x46, 0x38)) return "image/gif";
  if (startsWith(0x25, 0x50, 0x44, 0x46)) return "application/pdf";
  // WebP is "RIFF" .... "WEBP"
  if (startsWith(0x52, 0x49, 0x46, 0x46) && bytes[8] === 0x57 && bytes[9] === 0x45) {
    return "image/webp";
  }
  // MP4-family: a size-prefixed "ftyp" box at offset 4. The brand after it
  // varies (isom, mp42, avc1, M4V…) and does not need distinguishing — every
  // brand the box admits is the same container to the <video> element.
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    return "video/mp4";
  }
  // WebM/Matroska: the EBML header. Served as webm; a raw .mkv that slips the
  // same signature still plays or fails harmlessly in the same element.
  if (startsWith(0x1a, 0x45, 0xdf, 0xa3)) return "video/webm";
  return null;
}

export async function storeFile(file: File, opts: { maxBytes?: number } = {}): Promise<StoredFile> {
  // An explicit caller cap binds everything. Otherwise files are ADMITTED up to
  // the video ceiling and re-measured against their true kind's cap after the
  // magic bytes have spoken — the client's claimed type never picks the limit.
  const defaultCap = opts.maxBytes ?? MAX_UPLOAD_BYTES;
  const admitCap = opts.maxBytes ?? MAX_VIDEO_BYTES;

  if (file.size === 0) throw new UploadError("refusal.fileEmpty");
  if (file.size > admitCap) {
    throw new UploadError("refusal.fileTooLargeLimit", { mb: Math.round(admitCap / 1024 / 1024) });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // Re-check after reading: `file.size` is also client-reported.
  if (buffer.byteLength > admitCap) throw new UploadError("refusal.fileTooLarge");

  const detected = sniff(buffer);
  if (!detected || !ALLOWED[detected]) {
    throw new UploadError("refusal.fileTypeUnsupported");
  }

  const spec = ALLOWED[detected]!;

  // The cap of the kind the bytes actually are.
  const trueCap = spec.kind === "video" ? admitCap : defaultCap;
  if (buffer.byteLength > trueCap) {
    throw new UploadError("refusal.fileTooLargeLimit", { mb: Math.round(trueCap / 1024 / 1024) });
  }

  // Strip EXIF and friends BEFORE the bytes ever reach disk. A phone photo
  // carries GPS coordinates, and a child's picture taken at home would
  // otherwise store where they live. Writing it first and cleaning it later
  // still leaves the original in any backup taken in between.
  const clean = stripImageMetadata(buffer, detected);

  const fileId = `${randomUUID()}.${spec.ext}`;
  const target = pathFor(fileId);

  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, clean);

  return {
    fileId,
    // Keep the original name for display only; it is never used as a path.
    name: file.name.slice(0, 200).replace(/[\r\n]/g, ""),
    mime: detected,
    // The stored length, not the uploaded one — they differ once metadata goes.
    size: clean.byteLength,
    kind: spec.kind,
  };
}

export async function readStoredFile(fileId: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const safe = sanitizeFileId(fileId);
  if (!safe) return null;
  try {
    const bytes = await readFile(pathFor(safe));
    const ext = safe.split(".").pop() ?? "";
    const mime =
      Object.entries(ALLOWED).find(([, spec]) => spec.ext === ext)?.[0] ?? "application/octet-stream";
    return { bytes, mime };
  } catch {
    return null;
  }
}

export async function deleteStoredFile(fileId: string): Promise<void> {
  const safe = sanitizeFileId(fileId);
  if (!safe) return;
  await unlink(pathFor(safe)).catch(() => {
    // Already gone is the desired end state.
  });
}

/**
 * Only ever a UUID plus a known extension. Rejects traversal, absolute paths,
 * null bytes and anything else creative.
 */
function sanitizeFileId(fileId: string): string | null {
  return /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(fileId) ? fileId : null;
}

/** Shards into 2-char prefix directories so one flat dir never holds 100k files. */
function pathFor(fileId: string): string {
  return join(ROOT, fileId.slice(0, 2), fileId);
}

/** Stable ETag so the file route can answer 304 without re-reading. */
export function etagFor(bytes: Buffer): string {
  return `"${createHash("sha1").update(bytes).digest("hex")}"`;
}
