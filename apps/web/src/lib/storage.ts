import "server-only";
import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { blobStore, resolveRange, type ByteRange, type RangeRead } from "./blob-store";
import { stripImageMetadata } from "./image-metadata";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * File storage: what may be stored and under what name. WHERE the bytes go —
 * this machine's disk, or a bucket when STORAGE_BUCKET is set — is
 * blob-store.ts's business, and nothing in here knows the difference.
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
 * The major brands of the ISO-box still-image formats (HEIF and its HEVC and AV1 forms, image sequences included):
 * ISO/IEC 23008-12 and the AVIF specification. Their ftyp box is the one an MP4 opens with.
 */
const STILL_IMAGE_BRANDS = new Set(["heic", "heix", "heim", "heis", "hevc", "hevx", "hevm", "hevs", "mif1", "mif2", "msf1", "miaf", "avif", "avis", "avio"]);

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
  // brand the box admits is the same container to the <video> element —
  // except a still picture in the same box (TA-340): a HEIC, HEIF or AVIF
  // photograph is no video, would keep its EXIF and place unstripped under
  // the video cap, and is refused as a type we do not take.
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
    if (STILL_IMAGE_BRANDS.has(brand)) return null;
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
  await blobStore("files").put(nameFor(fileId), clean, detected);

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
  const bytes = await blobStore("files").get(nameFor(safe));
  if (!bytes) return null;
  const ext = safe.split(".").pop() ?? "";
  const mime =
    Object.entries(ALLOWED).find(([, spec]) => spec.ext === ext)?.[0] ?? "application/octet-stream";
  return { bytes, mime };
}

export async function deleteStoredFile(fileId: string): Promise<void> {
  const safe = sanitizeFileId(fileId);
  if (!safe) return;
  await blobStore("files").delete(nameFor(safe));
  await deleteStoredVariants(safe);
}

/**
 * The resized copies of one stored picture (TA-139): a picture said to be deleted must not live on as its 320, 640
 * and 1280 pixel copies. Deleting a copy that was never made is the desired end state, as for the original.
 */
export async function deleteStoredVariants(fileId: string): Promise<void> {
  const safe = sanitizeFileId(fileId);
  // Only a JPEG, PNG or WebP is ever resized (readStoredVariant); anything else has no copies to remove.
  if (!safe || !/\.(jpg|png|webp)$/i.test(safe)) return;
  const variants = blobStore("variants");
  await Promise.all(VARIANT_WIDTHS.map((width) => variants.delete(variantNameFor(safe, width))));
}

/**
 * Only ever a UUID plus a known extension. Rejects traversal, absolute paths,
 * null bytes and anything else creative.
 */
function sanitizeFileId(fileId: string): string | null {
  return /^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/i.test(fileId) ? fileId : null;
}

/** Shards into 2-char prefixes so one flat directory (or listing) never holds 100k files. */
export function nameFor(fileId: string): string {
  return `${fileId.slice(0, 2)}/${fileId}`;
}

/** Stable ETag so the file route can answer 304 without re-reading. */
export function etagFor(bytes: Buffer): string {
  return `"${createHash("sha1").update(bytes).digest("hex")}"`;
}

/**
 * TA-341: the file route's ETag, from the name alone. A stored file is never written twice under one name (a fresh
 * UUID per upload, its sized copies cut from it), so the name says what the bytes are and a revalidation is answered
 * 304 before anything is read. null for a name that is no stored file's.
 */
export function storedFileEtag(fileId: string, width: VariantWidth | null): string | null {
  const safe = sanitizeFileId(fileId);
  if (!safe) return null;
  return `"${createHash("sha1").update(`${safe}|${width ?? ""}`).digest("hex")}"`;
}

/** A stored file's type by its extension, as readStoredFile reads it. */
function mimeOf(fileId: string): string {
  const ext = fileId.split(".").pop() ?? "";
  return Object.entries(ALLOWED).find(([, spec]) => spec.ext === ext)?.[0] ?? "application/octet-stream";
}

/** TA-341: the bytes of one stored file that a Range header names, read by offset (or asked of the bucket by range). */
export async function readStoredRange(fileId: string, range: ByteRange): Promise<(RangeRead & { mime: string }) | null> {
  const safe = sanitizeFileId(fileId);
  if (!safe) return null;
  const store = blobStore("files");
  const mime = mimeOf(safe);
  if (store.getRange) {
    const read = await store.getRange(nameFor(safe), range);
    return read ? { ...read, mime } : null;
  }
  const bytes = await store.get(nameFor(safe));
  if (!bytes) return null;
  const span = resolveRange(range, bytes.byteLength);
  if (!span) return { unsatisfiable: true, total: bytes.byteLength, mime };
  return { bytes: bytes.subarray(span.start, span.end + 1), start: span.start, end: span.end, total: bytes.byteLength, mime };
}

/* -------------------------------------------------------------------------- */
/* Sized variants, for the feed's tiles                                         */
/* -------------------------------------------------------------------------- */

/**
 * The widths a caller may ask for. A short allow-list rather than any number:
 * every distinct width is another file on disk, and the mosaic only has three
 * shapes — a tile, a single photo, and the viewer, which takes the original.
 */
export const VARIANT_WIDTHS = [320, 640, 1280] as const;
export type VariantWidth = (typeof VARIANT_WIDTHS)[number];

/*
 * Variants live BESIDE the store, not in it — the "variants" namespace of
 * blob-store.ts (STORAGE_DIR=/mnt/files gives /mnt/files-variants; a bucket
 * gets a variants/ prefix). `files:check` walks the originals and reports
 * anything it does not recognise, and a variant is not a record — it is a
 * cache, regenerated from the original whenever it is missing.
 */

/**
 * The original resized to `width` (never enlarged) as WebP, made once and
 * kept. Only images resize; a video, a PDF or a GIF answers with the original
 * so a caller can ask for a width without first asking what the file is.
 * sharp writes no metadata, so the upload's EXIF strip holds for the copy.
 */
export async function readStoredVariant(
  fileId: string,
  width: VariantWidth,
): Promise<{ bytes: Buffer; mime: string } | null> {
  const safe = sanitizeFileId(fileId);
  if (!safe) return null;
  const original = await readStoredFile(safe);
  if (!original) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(original.mime)) return original;

  const variants = blobStore("variants");
  const name = variantNameFor(safe, width);
  const cached = await variants.get(name);
  if (cached) return { bytes: cached, mime: "image/webp" };
  const bytes = await sharp(original.bytes, { failOn: "none" })
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
  await variants.put(name, bytes, "image/webp");
  return { bytes, mime: "image/webp" };
}

/** A copy's name in the variants namespace: the one readStoredVariant writes and deleteStoredVariants removes. */
function variantNameFor(safeFileId: string, width: VariantWidth): string {
  return `${safeFileId.slice(0, 2)}/${safeFileId}.w${width}.webp`;
}
