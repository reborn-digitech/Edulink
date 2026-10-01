import { inflateSync } from "node:zlib";
import { pngDataUrlSchema } from "@edulink/contracts";
import { base64, crc32, deflateFixed, encodePng, rasterize, scanlines, SIGNATURE_SIZE, signatureDataUrl, zlib } from "@/lib/signature-png";

/**
 * The PNG the phone makes of a signature, opened again by Node's own
 * inflate: the stream the hand-written deflate wrote is the one every
 * reader expects, the chunks carry the right CRCs, and the pixels are the
 * strokes. The server reads only the magic, the size and the byte count
 * (lib/signatures.ts pngFrom), so the size limit is held here too.
 */
const be32 = (bytes: Uint8Array, at: number) => ((bytes[at]! << 24) | (bytes[at + 1]! << 16) | (bytes[at + 2]! << 8) | bytes[at + 3]!) >>> 0;

/** The chunks of a PNG, each with its CRC checked. */
function chunks(png: Uint8Array): { type: string; data: Uint8Array }[] {
  expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const out: { type: string; data: Uint8Array }[] = [];
  let at = 8;
  while (at < png.length) {
    const length = be32(png, at);
    const type = String.fromCharCode(...png.subarray(at + 4, at + 8));
    const data = png.subarray(at + 8, at + 8 + length);
    expect({ type, crc: be32(png, at + 8 + length) }).toEqual({ type, crc: crc32(png.subarray(at + 4, at + 8 + length)) });
    out.push({ type, data });
    at += 12 + length;
  }
  return out;
}

/** A decoded PNG's pixel. */
function pixel(lines: Uint8Array, width: number, x: number, y: number): number[] {
  const at = y * (width * 4 + 1) + 1 + x * 4;
  return [...lines.subarray(at, at + 4)];
}

describe("the deflate stream", () => {
  it("inflates to what it was given: empty, a byte, runs at each distance, and bytes that repeat nowhere", () => {
    const stride = 13;
    const cases: Uint8Array[] = [
      new Uint8Array(0),
      Uint8Array.from([200]),
      new Uint8Array(1000),
      Uint8Array.from({ length: 4 * 300 }, (_, i) => [1, 2, 3, 4][i % 4]!),
      Uint8Array.from({ length: stride * 40 }, (_, i) => (i % stride) * 7),
      Uint8Array.from({ length: 2000 }, (_, i) => (i * 7919) % 256),
      Uint8Array.from({ length: 70_000 }, (_, i) => (i < 65_535 ? 0 : i % 251)),
    ];
    for (const data of cases) {
      const packed = zlib(data, [1, 4, stride]);
      expect([packed[0], packed[1]]).toEqual([0x78, 0x01]);
      expect([...inflateSync(packed)]).toEqual([...data]);
    }
  });

  it("finds the runs: a kilobyte of nothing is a few bytes, and the pixel before is a distance it tries", () => {
    expect(deflateFixed(new Uint8Array(100_000), [1]).length).toBeLessThan(700);
    const pixels = Uint8Array.from({ length: 4 * 2000 }, (_, i) => [26, 26, 46, 255][i % 4]!);
    expect(deflateFixed(pixels, [1, 4]).length).toBeLessThan(deflateFixed(pixels, [1]).length / 4);
  });
});

describe("base64", () => {
  it("is the Buffer's, at every length modulo three", () => {
    for (const length of [0, 1, 2, 3, 4, 5, 6, 100, 257]) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 131 + 7) % 256);
      expect(base64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
    }
  });
});

describe("the signature's PNG", () => {
  it("is a real PNG of the web's size, RGBA, every row unfiltered, that inflates back to the strokes in the web's ink", () => {
    const strokes = [
      [{ x: 100, y: 100 }, { x: 300, y: 60 }, { x: 500, y: 120 }],
      [{ x: 50, y: 150 }],
    ];
    const png = encodePng(SIGNATURE_SIZE, scanlines(rasterize(strokes), SIGNATURE_SIZE));
    const parts = chunks(png);
    expect(parts.map((c) => c.type)).toEqual(["IHDR", "IDAT", "IEND"]);
    const ihdr = parts[0]!.data;
    expect([be32(ihdr, 0), be32(ihdr, 4), ihdr[8], ihdr[9], ihdr[10], ihdr[11], ihdr[12]]).toEqual([600, 200, 8, 6, 0, 0, 0]);
    const lines = new Uint8Array(inflateSync(parts[1]!.data));
    expect(lines.length).toBe((600 * 4 + 1) * 200);
    for (let y = 0; y < 200; y++) expect(lines[y * (600 * 4 + 1)]).toBe(0);
    // On the line: the ink, opaque. Beside it: nothing. The dot of a one-point stroke is drawn too.
    expect(pixel(lines, 600, 100, 100)).toEqual([0x1a, 0x1a, 0x2e, 255]);
    expect(pixel(lines, 600, 300, 60)).toEqual([0x1a, 0x1a, 0x2e, 255]);
    expect(pixel(lines, 600, 50, 150)).toEqual([0x1a, 0x1a, 0x2e, 255]);
    expect(pixel(lines, 600, 100, 150)).toEqual([0, 0, 0, 0]);
    expect(pixel(lines, 600, 599, 199)).toEqual([0, 0, 0, 0]);
    // The edge is soft: a pixel a little over the line's half-width from the slanted stroke is between.
    const edge = pixel(lines, 600, 200, 77);
    expect(edge[3]).toBeGreaterThan(0);
    expect(edge[3]).toBeLessThan(255);
  });

  it("clips what is drawn outside the box, and an empty drawing is a blank strip", () => {
    const mask = rasterize([[{ x: -50, y: -50 }, { x: 700, y: 300 }]], SIGNATURE_SIZE);
    expect(mask.length).toBe(600 * 200);
    expect(mask.some((a) => a > 0)).toBe(true);
    expect(rasterize([], SIGNATURE_SIZE).every((a) => a === 0)).toBe(true);
    expect(rasterize([[]], SIGNATURE_SIZE).every((a) => a === 0)).toBe(true);
  });

  it("⚠ is the data URL the contract takes, and a strip scribbled all over stays under the server's 200 KB", () => {
    const url = signatureDataUrl([[{ x: 10, y: 10 }, { x: 590, y: 190 }]]);
    expect(pngDataUrlSchema.safeParse(url).success).toBe(true);
    expect(url.startsWith("data:image/png;base64,iVBORw0KGgo")).toBe(true);
    // A dense scribble: forty strokes back and forth across the whole strip, which is far more ink than a signature.
    const scribble = Array.from({ length: 40 }, (_, i) => Array.from({ length: 60 }, (_, k) => ({ x: (k * 600) / 59, y: 5 + i * 4.8 + Math.sin(k) * 3 })));
    const dense = signatureDataUrl(scribble);
    const bytes = Buffer.from(dense.slice("data:image/png;base64,".length), "base64");
    expect(bytes.length).toBeLessThan(200 * 1024);
    expect(bytes.length).toBeGreaterThan(1000);
    chunks(new Uint8Array(bytes));
  });
});
