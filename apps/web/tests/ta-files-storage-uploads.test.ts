/**
 * What storage.ts keeps of an upload: three findings of the testing analysis of 13 November 2026.
 *
 *   TA-139  deleteStoredFile removed the original and left its 320, 640 and 1280 pixel copies in the
 *           variants namespace for good (src/lib/storage.ts).
 *   TA-136  The EXIF strip dropped APP1 whole, the orientation with it, without turning the pixels,
 *           so a portrait phone photograph was stored and served on its side
 *           (src/lib/image-metadata.ts).
 *   TA-340  Any ftyp box was taken for an MP4 video, so a HEIC, HEIF or AVIF still was stored as
 *           <uuid>.mp4 under the video cap with its EXIF, place and all (src/lib/storage.ts).
 *
 * No database. The store is a scratch directory under the system's temp folder, set before
 * storage.ts is imported (blob-store.ts reads the environment per call), removed afterwards.
 */
import { afterAll, describe, expect, it, vi } from "vitest";

const ENV = await vi.hoisted(async () => {
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  for (const key of ["STORAGE_BUCKET", "STORAGE_S3_ENDPOINT", "STORAGE_S3_REGION", "STORAGE_S3_ACCESS_KEY_ID", "STORAGE_S3_SECRET_ACCESS_KEY"]) delete process.env[key];
  const store = join(tmpdir(), `zz-tafs-store-${Date.now()}`);
  process.env.STORAGE_DIR = store;
  return { store };
});

import { rm } from "node:fs/promises";
import sharp from "sharp";
import { blobStore } from "@/lib/blob-store";
import { deleteStoredFile, readStoredFile, readStoredVariant, storeFile, UploadError, VARIANT_WIDTHS } from "@/lib/storage";

afterAll(async () => {
  await rm(ENV.store, { recursive: true, force: true });
  await rm(`${ENV.store}-variants`, { recursive: true, force: true });
});

const asFile = (bytes: Buffer, name: string, type: string) => new File([new Uint8Array(bytes)], name, { type });
const variantName = (fileId: string, width: number) => `${fileId.slice(0, 2)}/${fileId}.w${width}.webp`;

describe("TA-139: a picture's resized copies go with it", () => {
  it("TA-139: deleteStoredFile removes the 320, 640 and 1280 copies as well as the original", async () => {
    const png = await sharp({ create: { width: 1400, height: 700, channels: 3, background: { r: 200, g: 40, b: 40 } } }).png().toBuffer();
    const stored = await storeFile(asFile(png, "sports-day.png", "image/png"));
    for (const width of VARIANT_WIDTHS) expect(await readStoredVariant(stored.fileId, width), String(width)).not.toBeNull();
    for (const width of VARIANT_WIDTHS) expect(await blobStore("variants").get(variantName(stored.fileId, width)), String(width)).not.toBeNull();

    await deleteStoredFile(stored.fileId);

    expect(await readStoredFile(stored.fileId)).toBeNull();
    for (const width of VARIANT_WIDTHS) expect(await blobStore("variants").get(variantName(stored.fileId, width)), String(width)).toBeNull();
  });

  it("TA-139: deleting a picture nobody has viewed (no copies yet) is still a quiet success", async () => {
    const png = await sharp({ create: { width: 4, height: 4, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png().toBuffer();
    const stored = await storeFile(asFile(png, "unseen.png", "image/png"));
    await expect(deleteStoredFile(stored.fileId)).resolves.toBeUndefined();
    expect(await readStoredFile(stored.fileId)).toBeNull();
  });
});

/* A minimal EXIF APP1: a little-endian TIFF whose IFD0 holds a description (the marker standing for the GPS block a
 * phone writes) and the orientation. */
const PLACE = "GPS-18.5204N-73.8567E";
function exifApp1(orientation: number): Buffer {
  const text = Buffer.from(`${PLACE}\0`, "latin1");
  const ifd = 8;
  const entries = 2;
  const textAt = ifd + 2 + entries * 12 + 4;
  const tiff = Buffer.alloc(textAt + text.length);
  tiff.write("II", 0, "latin1");
  tiff.writeUInt16LE(42, 2);
  tiff.writeUInt32LE(ifd, 4);
  tiff.writeUInt16LE(entries, ifd);
  // ImageDescription (0x010e), ASCII, its text out of line.
  tiff.writeUInt16LE(0x010e, ifd + 2);
  tiff.writeUInt16LE(2, ifd + 4);
  tiff.writeUInt32LE(text.length, ifd + 6);
  tiff.writeUInt32LE(textAt, ifd + 10);
  // Orientation (0x0112), SHORT, one value, in line.
  tiff.writeUInt16LE(0x0112, ifd + 14);
  tiff.writeUInt16LE(3, ifd + 16);
  tiff.writeUInt32LE(1, ifd + 18);
  tiff.writeUInt16LE(orientation, ifd + 22);
  tiff.writeUInt32LE(0, ifd + 2 + entries * 12);
  text.copy(tiff, textAt);
  const payload = Buffer.concat([Buffer.from("Exif\0\0", "latin1"), tiff]);
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, 0xe1]), length, payload]);
}

/** A 2x1 landscape JPEG, as a phone camera stores a portrait picture, with the EXIF placed right after SOI. */
async function phoneJpeg(orientation: number): Promise<Buffer> {
  const pixels = await sharp({ create: { width: 2, height: 1, channels: 3, background: { r: 10, g: 120, b: 200 } } }).jpeg().toBuffer();
  return Buffer.concat([pixels.subarray(0, 2), exifApp1(orientation), pixels.subarray(2)]);
}

describe("TA-136: a portrait phone photograph stays upright", () => {
  it("TA-136: the arrangement: the upload carries the place and orientation 6", async () => {
    const upload = await phoneJpeg(6);
    expect(upload.toString("latin1")).toContain(PLACE);
    expect((await sharp(upload).metadata()).orientation).toBe(6);
  });

  it("TA-136: the stored original keeps orientation 6 and loses the place", async () => {
    const stored = await storeFile(asFile(await phoneJpeg(6), "notebook.jpg", "image/jpeg"));
    const onDisk = (await readStoredFile(stored.fileId))!.bytes;
    expect(onDisk.toString("latin1")).not.toContain(PLACE);
    expect((await sharp(onDisk).metadata()).orientation).toBe(6);
    await deleteStoredFile(stored.fileId);
  });

  it("TA-136: the feed's resized copy is drawn upright: 1 wide, 2 high", async () => {
    const stored = await storeFile(asFile(await phoneJpeg(6), "notebook.jpg", "image/jpeg"));
    const tile = (await readStoredVariant(stored.fileId, 320))!;
    const meta = await sharp(tile.bytes).metadata();
    expect({ width: meta.width, height: meta.height }).toEqual({ width: 1, height: 2 });
    await deleteStoredFile(stored.fileId);
  });

  it("TA-136: an upright photograph (orientation 1) keeps no EXIF at all, as before", async () => {
    const stored = await storeFile(asFile(await phoneJpeg(1), "upright.jpg", "image/jpeg"));
    const onDisk = (await readStoredFile(stored.fileId))!.bytes;
    expect(onDisk.toString("latin1")).not.toContain("Exif");
    expect(onDisk.toString("latin1")).not.toContain(PLACE);
    await deleteStoredFile(stored.fileId);
  });
});

/** An ISO base media file's opening: a 24-byte ftyp box with the given major brand and one compatible brand. */
function ftyp(major: string, compatible: string): Buffer {
  const box = Buffer.alloc(24);
  box.writeUInt32BE(24, 0);
  box.write("ftyp", 4, "latin1");
  box.write(major, 8, "latin1");
  box.writeUInt32BE(0, 12);
  box.write(compatible, 16, "latin1");
  box.write(major, 20, "latin1");
  return Buffer.concat([box, Buffer.alloc(64)]);
}

describe("TA-340: a HEIC, HEIF or AVIF still is not a video", () => {
  it("TA-340: the still-image brands are refused as an unsupported type, not stored as mp4", async () => {
    for (const [major, compatible] of [["heic", "mif1"], ["heix", "mif1"], ["mif1", "heic"], ["avif", "mif1"], ["msf1", "hevc"]] as const) {
      const attempt = storeFile(asFile(ftyp(major, compatible), "IMG_0001.HEIC", "image/heic"));
      await expect(attempt, major).rejects.toBeInstanceOf(UploadError);
      await expect(attempt, major).rejects.toMatchObject({ key: "refusal.fileTypeUnsupported" });
    }
  });

  it("TA-340: an MP4 or a phone's QuickTime-branded video is still stored as video", async () => {
    for (const [major, compatible] of [["isom", "mp41"], ["mp42", "isom"], ["qt  ", "qt  "]] as const) {
      const stored = await storeFile(asFile(ftyp(major, compatible), "clip.mp4", "video/mp4"));
      expect({ mime: stored.mime, kind: stored.kind }, major).toEqual({ mime: "video/mp4", kind: "video" });
      await deleteStoredFile(stored.fileId);
    }
  });
});
