/**
 * The catalog and the route files agree. An endpoint that exists but is not
 * listed is undocumented and unswept; an entry with no handler is a lie in
 * the OpenAPI document. Both fail here.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { ENDPOINTS, type SweepFixture } from "@/lib/api-catalog";
import { OUTSIDE_THE_CATALOG, UNVERSIONED } from "@/lib/api-catalog/unversioned";

const ROOT = "src/app/api/v1";
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

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

  it("paths are versioned (or among the unversioned doors), unique per method, and parameters are braced", () => {
    const seen = new Set<string>();
    for (const e of ENDPOINTS) {
      expect(e.path.startsWith("/api/v1/") || UNVERSIONED.includes(e), `${e.method} ${e.path} is versioned`).toBe(true);
      expect(e.path).not.toMatch(/\[|:/);
      const key = `${e.method} ${e.path}`;
      expect(seen.has(key), `duplicate ${key}`).toBe(false);
      seen.add(key);
    }
  });

  /**
   * R-30 (risks batch, 5 Oct 2026): eighteen doors with a parameter went unswept, each with no sample and nobody
   * saying why, and `sample: () => null` passed for one. A door whose path has a `{param}` now names a sample that
   * fills it from a fixture holding every row, or a reason in `noSample`; never both.
   */
  it("a door with a {param} has a sample that fills it, or says in noSample why not", () => {
    // A fixture that holds every row: each field a cuid-shaped id of its own name, today's key a date.
    const full = new Proxy({} as SweepFixture, { get: (_t, p) => (p === "todayKey" ? "2026-10-05" : `c${String(p).toLowerCase().replace(/[^a-z0-9]/g, "")}`.padEnd(25, "0")) });
    const bare: string[] = [];
    for (const e of ENDPOINTS) {
      if (!/\{\w+\}/.test(e.path)) continue;
      const key = `${e.method} ${e.path}`;
      if (e.noSample !== undefined) {
        expect(e.sample, `${key} names a sample and a reason for none`).toBeUndefined();
        expect(e.noSample.trim().split(/\s+/).length, `${key}: noSample is a sentence saying why`).toBeGreaterThanOrEqual(5);
        continue;
      }
      const path = typeof e.sample === "function" ? e.sample(full) : e.sample;
      if (!path || /\{\w+\}/.test(path)) bare.push(key);
    }
    expect(bare).toEqual([]);
  });
});

/**
 * EVERY /api ROUTE, NOT ONLY /api/v1 (A3-inventory-9, audit of 5 October
 * 2026). The register's write, POST /api/attendance, is the daily door of the
 * teacher on the web and the phone, and it sat outside the catalog: not in
 * openapi.json, no x-access for the phone's gate, never walked by api:sweep.
 * A route file outside /api/v1 is now catalogued (api-catalog/unversioned.ts
 * UNVERSIONED) or named, method by method, in OUTSIDE_THE_CATALOG with its
 * reason; anything else fails here.
 */
describe("the /api routes outside /api/v1", () => {
  const files = routeFiles("src/app/api").filter((f) => !f.startsWith(`${ROOT}/`));
  const pathOf = (file: string) => "/" + file.replace(/^src\/app\//, "").replace(/\/route\.ts$/, "").replace(/\[(\w+)\]/g, "{$1}");
  const exportsOf = (file: string) => METHODS.filter((m) => new RegExp(`export\\s+(async\\s+)?function\\s+${m}\\b`).test(readFileSync(file, "utf8")));

  it("there are some, so the walk below is not vacuous", () => {
    expect(files.length).toBeGreaterThan(5);
  });

  it("every method of every route file is catalogued or excluded with a reason", () => {
    const neither: string[] = [];
    for (const file of files) {
      const path = pathOf(file);
      for (const method of exportsOf(file)) {
        const catalogued = ENDPOINTS.some((e) => e.path === path && e.method === method);
        const excluded = OUTSIDE_THE_CATALOG.some((x) => x.path === path && x.methods.includes(method));
        if (!catalogued && !excluded) neither.push(`${method} ${path}`);
      }
    }
    expect(neither).toEqual([]);
  });

  it("an exclusion names a route that exists, exports each method it names, says why, and is not also catalogued", () => {
    const wrong: string[] = [];
    for (const x of OUTSIDE_THE_CATALOG) {
      const file = fileFor(x.path);
      if (!existsSync(file)) {
        wrong.push(`${x.path}: no route file`);
        continue;
      }
      const exported = exportsOf(file);
      for (const m of x.methods) if (!exported.includes(m)) wrong.push(`${m} ${x.path}: not exported`);
      if (x.reason.trim().length < 40) wrong.push(`${x.path}: no reason worth the name`);
      if (ENDPOINTS.some((e) => e.path === x.path)) wrong.push(`${x.path}: excluded and catalogued`);
    }
    expect(wrong).toEqual([]);
  });

  it("the register and the web's practice answer are catalogued, with the roles their handlers take", () => {
    const door = (method: string, path: string) => ENDPOINTS.find((e) => e.method === method && e.path === path);
    expect(door("POST", "/api/attendance")?.access).toEqual(["TEACHER", "ADMIN"]);
    expect(door("GET", "/api/attendance")?.access).toEqual(["TEACHER", "ADMIN"]);
    expect(door("POST", "/api/practice/answer")?.access).toEqual(["STUDENT"]);
    // The sweep can write the register: a valid body from the fixture, not only the empty body's 422.
    expect(door("POST", "/api/attendance")?.sampleBody).toBeTypeOf("function");
  });

  it("an unversioned door names no module, duty or limited role: the session's gate reads those under /api/v1 alone", () => {
    const wrong = UNVERSIONED.filter((e) => !e.path.startsWith("/api/v1/") && (e.module || e.duties?.length || e.limitedRoles?.length)).map((e) => `${e.method} ${e.path}`);
    expect(wrong).toEqual([]);
    for (const e of UNVERSIONED) expect(ENDPOINTS.includes(e), `${e.method} ${e.path} is in ENDPOINTS`).toBe(true);
  });
});
