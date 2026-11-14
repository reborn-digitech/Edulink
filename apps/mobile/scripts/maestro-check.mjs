#!/usr/bin/env node
/**
 * maestro-check — the static half of the Maestro flows, for a machine with no
 * simulator. Every flow under apps/mobile/maestro is parsed and held to:
 *
 *   1. a header document with appId;
 *   2. every command from Maestro's command set (the list below);
 *   3. every literal text a command targets or asserts resolving to one of:
 *        - a value of the English dictionary (packages/i18n/src/en.ts,
 *          flattened to dotted keys) — the string a screen renders through
 *          t("key"); a value in hi.ts / mr.ts is accepted too but named, since
 *          the language flow has to read a Hindi tab;
 *        - a language's name from packages/i18n/src/locales.ts;
 *        - a ZZ Northgate fixture name from the allow-list below;
 *        - a parameter, ${NAME};
 *        - a regex (a string carrying regex metacharacters — Maestro matches
 *          text as a full-match regex) that fully matches one of the above,
 *          so "Mark all .* present" stands for "Mark all {count} present",
 *          ".*Unit test.*" for a paper label built around "Unit test", and
 *          "Saved|Saved on this device" for either.
 *      What a flow types (inputText) is data, not a label: it must be a
 *      parameter or short plain text, and is listed as such.
 *      What a flow opens (openLink) must be a parameter or an edulink:// link.
 *
 * Exit 1 with every problem listed; exit 0 with a resolution per reference.
 *
 *   node scripts/maestro-check.mjs            from apps/mobile
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { parseAllDocuments, isMap, isSeq, isScalar } from "yaml";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const here = path.dirname(fileURLToPath(import.meta.url));
const mobile = path.resolve(here, "..");
const flowsDir = path.join(mobile, "maestro");
const i18nDir = path.resolve(mobile, "../../packages/i18n/src");

/** Maestro's command set, as the plan lists it. */
const COMMANDS = new Set([
  "launchApp", "tapOn", "inputText", "assertVisible", "assertNotVisible", "scroll", "scrollUntilVisible", "back", "runFlow",
  "openLink", "waitForAnimationToEnd", "hideKeyboard", "pressKey", "extendedWaitUntil", "swipe", "clearState", "eraseText",
  "evalScript", "stopApp", "takeScreenshot", "repeat", "copyTextFrom", "setLocation", "travel", "addMedia",
]);

/** ZZ Northgate fixture names a flow may target (apps/web/scripts/zz-fixtures.ts). */
const FIXTURES = new Set([
  "ZZ Northgate School",
  "ZZ Grade 3 · A",
  "ZZ Grade 7 · A",
  "ZZ Sunita Kale", // zz.teacher1 — holds Grade 3 · A and Grade 7 · A
  "ZZ Rohan Iyer", // zz.principal
  "ZZ Anita Deshmukh", // zz.admin
  "ZZ Aarav Apte", // zz.pupil01, Grade 3 · A seat 0
  "ZZ Divya Desai", // zz.pupil04, Grade 3 · A seat 3
  "ZZ Apte (parent)", // zz.parent01
]);

/* ---------------------------------------------------------------- dictionaries */

function loadDictionary(file, exportName) {
  const source = fs.readFileSync(path.join(i18nDir, file), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  const module = { exports: {} };
  new Function("exports", "require", "module", outputText)(module.exports, () => ({}), module);
  return module.exports[exportName];
}

function flatten(node, prefix, into) {
  for (const [key, value] of Object.entries(node)) {
    const dotted = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") into.set(dotted, value);
    else if (value && typeof value === "object") flatten(value, dotted, into);
  }
  return into;
}

const dictionaries = {
  en: flatten(loadDictionary("en.ts", "en"), "", new Map()),
  hi: flatten(loadDictionary("hi.ts", "hi"), "", new Map()),
  mr: flatten(loadDictionary("mr.ts", "mr"), "", new Map()),
};

/**
 * The keys some screen of the phone asks for (scripts/i18n-subset.cjs, the release's own reading), so that a flow's
 * text is a sentence the app still draws and not one left in the dictionary for the web (TA-590, 13 Nov 2026: flow 08
 * waited for a door the practice screen no longer drew).
 */
const { used: usedByPhone } = require("./i18n-subset.cjs").usedKeys();

/** value → "lang:key" (English first, so a string in all three names its en key), among the keys the phone uses. */
const byValue = new Map();
/** value → "lang:key" for a dictionary value no screen of the phone asks for. */
const unusedByValue = new Map();
for (const lang of ["en", "hi", "mr"]) {
  for (const [key, value] of dictionaries[lang]) {
    if (usedByPhone.has(key)) {
      if (!byValue.has(value)) byValue.set(value, `${lang}:${key}`);
    } else if (!unusedByValue.has(value)) unusedByValue.set(value, `${lang}:${key}`);
  }
}
for (const value of byValue.keys()) unusedByValue.delete(value);

/**
 * The testIDs the screens draw (TA-590): a flow that taps by id (`id:` in a selector) must name one, written as
 * testID="name" or built as testID={`prefix${…}`} (a row's index), so a renamed or removed id fails here and not
 * first on a simulator.
 */
function sourcesUnder(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourcesUnder(full));
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}
const testIds = new Set();
const testIdPrefixes = new Set();
for (const file of sourcesUnder(path.join(mobile, "src"))) {
  for (const m of fs.readFileSync(file, "utf8").matchAll(/testID=(?:"([^"]+)"|\{`([^`$]*)\$\{)/g)) {
    if (m[1]) testIds.add(m[1]);
    else if (m[2]) testIdPrefixes.add(m[2]);
  }
}
function resolveId(id) {
  if (testIds.has(id)) return { ok: true, how: "testID" };
  for (const prefix of testIdPrefixes) if (id.startsWith(prefix) && /^\w+$/.test(id.slice(prefix.length))) return { ok: true, how: `testID ${prefix}…` };
  return { ok: false, why: "no screen draws this testID" };
}

const locales = new Map();
for (const m of fs.readFileSync(path.join(i18nDir, "locales.ts"), "utf8").matchAll(/(native|english):\s*"([^"]+)"/g)) locales.set(m[2], `locale.${m[1]}`);

/* ------------------------------------------------------------------ resolving */

const PARAM = /^\$\{[A-Z0-9_]+\}$/;
const META = /[.*+?|\\[\]()^$]/;

function resolveLabel(text) {
  if (PARAM.test(text)) return { ok: true, how: "param" };
  if (byValue.has(text)) return { ok: true, how: byValue.get(text) };
  if (FIXTURES.has(text)) return { ok: true, how: "fixture" };
  if (locales.has(text)) return { ok: true, how: locales.get(text) };
  if (META.test(text)) {
    let re;
    try {
      re = new RegExp(`^(?:${text})$`, "u");
    } catch {
      return { ok: false, why: "not a valid regex" };
    }
    const hits = [];
    for (const [value, how] of byValue) if (re.test(value)) hits.push(how);
    for (const value of FIXTURES) if (re.test(value)) hits.push("fixture");
    for (const [value, how] of locales) if (re.test(value)) hits.push(how);
    if (hits.length > 0) return { ok: true, how: `regex → ${[...new Set(hits)].slice(0, 3).join(", ")}` };
    for (const value of unusedByValue.keys()) if (re.test(value)) return { ok: false, why: `regex matches only dictionary values no screen of the phone asks for (${unusedByValue.get(value)})` };
    return { ok: false, why: "regex matches no dictionary value, fixture name or language name" };
  }
  if (unusedByValue.has(text)) return { ok: false, why: `a dictionary value no screen of the phone asks for (${unusedByValue.get(text)})` };
  return { ok: false, why: "not a dictionary value, fixture name, language name or ${PARAM}" };
}

const PLAIN_DATA = /^[\p{L}\p{N} .,'’!?\-—:]{1,80}$/u;
function resolveData(text) {
  if (PARAM.test(text)) return { ok: true, how: "param" };
  if (/@|password|secret/i.test(text)) return { ok: false, why: "typed data looks like an address or a secret; pass it as a parameter" };
  if (PLAIN_DATA.test(text)) return { ok: true, how: "data" };
  return { ok: false, why: "typed data must be a ${PARAM} or short plain text" };
}

function resolveLink(text) {
  if (PARAM.test(text)) return { ok: true, how: "param" };
  if (/^edulink:\/\//.test(text)) return { ok: true, how: "deep link" };
  return { ok: false, why: "a link must be a ${PARAM} or an edulink:// deep link" };
}

/* ------------------------------------------------------------------- walking */

const SELECTOR_KEYS = ["text", "below", "above", "leftOf", "rightOf", "childOf", "containsChild", "containsDescendants", "element", "visible", "notVisible"];

/** Every text a selector names, including the relative ones nested in it. */
function selectorTexts(node, out = []) {
  if (isScalar(node)) {
    if (typeof node.value === "string") out.push(node.value);
    return out;
  }
  if (isSeq(node)) {
    for (const item of node.items) selectorTexts(item, out);
    return out;
  }
  if (isMap(node)) {
    for (const pair of node.items) {
      const key = String(pair.key?.value ?? pair.key);
      if (SELECTOR_KEYS.includes(key)) selectorTexts(pair.value, out);
    }
  }
  return out;
}

/** Every testID a selector names (`id:`), in it and in the relative selectors nested in it (TA-590). */
function selectorIds(node, out = []) {
  if (isSeq(node)) {
    for (const item of node.items) selectorIds(item, out);
    return out;
  }
  if (isMap(node)) {
    for (const pair of node.items) {
      const key = String(pair.key?.value ?? pair.key);
      if (key === "id" && isScalar(pair.value) && typeof pair.value.value === "string") out.push(pair.value.value);
      else if (SELECTOR_KEYS.includes(key)) selectorIds(pair.value, out);
    }
  }
  return out;
}

function stringOf(node) {
  return isScalar(node) && typeof node.value === "string" ? node.value : null;
}

function mapGet(node, key) {
  if (!isMap(node)) return undefined;
  const pair = node.items.find((p) => String(p.key?.value ?? p.key) === key);
  return pair?.value;
}

function walkCommands(seq, flowFile, report) {
  if (!isSeq(seq)) {
    report.problem(flowFile, 0, "the flow body is not a list of commands");
    return;
  }
  for (const item of seq.items) {
    const line = item?.range ? lineOf(report.text(flowFile), item.range[0]) : 0;
    if (isScalar(item)) {
      const name = String(item.value);
      if (!COMMANDS.has(name)) report.problem(flowFile, line, `unknown command "${name}"`);
      else report.command(flowFile, name);
      continue;
    }
    if (!isMap(item) || item.items.length !== 1) {
      report.problem(flowFile, line, "a command is one key with its arguments");
      continue;
    }
    const pair = item.items[0];
    const name = String(pair.key?.value ?? pair.key);
    const args = pair.value;
    if (!COMMANDS.has(name)) {
      report.problem(flowFile, line, `unknown command "${name}"`);
      continue;
    }
    report.command(flowFile, name);
    const label = (text) => report.reference(flowFile, line, name, text, resolveLabel(text));

    switch (name) {
      case "tapOn":
      case "assertVisible":
      case "assertNotVisible":
      case "copyTextFrom":
      case "scrollUntilVisible":
      case "extendedWaitUntil": {
        const bare = stringOf(args);
        if (bare !== null) label(bare);
        else {
          for (const text of selectorTexts(args)) label(text);
          for (const id of selectorIds(args)) report.reference(flowFile, line, name, `id:${id}`, resolveId(id));
        }
        break;
      }
      case "inputText": {
        const text = stringOf(args) ?? stringOf(mapGet(args, "text"));
        if (text === null) report.problem(flowFile, line, "inputText needs a string");
        else report.reference(flowFile, line, name, text, resolveData(text));
        break;
      }
      case "openLink": {
        const link = stringOf(args) ?? stringOf(mapGet(args, "link"));
        if (link === null) report.problem(flowFile, line, "openLink needs a link");
        else report.reference(flowFile, line, name, link, resolveLink(link));
        break;
      }
      case "runFlow": {
        const file = stringOf(args) ?? stringOf(mapGet(args, "file"));
        if (file !== null) {
          const target = path.resolve(path.dirname(flowFile), file);
          if (!fs.existsSync(target)) report.problem(flowFile, line, `runFlow file not found: ${file}`);
          else report.reference(flowFile, line, name, file, { ok: true, how: "subflow" });
        }
        const when = mapGet(args, "when");
        if (when) for (const text of selectorTexts(when)) label(text);
        const commands = mapGet(args, "commands");
        if (commands) walkCommands(commands, flowFile, report);
        if (file === null && !commands) report.problem(flowFile, line, "runFlow needs a file or inline commands");
        break;
      }
      case "repeat": {
        const commands = mapGet(args, "commands");
        if (commands) walkCommands(commands, flowFile, report);
        const whileNode = mapGet(args, "while");
        if (whileNode) for (const text of selectorTexts(whileNode)) label(text);
        break;
      }
      default:
        break;
    }
  }
}

function lineOf(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === "\n") line++;
  return line;
}

/* ---------------------------------------------------------------------- main */

function listFlows(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFlows(full));
    else if (/\.ya?ml$/.test(entry.name) && entry.name !== "config.yaml") out.push(full);
  }
  return out.sort();
}

const report = {
  problems: [],
  references: [],
  commands: new Map(),
  texts: new Map(),
  text(file) {
    if (!this.texts.has(file)) this.texts.set(file, fs.readFileSync(file, "utf8"));
    return this.texts.get(file);
  },
  problem(file, line, message) {
    this.problems.push({ file, line, message });
  },
  reference(file, line, command, text, outcome) {
    this.references.push({ file, line, command, text, ...outcome });
    if (!outcome.ok) this.problem(file, line, `${command} "${text}": ${outcome.why}`);
  },
  command(file, name) {
    this.commands.set(name, (this.commands.get(name) ?? 0) + 1);
  },
};

const flows = listFlows(flowsDir);
if (flows.length === 0) {
  console.error(`no flows under ${flowsDir}`);
  process.exit(1);
}

for (const file of flows) {
  const docs = parseAllDocuments(report.text(file));
  for (const doc of docs) for (const err of doc.errors) report.problem(file, err.linePos?.[0]?.line ?? 0, `YAML: ${err.message.split("\n")[0]}`);
  if (docs.length < 2) {
    report.problem(file, 1, "a flow is two YAML documents: the header (appId) and the commands");
    continue;
  }
  const header = docs[0].contents;
  const appId = stringOf(mapGet(header, "appId"));
  if (!appId) report.problem(file, 1, "header has no appId");
  else if (appId !== "school.edulink.app") report.problem(file, 1, `appId is "${appId}", expected school.edulink.app`);
  walkCommands(docs[1].contents, file, report);
}

const rel = (file) => path.relative(mobile, file);
let current = null;
for (const ref of report.references) {
  if (ref.file !== current) {
    current = ref.file;
    console.log(`\n${rel(ref.file)}`);
  }
  console.log(`  ${ref.ok ? "ok " : "!! "} L${String(ref.line).padStart(3)} ${ref.command.padEnd(18)} ${JSON.stringify(ref.text)}  → ${ref.ok ? ref.how : ref.why}`);
}

console.log(`\nflows: ${flows.length} (config.yaml skipped: it is the workspace order, not a flow)`);
console.log(`dictionary values: en ${dictionaries.en.size}, hi ${dictionaries.hi.size}, mr ${dictionaries.mr.size}; language names ${locales.size}; fixture names ${FIXTURES.size}`);
console.log(`commands used: ${[...report.commands.entries()].map(([k, v]) => `${k}×${v}`).join(", ")}`);
const okCount = report.references.filter((r) => r.ok).length;
const byHow = new Map();
for (const r of report.references) if (r.ok) byHow.set(r.how.split(" ")[0].split(":")[0], (byHow.get(r.how.split(" ")[0].split(":")[0]) ?? 0) + 1);
console.log(`references: ${report.references.length}, resolved ${okCount} (${[...byHow.entries()].map(([k, v]) => `${k} ${v}`).join(", ")})`);

if (report.problems.length > 0) {
  console.log(`\n${report.problems.length} problem(s):`);
  for (const p of report.problems) console.log(`  ${rel(p.file)}:${p.line}  ${p.message}`);
  process.exit(1);
}
console.log("\nmaestro-check: every flow has an appId, every command is Maestro's, every text resolves.");
