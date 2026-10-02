import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Every endpoint the app calls is in the OpenAPI document, with the method
 * the app uses. The document is generated from the web's endpoint catalog
 * and checked for drift in CI, so this is the app's side of "the client and
 * the document never drift": a screen that calls a path the catalog does not
 * know fails here, on the runner, before any server is involved.
 */
type Doc = { paths: Record<string, Record<string, { "x-access": "anyone" | "signed-in" | "account" | "operator" | "app-admin" | string[] }>> };
const SRC = join(__dirname, "..", "..", "src");
const DOC = JSON.parse(readFileSync(join(__dirname, "..", "..", "..", "..", "docs", "api", "openapi.json"), "utf8")) as Doc;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}

/** "/api/v1/x/{id}" in the document matches "/api/v1/x/abc" from a template literal. */
function documented(method: string, path: string): boolean {
  for (const [pattern, ops] of Object.entries(DOC.paths)) {
    if (!(method.toLowerCase() in ops)) continue;
    const re = new RegExp("^" + pattern.replace(/\{[^}]+\}/g, "[^/]+") + "$");
    if (re.test(path)) return true;
  }
  return false;
}

export type Call = { method: string; path: string; where: string };
export function callsInSource(): Call[] {
  const calls: Call[] = [];
  for (const file of walk(SRC)) {
    const text = readFileSync(file, "utf8");
    const where = relative(SRC, file);
    // api().get("/api/v1/...") · .post(`/api/v1/x/${id}`) · .request("DELETE", "/api/v1/...") · enqueue({ method, path }) shapes.
    for (const m of text.matchAll(/\.(get|post|put|patch|delete)(?:<[^>]*>)?\(\s*[`"](\/api\/v1\/[^"`?]*)/g)) calls.push({ method: m[1]!.toUpperCase(), path: m[2]!, where });
    for (const m of text.matchAll(/\.request(?:<[^>]*>)?\(\s*"(GET|POST|PUT|PATCH|DELETE)",\s*[`"](\/api\/v1\/[^"`?]*)/g)) calls.push({ method: m[1]!, path: m[2]!, where });
    for (const m of text.matchAll(/method:\s*"(GET|POST|PUT|PATCH|DELETE)"[^}]{0,200}?path:\s*[`"](\/api\/v1\/[^"`?]*)/gs)) calls.push({ method: m[1]!, path: m[2]!, where });
    for (const m of text.matchAll(/path:\s*[`"](\/api\/v1\/[^"`?]*)[`"][^}]{0,200}?method:\s*"(GET|POST|PUT|PATCH|DELETE)"/gs)) calls.push({ method: m[2]!, path: m[1]!, where });
  }
  return calls.map((c) => ({ ...c, path: literalPath(c.path) }));
}

/**
 * A template literal's `${...}` is an id when the path so far ends in "/"
 * (it becomes a placeholder segment) and a query builder otherwise (the
 * path ends there: the document has no query strings in its paths).
 */
function literalPath(raw: string): string {
  const i = raw.indexOf("${");
  if (i < 0) return raw;
  const before = raw.slice(0, i);
  const j = raw.indexOf("}", i);
  if (j < 0 || !before.endsWith("/")) return before.replace(/\/$/, "");
  return `${before}x${literalPath(raw.slice(j + 1))}`;
}

describe("the endpoints the app calls", () => {
  const calls = callsInSource();

  it("are a real list", () => {
    expect(calls.length).toBeGreaterThan(40);
  });

  it("are all in the OpenAPI document, method and path", () => {
    const unknown = calls.filter((c) => !documented(c.method, c.path)).map((c) => `${c.method} ${c.path} (${c.where})`);
    expect([...new Set(unknown)]).toEqual([]);
  });
});
