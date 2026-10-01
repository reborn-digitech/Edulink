/**
 * A small QR encoder: byte mode, error-correction level M, versions 1 to 10
 * (up to 216 bytes), which is several times the length of an otpauth:// URI.
 *
 * WRITTEN HERE RATHER THAN INSTALLED because the web app has no QR
 * dependency and the thing to draw is one short URI on one page. It follows
 * ISO/IEC 18004 as every encoder does: the data bits, Reed–Solomon over
 * GF(256), the blocks interleaved, the modules placed in the zigzag with the
 * function patterns kept clear, the eight masks scored by the four penalty
 * rules and the best one taken, the format and version information with
 * their BCH remainders. tests/qr.test.ts holds it to another encoder's
 * output, module for module.
 *
 * What comes out is a square of booleans; `qrSvgPath` turns it into one SVG
 * path (one unit per module) for the page to draw at any size.
 */

/** Level M: (error codewords per block, [blocks, data codewords per block] for each group). */
const LEVEL_M: { ec: number; groups: [number, number][] }[] = [
  { ec: 10, groups: [[1, 16]] },
  { ec: 16, groups: [[1, 28]] },
  { ec: 26, groups: [[1, 44]] },
  { ec: 18, groups: [[2, 32]] },
  { ec: 24, groups: [[2, 43]] },
  { ec: 16, groups: [[4, 27]] },
  { ec: 18, groups: [[4, 31]] },
  { ec: 22, groups: [[2, 38], [2, 39]] },
  { ec: 22, groups: [[3, 36], [2, 37]] },
  { ec: 26, groups: [[4, 43], [1, 44]] },
];

/** Centres of the alignment patterns, by version; version 1 has none. */
const ALIGNMENT: number[][] = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const MAX_VERSION = LEVEL_M.length;

/* ----------------------------------------------------------------- GF(256) */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = x;
  LOG[x] = i;
  x <<= 1;
  if (x & 0x100) x ^= 0x11d;
}
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255]!;

function mul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : EXP[LOG[a]! + LOG[b]!]!;
}

/** The generator polynomial for `n` error codewords: Π (x − α^i), i = 0..n−1. */
function generator(n: number): Uint8Array {
  let g = Uint8Array.of(1);
  for (let i = 0; i < n; i++) {
    const next = new Uint8Array(g.length + 1);
    for (let j = 0; j < g.length; j++) {
      next[j] = next[j]! ^ g[j]!;
      next[j + 1] = next[j + 1]! ^ mul(g[j]!, EXP[i]!);
    }
    g = next;
  }
  return g;
}

function reedSolomon(data: Uint8Array, n: number): Uint8Array {
  const g = generator(n);
  const rest = new Uint8Array(data.length + n);
  rest.set(data);
  for (let i = 0; i < data.length; i++) {
    const coef = rest[i]!;
    if (coef === 0) continue;
    for (let j = 1; j < g.length; j++) rest[i + j] = rest[i + j]! ^ mul(g[j]!, coef);
  }
  return rest.slice(data.length);
}

/* --------------------------------------------------------------- the bits */

class Bits {
  bits: number[] = [];
  put(value: number, length: number) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
}

function dataCapacity(version: number): number {
  return LEVEL_M[version - 1]!.groups.reduce((sum, [blocks, size]) => sum + blocks * size, 0);
}

function smallestVersion(bytes: number): number {
  for (let v = 1; v <= MAX_VERSION; v++) {
    const countBits = v < 10 ? 8 : 16;
    const needed = 4 + countBits + bytes * 8;
    if (needed <= dataCapacity(v) * 8) return v;
  }
  throw new Error(`qr: ${bytes} bytes is more than version ${MAX_VERSION} at level M holds`);
}

/** The data codewords, then the error codewords, interleaved block by block as the symbol reads them. */
function codewords(content: Uint8Array, version: number): Uint8Array {
  const spec = LEVEL_M[version - 1]!;
  const capacity = dataCapacity(version);
  const bits = new Bits();
  bits.put(0b0100, 4);
  bits.put(content.length, version < 10 ? 8 : 16);
  for (const byte of content) bits.put(byte, 8);
  bits.put(0, Math.min(4, capacity * 8 - bits.bits.length));
  while (bits.bits.length % 8 !== 0) bits.bits.push(0);
  const data = new Uint8Array(capacity);
  for (let i = 0; i < bits.bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | bits.bits[i + j]!;
    data[i / 8] = byte;
  }
  for (let i = bits.bits.length / 8, pad = 0xec; i < capacity; i++, pad ^= 0xec ^ 0x11) data[i] = pad;

  const blocks: Uint8Array[] = [];
  const ecs: Uint8Array[] = [];
  let at = 0;
  for (const [count, size] of spec.groups) {
    for (let b = 0; b < count; b++) {
      const block = data.slice(at, at + size);
      at += size;
      blocks.push(block);
      ecs.push(reedSolomon(block, spec.ec));
    }
  }
  const out: number[] = [];
  const longest = Math.max(...blocks.map((b) => b.length));
  for (let i = 0; i < longest; i++) for (const block of blocks) if (i < block.length) out.push(block[i]!);
  for (let i = 0; i < spec.ec; i++) for (const ec of ecs) out.push(ec[i]!);
  return Uint8Array.from(out);
}

/* ------------------------------------------------------------- the matrix */

type Matrix = { size: number; modules: Uint8Array; reserved: Uint8Array };

function matrixFor(version: number): Matrix {
  const size = version * 4 + 17;
  const m: Matrix = { size, modules: new Uint8Array(size * size), reserved: new Uint8Array(size * size) };
  const set = (x: number, y: number, dark: boolean) => {
    m.modules[y * size + x] = dark ? 1 : 0;
    m.reserved[y * size + x] = 1;
  };
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || y < 0 || x >= size || y >= size) continue;
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        set(x, y, d <= 1 || d === 3);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);
  for (let i = 8; i < size - 8; i++) {
    set(i, 6, i % 2 === 0);
    set(6, i, i % 2 === 0);
  }
  // Every pair of centres except the three that would sit on a finder; one
  // may sit on a timing pattern, and does.
  const centres = ALIGNMENT[version - 1]!;
  const last = centres.length - 1;
  for (let i = 0; i < centres.length; i++) {
    for (let j = 0; j < centres.length; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) continue;
      const cx = centres[j]!;
      const cy = centres[i]!;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }
  }
  // The format areas and the dark module; the format bits are written once the mask is chosen.
  for (let i = 0; i < 9; i++) {
    if (i === 6) continue; // the timing pattern's end, already drawn
    set(i, 8, false);
    set(8, i, false);
  }
  for (let i = 0; i < 8; i++) {
    set(size - 1 - i, 8, false);
    set(8, size - 1 - i, false);
  }
  set(8, size - 8, true);
  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        set(i, size - 11 + j, false);
        set(size - 11 + j, i, false);
      }
    }
  }
  return m;
}

function place(m: Matrix, words: Uint8Array): void {
  const { size } = m;
  let bit = 0;
  const total = words.length * 8;
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let step = 0; step < size; step++) {
      const y = upward ? size - 1 - step : step;
      for (const x of [right, right - 1]) {
        if (m.reserved[y * size + x]) continue;
        const value = bit < total ? (words[bit >> 3]! >>> (7 - (bit & 7))) & 1 : 0;
        m.modules[y * size + x] = value;
        bit++;
      }
    }
    upward = !upward;
  }
}

function masked(x: number, y: number, mask: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function applyMask(m: Matrix, mask: number): Uint8Array {
  const out = Uint8Array.from(m.modules);
  for (let y = 0; y < m.size; y++) for (let x = 0; x < m.size; x++) if (!m.reserved[y * m.size + x] && masked(x, y, mask)) out[y * m.size + x] = out[y * m.size + x]! ^ 1;
  return out;
}

/** BCH(15,5) over the five format bits, then the fixed XOR mask. */
function formatBits(mask: number): number {
  const data = (0b00 << 3) | mask; // level M is 00
  let rem = data;
  for (let i = 0; i < 10; i++) rem = (rem << 1) ^ (rem >>> 9 ? 0x537 : 0);
  return ((data << 10) | rem) ^ 0x5412;
}

/** BCH(18,6) over the version number. */
function versionBits(version: number): number {
  let rem = version;
  for (let i = 0; i < 12; i++) rem = (rem << 1) ^ (rem >>> 11 ? 0x1f25 : 0);
  return (version << 12) | rem;
}

function writeFormat(modules: Uint8Array, size: number, mask: number): void {
  const bits = formatBits(mask);
  const at = (x: number, y: number, i: number) => {
    modules[y * size + x] = (bits >>> i) & 1;
  };
  // Around the top-left finder, bit 0 nearest the corner's far side.
  for (let i = 0; i < 6; i++) at(8, i, i);
  at(8, 7, 6);
  at(8, 8, 7);
  at(7, 8, 8);
  for (let i = 9; i < 15; i++) at(14 - i, 8, i);
  // The second copy, split between the other two finders.
  for (let i = 0; i < 8; i++) at(size - 1 - i, 8, i);
  for (let i = 8; i < 15; i++) at(8, size - 15 + i, i);
}

function writeVersion(modules: Uint8Array, size: number, version: number): void {
  if (version < 7) return;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const value = (bits >>> i) & 1;
    const a = Math.floor(i / 3);
    const b = size - 11 + (i % 3);
    modules[b * size + a] = value;
    modules[a * size + b] = value;
  }
}

/** The four penalty rules of the standard, lowest wins. */
function penalty(modules: Uint8Array, size: number): number {
  const at = (x: number, y: number) => modules[y * size + x]!;
  let score = 0;
  // Rule 1: runs of five or more alike in a row or column.
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < size; i++) {
      let run = 1;
      for (let j = 1; j < size; j++) {
        const here = pass === 0 ? at(j, i) : at(i, j);
        const prev = pass === 0 ? at(j - 1, i) : at(i, j - 1);
        if (here === prev) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else run = 1;
      }
    }
  }
  // Rule 2: two-by-two blocks of one colour.
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const v = at(x, y);
      if (v === at(x + 1, y) && v === at(x, y + 1) && v === at(x + 1, y + 1)) score += 3;
    }
  }
  // Rule 3: the finder-like pattern 1011101 with four light modules on either side.
  const pattern = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const matches = (read: (k: number) => number) => {
    let forward = true;
    let backward = true;
    for (let k = 0; k < 11; k++) {
      if (read(k) !== pattern[k]) forward = false;
      if (read(k) !== pattern[10 - k]) backward = false;
    }
    return forward || backward;
  };
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - 11; j++) {
      if (matches((k) => at(j + k, i))) score += 40;
      if (matches((k) => at(i, j + k))) score += 40;
    }
  }
  // Rule 4: the balance of dark to light, in steps of five per cent from half.
  let dark = 0;
  for (const v of modules) dark += v;
  const percent = (dark * 100) / (size * size);
  const previous = Math.floor(percent / 5) * 5;
  const next = previous + 5;
  score += Math.min(Math.abs(previous - 50) / 5, Math.abs(next - 50) / 5) * 10;
  return score;
}

export type QrCode = { size: number; modules: Uint8Array; version: number; mask: number };

/** Encodes `text` (UTF-8) at level M, choosing the smallest version and the best mask. */
export function encodeQr(text: string, opts: { mask?: number } = {}): QrCode {
  const content = new TextEncoder().encode(text);
  const version = smallestVersion(content.length);
  const matrix = matrixFor(version);
  place(matrix, codewords(content, version));
  let best: { mask: number; modules: Uint8Array; score: number } | null = null;
  const candidates = opts.mask === undefined ? [0, 1, 2, 3, 4, 5, 6, 7] : [opts.mask];
  for (const mask of candidates) {
    const modules = applyMask(matrix, mask);
    writeFormat(modules, matrix.size, mask);
    writeVersion(modules, matrix.size, version);
    const score = penalty(modules, matrix.size);
    if (!best || score < best.score) best = { mask, modules, score };
  }
  return { size: matrix.size, modules: best!.modules, version, mask: best!.mask };
}

/** One SVG path, one unit per module, with a quiet zone of `margin` modules; draw it in a viewBox of `size + 2 * margin`. */
export function qrSvgPath(code: QrCode, margin = 4): { d: string; viewBox: string } {
  const parts: string[] = [];
  for (let y = 0; y < code.size; y++) {
    for (let x = 0; x < code.size; x++) {
      if (code.modules[y * code.size + x]) parts.push(`M${x + margin} ${y + margin}h1v1h-1z`);
    }
  }
  const span = code.size + margin * 2;
  return { d: parts.join(""), viewBox: `0 0 ${span} ${span}` };
}

/** The whole symbol as one string per row of `#` and `.`, for a test to compare and a person to see. */
export function qrRows(code: QrCode): string[] {
  const rows: string[] = [];
  for (let y = 0; y < code.size; y++) {
    let row = "";
    for (let x = 0; x < code.size; x++) row += code.modules[y * code.size + x] ? "#" : ".";
    rows.push(row);
  }
  return rows;
}
