import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const worker = require("../../scripts/contracts-exports.cjs") as {
  CACHE_KEY: string;
  CONTRACTS_FILE: RegExp;
  UPSTREAM: string;
  optionsFor: (filename: string, options: Record<string, unknown>) => Record<string, unknown> & { customTransformOptions?: Record<string, unknown> };
};
// eslint-disable-next-line @typescript-eslint/no-require-imports
const subset = require("../../scripts/contracts-subset.cjs") as {
  exportsOf: (file: string) => Set<string>;
  indexShape: () => { starred: string[]; own: Set<string> };
};

/**
 * The contracts package bundled with plain exports (scripts/contracts-exports.cjs,
 * metro.config.js; 15 Nov 2026): a file of packages/contracts/src is
 * transformed with Expo's live bindings off, so its imports are read once,
 * when it runs. That gives the value a live binding would only where the
 * imported file has finished running first; this holds the package to what
 * makes that so, and the worker to touching nothing else.
 */
const ROOT = path.join(__dirname, "..", "..", "..", "..");
const CONTRACTS = path.join(ROOT, "packages", "contracts", "src");

function sources(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return sources(full);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) ? [full] : [];
  });
}

const parse = (file: string) => ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

/** A file's imports and re-exports that carry a value at run time (a type-only one is erased), by specifier. */
function valueImports(file: string): string[] {
  const out: string[] = [];
  for (const node of parse(file).statements) {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const clause = node.importClause;
      const typeOnly = !!clause && (clause.isTypeOnly || (!clause.name && !!clause.namedBindings && ts.isNamedImports(clause.namedBindings) && clause.namedBindings.elements.length > 0 && clause.namedBindings.elements.every((e) => e.isTypeOnly)));
      if (!typeOnly) out.push(node.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
      const typeOnly = node.isTypeOnly || (!!node.exportClause && ts.isNamedExports(node.exportClause) && node.exportClause.elements.every((e) => e.isTypeOnly));
      if (!typeOnly) out.push(node.moduleSpecifier.text);
    }
  }
  return out;
}

function resolve(from: string, specifier: string): string {
  const base = path.resolve(path.dirname(from), specifier);
  const found = [`${base}.ts`, path.join(base, "index.ts")].find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`${path.relative(ROOT, from)} imports ${specifier}, which is not a file`);
  return found;
}

describe("the contracts package, bundled with plain exports", () => {
  const files = sources(CONTRACTS);

  it("hands a contracts file on with live bindings off, and every other file as it came", () => {
    const given = { dev: false, platform: "android", customTransformOptions: { environment: "client" } };
    for (const name of [path.join(CONTRACTS, "index.ts"), path.join(CONTRACTS, "v1", "fees.ts"), "../../packages/contracts/src/v1/library.ts", "packages/contracts/src/locale.ts"]) {
      expect(worker.CONTRACTS_FILE.test(name)).toBe(true);
      const options = worker.optionsFor(name, given);
      expect(options.customTransformOptions).toEqual({ environment: "client", liveBindings: "false" });
      expect(options.dev).toBe(false);
      expect(options.platform).toBe("android");
    }
    // What it was given is not changed for the next file.
    expect(given.customTransformOptions).toEqual({ environment: "client" });
    for (const name of ["src/lib/nav.ts", "src/screens/staff/fees.tsx", "../../packages/i18n/src/en.ts", "../../packages/api-client/src/index.ts", "../../node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.js", "../../packages/contracts/src/index.test.ts"]) {
      expect(worker.CONTRACTS_FILE.test(name)).toBe(false);
      expect(worker.optionsFor(name, given)).toBe(given);
    }
  });

  it("hands every file to Expo's own transform worker", () => {
    expect(worker.UPSTREAM.split(path.sep).join("/")).toMatch(/@expo\/metro-config\/build\/transform-worker\/transform-worker\.js$/);
  });

  it("names the switch Expo's worker still reads, so that an upgrade that renamed it cannot bring the getters back unseen", () => {
    // Expo's worker chooses its import and export plugin by `customTransformOptions?.liveBindings !== 'false'`; if that ever
    // reads another name, the flag this sets is ignored and the contracts' 2,275 getters (178 KB) come back with no error.
    const core = fs.readFileSync(path.join(path.dirname(worker.UPSTREAM), "metro-transform-worker.js"), "utf8");
    const reads = core.match(/customTransformOptions\?\.liveBindings !== ['"]false['"]/g) ?? [];
    expect(reads.length).toBeGreaterThanOrEqual(1);
    expect(core).toMatch(/liveBindings\s*\?\s*[\w.]*importExportLiveBindingsPlugin\s*:\s*[\w.]*importExportPlugin/);
  });

  it("is the transformer of every bundle, with its own text in the transformer's cache key", () => {
    const config = fs.readFileSync(path.join(__dirname, "..", "..", "metro.config.js"), "utf8");
    // At the top level, not inside a release-only block as the dictionaries' and the contracts' shares are: the development server bundles so too.
    expect(config).toMatch(/^config\.transformerPath = require\.resolve\("\.\/scripts\/contracts-exports\.cjs"\);$/m);
    expect(config).toMatch(/^config\.transformer\.edulinkContractsExports = contractsExports\.CACHE_KEY;$/m);
    const text = fs.readFileSync(path.join(__dirname, "..", "..", "scripts", "contracts-exports.cjs"));
    expect(worker.CACHE_KEY).toBe(crypto.createHash("sha1").update(text).digest("hex"));
  });

  it("imports nothing from outside but zod and @edulink/i18n, and @edulink/i18n nothing from it", () => {
    const outside = new Set(files.flatMap((file) => valueImports(file).filter((specifier) => !specifier.startsWith("."))));
    expect([...outside].sort()).toEqual(["@edulink/i18n", "zod"]);
    const i18n = sources(path.join(ROOT, "packages", "i18n", "src"));
    expect(i18n.length).toBeGreaterThan(3);
    expect(i18n.filter((file) => valueImports(file).some((specifier) => specifier.startsWith("@edulink/contracts")))).toEqual([]);
  });

  it("has no import cycle among its files, so each file it imports has finished running first", () => {
    const graph = new Map(files.map((file) => [file, valueImports(file).filter((specifier) => specifier.startsWith(".")).map((specifier) => resolve(file, specifier))]));
    expect([...graph.values()].flat().length).toBeGreaterThan(90);
    // A depth-first walk that meets a file still on its own path has found a cycle.
    const done = new Set<string>();
    const cycles: string[] = [];
    const visit = (file: string, trail: string[]) => {
      if (trail.includes(file)) {
        cycles.push([...trail.slice(trail.indexOf(file)), file].map((f) => path.relative(CONTRACTS, f)).join(" → "));
        return;
      }
      if (done.has(file)) return;
      for (const next of graph.get(file) ?? []) visit(next, [...trail, file]);
      done.add(file);
    };
    for (const file of files) visit(file, []);
    expect(cycles).toEqual([]);
  });

  it("holds only imports, exports and declarations at the top of a file, and no default export", () => {
    // A statement run for its effect, or a default export, is where the plain transform could part from the live one:
    // its `export *` copies `default` across, and a side effect would run once the file is first read either way but be
    // the one thing in the package not covered by the reading above.
    const allowed = new Set([
      ts.SyntaxKind.ImportDeclaration,
      ts.SyntaxKind.ExportDeclaration,
      ts.SyntaxKind.VariableStatement,
      ts.SyntaxKind.FunctionDeclaration,
      ts.SyntaxKind.InterfaceDeclaration,
      ts.SyntaxKind.TypeAliasDeclaration,
      ts.SyntaxKind.EnumDeclaration,
      ts.SyntaxKind.ClassDeclaration,
    ]);
    const found: string[] = [];
    for (const file of files) {
      for (const node of parse(file).statements) {
        const where = `${path.relative(CONTRACTS, file)}:${ts.getLineAndCharacterOfPosition(node.getSourceFile(), node.getStart()).line + 1}`;
        if (!allowed.has(node.kind)) found.push(`${where} ${ts.SyntaxKind[node.kind]}`);
        else if (ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((m) => m.kind === ts.SyntaxKind.DefaultKeyword)) found.push(`${where} export default`);
      }
    }
    expect(found).toEqual([]);
  });

  it("gives every name the index re-exports one file only, where the plain `export *` (the last file wins) and the live one (the first) agree", () => {
    const { starred, own } = subset.indexShape();
    expect(starred.length).toBeGreaterThan(80);
    const from = new Map<string, string[]>();
    for (const file of starred) for (const name of subset.exportsOf(file)) from.set(name, [...(from.get(name) ?? []), path.relative(CONTRACTS, file)]);
    expect([...from].filter(([, where]) => where.length > 1).map(([name, where]) => `${name}: ${where.join(", ")}`)).toEqual([]);
    // The index's own exports win over a re-exported one either way, but none shares a name today.
    expect([...own].filter((name) => from.has(name))).toEqual([]);
  });

  it("exports nothing a later assignment could change, which only a live binding would carry", () => {
    const changeable: string[] = [];
    for (const file of files) {
      const statements = parse(file).statements;
      const lets = new Set<string>();
      for (const node of statements) {
        if (!ts.isVariableStatement(node) || (node.declarationList.flags & ts.NodeFlags.Const) !== 0) continue;
        for (const d of node.declarationList.declarations) if (ts.isIdentifier(d.name)) lets.add(d.name.text);
        if (node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) changeable.push(`${path.relative(CONTRACTS, file)} ${node.declarationList.declarations.map((d) => d.name.getText()).join(", ")}`);
      }
      for (const node of statements) {
        if (!ts.isExportDeclaration(node) || node.moduleSpecifier || !node.exportClause || !ts.isNamedExports(node.exportClause)) continue;
        for (const el of node.exportClause.elements) if (lets.has((el.propertyName ?? el.name).text)) changeable.push(`${path.relative(CONTRACTS, file)} ${el.name.text}`);
      }
    }
    expect(changeable).toEqual([]);
  });
});
