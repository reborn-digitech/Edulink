#!/usr/bin/env node
/**
 * What the bundle is made of, by its source map.
 *
 *   npx expo export --platform android --no-bytecode --source-maps --output-dir <dir>
 *   node scripts/bundle-map.mjs <dir>/_expo/static/js/android/entry-….js [--top 20] [--json out.json] [--files]
 *
 * Every byte of the minified bundle is given to the source its mapping
 * segment names (a segment runs to the next one on its line; a line's bytes
 * before its first segment, and the newline, go to "(unmapped)"), then summed
 * by group: a package under node_modules by its name, a workspace package by
 * its folder (the three dictionaries each on their own line), the phone's own
 * source by its folder under src/ (screens by role). --files lists single
 * files instead of groups. --json writes the groups for a later comparison
 * (scripts/bundle-map.mjs --compare before.json after.json).
 *
 * Written for item 15 of the owner's batch of 27 October 2026 (the bundle at
 * 7.37 MB); the source-map walk the header of bundle-size.mjs describes,
 * kept here so the next measurement is one command and not a one-off.
 */
import { Buffer } from "node:buffer";
import { readFileSync, writeFileSync } from "node:fs";

const B64 = new Map([..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"].map((c, i) => [c, i]));

/** The source index of each segment of each generated line, with its starting column. */
function* segments(mappings) {
  let source = 0;
  let line = 0;
  let at = 0;
  while (at < mappings.length) {
    const lineEnd = (() => {
      const semi = mappings.indexOf(";", at);
      return semi < 0 ? mappings.length : semi;
    })();
    let column = 0;
    while (at < lineEnd) {
      const fields = [];
      while (at < lineEnd && mappings[at] !== ",") {
        let value = 0;
        let shift = 0;
        for (;;) {
          const digit = B64.get(mappings[at++]);
          value += (digit & 31) << shift;
          shift += 5;
          if (!(digit & 32)) break;
        }
        fields.push(value & 1 ? -(value >>> 1) : value >>> 1);
      }
      at++; // the comma, or one past the line
      column += fields[0];
      if (fields.length > 1) {
        source += fields[1];
        yield { line, column, source };
      } else yield { line, column, source: -1 };
    }
    if (at === lineEnd) at++;
    line++;
  }
}

export function groupOf(source) {
  const s = source.replace(/\\/g, "/");
  const nm = s.lastIndexOf("/node_modules/");
  if (nm >= 0) {
    const rest = s.slice(nm + "/node_modules/".length).split("/");
    return rest[0].startsWith("@") ? `${rest[0]}/${rest[1]}` : rest[0];
  }
  const dict = /packages\/i18n\/src\/(en|hi|mr)\.ts$/.exec(s) ?? /apps\/mobile\/i18n-subset\/(\w+)\.js$/.exec(s);
  if (dict) return `dictionary ${dict[1]}`;
  const ws = /packages\/([\w-]+)\//.exec(s);
  if (ws) return `@edulink/${ws[1]}`;
  const app = /apps\/mobile\/(src\/screens\/[\w-]+|src\/[\w-]+|app|[\w-]+)/.exec(s);
  if (app) return `phone ${app[1]}`;
  return s;
}

export function attribute(code, map, { files = false } = {}) {
  const lines = code.split("\n");
  const sizes = new Map();
  const add = (name, bytes) => sizes.set(name, (sizes.get(name) ?? 0) + bytes);
  const name = (index) => (index < 0 ? "(unmapped)" : files ? map.sources[index] : groupOf(map.sources[index]));
  const flush = (seg, endColumn) => {
    const text = lines[seg.line] ?? "";
    add(name(seg.source), Buffer.byteLength(text.slice(seg.column, endColumn)));
  };
  const byLine = new Map();
  for (const seg of segments(map.mappings)) {
    if (!byLine.has(seg.line)) byLine.set(seg.line, []);
    byLine.get(seg.line).push(seg);
  }
  lines.forEach((text, line) => {
    const segs = byLine.get(line) ?? [];
    const first = segs.length ? segs[0].column : text.length;
    add("(unmapped)", Buffer.byteLength(text.slice(0, first)) + 1);
    segs.forEach((seg, i) => flush(seg, i + 1 < segs.length ? segs[i + 1].column : undefined));
  });
  return [...sizes.entries()].sort((a, b) => b[1] - a[1]);
}

const KB = (n) => `${(n / 1024).toFixed(0).padStart(6)} KB`;

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === "--compare") {
    const [before, after] = [JSON.parse(readFileSync(args[1], "utf8")), JSON.parse(readFileSync(args[2], "utf8"))];
    const names = new Set([...Object.keys(before.groups), ...Object.keys(after.groups)]);
    const rows = [...names].map((n) => [n, before.groups[n] ?? 0, after.groups[n] ?? 0]).sort((a, b) => b[2] - a[2]);
    const top = Number(args[args.indexOf("--top") + 1]) || 25;
    console.log(`${"".padEnd(44)}${"before".padStart(9)}${"after".padStart(10)}${"change".padStart(10)}`);
    for (const [n, b, a] of rows.slice(0, top)) console.log(`${n.slice(0, 43).padEnd(44)}${KB(b)}${KB(a)}${KB(a - b)}`);
    console.log(`${"total".padEnd(44)}${KB(before.total)}${KB(after.total)}${KB(after.total - before.total)}`);
    process.exit(0);
  }
  const file = args.find((a) => !a.startsWith("--"));
  const code = readFileSync(file, "utf8");
  const map = JSON.parse(readFileSync(`${file}.map`, "utf8"));
  const rows = attribute(code, map, { files: args.includes("--files") });
  const total = rows.reduce((s, [, n]) => s + n, 0);
  const top = args.includes("--top") ? Number(args[args.indexOf("--top") + 1]) : 20;
  for (const [n, bytes] of rows.slice(0, top)) console.log(`${KB(bytes)}  ${(100 * bytes / total).toFixed(1).padStart(5)} %  ${n}`);
  console.log(`${KB(total)}  total (${Buffer.byteLength(code)} bytes in the file)`);
  if (args.includes("--json")) writeFileSync(args[args.indexOf("--json") + 1], JSON.stringify({ file, total, groups: Object.fromEntries(rows) }, null, 1) + "\n");
}
