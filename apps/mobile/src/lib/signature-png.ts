/**
 * A signature drawn with a finger, made into the PNG the server keeps.
 *
 * The web signs on a <canvas> and asks it for a PNG (admin/signatures/
 * signature-pad.tsx). A phone has no canvas: the strokes are drawn on screen
 * with react-native-svg, and what LEAVES THE PHONE is made here — the
 * strokes rasterised onto a transparent bitmap of the same fixed size the
 * web uses, with the same ink, and the bitmap written as a PNG by hand:
 * the eight magic bytes, an IHDR, one IDAT holding a zlib stream, an IEND.
 * The zlib stream is deflate with the fixed Huffman tables and a run finder
 * for the three distances a bitmap like this repeats at (the byte before,
 * the pixel before, the row above), which is enough: a 600 by 200 strip is
 * 480 KB raw and a signature on it is a few kilobytes, well under the
 * server's 200 KB (lib/signatures.ts, SIGNATURE_LIMIT). No native module,
 * no dependency, and the same bytes on every platform, which is what makes
 * it testable on the runner.
 *
 * The server reads the magic, the IHDR's size and the byte count, and
 * believes nothing else (pngFrom): what it is handed is a real PNG a browser
 * and the PDF renderer both open, held by the test that inflates it back.
 */
export type Point = { x: number; y: number };
export type Stroke = Point[];

/** The web's signature box: 600 by 200, a strip. */
export const SIGNATURE_SIZE = { width: 600, height: 200 } as const;
/** The web pad's ink, #1a1a2e, and its line of 3 CSS px; a finger is wider than a mouse, so a touch is drawn a little heavier. */
const INK = [0x1a, 0x1a, 0x2e] as const;
export const LINE_WIDTH = 4;

/* -------------------------------------------------------------------------- */
/* Rasterising                                                                  */
/* -------------------------------------------------------------------------- */

/** Distance from a point to a segment ab. */
function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
}

/**
 * The strokes as an alpha mask, one byte a pixel: 255 inside the line, 0
 * outside, and a soft edge one pixel wide so the line is not jagged. A
 * stroke of one point is a dot. Points outside the bitmap are clipped.
 */
export function rasterize(strokes: Stroke[], size: { width: number; height: number } = SIGNATURE_SIZE, lineWidth: number = LINE_WIDTH): Uint8Array {
  const { width, height } = size;
  const mask = new Uint8Array(width * height);
  const r = lineWidth / 2;
  const stamp = (ax: number, ay: number, bx: number, by: number) => {
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx) - r - 1));
    const x1 = Math.min(width - 1, Math.ceil(Math.max(ax, bx) + r + 1));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by) - r - 1));
    const y1 = Math.min(height - 1, Math.ceil(Math.max(ay, by) + r + 1));
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const d = segmentDistance(x + 0.5, y + 0.5, ax, ay, bx, by);
        const cover = r + 0.5 - d;
        if (cover <= 0) continue;
        const alpha = cover >= 1 ? 255 : Math.round(cover * 255);
        const at = y * width + x;
        if (alpha > mask[at]!) mask[at] = alpha;
      }
    }
  };
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;
    if (stroke.length === 1) {
      stamp(stroke[0]!.x, stroke[0]!.y, stroke[0]!.x, stroke[0]!.y);
      continue;
    }
    for (let i = 1; i < stroke.length; i++) stamp(stroke[i - 1]!.x, stroke[i - 1]!.y, stroke[i]!.x, stroke[i]!.y);
  }
  return mask;
}

/** The PNG's raw scanlines: a filter byte of 0, then RGBA, the ink under the mask's alpha. */
export function scanlines(mask: Uint8Array, size: { width: number; height: number }): Uint8Array {
  const { width, height } = size;
  const stride = width * 4 + 1;
  const out = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const row = y * stride;
    out[row] = 0;
    for (let x = 0; x < width; x++) {
      const alpha = mask[y * width + x]!;
      if (alpha === 0) continue;
      const at = row + 1 + x * 4;
      out[at] = INK[0];
      out[at + 1] = INK[1];
      out[at + 2] = INK[2];
      out[at + 3] = alpha;
    }
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Deflate, fixed Huffman, three distances                                      */
/* -------------------------------------------------------------------------- */

class BitWriter {
  private bytes: number[] = [];
  private acc = 0;
  private n = 0;
  /** `count` bits of `value`, least significant first: how deflate writes extra bits and block headers. */
  bits(value: number, count: number): void {
    for (let i = 0; i < count; i++) {
      this.acc |= ((value >>> i) & 1) << this.n;
      this.n++;
      if (this.n === 8) {
        this.bytes.push(this.acc);
        this.acc = 0;
        this.n = 0;
      }
    }
  }
  /** A Huffman code, most significant bit first: how deflate writes a code. */
  code(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) this.bits((value >>> i) & 1, 1);
  }
  finish(): Uint8Array {
    if (this.n > 0) this.bytes.push(this.acc);
    return Uint8Array.from(this.bytes);
  }
}

const LENGTH_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const LENGTH_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const MAX_MATCH = 258;
const MIN_MATCH = 3;

function literal(w: BitWriter, byte: number): void {
  if (byte < 144) w.code(0x30 + byte, 8);
  else w.code(0x190 + (byte - 144), 9);
}

function lengthCode(w: BitWriter, length: number): void {
  let i = LENGTH_BASE.length - 1;
  while (LENGTH_BASE[i]! > length) i--;
  const symbol = 257 + i;
  if (symbol < 280) w.code(symbol - 256, 7);
  else w.code(0xc0 + (symbol - 280), 8);
  if (LENGTH_EXTRA[i]! > 0) w.bits(length - LENGTH_BASE[i]!, LENGTH_EXTRA[i]!);
}

function distanceCode(w: BitWriter, distance: number): void {
  let i = DIST_BASE.length - 1;
  while (DIST_BASE[i]! > distance) i--;
  w.code(i, 5);
  if (DIST_EXTRA[i]! > 0) w.bits(distance - DIST_BASE[i]!, DIST_EXTRA[i]!);
}

/**
 * One final block with the fixed tables. At each byte the three distances
 * are tried (the byte before, the pixel before, the row above: what a
 * bitmap of ink on nothing repeats at) and the longest run taken, the
 * byte itself otherwise. Distances over 32 K are never tried: a row is
 * at most 2,401 bytes.
 */
export function deflateFixed(data: Uint8Array, distances: number[] = [1]): Uint8Array {
  const w = new BitWriter();
  w.bits(1, 1); // BFINAL
  w.bits(1, 2); // BTYPE 01: fixed Huffman
  const tried = distances.filter((d) => d > 0 && d <= 32_768);
  let i = 0;
  while (i < data.length) {
    let bestLength = 0;
    let bestDistance = 0;
    const room = Math.min(MAX_MATCH, data.length - i);
    for (const d of tried) {
      if (d > i) continue;
      let length = 0;
      while (length < room && data[i + length] === data[i + length - d]) length++;
      if (length > bestLength) {
        bestLength = length;
        bestDistance = d;
        if (length === MAX_MATCH) break;
      }
    }
    if (bestLength >= MIN_MATCH) {
      lengthCode(w, bestLength);
      distanceCode(w, bestDistance);
      i += bestLength;
    } else {
      literal(w, data[i]!);
      i++;
    }
  }
  w.code(0, 7); // end of block, symbol 256
  return w.finish();
}

function adler32(data: Uint8Array): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]!) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

/** A zlib stream: the two-byte header (deflate, 32 K window, no preset), the deflate data, the Adler-32 of what was compressed. */
export function zlib(data: Uint8Array, distances?: number[]): Uint8Array {
  const body = deflateFixed(data, distances);
  const out = new Uint8Array(2 + body.length + 4);
  out[0] = 0x78;
  out[1] = 0x01;
  out.set(body, 2);
  const sum = adler32(data);
  out[out.length - 4] = (sum >>> 24) & 0xff;
  out[out.length - 3] = (sum >>> 16) & 0xff;
  out[out.length - 2] = (sum >>> 8) & 0xff;
  out[out.length - 1] = sum & 0xff;
  return out;
}

/* -------------------------------------------------------------------------- */
/* PNG                                                                          */
/* -------------------------------------------------------------------------- */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u32(value: number): number[] {
  return [(value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff];
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = Uint8Array.from(type, (ch) => ch.charCodeAt(0));
  const body = new Uint8Array(typeBytes.length + data.length);
  body.set(typeBytes, 0);
  body.set(data, typeBytes.length);
  const out = new Uint8Array(4 + body.length + 4);
  out.set(u32(data.length), 0);
  out.set(body, 4);
  out.set(u32(crc32(body)), 4 + body.length);
  return out;
}

const PNG_MAGIC = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** An 8-bit RGBA PNG of the raw scanlines (a filter byte then the pixels, a row at a time). */
export function encodePng(size: { width: number; height: number }, lines: Uint8Array): Uint8Array {
  const header = Uint8Array.from([...u32(size.width), ...u32(size.height), 8, 6, 0, 0, 0]);
  const parts = [PNG_MAGIC, chunk("IHDR", header), chunk("IDAT", zlib(lines, [1, 4, size.width * 4 + 1])), chunk("IEND", new Uint8Array(0))];
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64 of bytes, without a Buffer: the runtime's btoa wants a string and chokes on half a megabyte of one. */
export function base64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = i + 1 < bytes.length ? bytes[i + 1]! : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2]! : 0;
    const n = (a << 16) | (b << 8) | c;
    out += B64[(n >>> 18) & 63]! + B64[(n >>> 12) & 63]! + (i + 1 < bytes.length ? B64[(n >>> 6) & 63]! : "=") + (i + 2 < bytes.length ? B64[n & 63]! : "=");
  }
  return out;
}

/** The strokes as the data URL POST /api/v1/office/signatures/mine takes, exactly as the web's canvas hands one over. */
export function signatureDataUrl(strokes: Stroke[], size: { width: number; height: number } = SIGNATURE_SIZE): string {
  return `data:image/png;base64,${base64(encodePng(size, scanlines(rasterize(strokes, size), size)))}`;
}
