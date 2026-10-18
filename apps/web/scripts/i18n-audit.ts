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
 *   - product nouns that are the same in every language (Chrome, PDF), and the
 *     product's own name standing alone in Latin letters (Shalaghar) — in a
 *     sentence it comes from the dictionary, where Hindi and Marathi spell it
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
  "Shalaghar", "Chrome", "Safari", "Firefox", "Edge", "Android", "iPhone", "iPad",
  "Mac", "Windows", "Linux", "PDF", "PNG", "JPEG", "WebP", "GIF", "CSV", "SMS",
  // The bundled typefaces, by the names their files give them (src/lib/fonts.ts).
  "Noto Sans Devanagari", "Noto Serif Devanagari", "Tiro Devanagari Marathi", "Noto Sans", "Noto Serif",
  // website-builder A (15 Oct 2026): a job's name, a code the crontab and /root/jobs key on (its words are website.jobDesc).
  "site:refresh",
  "site:domains", // the job name the scheduler prints, a code like site:refresh (15 Oct 2026)
  // end website-builder A
  // website-two (16 Oct 2026): a job's name, a code the crontab and /root/jobs key on (its words are root.jobDescSiteEnquiries).
  "site:enquiries",
  // end website-two
  // meta-posting (16 Oct 2026): two job names, codes the crontab and /root/jobs key on (their words are root.jobDescSocialSend and root.jobDescSocialRefresh).
  "social:send",
  "social:refresh",
  // end meta-posting
  // plans (16 Oct 2026): a job's name, a code the crontab and /root/jobs key on (its words are root.jobDescPlansExpire).
  "plans:expire",
  // end plans
  // plans-pay (17 Oct 2026): a job's name, a code the crontab and /root/jobs key on (its words are root.jobDescPassExpiring).
  "pass:expiring",
  // end plans-pay
  // seats (17 Oct 2026): a job's name, a code the crontab and /root/jobs key on (its words are root.jobDescSessionsRemind).
  "sessions:remind",
  // end seats
  // vidura pass 3 (18 Oct 2026): a job's name, a code the crontab and /root/jobs key on (its words are root.jobDescViduraGaps).
  "vidura:gaps",
]);

const PROPS = ["title", "description", "label", "placeholder", "hint", "alt", "aria-label", "empty", "cta"];

export type Finding = { file: string; strings: string[] };

/**
 * ⚠ THERE USED TO BE A DATE COUNTER HERE, AND ITS ABSENCE IS A DECISION.
 *
 * For a while this script also counted date-formatter calls that omitted a
 * `locale`, because a fully translated Hindi page still read "WEDNESDAY,
 * AUGUST 5" mid-sentence. Threading the locale through produced something
 * worse: Marathi dates in Devanagari digits (`१४ सप्टें`) next to ASCII
 * `{count}`s, so one line mixed numeral systems. The product rule that settled
 * it: THE LANGUAGE TOGGLE MOVES LABELS AND HEADINGS — static visible text —
 * AND NOTHING ELSE. Dates, times and "2 hours ago" are values, and values read
 * the same in every language.
 *
 * The rule is enforced where it cannot rot: the formatters in `lib/dates.ts`
 * no longer HAVE a locale parameter, so a call site that tries to pass one is
 * a type error, not an audit finding. A counter here would be a second, weaker
 * copy of what the compiler already refuses.
 */

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

  // 1c. JSX text the one-line rule cannot see: a sentence that starts its own
  // line (the node spans lines, or holds an `{interpolation}` — both broke
  // rule 1's `[^{}\n]` window). "Week of {date}", "Hi {name} 👋", and whole
  // paragraphs wrapped by prettier all lived here, on pages reported finished.
  for (const line of code.split("\n")) {
    const m = line.match(/^\s*([A-Z][a-zA-Z0-9,'’&—.\- ]{8,})(\{|$)/);
    if (
      m &&
      /\s/.test(m[1]!.trim()) && // a lone token is an import member, not a sentence
      !/\b(const|let|return|export|import|function|type|interface)\b/.test(line)
    ) {
      found.push(m[1]!.trim());
    }
  }

  // 1d. THE SIXTH BLIND SPOT: English TRAILING an inline element. Rule 1
  // anchors on a capital letter after `>`, but a fragment that CONTINUES a
  // sentence starts lowercase — `<strong>{url}</strong> and type this code.`
  // — so the wall poster's tail and the parent dashboard's "would like to
  // enter …, run by …" walked past every rule here. Two shapes: lowercase
  // words after a closing tag, and a line that OPENS with a comma and prose
  // (the fragment that follows a </Link> wrapped to its own line).
  for (const m of code.matchAll(/<\/\w+>\s*([a-z][a-zA-Z,'’ ]{6,120}?)(?=[<{.\n]|$)/g)) {
    const text = m[1]!.trim();
    if (/\s[a-z]/.test(text)) found.push(text);
  }
  for (const line of code.split("\n")) {
    const m = line.match(/^\s*(,\s*[a-z][a-zA-Z'’ ]{4,})[{.]/);
    if (m && /\s[a-z]/.test(m[1]!)) found.push(m[1]!.trim());
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

  // 3. EXPRESSION-POSITION STRINGS — the FOURTH blind spot, found the same way
  // as the other three: by reading a page the counter called finished. Rules 1
  // and 2 see JSX text nodes and static props, so `hint="Register taken"` is
  // counted but `hint={taken ? "Register taken" : "Not yet"}` is invisible —
  // and so is every toast title, every `setError("…")`, every `?? "fallback"`.
  // Twenty finished-looking files held ~50 strings in exactly these shapes.
  //
  // Pre-strip what is never read by a person: class lists, hrefs, keys,
  // console noise and thrown errors (the last two excluded by design — see the
  // header). Then: a quoted string in an expression context (after ?, :, a
  // comma, an opening paren or brace) that starts with a capital and holds at
  // least two words is treated as a sentence somebody will read.
  const exprCode = code
    .replace(/\b(className|href|key|src|id|htmlFor|style|accept)=\{[^{}]*(\{[^}]*\}[^{}]*)*\}/g, "")
    .replace(/\b(className|href|key|src|id|htmlFor|accept)="[^"]*"/g, "")
    .replace(/console\.\w+\([^)]*\)/g, "")
    .replace(/throw new \w*Error\([^)]*\)/g, "");
  for (const m of exprCode.matchAll(/[?(:,{]\s*"([A-Z][^"\n]*\s[^"\n]{2,})"/g)) {
    found.push(m[1]!.trim());
  }
  // Template literals: strip the `${…}` holes, and what remains must still
  // contain running words ("waiting to sync") — not a path, not a query string.
  for (const m of exprCode.matchAll(/`([^`\n]{4,200})`/g)) {
    const raw = m[1]!;
    if (/^[/.]|:\/\//.test(raw)) continue;
    const stripped = raw.replace(/\$\{[^}]*\}/g, " ");
    if (/[A-Za-z]{3,}\s+[a-z]{2,}/.test(stripped) && !/[a-z]-[a-z].*[a-z]-[a-z]/.test(stripped)) {
      found.push(raw.replace(/\s+/g, " ").trim());
    }
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
    // `places.ts` is a table of place names — "Tamil Nadu", "West Bengal" —
    // which are VALUES the directory filters on, the same string in every
    // language by the rule in the header, not sentences a reader is owed a
    // translation of. Counting them would report a finished file unfinished.
    ...LIB_ROOTS.flatMap((root) => walk(root, ".ts")).filter(
      // …and the endpoint catalog, whose `summary` lines are the OpenAPI
      // document's prose for developers, in English by design like email.ts.
      //
      // …and the boot check. Every string in env.ts is a `message:` for the
      // operator's console — assertEnv prints them with console.warn/error,
      // the channel the header already excludes — and none is read through a
      // locale. They were counted only because the server-action rule reads
      // the same `message:` key; the release's kill-switch variables added
      // three more and made the accident visible. gig-gateway-env.ts is the
      // same boot check for the company's gateway, kept out of env.ts only
      // so the fees invariant's regex on its variable names stays true.
      //
      // …and the text-message registry. message-templates.ts holds every
      // sentence a family can be sent BY SMS OR WHATSAPP, in English, Hindi
      // and Marathi side by side, and its English is the English variant of
      // a trilingual table — the very thing this counter exists to produce,
      // not a string waiting to be moved into it. Its labels go through the
      // dictionary (labelKey); its texts are registered with carriers as
      // written, which is why they cannot live in the dictionary's fold.
      //
      // …and the UDISE+ impairment list. filing-codes.ts is the portal's own
      // twenty-one names beside their codes — values the record form shows
      // so a family can find the code the portal takes, like places.ts's
      // state names, not sentences of the app's. The portal reads the code.
      // …and the filings library, whose strings are the UDISE+ bulk sheet's
      // and the boards' own column headings and code legends — the portal
      // reads them, not a person, and a translated heading would not upload.
      // …and the inventory and payroll files' headings (module-file-headings.ts):
      // the ESIC sheet's and a bank's bulk-upload columns and the auditor's, the same case.
      // …and the Tally export (tally-export.ts): the envelope's tag values
      // ("Import Data", "Vouchers") are Tally's own import grammar and the
      // narrations are what Tally, an English program, shows the accountant
      // beside the ledger names it already fixes; the file is read by Tally.
      // …and the peer-team visit file (peer-visits.ts), whose five flagged
      // strings are joins of a framework code, a year, a filing status code
      // and a metric id ("SSR 2025 · FILED", "NBA 2026"): codes the page
      // shows beside its translated headings, like filing-codes.ts.
      // …the generation job's library (quiz-publish-jobs, 11 Oct 2026): src/lib/quiz-jobs.ts's three strings are a
      // failed run's diagnostics recorded on its row like a log line (a dead runner's pid, an exception's own text,
      // the model script's exit), in English as the runner's log and the exceptions they carry are; the page
      // prints them after its translated label (quizJobs.errorLine) and every sentence around them is a key.
      // …the competitions crawl's job library (competitions-crawler, 12 Oct 2026): src/lib/competition-crawl-jobs.ts's two
      // strings are a failed crawl's diagnostics recorded on its row like a log line (an exception's own text, the model
      // script's exit), exactly as quiz-jobs.ts's are; the desk prints them after its translated label (quizJobs.errorLine).
      // …the papers' style reader (11 Oct 2026): src/lib/quiz-style.ts holds the corpus's subject VALUES the
      // ContentDocument rows carry ("Political Science"), matched against stored rows, and the SQL expression its
      // scan orders by; it returns excerpts to the quiz generator's prompt and nothing of it reaches a page.
      // …the data questions' summary lines (11 Oct 2026): src/lib/assistant/summary.ts and router.ts write the person's own
      // doors' answers summed up for the model ("items: 7 rows; by status: PENDING 2"), in English like the prompt, read by
      // the model and never by a person; the LINK citations a person reads are dictionary keys (assistantData.*).
      // …the exam-scope reader's lines (10 Oct 2026): src/lib/assistant/exams.ts writes the pupil's own sittings for the
      // model to read beside the passages, in English like the prompt; the model answers in the person's language.
      // …and the assistant's system prompt (Phase B, 10 Oct 2026): src/lib/assistant/prompt.ts is the model's only
      // instruction channel, read by the model and never by a person; every sentence a person reads is a
      // dictionary key (assistantService.*).
      // …and the assistant's three libraries (Phase A, 8 Oct 2026): assistant-env.ts is a boot check
      // like env.ts (every string a `message:` for the operator's console); assistant-model.ts holds
      // the embedding model's query instructions, which the model card wants in English whatever
      // the question's language, read by the model and never by a person; assistant-retrieval.ts's
      // one string is the SQL expression its full-text index is built on. None reaches a page.
      (f) => !f.includes("i18n") && !f.endsWith("/places.ts") && !f.includes("/api-catalog/") && !f.endsWith("/lib/env.ts") && !f.endsWith("/lib/gig-gateway-env.ts") && !f.endsWith("/lib/message-templates.ts") && !f.endsWith("/lib/filing-codes.ts") && !f.endsWith("/lib/filings.ts") && !f.endsWith("/lib/module-file-headings.ts") && !f.endsWith("/lib/tally-export.ts") && !f.endsWith("/lib/peer-visits.ts") && !f.endsWith("/lib/assistant-env.ts") && !f.endsWith("/lib/assistant-model.ts") && !f.endsWith("/lib/assistant-retrieval.ts") && !f.endsWith("/lib/assistant/prompt.ts") && !f.endsWith("/lib/assistant/exams.ts") && !f.endsWith("/lib/assistant/summary.ts") && !f.endsWith("/lib/assistant/router.ts") && !f.endsWith("/lib/quiz-style.ts") && !f.endsWith("/lib/quiz-jobs.ts") && !f.endsWith("/lib/competition-crawl-jobs.ts"),
    )
      // website-builder A (15 Oct 2026): the school website's renderer (src/lib/site-render.ts) is HTML markup in template
      // literals — tags, attributes, CSS — and every word a reader sees in it comes from the dictionary (site.*) in the
      // page's language; the school's own words are its data. The markup is not a sentence to translate.
      .filter((f) => !f.endsWith("/lib/site-render.ts")),
    // end website-builder A
    ...APP_TS_ROOTS.flatMap((root) => walk(root, ".ts")),
  ].sort();

  const out: Finding[] = [];
  for (const file of files) {
    const source = readFileSync(file, "utf8");
    const strings = file.endsWith(".ts")
      ? [...new Set([...userVisible(source), ...actionMessages(source)])]
      : userVisible(source);
    if (strings.length > 0) out.push({ file, strings });
  }
  return out;
}

// A flag is not a path filter: `--max 189` gates, `-- expert` narrows.
const target = process.argv[2]?.startsWith("--") ? undefined : process.argv[2];
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
  console.log(
    `${matches.length} file${matches.length === 1 ? "" : "s"} matching "${target}" — ${strings} strings`,
  );
  for (const one of matches) {
    console.log(`\n${one.file} — ${one.strings.length} strings\n`);
    for (const s of one.strings) console.log(`  ${s}`);
  }
  process.exit(0);
}

const total = findings.reduce((n, f) => n + f.strings.length, 0);
console.log(`${findings.length} files still hold hardcoded English — ${total} strings.\n`);

/**
 * `--max N` turns the counter into a gate: CI asserts the floor and fails the
 * build when a change adds English the dictionaries do not have. Lowering the
 * floor is deliberate work and comes with the number in the workflow file.
 */
const maxFlag = process.argv.indexOf("--max");
if (maxFlag !== -1) {
  const max = Number.parseInt(process.argv[maxFlag + 1] ?? "", 10);
  if (Number.isNaN(max)) {
    console.error("--max needs a number, e.g. --max 189");
    process.exit(2);
  }
  if (total > max) {
    console.error(`i18n floor is ${max}; found ${total}. New hardcoded English — translate it or, if it is by design, exclude it in the audit.`);
    process.exit(1);
  }
  console.log(`i18n floor held: ${total} ≤ ${max}.`);
  process.exit(0);
}
for (const f of findings.slice(0, 25)) {
  console.log(`  ${String(f.strings.length).padStart(4)}  ${f.file}`);
}
if (findings.length > 25) console.log(`  … and ${findings.length - 25} more files`);
console.log(`\nOne file at a time:  npm run i18n -- <path fragment>`);
