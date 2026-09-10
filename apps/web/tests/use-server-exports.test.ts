import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * A "use server" file may export async functions — and type declarations,
 * which the compiler erases — but nothing else. Next refuses a RE-EXPORT
 * (`export type { X } from "…"`, `export { y } from "…"`), a constant or a
 * plain function there, and when it does the module exports NOTHING: every
 * page that imports an action from it fails to render. TypeScript accepts all
 * of those, and no unit test imports the module the way Next does — so on
 * 10 Sep 2026 two type re-exports in app/join/actions.ts (CodeLookup and
 * ClaimState, each left by a refactor that moved logic into src/lib) broke
 * /join, /join/student, /join/parent and /parent/link, and only the route
 * sweep noticed. This reads every "use server" module and names each export
 * Next would refuse, so the break fails here instead.
 */
const SRC = join(__dirname, "..", "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(name) ? [p] : [];
  });
}

function isUseServer(text: string): boolean {
  // The directive must be the first statement: skip leading comments and blank lines.
  const body = text.replace(/^(\s*(\/\/[^\n]*\n|\/\*[\s\S]*?\*\/))*\s*/, "");
  return /^["']use server["'];?/.test(body);
}

/** Every top-level export Next refuses in a "use server" module, as "line: text". */
export function badExports(text: string): string[] {
  const allowed = [
    /^export\s+async\s+function\b/,
    /^export\s+default\s+async\s+function\b/,
    /^export\s+type\s+[A-Za-z_$][\w$]*\s*(<[^>]*>)?\s*=/, // a type alias — erased
    /^export\s+interface\b/, // erased
  ];
  const out: string[] = [];
  text.split("\n").forEach((line, i) => {
    if (!/^export\b/.test(line)) return;
    if (allowed.some((re) => re.test(line))) return;
    out.push(`${i + 1}: ${line.trim().slice(0, 80)}`);
  });
  return out;
}

describe('"use server" modules', () => {
  const files = walk(SRC).filter((f) => isUseServer(readFileSync(f, "utf8")));

  it("are found", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("export only what Next accepts: async functions and type declarations", () => {
    const offenders = files.flatMap((f) => badExports(readFileSync(f, "utf8")).map((line) => `${relative(SRC, f)}:${line}`));
    expect(offenders).toEqual([]);
  });

  it("the check refuses re-exports, constants and plain functions, and allows type declarations", () => {
    const sample = [
      '"use server";',
      "export type { X } from './x';",
      "export { y } from './y';",
      "export * from './z';",
      "export const c = 1;",
      "export function plain() {}",
      "export async function ok() {}",
      "export type State = { ok: boolean };",
      "export type Pair<T> = [T, T];",
      "export interface Shape { a: number }",
    ].join("\n");
    expect(badExports(sample).map((l) => l.split(": ")[1])).toEqual([
      "export type { X } from './x';",
      "export { y } from './y';",
      "export * from './z';",
      "export const c = 1;",
      "export function plain() {}",
    ]);
  });
});
