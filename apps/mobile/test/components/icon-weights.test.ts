import { readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const iconWeights = require("../../scripts/icon-weights.cjs") as {
  KEPT: string[];
  DROPPED: string[];
  ICON_FILE: RegExp;
  trimWeights: (src: string, filename?: string) => string;
};

/**
 * The icons' weights (scripts/icon-weights.cjs): every bundle carries each
 * Phosphor icon in the four weights the phone draws, and draws the other two
 * names regular. This holds the phone's source to those four, and holds every
 * icon file the phone imports to the shape the trim reads, by trimming it and
 * running what comes out.
 */
const SRC = join(__dirname, "..", "..", "src");
const ICONS = join(SRC, "components", "icon.tsx");
const PACKAGE = realpathSync(join(__dirname, "..", "..", "node_modules", "phosphor-react-native"));

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

/** The icon files icon.tsx imports, by name. */
const imported = [...readFileSync(ICONS, "utf8").matchAll(/phosphor-react-native\/src\/icons\/(\w+)"/g)].map((m) => m[1]!);

/** A trimmed icon file, compiled and run as Metro would hand it on. */
function load(name: string): Map<string, unknown> {
  const file = join(PACKAGE, "src", "defs", `${name}.tsx`);
  const trimmed = iconWeights.trimWeights(readFileSync(file, "utf8"), file);
  const out = ts.transpileModule(trimmed, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020, esModuleInterop: true }, reportDiagnostics: true });
  expect(out.diagnostics ?? []).toEqual([]);
  const module = { exports: {} as { default?: Map<string, unknown> } };
  new Function("require", "module", "exports", out.outputText)(require, module, module.exports);
  return module.exports.default!;
}

describe("the icons' weights", () => {
  it("the phone's source asks for no weight but the four the bundle carries", () => {
    const asked: string[] = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\bweight\s*(?:=|:)\s*(\{[^}\n]*\}|"[^"\n]*"|'[^'\n]*')/g)) {
        for (const w of m[1]!.matchAll(/["'](\w+)["']/g)) asked.push(`${relative(SRC, file)} ${w[1]}`);
      }
    }
    expect(asked.length).toBeGreaterThan(0);
    // fontWeight is not a weight= or weight: of an icon, and the pattern's word boundary keeps it out.
    expect(asked.filter((entry) => !iconWeights.KEPT.includes(entry.split(" ")[1]!))).toEqual([]);
  });

  it("the transformer trims only Phosphor's icon files", () => {
    expect(iconWeights.ICON_FILE.test(join(PACKAGE, "src", "defs", "Gear.tsx"))).toBe(true);
    expect(iconWeights.ICON_FILE.test(join(PACKAGE, "src", "icons", "Gear.tsx"))).toBe(false);
    expect(iconWeights.ICON_FILE.test(ICONS)).toBe(false);
  });

  it.each(imported)("%s keeps its four weights and draws the other two regular", (name) => {
    expect(imported.length).toBeGreaterThan(50);
    const weights = load(name);
    for (const weight of iconWeights.KEPT) expect(weights.get(weight)).toBeTruthy();
    expect(typeof weights.get("duotone")).toBe("function");
    for (const weight of iconWeights.DROPPED) expect(weights.get(weight)).toBe(weights.get("regular"));
    expect(weights.size).toBe(iconWeights.KEPT.length + iconWeights.DROPPED.length);
  });

  it("fails loudly on a file of another shape rather than bundling it whole", () => {
    expect(() => iconWeights.trimWeights("export default new Map([]);", "Odd.tsx")).toThrow(/Odd\.tsx has no 'light' entry/);
  });
});
