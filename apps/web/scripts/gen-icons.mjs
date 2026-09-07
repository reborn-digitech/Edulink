/**
 * Generates the PWA icon set as real PNG files.
 *
 * Written by hand rather than pulled from a canvas/sharp dependency because the
 * icons are static: rasterising them once at setup means no native module to
 * install, no runtime image route, and identical bytes on every machine.
 *
 * Output:
 *   public/icons/icon-192.png        any
 *   public/icons/icon-512.png        any
 *   public/icons/maskable-192.png    maskable (glyph inside the 80% safe zone)
 *   public/icons/maskable-512.png    maskable
 *   public/icons/apple-touch-icon.png
 *   public/icons/shortcut-*.png      app shortcut glyphs
 *   src/app/favicon.ico              (PNG-encoded ICO container)
 *
 * Run: node scripts/gen-icons.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const OUT = resolve(import.meta.dirname, "../public/icons");
mkdirSync(OUT, { recursive: true });

/* ---------------------------------------------------------------- PNG ----- */

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** rgba: Uint8ClampedArray of size*size*4 */
function encodePng(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  // 10,11,12 = compression/filter/interlace, all 0

  // Each scanline is prefixed with filter byte 0 (None). Good enough: these
  // are flat-colour images and deflate handles the redundancy.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    for (let x = 0; x < size * 4; x++) raw[rowStart + 1 + x] = rgba[y * size * 4 + x];
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- raster ---- */

const SS = 3; // supersample factor per axis -> 9 samples/pixel antialiasing

function hex(h) {
  return [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
}

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function insideRoundRect(x, y, x0, y0, x1, y1, r) {
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= r * r || (x >= x0 + r && x <= x1 - r) || (y >= y0 + r && y <= y1 - r);
  }
  return false;
}

function insidePolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * Draws the EduLink mark: a rounded badge with a mortarboard (graduation cap)
 * and a link-node dot, in normalised 0..1 coordinates so it scales exactly.
 *
 * @param scale 1 = glyph fills the badge; 0.8 keeps it inside the maskable
 *              safe zone so Android's circular/squircle crop never clips it.
 */
function drawIcon(size, { maskable = false, glyph = "cap" } = {}) {
  const rgba = new Uint8ClampedArray(size * size * 4);
  const top = hex("#4f8dfb");
  const bottom = hex("#2563eb");
  const white = [255, 255, 255];

  // Maskable icons must be full-bleed; regular icons get rounded corners.
  const radius = maskable ? 0 : 0.22;
  const inset = maskable ? 0.13 : 0.2; // glyph inset from badge edge

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0, g = 0, b = 0, a = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const x = (px + (sx + 0.5) / SS) / size;
          const y = (py + (sy + 0.5) / SS) / size;

          const inBadge = radius === 0 ? true : insideRoundRect(x, y, 0, 0, 1, 1, radius);
          if (!inBadge) continue;

          const base = mix(top, bottom, y);
          let color = base;

          if (glyph === "cap") {
            // Mortarboard: a diamond, plus a trapezoid body beneath it.
            const cx = 0.5;
            const capY = inset + 0.16;
            const halfW = 0.5 - inset;
            const diamond = [
              [cx, capY - 0.11],
              [cx + halfW, capY],
              [cx, capY + 0.11],
              [cx - halfW, capY],
            ];
            // Crown of the cap: short trapezoid tucked under the board, so the
            // silhouette reads as a mortarboard rather than a bag.
            const bodyTop = capY + 0.035;
            const bodyBottom = capY + 0.235;
            const body = [
              [cx - halfW * 0.5, bodyTop],
              [cx + halfW * 0.5, bodyTop],
              [cx + halfW * 0.4, bodyBottom],
              [cx - halfW * 0.4, bodyBottom],
            ];
            // Tassel: a small dot hanging off the right edge.
            const tx = cx + halfW * 0.82;
            const ty = capY + 0.2;
            const tassel = (x - tx) ** 2 + (y - ty) ** 2 <= 0.045 ** 2;
            const tasselLine =
              Math.abs(x - tx) < 0.012 && y > capY + 0.01 && y < ty;

            if (insidePolygon(x, y, diamond) || insidePolygon(x, y, body) || tassel || tasselLine) {
              color = white;
            }
          } else if (glyph === "check") {
            const pts = [
              [0.28, 0.52], [0.42, 0.66], [0.72, 0.34],
              [0.78, 0.42], [0.42, 0.78], [0.22, 0.58],
            ];
            if (insidePolygon(x, y, pts)) color = white;
          } else if (glyph === "plus") {
            const arm = 0.09;
            if (
              (Math.abs(x - 0.5) < arm && Math.abs(y - 0.5) < 0.28) ||
              (Math.abs(y - 0.5) < arm && Math.abs(x - 0.5) < 0.28)
            ) {
              color = white;
            }
          } else if (glyph === "chat") {
            const bubble = insideRoundRect(x, y, 0.22, 0.26, 0.78, 0.64, 0.1);
            const tail = insidePolygon(x, y, [[0.34, 0.62], [0.46, 0.62], [0.34, 0.78]]);
            if (bubble || tail) color = white;
          }

          r += color[0];
          g += color[1];
          b += color[2];
          a += 255;
        }
      }

      const samples = SS * SS;
      const i = (py * size + px) * 4;
      if (a > 0) {
        rgba[i] = r / samples / (a / samples / 255);
        rgba[i + 1] = g / samples / (a / samples / 255);
        rgba[i + 2] = b / samples / (a / samples / 255);
        rgba[i + 3] = a / samples;
      }
    }
  }
  return rgba;
}

function write(path, buffer) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, buffer);
  console.log(`  ${path.replace(resolve(import.meta.dirname, ".."), ".")}  ${(buffer.length / 1024).toFixed(1)} KB`);
}

console.log("Generating EduLink icons…");

for (const size of [192, 512]) {
  write(`${OUT}/icon-${size}.png`, encodePng(drawIcon(size), size));
  write(`${OUT}/maskable-${size}.png`, encodePng(drawIcon(size, { maskable: true }), size));
}
write(`${OUT}/apple-touch-icon.png`, encodePng(drawIcon(180), 180));
write(`${OUT}/shortcut-attendance.png`, encodePng(drawIcon(96, { glyph: "check" }), 96));
write(`${OUT}/shortcut-assignment.png`, encodePng(drawIcon(96, { glyph: "plus" }), 96));
write(`${OUT}/shortcut-remark.png`, encodePng(drawIcon(96, { glyph: "chat" }), 96));

// ICO container holding a single 32x32 PNG — every browser since IE11 accepts
// PNG-in-ICO, and it avoids hand-rolling a BMP encoder.
const ico32 = encodePng(drawIcon(32), 32);
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16);
entry[0] = 32;
entry[1] = 32;
entry[4] = 1;
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(ico32.length, 8);
entry.writeUInt32LE(22, 12);
write(resolve(import.meta.dirname, "../src/app/favicon.ico"), Buffer.concat([header, entry, ico32]));

console.log("Done.");
