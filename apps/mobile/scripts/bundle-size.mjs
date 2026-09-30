#!/usr/bin/env node
/**
 * The bundle-size gate.
 *
 *   node scripts/bundle-size.mjs            export both platforms, measure, gate
 *   node scripts/bundle-size.mjs --json     also write bundle-size.json for the trend
 *
 * The plan's target was a JavaScript bundle under 4 MB for the first
 * twenty screens; the app now carries every section of the web's NAV for
 * every role (about fifty screens), and the gate moved with it — 4.5 MB
 * target, 5 MB ceiling — after checking that nothing heavier than a screen
 * had come in (no new dependency, icons still per file). Metro's minified JS is
 * measured (what Hermes compiles; the .hbc it becomes is about 8% larger and
 * is reported too when present). Above the target is a warning that names
 * the number; above the ceiling the gate fails.
 *
 * On 30 Sep 2026 the bundle stood at 5.82 MB, over the ceiling for some
 * commits while CI was refused, and 1.75 MB of it was the three dictionaries
 * whole, the web's sentences with the phone's. A release now carries the
 * phone's share of them (scripts/i18n-subset.cjs, swapped in by
 * metro.config.js), which is what this measures: 4.93 MB on Android, 0.07 MB
 * under the ceiling, about one feature's screens. The owner was given the
 * choice that day (trim the icons' unused weights, raise the ceiling, or leave
 * it) and raised the ceiling to 5.5 MB. The target is where it was, so every
 * run still names the number; what the ceiling costs is the weight of each
 * over-the-air update, 1.26 MB gzipped at 4.93 MB. The levers not yet pulled,
 * by the source map: the icons, 0.23 MB with six weights drawn for each where
 * the phone uses three, and the screens themselves, 1.31 MB.
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TARGET_MB = 4.5;
const CEILING_MB = 5.5;
const MB = 1024 * 1024;

const out = mkdtempSync(join(tmpdir(), "edulink-bundle-"));
try {
  execSync(`npx expo export --platform ios --platform android --no-bytecode --output-dir ${out}`, { stdio: ["ignore", "ignore", "inherit"], env: { ...process.env, CI: "1" } });
  const rows = [];
  for (const platform of ["ios", "android"]) {
    const dir = join(out, "_expo", "static", "js", platform);
    const files = readdirSync(dir).filter((f) => f.endsWith(".js") || f.endsWith(".hbc"));
    for (const file of files) {
      const bytes = statSync(join(dir, file)).size;
      const gz = gzipSync(readFileSync(join(dir, file))).length;
      rows.push({ platform, kind: file.endsWith(".hbc") ? "hermes" : "js", mb: +(bytes / MB).toFixed(2), gzipMb: +(gz / MB).toFixed(2) });
    }
  }
  const js = rows.filter((r) => r.kind === "js");
  const worst = Math.max(...js.map((r) => r.mb));
  for (const r of rows) console.log(`${r.platform.padEnd(8)} ${r.kind.padEnd(7)} ${String(r.mb).padStart(5)} MB  (${r.gzipMb} MB gzipped)`);
  console.log(`largest JS bundle ${worst} MB · target ${TARGET_MB} MB · ceiling ${CEILING_MB} MB`);
  if (process.argv.includes("--json")) writeFileSync("bundle-size.json", JSON.stringify({ at: new Date().toISOString(), commit: process.env.GITHUB_SHA ?? null, targetMb: TARGET_MB, ceilingMb: CEILING_MB, bundles: rows }, null, 2) + "\n");
  if (worst > CEILING_MB) {
    console.error(`bundle-size: ${worst} MB is over the ${CEILING_MB} MB ceiling`);
    process.exit(1);
  }
  if (worst > TARGET_MB) console.warn(`bundle-size: ${worst} MB is over the ${TARGET_MB} MB target (under the ceiling)`);
} finally {
  rmSync(out, { recursive: true, force: true });
}
