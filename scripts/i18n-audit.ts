import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * What is still hardcoded English.
 *
 * ⚠ "TRANSLATE THE REST OF THE APP" HAS NO FINISH LINE WITHOUT THIS. The work is
 * 177 files and roughly 1,500 strings; done by eye it is impossible to say
 * whether it is a third or nine tenths done, impossible to prove a file is
 * finished, and impossible to notice the next English string somebody adds. So
 * the counter comes first and the translating comes second.
 *
 * IT IS A HEURISTIC AND SAYS SO. It reads JSX text nodes and the handful of
 * props that reach a reader — `title`, `description`, `label`, `placeholder`,
 * `hint`, `alt`, `aria-label`, `empty` — and it deliberately does NOT try to
 * parse TypeScript. It will miss a string built by concatenation and it will
 * flag the odd proper noun. Both failures are cheap: the number is for tracking
 * progress and catching regressions, not for gating a build. `npm run i18n` to
 * see where things stand, `-- <path>` to see one file's strings.
 *
 * WHAT IT DOES NOT COUNT, on purpose:
 *   - product nouns that are the same in every language (EduLink, Chrome, PDF)
 *   - anything already inside t("…")
 *   - `console.*`, thrown Error messages, and comments: not read by a parent
 */

const ROOTS = ["src/app", "src/components"];

/**
 * ⚠ AND THE LOOKUP TABLES IN `src/lib`, which the first version did not read at
 * all — it only opened `.tsx`. A screenshot is what caught it: the guardian's
 * attendance page reported CLEAR while still showing "Late", "Absent",
 * "Arrived after the bell". Those live in `ATTENDANCE_META`, a plain object in
 * `constants.ts`, and the same shape hides in `badges.ts`, `holidays.ts`,
 * `onboarding.ts`, `quiz.ts` and `school-day.ts`.
 *
 * The lesson is worth more than the fix: a counter that only looks where you
 * expect the problem reports the problem solved. This one now reads both, and
 * the total it prints is a FLOOR rather than a certainty — see the header.
 */
const LIB_ROOTS = ["src/lib"];

/** Same in every language, or not shown to a reader. */
const SKIP_EXACT = new Set([
  "EduLink", "Chrome", "Safari", "Firefox", "Edge", "Android", "iPhone", "iPad",
  "Mac", "Windows", "Linux", "PDF", "PNG", "JPEG", "WebP", "GIF", "CSV", "SMS",
]);

const PROPS = ["title", "description", "label", "placeholder", "hint", "alt", "aria-label", "empty", "cta"];

export type Finding = { file: string; strings: string[]; dates: number };

/**
 * ⚠ DATES ARE THE MISS A STRING COUNT CANNOT SEE, and a screenshot caught it.
 *
 * `formatDateKey` and `relativeTime` both take a locale and both DEFAULT TO
 * "en". Every call site in the app omitted it, so a fully translated Hindi page
 * still read "WEDNESDAY, AUGUST 5" and "3 days ago" in the middle of a Hindi
 * sentence. Nothing about that is a hardcoded string, so the counter above was
 * blind to it and reported the page finished.
 *
 * Counted separately rather than folded into the string total: they are a
 * different fix (thread the locale through) and mixing them would make the
 * headline number mean two things.
 */
function unlocalisedDates(source: string): number {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  let n = 0;
  for (const m of code.matchAll(/\b(formatDateKey|relativeTime)\(([^;]*?)\)/g)) {
    // Crude but adequate: a call that never mentions `locale` is not passing one.
    if (!/\blocale\b/.test(m[2] ?? "")) n++;
  }
  return n;
}

/** Every .tsx under a directory. No dependency, so this runs anywhere. */
function walk(dir: string, ext: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path, ext));
    else if (entry.name.endsWith(ext) && !entry.name.endsWith(".test.ts")) out.push(path);
  }
  return out;
}

function userVisible(source: string): string[] {
  // Strip comments and imports first: a sentence in a comment is not a string a
  // parent reads, and this file's own prose would otherwise dominate the count.
  const code = source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/^import[\s\S]*?from\s+["'][^"']+["'];?$/gm, "");

  const found: string[] = [];

  // 1. JSX text nodes: >Some words<
  for (const m of code.matchAll(/>\s*([A-Z][^<>{}\n]{3,120}?)\s*</g)) {
    found.push(m[1]!.trim());
  }

  // 1b. Reader-facing VALUES in lookup tables — `label: "Late"` and friends.
  for (const key of ["label", "short", "hint", "title", "description", "name"]) {
    const re = new RegExp(`\\b${key}:\\s*["'\`]([^"'\`]{4,160})["'\`]`, "g");
    for (const m of code.matchAll(re)) found.push(m[1]!.trim());
  }

  // 2. Reader-facing props.
  for (const prop of PROPS) {
    const re = new RegExp(`\\b${prop}=\\{?["'\`]([^"'\`]{3,160})["'\`]`, "g");
    for (const m of code.matchAll(re)) found.push(m[1]!.trim());
  }

  return [...new Set(found)]
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length >= 4)
    .filter((s) => /[a-z]/.test(s))          // needs lowercase letters: skips ACRONYMS
    .filter((s) => !SKIP_EXACT.has(s))
    .filter((s) => !/^[a-z-]+$/.test(s))     // css-ish tokens
    .filter((s) => !s.includes("t(\""));
}

function scan(): Finding[] {
  const files = [
    ...ROOTS.flatMap((root) => walk(root, ".tsx")),
    ...LIB_ROOTS.flatMap((root) => walk(root, ".ts")).filter((f) => !f.includes("i18n")),
  ].sort();

  const out: Finding[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const strings = userVisible(source);
    const dates = unlocalisedDates(source);
    if (strings.length > 0 || dates > 0) out.push({ file, strings, dates });
  }
  return out;
}

const target = process.argv[2];
const findings = scan();

if (target) {
  const one = findings.find((f) => f.file.includes(target));
  if (!one) {
    console.log(`No untranslated strings found in anything matching "${target}".`);
    process.exit(0);
  }
  console.log(`${one.file} — ${one.strings.length} strings, ${one.dates} unlocalised dates\n`);
  for (const s of one.strings) console.log(`  ${s}`);
  process.exit(0);
}

const total = findings.reduce((n, f) => n + f.strings.length, 0);
const dateTotal = findings.reduce((n, f) => n + f.dates, 0);
console.log(`${findings.length} files still hold hardcoded English — ${total} strings.`);
console.log(`${dateTotal} date calls still render in English whatever the reader's language.\n`);
for (const f of findings.slice(0, 25)) {
  const d = f.dates > 0 ? `  (+${f.dates} dates)` : "";
  console.log(`  ${String(f.strings.length).padStart(4)}  ${f.file}${d}`);
}
if (findings.length > 25) console.log(`  … and ${findings.length - 25} more files`);
console.log(`\nOne file at a time:  npm run i18n -- <path fragment>`);
