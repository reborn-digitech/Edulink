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
 * over-the-air update, 1.26 MB gzipped at 4.93 MB.
 *
 * By 1 Oct 2026 two waves of screens had brought it to 5.37 MB. The icons now
 * carry the four weights the phone draws, not six (scripts/icon-weights.cjs,
 * 66 KB): 5.31 MB. What is left, by the source map: the screens, 1.73 MB, of
 * which about 0.6 MB is the React Compiler's memo caches (app.json
 * experiments.reactCompiler; 4.71 MB with it off, measured, not taken); the
 * three dictionaries' phone share, 1.05 MB, every key named in the phone's
 * source; contracts, 0.24 MB, 77 KB of it schemas the phone does not use that
 * only Expo's unstable tree shaking leaves out.
 *
 * On 2 Oct 2026 the owner was given the choice again (the compiler off for
 * the office, operator and expert screens, about 275 KB; off everywhere,
 * 4.71 MB; the ceiling raised; or the dictionaries fetched on first use) and
 * raised the ceiling to 6 MB, the code untouched. The target stays at 4.5, so
 * every run still names the number and the distance; what the ceiling costs
 * is the weight of each over-the-air update, 1.36 MB gzipped at 5.31 MB, and
 * the first open on a poor connection.
 *
 * On 1 Nov 2026 the first CI run since billing was restored measured 7.12 MB
 * iOS and 7.37 MB Android (1.8 and 1.86 MB gzipped): October's screens (the
 * plan lock card, payroll and payslips, the menu groups and More sheet, the
 * head's pages, family transport, support staff, the subject teachers' work,
 * the QA fixes) and the dictionaries' growth to 11,087 keys a language. The
 * ceiling is raised to 7.5 MB PROVISIONALLY, by the coordinator, so the other
 * CI jobs run; a builder is measuring the bundle by source map and cutting it
 * (the dictionaries fetched on first use, the icon weights, heavy screens made
 * lazy), after which the ceiling comes back down to the measured number.
 *
 * Measured the same day by source map (scripts/bundle-map.mjs, against the
 * 2 Oct commit 58d4a183 built in a worktree: 5.45 → 7.37 MB Android): the
 * contracts 237 → 697 KB, Hindi and Marathi 794 → 1,364 KB, English and the
 * key names 255 → 439 KB, the college and module screens about 0.6 MB. Three
 * cuts, no feature lost: Hindi and Marathi fetched on first use from the
 * web's /i18n/<locale>.<hash>.json and kept on the phone, the first screens'
 * keys still bundled (src/lib/i18n-words.ts; −1,302 KB); Expo's own
 * EXPO_ROUTER_DISABLE_NATIVE_TABS_MD, which leaves out a 79 KB Material
 * Symbols table expo-router's native tabs carry on Android and the app never
 * draws (−88 KB); and the 24 contracts files the phone imports no value from
 * left out where the index re-exports them (scripts/contracts-subset.cjs;
 * −96 KB). 5.92 MB Android, 5.76 MB iOS (1.59 and 1.56 MB gzipped).
 */
import { execSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TARGET_MB = 4.5;
const CEILING_MB = 6;
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
