import { deflateSync } from "node:zlib";

/**
 * A PNG made by hand, for fixtures and sweeps that need a picture and must
 * not carry one in the repository: white, with a dark stroke across it so
 * that it is visibly something on a paper.
 */
const CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const b of bytes) c = table[(c ^ b) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
})();

function chunk(type: string, data: Buffer): Buffer {
  const head = Buffer.alloc(4);
  head.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(CRC(body));
  return Buffer.concat([head, body, tail]);
}

export function fixturePng(width: number, height: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour
  const row = 1 + width * 3;
  const pixels = Buffer.alloc(row * height, 0xff);
  for (let y = 0; y < height; y++) {
    pixels[y * row] = 0; // no filter
    // A stroke from the lower left to the upper right.
    const x = Math.min(width - 1, Math.round(((height - 1 - y) / Math.max(1, height - 1)) * (width - 1)));
    for (const dx of [0, 1]) {
      const at = y * row + 1 + Math.min(width - 1, x + dx) * 3;
      pixels[at] = 0x1a;
      pixels[at + 1] = 0x1a;
      pixels[at + 2] = 0x2e;
    }
  }
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]);
}
