import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { en } from "@edulink/i18n/en";

/**
 * Every key the app asks the dictionary for exists. The translator falls
 * back to the key itself when a key is missing, so a typo ships as a dotted
 * string on a screen rather than as a failing build; this is the build
 * failing instead. Dynamic keys (t(`role.${x}`)) are checked by prefix: the
 * prefix must name a namespace that exists.
 */
type Tree = Record<string, unknown>;
function flatten(tree: unknown, prefix = ""): Set<string> {
  const out = new Set<string>();
  if (!tree || typeof tree !== "object") return out;
  for (const [k, v] of Object.entries(tree as Tree)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") for (const kk of flatten(v, key)) out.add(kk);
    else out.add(key);
  }
  return out;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

const SRC = join(__dirname, "..", "..", "src");
const KEYS = flatten(en);

describe("the translation keys the app uses", () => {
  const files = walk(SRC);
  const literal = new Map<string, string[]>();
  const dynamic = new Map<string, string[]>();
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    const where = relative(SRC, file);
    for (const m of text.matchAll(/\bt\("([a-zA-Z0-9_.]+)"/g)) literal.set(m[1]!, [...(literal.get(m[1]!) ?? []), where]);
    for (const m of text.matchAll(/\b(?:labelKey|label|titleKey|bodyKey|hintKey):\s*"([a-zA-Z0-9_]+\.[a-zA-Z0-9_.]+)"/g)) literal.set(m[1]!, [...(literal.get(m[1]!) ?? []), where]);
    for (const m of text.matchAll(/\bt\(`([a-zA-Z0-9_.]+)\$\{/g)) dynamic.set(m[1]!, [...(dynamic.get(m[1]!) ?? []), where]);
  }

  it("are all in the English dictionary", () => {
    expect(literal.size).toBeGreaterThan(500);
    const missing = [...literal].filter(([k]) => !KEYS.has(k)).map(([k, files]) => `${k} (${[...new Set(files)].join(", ")})`);
    expect(missing).toEqual([]);
  });

  it("name a namespace that exists when the key is built at runtime", () => {
    const missing = [...dynamic].filter(([prefix]) => ![...KEYS].some((k) => k.startsWith(prefix))).map(([p, files]) => `${p}… (${[...new Set(files)].join(", ")})`);
    expect(missing).toEqual([]);
  });
});
