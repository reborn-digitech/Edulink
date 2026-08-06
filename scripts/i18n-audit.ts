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

/**
 * ⚠ AND THE SERVER ACTIONS, which were the THIRD blind spot and were found the
 * same way as the first two: by reading a form that had just been translated.
 *
 * `ROOTS` above walks `.tsx`. Every `actions.ts` beside those components is
 * `.ts`, so none of them were ever opened — and a server action's whole
 * user-visible surface is `return { ok: false, error: "…" }`, which is the
 * sentence a reader sees the moment they mistype something. A Marathi admin
 * filling in a fully-translated class form and leaving the name blank got
 * "Give the class a name." back in English.
 *
 * Counted here rather than in `userVisible`, because the shape is different:
 * not JSX and not a `label:` in a lookup table, but the value of an `error`,
 * `_form` or `errors` field on a returned object.
 */
const APP_TS_ROOTS = ["src/app"];

function actionMessages(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const found: string[] = [];
  for (const key of ["error", "_form", "message", "reason"]) {
    const re = new RegExp(`\\b${key}:\\s*["'\`]([^"'\`]{6,200})["'\`]`, "g");
    for (const m of code.matchAll(re)) found.push(m[1]!.trim());
  }
  return [...new Set(found)].filter((s) => /[a-z]/.test(s) && /\s/.test(s));
}

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
  // ⚠ GREEDY, AND LINE-BOUNDED. This was non-greedy, so it stopped at the FIRST
  // `)` — and `formatUtcMoment(new Date(slot.startsAt), locale)` hides its
  // locale behind a nested call. Two correct call sites were reported as
  // unlocalised, which is the kind of noise that teaches you to stop reading.
  // Greedy to the last `)` on the line fixes it; the cost is that two calls on
  // ONE line are judged together, which no call site here does.
  for (const m of code.matchAll(
    /\b(formatDateKey|relativeTime|formatInZone|formatUtcMoment|formatUtcTime)\(([^;\n]*)\)/g,
  )) {
    // Crude but adequate: a call that never mentions `locale` is not passing one.
    if (!/\blocale\b/.test(m[2] ?? "")) n++;
  }
  /**
   * ⚠ AND `toUTCString`, WHICH IS THE SAME MISS WITH NO LOCALE TO FORGET.
   *
   * Six screens of the expert surface rendered a date as
   * `startsAt.toUTCString().slice(0, 22)`. It takes no locale, so the rule above
   * had nothing to check; it is not a string literal, so the counter could not
   * see it either. A fully translated Marathi page read `Mon, 14 Sep 2026 09:00`
   * and BOTH numbers above said the file was finished.
   *
   * `.slice(17, 22)` on its own is just `HH:MM` and reads the same in every
   * language, so only the calls that keep the weekday and month are counted.
   */
  for (const m of code.matchAll(/\.toUTCString\(\)(\.slice\(\s*(\d+)\s*,\s*\d+\s*\))?/g)) {
    if (m[2] === undefined || Number(m[2]) === 0) n++;
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
  //
  // ⚠ NOT AFTER AN ARROW. `=> Promise<…>` is a return type, and the `>` of the
  // arrow made every one of them look like a JSX text node saying "Promise".
  // Three files reported one untranslated string that did not exist, which is
  // the kind of noise that teaches you to stop reading the output.
  for (const m of code.matchAll(/(^|[^=])>\s*([A-Z][^<>{}\n]{3,120}?)\s*</gm)) {
    found.push(m[2]!.trim());
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
    // A DOTTED KEY IS THE FIX, NOT THE PROBLEM. Once a lookup table holds
    // `labelKey: "classes.duplicateName"` the `name:`/`label:` rules above
    // match the KEY, and a finished file reports itself as unfinished.
    .filter((s) => !/^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/.test(s))
    .filter((s) => !s.includes("t(\""))
    // ⚠ NOR A CONDITION THAT HAPPENS TO CONTAIN A `>`. Rule 1 reads a JSX text
    // node as "> words <", and `…getTime() > Date.now() && (` looks exactly
    // like one. No sentence a parent reads contains `&&`, `||`, `=>` or a call.
    .filter((s) => !/&&|\|\||=>|\w\(\)/.test(s));
}

function scan(): Finding[] {
  const files = [
    ...ROOTS.flatMap((root) => walk(root, ".tsx")),
    ...LIB_ROOTS.flatMap((root) => walk(root, ".ts")).filter((f) => !f.includes("i18n")),
    ...APP_TS_ROOTS.flatMap((root) => walk(root, ".ts")),
  ].sort();

  const out: Finding[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const strings = file.endsWith(".ts")
      ? [...new Set([...userVisible(source), ...actionMessages(source)])]
      : userVisible(source);
    const dates = unlocalisedDates(source);
    if (strings.length > 0 || dates > 0) out.push({ file, strings, dates });
  }
  return out;
}

const target = process.argv[2];
const findings = scan();

if (target) {
  /**
   * ⚠ EVERY MATCH, NOT THE FIRST ONE. This was `findings.find(…)`, and the
   * fragment is how a whole surface gets translated one role at a time — so
   * `-- expert` answered with a single file holding one string and looked like
   * a finished job. The role had thirteen files. A tool used to decide "am I
   * done here" must not stop at the first answer it likes.
   */
  const matches = findings.filter((f) => f.file.includes(target));
  if (matches.length === 0) {
    console.log(`No untranslated strings found in anything matching "${target}".`);
    process.exit(0);
  }
  const strings = matches.reduce((n, f) => n + f.strings.length, 0);
  const dates = matches.reduce((n, f) => n + f.dates, 0);
  console.log(
    `${matches.length} file${matches.length === 1 ? "" : "s"} matching "${target}" — ` +
      `${strings} strings, ${dates} unlocalised dates`,
  );
  for (const one of matches) {
    console.log(`\n${one.file} — ${one.strings.length} strings, ${one.dates} unlocalised dates\n`);
    for (const s of one.strings) console.log(`  ${s}`);
  }
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
