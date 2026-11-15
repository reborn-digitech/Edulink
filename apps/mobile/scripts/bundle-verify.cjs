/**
 * What the bundle gate checks in its own export, beside the size.
 *
 *   node scripts/bundle-verify.cjs <bundle.js> [<bundle.js> …]
 *
 * Two of the cuts that keep the bundle under the ceiling change how things
 * are bundled rather than leave them out: the contracts package with plain
 * exports (scripts/contracts-exports.cjs) and the dictionaries written
 * compactly (scripts/i18n-subset.cjs). Neither shows in a test of the
 * phone, which runs the source through Babel and not through Metro, so this
 * runs the exported bundle's own modules in Node, with a stand-in for
 * Metro's module runtime, and checks what they make:
 *   1. the contracts index runs, and every value the phone imports from it
 *      (scripts/contracts-subset.cjs) is defined; apiErrorSchema parses an
 *      error and refuses an unknown code;
 *   2. no module of the contracts package exports through a getter (Expo's
 *      live bindings, which contracts-exports.cjs turns off for the package:
 *      if that ever stops working, 178 KB come back and this says so);
 *   3. the bundled English holds every key of the phone's share and Hindi and
 *      Marathi every key of the first screens', each the language's own
 *      sentence, none missing and none extra.
 * It reads a release bundle as Metro writes it, one module a line
 * (`__d(function(…){…},<id>,[<dependencies>]);`), and needs no source map:
 * it finds the contracts index by the export only that file defines
 * (apiErrorSchema), zod and @edulink/i18n by what they export, and the
 * package as what the index reaches without passing through those two.
 * scripts/bundle-size.mjs runs it on both platforms' export and fails when it
 * finds a problem; test/lib/bundle-verify.test.ts holds it to failing on a
 * bundle whose contracts export through getters.
 *
 * Written for the bundle trim of 15 Nov 2026, from the script that first
 * checked it by hand.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

/** A module of a release bundle: its factory's text, its id and its dependencies' ids. */
const MODULE = /^__d\((function\([^)]*\)\{[\s\S]*\}),(\d+),\[([\d,]*)\]\);?$/;
/** An export defined through a getter, as Metro's minified output writes Expo's live bindings. */
const GETTER_EXPORT = /defineProperty\([\w$]+,["'][\w$]+["'],\{enumerable:!0,get:/;
/** The contracts index's own export, defined plainly or through a getter. */
const INDEX_EXPORT = /[\w$]+\.apiErrorSchema=(?!=)|defineProperty\([\w$]+,["']apiErrorSchema["']/;

/**
 * Each module starts a line with `__d(` and runs to the next one, most on one
 * line, some on several (a template string keeps its line breaks); the last
 * runs to the `__r(` calls that start the app.
 */
function modulesOf(code) {
  const modules = new Map();
  const starts = [...code.matchAll(/^__d\(/gm)].map((m) => m.index);
  starts.forEach((start, i) => {
    let end = i + 1 < starts.length ? starts[i + 1] : code.length;
    if (i + 1 === starts.length) {
      const run = code.slice(start).search(/\n__r\(/);
      if (run >= 0) end = start + run;
    }
    const text = code.slice(start, end).replace(/\s+$/, "");
    const m = MODULE.exec(text);
    if (!m) throw new Error(`bundle-verify: a module this cannot read: ${text.slice(0, 120)}…`);
    modules.set(Number(m[2]), { source: m[1], deps: m[3] ? m[3].split(",").map(Number) : [] });
  });
  return modules;
}

/** Every module a module reaches through its dependencies, itself included. */
function closure(modules, from) {
  const seen = new Set();
  const walk = (id) => {
    if (seen.has(id) || !modules.has(id)) return;
    seen.add(id);
    for (const dep of modules.get(id).deps) walk(dep);
  };
  walk(from);
  return seen;
}

/**
 * Checks one bundle's text. `wanted` is the names the phone imports from the
 * contracts; `dictionaries`, when given, is { en, hi, mr }, each the keys the
 * bundle should hold mapped to their sentences.
 */
function verifyBundle(code, { wanted, dictionaries } = {}) {
  const problems = [];
  const facts = {};
  const modules = modulesOf(code);
  facts.modules = modules.size;
  const context = vm.createContext({ console });
  const factories = new Map();
  for (const [id, { source }] of modules) factories.set(id, vm.runInContext(`(${source})`, context, { filename: `module-${id}.js` }));
  const cache = new Map();
  const req = (id) => {
    if (cache.has(id)) return cache.get(id).exports;
    const factory = factories.get(id);
    if (!factory) throw new Error(`bundle-verify: no module ${id} in the bundle`);
    const module = { exports: {} };
    cache.set(id, module);
    const importDefault = (dep) => {
      const e = req(dep);
      return e && e.__esModule ? e.default : e;
    };
    const importAll = (dep) => {
      const e = req(dep);
      if (e && e.__esModule) return e;
      const all = {};
      if (e) for (const k in e) all[k] = e[k];
      all.default = e;
      return all;
    };
    factory(context, req, importDefault, importAll, module, module.exports, modules.get(id).deps);
    return module.exports;
  };

  const candidates = [...modules].filter(([, m]) => INDEX_EXPORT.test(m.source)).sort((a, b) => b[1].deps.length - a[1].deps.length);
  if (candidates.length === 0) return { ok: false, problems: ["the contracts index (the module that defines apiErrorSchema) is not in the bundle"], facts };
  const indexId = candidates[0][0];
  let index;
  try {
    index = req(indexId);
  } catch (error) {
    return { ok: false, problems: [`the contracts index does not run: ${error && error.message}`], facts };
  }
  facts.indexExports = Object.keys(index).length;
  const names = [...(wanted ?? [])];
  const undefinedNames = names.filter((name) => index[name] === undefined);
  facts.wanted = names.length;
  if (undefinedNames.length > 0) problems.push(`${undefinedNames.length} of the ${names.length} values the phone imports from the contracts are undefined in the bundle: ${undefinedNames.slice(0, 20).join(", ")}`);
  const schema = index.apiErrorSchema;
  if (!schema || typeof schema.safeParse !== "function" || !schema.safeParse({ error: "x", code: "FORBIDDEN" }).success || schema.safeParse({ error: "x", code: "NOT_A_CODE" }).success) {
    problems.push("apiErrorSchema does not parse an error and refuse an unknown code as the contracts say");
  }

  // The package: what the index reaches, less zod's modules and @edulink/i18n's, found by what they export.
  const ran = [...cache.keys()];
  const exportsOf = (id) => cache.get(id)?.exports ?? {};
  const zod = modules.get(indexId).deps.find((id) => typeof exportsOf(id).ZodType === "function" && exportsOf(id).z);
  const i18n = ran.find((id) => typeof exportsOf(id).translatorFor === "function" && exportsOf(id).LOCALES);
  if (zod === undefined) problems.push("zod's entry is not among the contracts index's dependencies");
  if (i18n === undefined) problems.push("@edulink/i18n's entry is not among the modules the contracts index runs");
  const outside = new Set([...(zod === undefined ? [] : closure(modules, zod)), ...(i18n === undefined ? [] : closure(modules, i18n))]);
  const contracts = [...closure(modules, indexId)].filter((id) => !outside.has(id));
  facts.contractsModules = contracts.length;
  const withGetters = contracts.filter((id) => GETTER_EXPORT.test(modules.get(id).source));
  facts.contractsWithGetters = withGetters.length;
  if (withGetters.length > 0) problems.push(`${withGetters.length} of the contracts package's ${contracts.length} modules export through getters (Expo's live bindings, which scripts/contracts-exports.cjs turns off for the package)`);

  if (dictionaries) {
    const shape = ran.find((id) => typeof exportsOf(id).inflate === "function" && typeof exportsOf(id).shape === "string");
    if (shape === undefined) problems.push("the dictionaries' names (i18n-subset/shape.js) are not among the modules @edulink/i18n runs");
    for (const [locale, expected] of Object.entries(dictionaries)) {
      const id = ran.find((m) => exportsOf(m)[locale] && typeof exportsOf(m)[locale] === "object" && closure(modules, m).has(shape));
      if (id === undefined) {
        problems.push(`the bundled ${locale} (i18n-subset/${locale}.js) is not among the modules @edulink/i18n runs`);
        continue;
      }
      const bundled = new Map();
      const walk = (tree, above) => {
        for (const name in tree) {
          if (typeof tree[name] === "string") bundled.set(above + name, tree[name]);
          else walk(tree[name], `${above}${name}.`);
        }
      };
      walk(exportsOf(id)[locale], "");
      const wrong = [...expected].filter(([key, sentence]) => bundled.get(key) !== sentence).map(([key]) => key);
      const extra = [...bundled.keys()].filter((key) => !expected.has(key));
      facts[locale] = bundled.size;
      if (wrong.length > 0) problems.push(`${wrong.length} of the ${expected.size} ${locale} keys are missing or not their sentence: ${wrong.slice(0, 10).join(", ")}`);
      if (extra.length > 0) problems.push(`${extra.length} ${locale} keys are bundled beyond the share: ${extra.slice(0, 10).join(", ")}`);
    }
  }
  return { ok: problems.length === 0, problems, facts };
}

/** What a release should hold, read as the release itself reads it: the names the phone imports, and each language's share. */
function expectations() {
  const { contractsSubset } = require("./contracts-subset.cjs");
  const subset = require("./i18n-subset.cjs");
  const { used } = subset.usedKeys();
  const boot = subset.bootKeys(used);
  const share = (locale, keys) => {
    const whole = subset.flatten(subset.readDictionary(locale));
    return new Map([...keys].map((key) => [key, whole.get(key) ?? ""]));
  };
  return { wanted: contractsSubset().wanted, dictionaries: { en: share("en", used), hi: share("hi", boot), mr: share("mr", boot) } };
}

/** One line of what was found, for the gate's output. */
function describe(facts) {
  return `contracts index ${facts.indexExports} exports, ${facts.wanted} values the phone imports all defined, ${facts.contractsWithGetters} of ${facts.contractsModules} contracts modules with getters; en ${facts.en} keys, hi ${facts.hi}, mr ${facts.mr}, each its own sentence`;
}

module.exports = { GETTER_EXPORT, INDEX_EXPORT, closure, describe, expectations, modulesOf, verifyBundle };

if (require.main === module) {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error("usage: node scripts/bundle-verify.cjs <bundle.js> [<bundle.js> …]");
    process.exit(2);
  }
  const expected = expectations();
  let failed = false;
  for (const file of files) {
    const { ok, problems, facts } = verifyBundle(fs.readFileSync(file, "utf8"), expected);
    console.log(`${path.basename(file)}: ${ok ? describe(facts) : "FAILED"}`);
    for (const problem of problems) console.error(`  ${problem}`);
    failed ||= !ok;
  }
  process.exit(failed ? 1 : 0);
}
