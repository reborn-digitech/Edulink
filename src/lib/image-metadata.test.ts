import { describe, expect, it } from "vitest";
import { stripImageMetadata } from "./image-metadata";

/**
 * Metadata stripping.
 *
 * The property under test is a privacy one: after this runs, a byte sequence
 * that identified where a photo was taken must not be in the file. The tests
 * plant a recognisable marker inside each container's metadata slot and assert
 * it is gone — and, just as importantly, that the pixel data either side of it
 * survived, because a stripper that eats the image is worse than no stripper.
 */

const GPS = "GPS-51.5074N-0.1278W";

/* ---------------------------------- JPEG --------------------------------- */

function jpegSegment(marker: number, payload: Buffer): Buffer {
  const length = Buffer.alloc(2);
  length.writeUInt16BE(payload.length + 2);
  return Buffer.concat([Buffer.from([0xff, marker]), length, payload]);
}

const SCAN = Buffer.from([0xff, 0xda, 0x11, 0x22, 0x33, 0x44, 0xff, 0xd9]);

function buildJpeg(...segments: Buffer[]): Buffer {
  return Buffer.concat([Buffer.from([0xff, 0xd8]), ...segments, SCAN]);
}

const APP0_JFIF = jpegSegment(0xe0, Buffer.from("JFIF\0", "latin1"));
const APP1_EXIF = jpegSegment(0xe1, Buffer.from(`Exif\0\0${GPS}`, "latin1"));
const APP2_ICC = jpegSegment(0xe2, Buffer.from("ICC_PROFILE\0colour-data", "latin1"));
const COMMENT = jpegSegment(0xfe, Buffer.from("taken at home", "latin1"));

describe("JPEG", () => {
  it("removes the EXIF block that carries GPS", () => {
    const out = stripImageMetadata(buildJpeg(APP0_JFIF, APP1_EXIF), "image/jpeg");
    expect(out.toString("latin1")).not.toContain(GPS);
    expect(out.toString("latin1")).not.toContain("Exif");
  });

  it("keeps the image data and the JPEG framing", () => {
    const out = stripImageMetadata(buildJpeg(APP0_JFIF, APP1_EXIF), "image/jpeg");
    expect([out[0], out[1]]).toEqual([0xff, 0xd8]); // still starts with SOI
    expect(out.subarray(-SCAN.length)).toEqual(SCAN); // scan + EOI intact
  });

  it("keeps JFIF and the ICC colour profile", () => {
    // Dropping ICC would visibly shift colours, and it carries nothing personal.
    const out = stripImageMetadata(buildJpeg(APP0_JFIF, APP1_EXIF, APP2_ICC), "image/jpeg");
    expect(out.toString("latin1")).toContain("JFIF");
    expect(out.toString("latin1")).toContain("ICC_PROFILE");
  });

  it("removes free-text comments", () => {
    const out = stripImageMetadata(buildJpeg(COMMENT), "image/jpeg");
    expect(out.toString("latin1")).not.toContain("taken at home");
  });

  it("leaves a JPEG with no metadata byte-identical", () => {
    const clean = buildJpeg(APP0_JFIF);
    expect(stripImageMetadata(clean, "image/jpeg")).toEqual(clean);
  });

  it("shrinks the file by the size of what it dropped", () => {
    const withExif = buildJpeg(APP0_JFIF, APP1_EXIF);
    const out = stripImageMetadata(withExif, "image/jpeg");
    expect(out.length).toBe(withExif.length - APP1_EXIF.length);
  });

  it("does not truncate a file it cannot parse", () => {
    // A segment claiming a length past the end of the buffer. The tail must
    // survive: a half-written file should fail on decode, not be silently cut.
    const lying = Buffer.alloc(2);
    lying.writeUInt16BE(0xff00);
    const broken = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff, 0xe1]),
      lying,
      Buffer.from("tail-bytes", "latin1"),
    ]);
    const out = stripImageMetadata(broken, "image/jpeg");
    expect(out.toString("latin1")).toContain("tail-bytes");
  });

  it("passes through a buffer too short to be an image", () => {
    const tiny = Buffer.from([0xff, 0xd8]);
    expect(stripImageMetadata(tiny, "image/jpeg")).toEqual(tiny);
  });
});

/* ----------------------------------- PNG --------------------------------- */

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  return Buffer.concat([length, Buffer.from(type, "latin1"), data, Buffer.alloc(4)]);
}

function buildPng(...chunks: Buffer[]): Buffer {
  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", Buffer.alloc(13)),
    ...chunks,
    pngChunk("IDAT", Buffer.from("pixels", "latin1")),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

describe("PNG", () => {
  it("removes text and EXIF chunks", () => {
    const png = buildPng(
      pngChunk("tEXt", Buffer.from(`Comment\0${GPS}`, "latin1")),
      pngChunk("eXIf", Buffer.from(GPS, "latin1")),
    );
    const out = stripImageMetadata(png, "image/png");
    expect(out.toString("latin1")).not.toContain(GPS);
  });

  it("keeps the header, the pixels and the terminator", () => {
    const png = buildPng(pngChunk("iTXt", Buffer.from(GPS, "latin1")));
    const out = stripImageMetadata(png, "image/png");
    expect(out.subarray(0, 8)).toEqual(PNG_SIGNATURE);
    expect(out.toString("latin1")).toContain("IHDR");
    expect(out.toString("latin1")).toContain("pixels");
    expect(out.toString("latin1")).toContain("IEND");
  });

  it("leaves a PNG with no metadata byte-identical", () => {
    const clean = buildPng();
    expect(stripImageMetadata(clean, "image/png")).toEqual(clean);
  });
});

/* ---------------------------------- WebP --------------------------------- */

function webpChunk(fourCC: string, data: Buffer): Buffer {
  const size = Buffer.alloc(4);
  size.writeUInt32LE(data.length);
  const padding = data.length % 2 === 1 ? Buffer.from([0]) : Buffer.alloc(0);
  return Buffer.concat([Buffer.from(fourCC, "latin1"), size, data, padding]);
}

function buildWebp(...chunks: Buffer[]): Buffer {
  const body = Buffer.concat(chunks);
  const header = Buffer.alloc(12);
  header.write("RIFF", 0, "latin1");
  header.writeUInt32LE(4 + body.length, 4);
  header.write("WEBP", 8, "latin1");
  return Buffer.concat([header, body]);
}

/** Flags byte with both the EXIF (0x08) and XMP (0x04) bits set. */
function vp8xPayload(flags: number): Buffer {
  const payload = Buffer.alloc(10);
  payload[0] = flags;
  return payload;
}

describe("WebP", () => {
  it("removes the EXIF chunk", () => {
    const webp = buildWebp(
      webpChunk("VP8X", vp8xPayload(0x0c)),
      webpChunk("VP8 ", Buffer.from("pixels", "latin1")),
      webpChunk("EXIF", Buffer.from(GPS, "latin1")),
    );
    const out = stripImageMetadata(webp, "image/webp");
    expect(out.toString("latin1")).not.toContain(GPS);
    expect(out.toString("latin1")).toContain("pixels");
  });

  it("clears the VP8X flags that advertise metadata", () => {
    // Left set, a decoder is told to go looking for a chunk that is now gone.
    const webp = buildWebp(
      webpChunk("VP8X", vp8xPayload(0x1c)), // alpha + EXIF + XMP
      webpChunk("EXIF", Buffer.from(GPS, "latin1")),
    );
    const out = stripImageMetadata(webp, "image/webp");
    const flags = out[20]!; // 12 header + 8 chunk header = first payload byte
    expect(flags & 0x08).toBe(0); // EXIF bit cleared
    expect(flags & 0x04).toBe(0); // XMP bit cleared
    expect(flags & 0x10).toBe(0x10); // alpha bit untouched
  });

  it("rewrites the RIFF length to match the smaller file", () => {
    const webp = buildWebp(
      webpChunk("VP8 ", Buffer.from("pixels", "latin1")),
      webpChunk("XMP ", Buffer.from(GPS, "latin1")),
    );
    const out = stripImageMetadata(webp, "image/webp");
    // A stale length makes the file unreadable to strict decoders.
    expect(out.readUInt32LE(4)).toBe(out.length - 8);
  });

  it("leaves a WebP with no metadata byte-identical", () => {
    const clean = buildWebp(webpChunk("VP8 ", Buffer.from("pixels", "latin1")));
    expect(stripImageMetadata(clean, "image/webp")).toEqual(clean);
  });
});

/* --------------------------------- others -------------------------------- */

describe("formats it does not rewrite", () => {
  it("passes GIF and PDF through untouched", () => {
    // No EXIF in practice, and no test coverage — so no rewriting.
    const gif = Buffer.from("GIF89a-and-some-bytes", "latin1");
    expect(stripImageMetadata(gif, "image/gif")).toEqual(gif);
    const pdf = Buffer.from("%PDF-1.7", "latin1");
    expect(stripImageMetadata(pdf, "application/pdf")).toEqual(pdf);
  });
});
