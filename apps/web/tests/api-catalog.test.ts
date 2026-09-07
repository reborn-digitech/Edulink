/**
 * The catalog and the route files agree. An endpoint that exists but is not
 * listed is undocumented and unswept; an entry with no handler is a lie in
 * the OpenAPI document. Both fail here.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ENDPOINTS } from "@/lib/api-catalog";

const ROOT = "src/app/api/v1";

function routeFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...routeFiles(p));
    else if (name === "route.ts") out.push(p);
  }
  return out;
}

function fileFor(path: string): string {
  // /api/v1/me/sessions/{sessionId} → src/app/api/v1/me/sessions/[sessionId]/route.ts
  return join("src/app", path.replace(/\{(\w+)\}/g, "[$1]"), "route.ts");
}

describe("the /api/v1 catalog", () => {
  it("every listed endpoint has a route file exporting its method", () => {
    const missing: string[] = [];
    for (const e of ENDPOINTS) {
      const file = fileFor(e.path);
      if (!existsSync(file)) {
        missing.push(`${e.method} ${e.path} → ${file} does not exist`);
        continue;
      }
      const src = readFileSync(file, "utf8");
      if (!new RegExp(`export\\s+(async\\s+)?function\\s+${e.method}\\b`).test(src)) missing.push(`${e.method} ${e.path} → ${file} does not export ${e.method}`);
    }
    expect(missing).toEqual([]);
  });

  it("every route file under /api/v1 is listed, method by method", () => {
    const unlisted: string[] = [];
    for (const file of routeFiles(ROOT)) {
      const path = "/" + file.replace(/^src\/app\//, "").replace(/\/route\.ts$/, "").replace(/\[(\w+)\]/g, "{$1}");
      const src = readFileSync(file, "utf8");
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        if (!new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`).test(src)) continue;
        if (!ENDPOINTS.some((e) => e.path === path && e.method === method)) unlisted.push(`${method} ${path}`);
      }
    }
    expect(unlisted).toEqual([]);
  });

  it("paths are versioned, unique per method, and parameters are braced", () => {
    const seen = new Set<string>();
    for (const e of ENDPOINTS) {
      expect(e.path.startsWith("/api/v1/")).toBe(true);
      expect(e.path).not.toMatch(/\[|:/);
      const key = `${e.method} ${e.path}`;
      expect(seen.has(key), `duplicate ${key}`).toBe(false);
      seen.add(key);
    }
  });
});
