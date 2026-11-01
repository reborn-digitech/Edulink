/**
 * The contracts files the phone uses, and the ones it does not.
 *
 * packages/contracts/src/index.ts re-exports every file of the API's shapes
 * (`export * from "./v1/…"`), and every screen imports from that index, so
 * Metro, which cannot leave out an export nobody asks for, bundled all of
 * them: 697 KB on 1 Nov 2026, three times what it was on 2 October, much of
 * it the web's own desks (the quiz bank's jobs and figures, the competitions
 * crawler, the assistant's operations, the website's domains, the NAAC text).
 *
 * This finds, for each file the index re-exports, whether the phone imports
 * any VALUE from it (a schema, a list, a function; a type is erased and costs
 * nothing), and metro.config.js hands Metro an empty module in place of each
 * file it does not, when a release is bundled and only where the index
 * re-exports it: a file another contracts file imports is still bundled
 * through that import, whole and unchanged. Nothing is rewritten; a file is
 * in the bundle exactly as written or not at all.
 *
 * WHAT THE PHONE IMPORTS is read from its own source and the api-client's:
 * every `import { … } from "@edulink/contracts"`, a `type` specifier left
 * aside. A namespace import or a require of the package would hide which
 * names are used, so either is refused here rather than guessed at. A name
 * the phone imports that neither the index nor a file it keeps exports is
 * refused too. test/lib/contracts-subset.test.ts holds these to the source,
 * and checks every name the phone imports against the real package.
 *
 * Plain CommonJS, because metro.config.js loads it. TypeScript's parser reads
 * the exports, so that a `const`, a `function`, an `enum` or an `export { … }`
 * list are all seen as a file's values and an interface or a type is not.
 */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = path.join(__dirname, "..", "..", "..");
const CONTRACTS = path.join(ROOT, "packages", "contracts", "src");
const INDEX = path.join(CONTRACTS, "index.ts");
/** The places that import from @edulink/contracts into the phone's bundle. */
const IMPORTERS = [path.join(__dirname, "..", "src"), path.join(ROOT, "packages", "api-client", "src")];

function sources(dir) {
  const out = [];
  const walk = (at) => {
    for (const name of fs.readdirSync(at)) {
      const full = path.join(at, name);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

/** The value names the phone imports from @edulink/contracts. */
function phoneImports() {
  const names = new Set();
  for (const file of IMPORTERS.flatMap(sources)) {
    const text = fs.readFileSync(file, "utf8");
    if (!text.includes("@edulink/contracts")) continue;
    const rel = path.relative(ROOT, file);
    if (/import\s+\*\s+as\s+\w+\s+from\s+["']@edulink\/contracts["']|require\(\s*["']@edulink\/contracts["']\s*\)|import\(\s*["']@edulink\/contracts["']\s*\)/.test(text)) {
      throw new Error(`contracts-subset: ${rel} imports @edulink/contracts whole; name what it uses, so the files it does not can be left out`);
    }
    if (/["']@edulink\/contracts\/[^"']+["']/.test(text)) throw new Error(`contracts-subset: ${rel} imports a path inside @edulink/contracts; the package exports only its index`);
    for (const m of text.matchAll(/(import|export)\s+(type\s+)?\{([^}]*)\}\s+from\s+["']@edulink\/contracts["']/g)) {
      if (m[2]) continue;
      for (const part of m[3].split(",")) {
        const spec = part.trim();
        if (!spec || spec.startsWith("type ")) continue;
        names.add(spec.split(/\s+as\s+/)[0].trim());
      }
    }
    const statements = [...text.matchAll(/from\s+["']@edulink\/contracts["']/g)].length;
    const read = [...text.matchAll(/(import|export)\s+(type\s+)?\{[^}]*\}\s+from\s+["']@edulink\/contracts["']/g)].length;
    if (statements !== read) throw new Error(`contracts-subset: ${rel} imports from @edulink/contracts in a form this does not read (a default import?)`);
  }
  return names;
}

function parse(file) {
  return ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
}

const exported = (node) => (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0;

/**
 * A file's exported values, and the files it re-exports whole: what `export *`
 * of it hands on. Types, interfaces and `export type { … }` are not values.
 */
function exportsOf(file, seen = new Set()) {
  const values = new Set();
  if (seen.has(file)) return values;
  seen.add(file);
  const source = parse(file);
  for (const node of source.statements) {
    if (ts.isVariableStatement(node) && exported(node)) {
      for (const d of node.declarationList.declarations) {
        if (ts.isIdentifier(d.name)) values.add(d.name.text);
        else throw new Error(`contracts-subset: ${path.relative(ROOT, file)} exports a destructured declaration this does not read`);
      }
    } else if ((ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isEnumDeclaration(node)) && exported(node) && node.name) {
      values.add(node.name.text);
    } else if (ts.isExportDeclaration(node) && !node.isTypeOnly) {
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const el of node.exportClause.elements) if (!el.isTypeOnly) values.add(el.name.text);
      } else if (!node.exportClause && node.moduleSpecifier) {
        for (const name of exportsOf(resolve(file, node.moduleSpecifier.text), seen)) values.add(name);
      } else if (node.exportClause) {
        values.add(node.exportClause.name.text); // export * as name from
      }
    }
  }
  return values;
}

function resolve(from, specifier) {
  if (!specifier.startsWith(".")) throw new Error(`contracts-subset: ${path.relative(ROOT, from)} re-exports the package ${specifier}, which this does not follow`);
  const base = path.resolve(path.dirname(from), specifier);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) if (fs.existsSync(candidate)) return candidate;
  throw new Error(`contracts-subset: ${path.relative(ROOT, from)} re-exports ${specifier}, which is not a file`);
}

/** The files the index re-exports whole, and the values the index itself declares. */
function indexShape() {
  const source = parse(INDEX);
  const starred = [];
  const own = new Set();
  for (const node of source.statements) {
    if (ts.isExportDeclaration(node) && !node.exportClause && node.moduleSpecifier && !node.isTypeOnly) starred.push(resolve(INDEX, node.moduleSpecifier.text));
  }
  const shallow = exportsOf(INDEX, new Set(starred)); // the index's own values, its starred files left aside
  for (const name of shallow) own.add(name);
  return { starred, own };
}

/** Which of the index's files the phone keeps, which it leaves out, and why. */
function contractsSubset() {
  const wanted = phoneImports();
  const { starred, own } = indexShape();
  const kept = [];
  const dropped = [];
  const found = new Set([...wanted].filter((name) => own.has(name)));
  for (const file of starred) {
    const values = exportsOf(file);
    const uses = [...wanted].filter((name) => values.has(name));
    for (const name of uses) found.add(name);
    (uses.length > 0 ? kept : dropped).push(file);
  }
  const missing = [...wanted].filter((name) => !found.has(name));
  if (missing.length > 0) throw new Error(`contracts-subset: the phone imports ${missing.join(", ")} from @edulink/contracts, which the index does not export as a value`);
  return { wanted, kept, dropped, index: INDEX };
}

module.exports = { CONTRACTS, INDEX, contractsSubset, exportsOf, indexShape, phoneImports };

if (require.main === module) {
  const { wanted, kept, dropped } = contractsSubset();
  const kb = (file) => (fs.statSync(file).size / 1024).toFixed(0);
  console.log(`the phone imports ${wanted.size} values from @edulink/contracts; it keeps ${kept.length} of the index's ${kept.length + dropped.length} files and leaves out ${dropped.length}:`);
  for (const file of dropped) console.log(`  ${path.relative(CONTRACTS, file)}  (${kb(file)} KB of source)`);
}
