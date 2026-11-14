/**
 * TA-512, the owner's decision of 14 November 2026 (list first, then declare and tighten): the API sweep let a permitted
 * role's fixed-address GET answer 404 by default, so a read that lost its own rows passed. Built here: the sweep's
 * report mode (`--report-not-found`, scripts/sweep-not-found.ts), which lists every such 404 and fails nothing; CI's run
 * of it, whose list is uploaded; and the sweep header, which claimed a permitted GET was expected to answer 200. The
 * declarations per role and the tightened default come after the local run, and are not this suite's.
 *
 * Pure: no database and no server. The module is imported inside each case, so each case fails alone without it.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENDPOINTS, type Endpoint } from "@/lib/api-catalog";
import { declaredStatus, permits } from "@/lib/api-catalog/types";
import type { Role } from "@/lib/constants";

const WEB = process.cwd();
const read = (rel: string) => readFileSync(join(WEB, rel), "utf8");
const MODULE = join(WEB, "scripts", "sweep-not-found.ts");
const load = async () => {
  expect(existsSync(MODULE), "scripts/sweep-not-found.ts: the sweep's not-found report").toBe(true);
  return import("../scripts/sweep-not-found");
};

const fixed = (e: Endpoint) => e.method === "GET" && !/\{\w+\}/.test(e.path) && e.path !== "/api/v1/events";
/** A fixed-address read open to the office with nothing declared: the default [200, 404] judges it. */
const plainRead = ENDPOINTS.find((e) => fixed(e) && e.access === "signed-in" && !e.duties?.length && declaredStatus(e, "ADMIN") === undefined)!;
const withParam = ENDPOINTS.find((e) => e.method === "GET" && /\{\w+\}/.test(e.path) && e.access === "signed-in" && declaredStatus(e, "ADMIN") === undefined)!;

describe("TA-512: the API sweep's not-found report", () => {
  it("TA-512: a fixed-address read judged by the default alone is reportable, and nothing declared, parameterised or refused is", async () => {
    const { judgedByDefault } = await load();
    expect(plainRead).toBeDefined();
    expect(judgedByDefault(plainRead, "ADMIN", permits(plainRead, "ADMIN"))).toBe(true);
    // A door with a parameter in its path answers 404 for another tenant's sample by design (G4-2): not this list's.
    expect(withParam).toBeDefined();
    expect(judgedByDefault(withParam, "ADMIN", true)).toBe(false);
    // Declared for the door, or for the role: the catalog already says what the role gets.
    const declared: Endpoint = { ...plainRead, emptyBodyStatus: [200, 404] };
    expect(judgedByDefault(declared, "ADMIN", true)).toBe(false);
    const byRole: Endpoint = { ...plainRead, statusByRole: { TEACHER: 404 } };
    expect(judgedByDefault(byRole, "TEACHER", true)).toBe(false);
    expect(judgedByDefault(byRole, "ADMIN", true)).toBe(true);
    // A role the door refuses, a write, the event stream, and the doors whose answer is not the default.
    expect(judgedByDefault(plainRead, "ADMIN", false)).toBe(false);
    expect(judgedByDefault({ ...plainRead, method: "POST" }, "ADMIN", true)).toBe(false);
    expect(judgedByDefault({ ...plainRead, path: "/api/v1/events" }, "ADMIN", true)).toBe(false);
    for (const access of ["account", "operator", "app-admin", "anyone"] as const) expect(judgedByDefault({ ...plainRead, access }, "ADMIN", true), access).toBe(false);
    // The catalog holds many such reads today: the population the finding counted.
    const roles: Role[] = ["ADMIN", "PRINCIPAL", "TEACHER", "PARENT", "STUDENT"];
    const reportable = ENDPOINTS.filter((e) => roles.some((r) => judgedByDefault(e, r, permits(e, r))));
    expect(reportable.length).toBeGreaterThan(100);
  });

  it("TA-512: the report lists each 404 door by door with its roles, counts what the default judged, and says none failed", async () => {
    const { NotFoundReport } = await load();
    const report = new NotFoundReport();
    const a = { method: "GET", path: "/api/v1/zz/a" } as const;
    const b = { method: "GET", path: "/api/v1/zz/b" } as const;
    report.note(b, "TEACHER", "/api/v1/zz/b", 404);
    report.note(a, "TEACHER", "/api/v1/zz/a?term=1", 404);
    report.note(a, "ADMIN", "/api/v1/zz/a?term=1", 404);
    report.note(a, "ADMIN", "/api/v1/zz/a?term=1", 404); // the same call twice is one
    report.note(b, "ADMIN", "/api/v1/zz/b", 200);
    expect(report.doors()).toEqual([
      { door: "GET /api/v1/zz/a", sample: "/api/v1/zz/a?term=1", roles: ["ADMIN", "TEACHER"] },
      { door: "GET /api/v1/zz/b", sample: "/api/v1/zz/b", roles: ["TEACHER"] },
    ]);
    const lines = report.lines();
    expect(lines[0]).toBe("· not found (report): GET /api/v1/zz/a as ADMIN, TEACHER (sample /api/v1/zz/a?term=1)");
    expect(lines[1]).toBe("· not found (report): GET /api/v1/zz/b as TEACHER");
    expect(lines.at(-1)).toMatch(/^not-found report \(TA-512\): 3 of 4 calls at 2 of 2 fixed-address reads judged by the default \[200, 404\] answered 404 to a permitted role; listed, none failed/);
    const json = report.json(new Date("2026-11-14T10:00:00Z"), "http://localhost:3000", "features on: none");
    expect(json).toMatchObject({ finding: "TA-512", generatedAt: "2026-11-14T10:00:00.000Z", judgedCalls: 4, judgedDoors: 2, notFoundCalls: 3, gate: "features on: none" });
    expect(json.doors).toHaveLength(2);
  });

  it("TA-512: the flag turns the mode on, with or without a file, and an empty file is refused", async () => {
    const { notFoundReportFlag } = await load();
    expect(notFoundReportFlag(["--chunk=1/2"])).toBeUndefined();
    expect(notFoundReportFlag(["--report-not-found"])).toBeNull();
    expect(notFoundReportFlag(["--features=on", "--report-not-found=not-found.json"])).toBe("not-found.json");
    expect(() => notFoundReportFlag(["--report-not-found="])).toThrow(/name a file/);
  });

  it("TA-512: api-sweep notes every permitted fixed-address read judged by the default, prints and writes the list, and sets no exit code for it", () => {
    const src = read("scripts/api-sweep.ts");
    expect(src).toMatch(/from "\.\/sweep-not-found"/);
    expect(src).toMatch(/const NOT_FOUND = notFoundReportFlag\(process\.argv\)/);
    // In the main walk, after the call: a role's answer, not the feature gate's or the handler's own feature-off 404, nor the module gate's.
    expect(src).toMatch(/if \(NOT_FOUND !== undefined && role && !byHandler && off !== "must" && judgedByDefault\(e, role, actorPermits\(e, role\)\)\) notFound\.note\(e, role, path, got\.status\)/);
    // Printed, and written where a file was named, before the clean-up.
    const tail = src.slice(src.indexOf("const failed = results.filter((r) => !r.ok);", src.indexOf("async function main()")));
    expect(tail).toMatch(/for \(const line of notFound\.lines\(\)\) console\.log\(line\)/);
    expect(tail).toMatch(/writeFileSync\(NOT_FOUND, JSON\.stringify\(notFound\.json\(/);
    // The list fails nothing: the exit code is still the failures' and the variants' alone.
    expect(tail).toMatch(/if \(failed\.length \|\| variantResults\.some\(\(r\) => !r\.ok\)\) process\.exitCode = 1;/);
    expect(src).not.toMatch(/notFound[^\n]*process\.exitCode/);
    // The default itself is unchanged until the declarations: the tightened default is the campaign's last commit.
    expect(src).toMatch(/declaredStatus\(e, role\) \?\? \[200, 404\]\);/);
  });

  it("TA-512: the sweep header no longer claims a permitted GET is expected to answer 200, and names the report", () => {
    const src = read("scripts/api-sweep.ts");
    const header = src.slice(0, src.indexOf("*/"));
    expect(header).not.toMatch(/A GET is expected to answer 200 for a permitted\s+\* role/);
    expect(header).toMatch(/--report-not-found/);
    expect(header).toMatch(/200 or 404/);
    expect(header).toMatch(/TA-512/);
  });

  it("TA-512: CI's API sweep runs the report and uploads its list, whatever the step's outcome", () => {
    const workflow = readFileSync(join(WEB, "..", "..", ".github", "workflows", "battery.yml"), "utf8");
    const steps = workflow.split(/\n\s+- name: /).slice(1).map((chunk) => ({ name: chunk.split("\n")[0]!.trim(), body: chunk }));
    const sweep = steps.find((s) => s.name.startsWith("API sweep"));
    expect(sweep?.body).toMatch(/run: npm run api:sweep -- --report-not-found=api-sweep-not-found\.json/);
    const upload = steps.find((s) => /uses: actions\/upload-artifact@v\d+/.test(s.body) && s.body.includes("apps/web/api-sweep-not-found.json"));
    expect(upload, "an upload of the not-found list").toBeDefined();
    expect(upload!.body).toMatch(/if: always\(\)/);
    // In the sweep job, after the API sweep and before anything rebuilds the fixtures.
    const at = (name: string) => steps.findIndex((s) => s === steps.find((x) => x.name.startsWith(name)));
    const uploadAt = steps.indexOf(upload!);
    expect(uploadAt).toBeGreaterThan(at("API sweep"));
    expect(uploadAt).toBeLessThan(at("Fixtures again, after the API sweep"));
  });
});
