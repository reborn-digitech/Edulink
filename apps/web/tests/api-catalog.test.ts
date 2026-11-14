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
import { REACHES, reachFits, reachFor, reachRoles } from "@/lib/api-catalog/types"; // owner-batch-item13

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

  /**
   * owner-batch-item5 (27 Oct 2026): `kinds` says a door is for some kinds of institution only, and the gate answers
   * every other kind 404 (role-gate.ts rule 4). A door naming it names known kinds, none twice, not all of them (that
   * is no `kinds`), and is a door of the versioned API (the gate reads `kinds` under /api/v1 alone). The college's
   * campus doors were each decided: those a school uses too carry no `kinds`, the rest say a college's.
   */
  it("a door naming kinds names known institution kinds, some but not all, and the campus doors are each decided", async () => {
    const { INSTITUTION_KINDS } = await import("@edulink/contracts");
    const { COLLEGE_CAMPUS } = await import("@/lib/api-catalog/college-campus");
    const kinded = ENDPOINTS.filter((e) => e.kinds);
    expect(kinded.length).toBeGreaterThan(0);
    for (const e of kinded) {
      const key = `${e.method} ${e.path}`;
      expect(e.kinds!.length, key).toBeGreaterThan(0);
      expect(e.kinds!.length, `${key}: every kind is no kinds at all`).toBeLessThan(INSTITUTION_KINDS.length);
      expect(new Set(e.kinds).size, key).toBe(e.kinds!.length);
      for (const k of e.kinds!) expect((INSTITUTION_KINDS as readonly string[]).includes(k), `${key}: ${k}`).toBe(true);
      expect(e.path.startsWith("/api/v1/"), key).toBe(true);
    }
    const schoolsToo = COLLEGE_CAMPUS.filter((e) => !e.kinds).map((e) => `${e.method} ${e.path}`).sort();
    expect(schoolsToo).toEqual(["GET /api/v1/library/eresources", "POST /api/v1/hostel/room-change", "POST /api/v1/library/eresources", "POST /api/v1/library/eresources/{resourceId}/open", "POST /api/v1/library/isbn-import"]);
    for (const e of COLLEGE_CAMPUS.filter((x) => x.kinds)) expect(e.kinds, `${e.method} ${e.path}`).toEqual(["COLLEGE", "AUTONOMOUS_COLLEGE"]);
    // The college office's mess bill and route fees too (coordinator's decision 1): a school's office has its own doors.
    for (const path of ["/api/v1/accounts/mess-bill", "/api/v1/accounts/route-fees"]) expect(ENDPOINTS.find((e) => e.method === "POST" && e.path === path)?.kinds, path).toEqual(["COLLEGE", "AUTONOMOUS_COLLEGE"]);
    for (const path of ["/api/v1/admin/hostel/mess-bill", "/api/v1/admin/transport/route-fees"]) expect(ENDPOINTS.find((e) => e.method === "POST" && e.path === path)?.kinds, path).toBeUndefined();
  });

  /**
   * owner-batch-item13 (1 Nov 2026, after the subject-teacher bug of 10e5f2d2): a door whose path or body names a
   * class, a pupil, a child, a membership or a piece of work declares its REACH — which of those rows each of its roles
   * reaches (catalog types.ts REACHES) — so the API sweep walks it as the role variants that reach implies. Those that
   * name such a thing and declare none are listed in REACH_EXEMPT, each with why.
   */
  it("a door naming a class, pupil, child, membership or piece of work declares its reach, or is exempted with a reason", () => {
    const missing: string[] = [];
    for (const e of ENDPOINTS) {
      const key = `${e.method} ${e.path}`;
      const names = reachNames(e);
      if (names.length === 0) continue;
      if (REACH_EXEMPT[key]) {
        expect(e.reach, `${key} is exempted and declares a reach`).toBeUndefined();
        continue;
      }
      if (!e.reach) missing.push(`${key} (names ${names.join(", ")})`);
    }
    expect(missing).toEqual([]);
    for (const [key, reason] of Object.entries(REACH_EXEMPT)) {
      const e = ENDPOINTS.find((x) => `${x.method} ${x.path}` === key);
      expect(e, `${key}: exempted but not in the catalog`).toBeDefined();
      expect(reachNames(e!).length, `${key}: exempted but names nothing that asks for a reach`).toBeGreaterThan(0);
      expect(reason.trim().split(/\s+/).length, `${key}: the exemption says why in a sentence`).toBeGreaterThanOrEqual(6);
    }
  });

  it("a declared reach gives every role of its door one value from the closed list that fits that role", () => {
    const wrong: string[] = [];
    const declared = ENDPOINTS.filter((e) => e.reach);
    expect(declared.length).toBeGreaterThan(100);
    for (const e of declared) {
      const key = `${e.method} ${e.path}`;
      const roles = reachRoles(e);
      if (roles.length === 0) wrong.push(`${key}: an open door's reach must name its roles one by one`);
      if (typeof e.reach === "string" && !(REACHES as readonly string[]).includes(e.reach)) wrong.push(`${key}: ${e.reach} is not a reach`);
      if (typeof e.reach === "object") {
        for (const [role, value] of Object.entries(e.reach)) {
          if (!(REACHES as readonly string[]).includes(value as string)) wrong.push(`${key}: ${role} ${value} is not a reach`);
          if (Array.isArray(e.access) && !e.access.includes(role as never)) wrong.push(`${key}: ${role} is in the reach and not in access`);
        }
      }
      for (const role of roles) {
        const r = reachFor(e, role);
        if (!r) wrong.push(`${key}: ${role} has no reach`);
        else if (!reachFits(r, role)) wrong.push(`${key}: ${r} cannot describe a ${role}`);
      }
      if (e.reachRefusal && !e.reach) wrong.push(`${key}: reachRefusal without a reach`);
    }
    expect(wrong).toEqual([]);
  });
});

/** The parameter and body names that ask a door for a reach (owner-batch-item13): a class, a pupil, a child, a membership, a piece of work. */
const REACH_NAME = /^(classId|classIds|fromClassId|toClassIds?|childId|childIds|assignmentIds?|studentMembershipIds?|membershipIds?|[a-z][A-Za-z]*MembershipIds?)$/;

/** Every key a zod schema names, nested objects and arrays included (zod 3's _def). */
function schemaKeys(schema: unknown, depth = 0): string[] {
  const def = (schema as { _def?: Record<string, unknown> } | undefined)?._def;
  if (!def || depth > 6) return [];
  switch (def.typeName) {
    case "ZodObject": {
      const shape = (typeof def.shape === "function" ? (def.shape as () => Record<string, unknown>)() : def.shape) as Record<string, unknown>;
      return Object.entries(shape).flatMap(([k, v]) => [k, ...schemaKeys(v, depth + 1)]);
    }
    case "ZodOptional": case "ZodNullable": case "ZodDefault": case "ZodReadonly": case "ZodCatch": case "ZodBranded":
      return schemaKeys(def.innerType ?? def.type, depth);
    case "ZodEffects": return schemaKeys(def.schema, depth);
    case "ZodPipeline": return schemaKeys(def.in, depth);
    case "ZodLazy": return schemaKeys((def.getter as () => unknown)(), depth + 1);
    case "ZodArray": return schemaKeys(def.type, depth + 1);
    case "ZodUnion": case "ZodDiscriminatedUnion": {
      const options = def.options instanceof Map ? [...def.options.values()] : (def.options as unknown[]);
      return options.flatMap((o) => schemaKeys(o, depth + 1));
    }
    case "ZodIntersection": return [...schemaKeys(def.left, depth + 1), ...schemaKeys(def.right, depth + 1)];
    default: return [];
  }
}

function reachNames(e: (typeof ENDPOINTS)[number]): string[] {
  const names = new Set([...[...e.path.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!), ...schemaKeys(e.request)]);
  return [...names].filter((n) => REACH_NAME.test(n)).sort();
}

/** Doors that name such a thing and declare no reach, each with why (owner-batch-item13). */
const REACH_EXEMPT: Record<string, string> = {
  // None on 1 November 2026: every such door declares one. An entry is "METHOD /path": "why, in a sentence".
};

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
    // A principal named as register cover marks it (TA-031); registerDuty refuses one with no cover.
    expect(door("POST", "/api/attendance")?.access).toEqual(["TEACHER", "ADMIN", "PRINCIPAL"]);
    expect(door("GET", "/api/attendance")?.access).toEqual(["TEACHER", "ADMIN", "PRINCIPAL"]);
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
