import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A route file exports handlers and Next's own config fields, nothing else:
 * `next build` type-checks every route against that list and refuses a
 * build on a stray `export const`. The build of 2026-10-01 fell on three
 * budget constants three builders had exported for their tests; the dev
 * server never minds, so only a build — or this — sees it.
 */
const ALLOWED = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS", "dynamic", "revalidate", "runtime", "preferredRegion", "maxDuration", "fetchCache", "dynamicParams", "generateStaticParams", "metadata", "config"]);

function routes(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...routes(full));
    else if (name === "route.ts" || name === "route.tsx") out.push(full);
  }
  return out;
}

describe("every route file", () => {
  it("exports only handlers and Next's config fields", () => {
    const root = join(__dirname, "..", "src", "app");
    const offenders: string[] = [];
    for (const file of routes(root)) {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(/^export\s+(?:async\s+)?(?:const|function|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
        if (!ALLOWED.has(m[1]!)) offenders.push(`${file.slice(root.length + 1)}: ${m[1]}`);
      }
      for (const m of source.matchAll(/^export\s+\{([^}]*)\}/gm)) {
        for (const name of m[1]!.split(",").map((s) => s.trim().split(/\s+as\s+/).pop()!).filter(Boolean)) {
          if (!ALLOWED.has(name)) offenders.push(`${file.slice(root.length + 1)}: ${name}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
