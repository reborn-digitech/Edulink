/**
 * The phone's share of the dictionaries.
 *
 * packages/i18n holds what both apps say: some 7,600 keys in each of three
 * languages, most of them the web's. Metro has no way to leave out the ones
 * no screen of the phone asks for, so the bundle carried all of them: 1.75 MB
 * of a 5.8 MB bundle, about half of it sentences the phone could never show
 * (measured from the source map, 30 Sep 2026). This finds the keys the phone
 * can ask for and writes the three dictionaries with only those; metro.config.js
 * hands Metro these files in place of the whole ones when it bundles a release.
 *
 * WHAT THE PHONE CAN ASK FOR, from four places:
 *   1. every string in the phone's own source that is a key of the dictionary
 *      (a t("…") call, a map of keys, a menu entry);
 *   2. every key under a prefix the source builds at run time
 *      (t(`role.${x}`) takes all of role.*);
 *   3. the same two, in the workspace packages the phone bundles;
 *   4. the keys the SERVER sends for the phone to translate: a badge's label,
 *      a setup step's title, the reason a row of a sheet was refused, the
 *      audit log's word for an action. They are in no file of the phone's,
 *      and the server does not always write them where it sends them: an
 *      action's word is looked up in a table, a guardian's reason is the
 *      refusal of another function. So each place the phone translates a key
 *      it was sent is listed below (SENT_BY_SERVER) with the server's files
 *      that write it, and every key those files name is taken. The list is
 *      held to the source: test/lib/i18n-subset.test.ts fails when a screen
 *      translates a sent key that is not on it. A refusal's errorKey is not a
 *      fifth source: the server turns that into its sentence before it answers.
 *
 * A KEY LEFT OUT SHOWS AS THE KEY ITSELF on a release build and nowhere else,
 * which is the one way this can go wrong. Two things stand against it:
 * test/setup.ts fails any test file that asks the translator for a key this
 * leaves out, and the section walk on the web target (e2e/sections.spec.ts)
 * fails on a screen that shows a key where a sentence should be.
 *
 * HINDI AND MARATHI ARE FETCHED, NOT BUNDLED (item 15 of the owner's batch,
 * 1 Nov 2026). At 8,886 keys the phone's share of the two was 1.36 MB of a
 * 7.37 MB bundle, every reader carrying two languages they might never read.
 * A release now bundles English whole (the phone's share) and, of Hindi and
 * Marathi, only the keys of the first screens (BOOT_SOURCES below: signing
 * in, the language row, the bar and the menu, the shared components, the
 * update screen), so that a phone set to Hindi opens in Hindi before it has
 * fetched anything. The rest comes on first use from the web's own static
 * file, /i18n/<locale>.<hash>.json, and is kept on the phone
 * (src/lib/i18n-words.ts); offline with nothing kept, a sentence the first
 * screens do not hold is shown in English, never as its key.
 *
 * Plain CommonJS with no TypeScript tooling, because metro.config.js loads it:
 * the dictionary files are object literals and are read as such.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..", "..", "..");
const DICTIONARIES = path.join(ROOT, "packages", "i18n", "src");
const LOCALES = ["en", "hi", "mr"];
const SUBSET_DIR = path.join(__dirname, "..", "i18n-subset");

/** A dictionary file is `export const <locale> = { … }`: the literal is evaluated by itself. */
function readDictionary(locale) {
  const text = fs.readFileSync(path.join(DICTIONARIES, `${locale}.ts`), "utf8");
  const declared = text.search(new RegExp(`export const ${locale}\\b[^=]*=\\s*\\{`));
  if (declared < 0) throw new Error(`i18n-subset: packages/i18n/src/${locale}.ts does not declare \`export const ${locale}\``);
  return vm.runInNewContext(`(${text.slice(text.indexOf("{", declared), text.lastIndexOf("}") + 1)})`);
}

function flatten(tree, prefix = "", out = new Map()) {
  for (const [name, value] of Object.entries(tree)) {
    if (typeof value === "string") out.set(prefix + name, value);
    else flatten(value, `${prefix}${name}.`, out);
  }
  return out;
}

function sources(dir, skip = () => false) {
  if (!fs.existsSync(dir)) throw new Error(`i18n-subset: ${path.relative(ROOT, dir)} is missing, and the keys it holds would be left out of the phone's dictionaries`);
  const out = [];
  const walk = (at) => {
    for (const name of fs.readdirSync(at)) {
      const full = path.join(at, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && !skip(full)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

const LITERAL = /["'`]([A-Za-z]\w*(?:\.\w+)+)["'`]/g;
/** `role.${x}`, `filings.board${b}`, "staff.aq" + code: everything under what is written before the hole. */
const BUILT = [/`([A-Za-z]\w*(?:\.\w+)*\.\w*)\$\{/g, /["']([A-Za-z]\w*(?:\.\w+)*\.\w*)["']\s*\+/g];
/** t(step.titleKey as TranslationKey): a key that came in an answer, its type a plain string until the screen says otherwise. */
const SENT = /\bt\(\s*[\w.[\]!?]*\.(\w*Key)\s+as\s+(?:TranslationKey|never|any)\b/g;

/**
 * Each screen that translates a key the server sent, the properties it reads
 * them from, and the server's files that write those keys (under apps/web/src).
 * A file is named when a key in that property can come from it, by whatever
 * road: written there, looked up in a table there, or passed on from a
 * function there.
 */
const SENT_BY_SERVER = [
  // The setup checklist of the admin's overview: getChecklist.
  { screen: "src/screens/staff/admin-home.tsx", properties: ["titleKey", "descriptionKey"], written: ["lib/onboarding.ts"] },
  // A pupil's badges: getBadges.
  { screen: "src/screens/family/student-profile.tsx", properties: ["labelKey", "descriptionKey"], written: ["lib/badges.ts"] },
  // The operator's jobs, each with its sentence, and the server log, whose word for an action is looked up in ACTION_KEYS.
  { screen: "src/screens/operator/home.tsx", properties: ["describeKey", "actionKey"], written: ["lib/jobs.ts", "lib/safety-labels.ts"] },
  // A row of a pasted sheet that could not be read, for invitations and for intake: parseInviteCsv, parseIntakeCsv.
  { screen: "src/screens/staff/shared.tsx", properties: ["reasonKey"], written: ["lib/csv.ts"] },
  // An invitation not sent: sendInvites.
  { screen: "src/screens/staff/invites.tsx", properties: ["reasonKey"], written: ["app/(app)/admin/invites/actions.ts"] },
  // A pupil not admitted, and a guardian not invited, whose reason is inviteParent's refusal or matchPen's.
  { screen: "src/screens/staff/intake.tsx", properties: ["reasonKey", "guardianReasonKey"], written: ["lib/intake.ts", "lib/pen.ts", "lib/parent-link.ts"] },
  // A timetable sheet's row whose teacher could not be honoured, and its rows that could not be placed (reasonKey, through shared.tsx): previewTimetableImport.
  { screen: "src/screens/staff/timetable-editor.tsx", properties: ["teacherIssueKey"], written: ["lib/timetable.ts"] },
  // A bank statement line the office must key by hand, with why: previewBankImport.
  { screen: "src/screens/staff/fees.tsx", properties: ["problemKey"], written: ["lib/fees-bank-import.ts"] },
  // "What you did last" on the accreditation insights: the audit action's words, looked up in ACTION_KEYS (A3-states-16).
  { screen: "src/screens/iqac/insights.tsx", properties: ["labelKey"], written: ["lib/safety-labels.ts"] },
];

/** The places the phone's source translates a sent key, as "screen property": what SENT_BY_SERVER has to cover. */
function sentSites() {
  const app = path.join(__dirname, "..");
  const found = new Set();
  for (const file of sources(path.join(app, "src"))) {
    for (const m of fs.readFileSync(file, "utf8").matchAll(SENT)) found.add(`${path.relative(app, file).split(path.sep).join("/")} ${m[1]}`);
  }
  return found;
}

/** The keys the phone can ask for, and the whole English dictionary they are taken from. */
function usedKeys() {
  const all = flatten(readDictionary("en"));
  const used = new Set();
  const prefixes = new Set();
  const literals = (text) => {
    for (const m of text.matchAll(LITERAL)) if (all.has(m[1])) used.add(m[1]);
  };
  const own = (file) => {
    const text = fs.readFileSync(file, "utf8");
    literals(text);
    for (const pattern of BUILT) for (const m of text.matchAll(pattern)) prefixes.add(m[1]);
  };
  for (const file of sources(path.join(__dirname, "..", "src"))) own(file);
  for (const file of sources(path.join(ROOT, "packages", "contracts", "src"))) own(file);
  for (const file of sources(path.join(ROOT, "packages", "api-client", "src"))) own(file);
  for (const file of sources(DICTIONARIES, (full) => LOCALES.some((l) => full.endsWith(`${path.sep}${l}.ts`)))) own(file);
  const server = new Set(SENT_BY_SERVER.flatMap((entry) => entry.written));
  for (const name of server) {
    const file = path.join(ROOT, "apps", "web", "src", ...name.split("/"));
    if (!fs.existsSync(file)) throw new Error(`i18n-subset: apps/web/src/${name} is missing, and the keys it sends the phone would be left out of the phone's dictionaries`);
    literals(fs.readFileSync(file, "utf8"));
  }
  for (const prefix of prefixes) for (const key of all.keys()) if (key.startsWith(prefix)) used.add(key);
  return { used, prefixes, server, all };
}

/**
 * The first screens: what a phone shows before it can have fetched a
 * language (signing in, the language row, the update screen) and what every
 * screen after it carries (the bar, the menu and its groups, the shared
 * components, the library's sentences). Their keys are bundled in Hindi and
 * Marathi too; every other key of those two languages is fetched.
 */
const BOOT_SOURCES = ["src/app/_layout.tsx", "src/app/(auth)", "src/app/(app)/_layout.tsx", "src/screens/auth", "src/screens/shared/update-required.tsx", "src/components", "src/lib"];

/** The keys of the first screens, a share of `used`: what Hindi and Marathi bundle. */
function bootKeys(used) {
  const app = path.join(__dirname, "..");
  const boot = new Set();
  const prefixes = new Set();
  for (const source of BOOT_SOURCES) {
    const full = path.join(app, ...source.split("/"));
    if (!fs.existsSync(full)) throw new Error(`i18n-subset: ${source} is missing from BOOT_SOURCES' places, and the first screens' Hindi and Marathi would be left out`);
    for (const file of fs.statSync(full).isDirectory() ? sources(full) : [full]) {
      const text = fs.readFileSync(file, "utf8");
      for (const m of text.matchAll(LITERAL)) if (used.has(m[1])) boot.add(m[1]);
      for (const pattern of BUILT) for (const m of text.matchAll(pattern)) prefixes.add(m[1]);
    }
  }
  for (const prefix of prefixes) for (const key of used) if (key.startsWith(prefix)) boot.add(key);
  return boot;
}

/** One language with only the keys the phone can ask for, nested as the whole one is. */
function subsetOf(locale, used) {
  const whole = flatten(readDictionary(locale));
  const out = {};
  for (const key of [...used].sort()) {
    const value = whole.get(key);
    if (value === undefined) continue; // a gap in this language: English is folded under it at run time
    const parts = key.split(".");
    let node = out;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

/**
 * The names of the keys are the same in every language, and written out three
 * times they were 62 KB each. They are written once, as a tree whose leaves are
 * positions, and each language is the list of its sentences in that order; the
 * tree is filled from the list when the app starts. A sentence a language lacks
 * is the empty string, which the fold over English already reads as a gap.
 */
function shapeOf(keys) {
  const out = {};
  keys.forEach((key, at) => {
    const parts = key.split(".");
    let node = out;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts[parts.length - 1]] = at;
  });
  return out;
}

function sentencesOf(locale, keys) {
  const whole = flatten(readDictionary(locale));
  return keys.map((key) => whole.get(key) ?? "");
}

/** Written into the bundle as it stands here, so that what the tests fill a tree with is what the phone does. */
function inflate(shape, sentences) {
  const out = {};
  for (const name in shape) {
    const at = shape[name];
    out[name] = typeof at === "number" ? sentences[at] : inflate(at, sentences);
  }
  return out;
}

/**
 * The files Metro bundles in place of the whole dictionaries, by name:
 * English as the phone's whole share (shape.js and en.js), Hindi and Marathi
 * as the first screens' keys only (boot.js, hi.js, mr.js), the rest of those
 * two fetched (src/lib/i18n-words.ts).
 */
function subsetFiles(used, boot = bootKeys(used)) {
  const keys = [...used].sort();
  const first = [...boot].filter((key) => used.has(key)).sort();
  const files = {
    "shape.js": `// Generated by scripts/i18n-subset.cjs when a release is bundled: the names of the keys the phone can ask for. Not kept in git.\nexport const shape = ${JSON.stringify(shapeOf(keys))};\nexport ${inflate.toString()}\n`,
    "boot.js": `// Generated by scripts/i18n-subset.cjs when a release is bundled: the names of the first screens' keys, which Hindi and Marathi bundle. Not kept in git.\nexport const boot = ${JSON.stringify(shapeOf(first))};\n`,
    "en.js": `// Generated by scripts/i18n-subset.cjs when a release is bundled: the phone's share of packages/i18n/src/en.ts. Not kept in git.\nimport { inflate, shape } from "./shape";\nexport const en = inflate(shape, ${JSON.stringify(sentencesOf("en", keys))});\n`,
  };
  for (const locale of LOCALES.filter((l) => l !== "en")) {
    files[`${locale}.js`] = `// Generated by scripts/i18n-subset.cjs when a release is bundled: the first screens' share of packages/i18n/src/${locale}.ts; the rest is fetched on first use (src/lib/i18n-words.ts). Not kept in git.\nimport { inflate } from "./shape";\nimport { boot } from "./boot";\nexport const ${locale} = inflate(boot, ${JSON.stringify(sentencesOf(locale, first))});\n`;
  }
  return files;
}

/** Writes them where Metro can bundle them, and says where each language is. */
function writeSubset() {
  const { used } = usedKeys();
  fs.mkdirSync(SUBSET_DIR, { recursive: true });
  for (const [name, body] of Object.entries(subsetFiles(used))) {
    const file = path.join(SUBSET_DIR, name);
    // Written only when it has changed, so that Metro's cache of an unchanged language stays warm.
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== body) fs.writeFileSync(file, body);
  }
  return Object.fromEntries(LOCALES.map((locale) => [locale, path.join(SUBSET_DIR, `${locale}.js`)]));
}

module.exports = { BOOT_SOURCES, LOCALES, SENT_BY_SERVER, SUBSET_DIR, bootKeys, flatten, inflate, readDictionary, sentencesOf, shapeOf, sentSites, subsetFiles, subsetOf, usedKeys, writeSubset };

if (require.main === module) {
  const { used, all, prefixes, server } = usedKeys();
  const kb = (text) => (Buffer.byteLength(text) / 1024).toFixed(0);
  const files = subsetFiles(used);
  console.log(`the phone can ask for ${used.size} of ${all.size} keys (${prefixes.size} prefixes built at run time; ${server.size} of the server's files read for the keys it sends)`);
  console.log(`the names of the keys, once: ${kb(files["shape.js"])} KB; the first screens' ${bootKeys(used).size} keys, which Hindi and Marathi bundle: ${kb(files["boot.js"])} KB`);
  for (const locale of LOCALES) console.log(`${locale}  ${kb(JSON.stringify(readDictionary(locale)))} KB whole  →  ${kb(files[`${locale}.js`])} KB bundled${locale === "en" ? "" : " (the rest fetched on first use)"}`);
  writeSubset();
}
