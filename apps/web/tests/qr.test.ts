/**
 * The QR encoder behind the two-step sign-in card, held to another encoder.
 *
 * `toqr` sits in the pnpm store as a dependency of the phone's Expo tooling
 * and is not a dependency of the web app; it is loaded here from the store
 * for the comparison alone, and the comparison is skipped with a note when
 * the store does not have it. The data bits, the Reed–Solomon codewords,
 * their interleaving, the placement, the format and version information
 * must all agree for two symbols to match module for module.
 */
import { createRequire } from "node:module";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { encodeQr, qrRows, qrSvgPath } from "@/lib/qr";

type ToQr = (content: string, level: number) => Uint8Array;

function loadToqr(): ToQr | null {
  const store = resolve(__dirname, "../../../node_modules/.pnpm");
  if (!existsSync(store)) return null;
  const dir = readdirSync(store).find((name) => name.startsWith("toqr@"));
  if (!dir) return null;
  const require = createRequire(__filename);
  return (require(join(store, dir, "node_modules/toqr/dist/toqr.js")) as { toQR: ToQr }).toQR;
}

function rowsOf(matrix: Uint8Array): string[] {
  const size = Math.sqrt(matrix.length);
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) row += matrix[y * size + x] ? "#" : ".";
    rows.push(row);
  }
  return rows;
}

const URIS = [
  "HELLO WORLD",
  "otpauth://totp/Relay:head%40zz.test?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Relay&algorithm=SHA1&digits=6&period=30",
  "otpauth://totp/Relay:someone.with.a.long.address%40example-school.edu.in?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=Relay&algorithm=SHA1&digits=6&period=30",
  "otpauth://totp/Relay:%2B919876543210?secret=GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ&issuer=Relay&algorithm=SHA1&digits=6&period=30",
  "x".repeat(200),
];

describe("the QR encoder", () => {
  it("picks the smallest version that fits, and refuses what version 10 cannot hold", () => {
    expect(encodeQr("HELLO WORLD").version).toBe(1);
    expect(encodeQr(URIS[1]!).version).toBe(7);
    // 216 data codewords, less the mode and the sixteen-bit count: 213 bytes.
    expect(encodeQr("x".repeat(213)).version).toBe(10);
    expect(() => encodeQr("x".repeat(214))).toThrow(/version 10/);
  });

  it("draws the three finders, the timing patterns and the dark module where the standard puts them", () => {
    const rows = qrRows(encodeQr("HELLO WORLD"));
    expect(rows[0]!.slice(0, 7)).toBe("#######");
    expect(rows[0]!.slice(14)).toBe("#######");
    expect(rows[20]!.slice(0, 7)).toBe("#######");
    expect(rows[6]!.slice(8, 13)).toBe("#.#.#");
    expect(rows[13]![8]).toBe("#"); // the dark module at (8, 4V + 9)
  });

  it("the SVG path has one square per dark module inside the quiet zone", () => {
    const code = encodeQr("HELLO WORLD");
    const { d, viewBox } = qrSvgPath(code, 4);
    expect(viewBox).toBe("0 0 29 29");
    let dark = 0;
    for (const v of code.modules) dark += v;
    expect(d.match(/h1v1h-1z/g)).toHaveLength(dark);
    expect(d.startsWith("M4 4h1v1h-1z")).toBe(true);
  });

  const toqr = loadToqr();
  const compare = toqr ? it : it.skip;
  compare("reproduces toqr module for module, under one of the eight masks, on sign-in URIs across versions 1, 7, 8, 9 and 10", () => {
    // The two encoders score the masks differently — this one with the
    // format bits drawn, as the reference implementations do, toqr before
    // them — so the mask they choose can differ (it does for the fourth
    // URI); the symbol under toqr's mask must be toqr's exactly, which holds
    // the data bits, the Reed–Solomon codewords, the interleaving, the
    // placement, the format and the version information to the standard.
    for (const text of URIS) {
      const theirs = rowsOf(toqr!(text, 0)).join("\n");
      const matches = [0, 1, 2, 3, 4, 5, 6, 7].filter((mask) => qrRows(encodeQr(text, { mask })).join("\n") === theirs);
      expect(matches, text.slice(0, 40)).toHaveLength(1);
    }
  });
  compare("chooses the same mask as toqr where the format bits do not tip the score", () => {
    for (const text of [URIS[0]!, URIS[1]!, URIS[2]!, URIS[4]!]) expect(qrRows(encodeQr(text))).toEqual(rowsOf(toqr!(text, 0)));
  });
  if (!toqr) console.log("tests/qr.test.ts: toqr is not in the pnpm store; the module-for-module comparison was skipped");
});
