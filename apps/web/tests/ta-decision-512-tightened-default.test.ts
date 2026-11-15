/**
 * TA-512's last step, the owner's decision of 14 November 2026 (list first, then declare and tighten), built after the
 * run the owner's words order ("run it once all the issues are fixed and committed"): the API sweep with platform
 * features and plans on, 15 November 2026, listed twelve fixed-address reads that answered 404 to a permitted role,
 * fifteen calls in all. Each is by design for the role that met it, so each is declared in its door's catalog entry for
 * that role alone (statusByRole); and the sweep's default for a permitted role's GET with nothing declared becomes 200
 * at a fixed address (no parameter in the catalog path), while a read whose path names a parameter keeps [200, 404]
 * (another tenant's sample, G4-2). The report mode stays and lists any undeclared 404, which now fails the run too.
 *
 * Pure: no server, and no row of its own. The report module is imported inside each case, so each case fails alone
 * without the change.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ENDPOINTS, type Endpoint } from "@/lib/api-catalog";
import { declaredStatus, permits } from "@/lib/api-catalog/types";
import { ROLES, type Role } from "@/lib/constants";

const WEB = process.cwd();
const read = (rel: string) => readFileSync(join(WEB, rel), "utf8");
const load = () => import("../scripts/sweep-not-found");
const doorOf = (key: string): Endpoint | undefined => ENDPOINTS.find((e) => `${e.method} ${e.path}` === key);

/**
 * The run's list (15 November 2026, a production build of f6922ac2 with the sweep's fixes, features and plans on):
 * every door and role that answered 404 with nothing declared, and why that answer is right for that role.
 */
const BY_DESIGN: { door: string; roles: Role[]; why: string }[] = [
  { door: "GET /api/v1/family/placement", roles: ["PARENT"], why: "the sweep's guardian (zz.parent01) has no child at a college, so there is no child to read (access.notYourChild)" },
  { door: "GET /api/v1/fees/classes/roster", roles: ["ACCOUNTS"], why: "the sample is Northgate's class; the ACCOUNTS actor is at ZZ Vidya College (fees.notFound)" },
  { door: "GET /api/v1/iqac/council/bci", roles: ["IQAC"], why: "ZZ Vidya teaches arts, science and commerce, which bring no BCI return (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/iqac/council/nba", roles: ["HOD", "IQAC"], why: "ZZ Vidya teaches no engineering, so no NBA SAR (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/iqac/council/ncte", roles: ["IQAC"], why: "ZZ Vidya teaches no teacher education, so no NCTE return (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/iqac/council/pci", roles: ["IQAC"], why: "ZZ Vidya teaches no pharmacy, so no PCI inspection (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/iqac/disclosure", roles: ["IQAC"], why: "ZZ Vidya's streams bring no AICTE disclosure (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/iqac/insights/nba", roles: ["HOD", "IQAC"], why: "ZZ Vidya teaches no engineering, so no NBA SAR (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/iqac/simulate/nba", roles: ["HOD", "IQAC"], why: "ZZ Vidya teaches no engineering, so no NBA SAR (councilFilings.refuseNotApplicable)" },
  { door: "GET /api/v1/practice/next", roles: ["STUDENT"], why: "the sample names an attempt nobody has (access.attemptNotFound)" },
  { door: "GET /api/v1/practice/revision/question", roles: ["STUDENT"], why: "the sample names a question the pupil never answered (access.questionNotFound)" },
  { door: "GET /api/v1/practice/worksheets/sheet", roles: ["TEACHER"], why: "the sample names a chapter no bank holds (access.chapterNotFound)" },
];

describe("TA-512: the sweep's default is 200 at a fixed address, and the by-design 404s are declared per role", () => {
  it("TA-512: a permitted role's GET with nothing declared must answer 200 at a fixed address, and keeps [200, 404] where its path names a parameter", async () => {
    const m = await load();
    expect(typeof m.defaultGetStatus, "scripts/sweep-not-found.ts: defaultGetStatus, the sweep's default for a permitted GET").toBe("function");
    expect(typeof m.fixedAddressRead, "scripts/sweep-not-found.ts: fixedAddressRead, the report's own test").toBe("function");
    const fixedRead = ENDPOINTS.find((e) => e.method === "GET" && !/\{\w+\}/.test(e.path) && e.path !== "/api/v1/events" && e.access === "signed-in" && declaredStatus(e, "ADMIN") === undefined)!;
    const paramRead = ENDPOINTS.find((e) => e.method === "GET" && /\{\w+\}/.test(e.path) && e.access === "signed-in" && declaredStatus(e, "ADMIN") === undefined)!;
    expect(fixedRead).toBeDefined();
    expect(paramRead).toBeDefined();
    expect(m.defaultGetStatus(fixedRead)).toEqual([200]);
    expect(m.defaultGetStatus(paramRead)).toEqual([200, 404]);
    // A query string is not a parameter of the path: ?year=, ?classId= and ?attemptId= leave a read at a fixed address.
    expect(m.fixedAddressRead({ method: "GET", path: "/api/v1/iqac/council/pci", access: ["IQAC"] })).toBe(true);
    // Not a fixed-address read: a write, the event stream (held to 200 by expected() itself), and the doors the person or the platform decides.
    expect(m.fixedAddressRead({ ...fixedRead, method: "POST" })).toBe(false);
    expect(m.fixedAddressRead({ ...fixedRead, path: "/api/v1/events" })).toBe(false);
    for (const access of ["account", "operator", "app-admin", "anyone"] as const) expect(m.fixedAddressRead({ ...fixedRead, access }), access).toBe(false);
    // One test for both: the report notes exactly the calls the default now holds to 200.
    const drift: string[] = [];
    for (const e of ENDPOINTS) {
      for (const role of ROLES as readonly Role[]) {
        const permitted = permits(e, role);
        if (m.judgedByDefault(e, role, permitted) !== (permitted && m.fixedAddressRead(e) && declaredStatus(e, role) === undefined)) drift.push(`${e.method} ${e.path} as ${role}`);
      }
    }
    expect(drift).toEqual([]);
  });

  it("TA-512: api-sweep's expected() holds a permitted GET to what the catalog declares for the role, then to that default", () => {
    const src = read("scripts/api-sweep.ts");
    expect(src).toMatch(/import \{[^}]*\bdefaultGetStatus\b[^}]*\} from "\.\/sweep-not-found";/);
    const start = src.indexOf("function expected(e: Endpoint, role: Role | null)");
    expect(start).toBeGreaterThan(0);
    const body = src.slice(start, src.indexOf("\n}\n", start));
    expect(body).toMatch(/if \(e\.method === "GET"\) return e\.path === "\/api\/v1\/events" \? 200 : \(declaredStatus\(e, role\) \?\? defaultGetStatus\(e\)\);/);
    expect(body).not.toMatch(/declaredStatus\(e, role\) \?\? \[200, 404\]\)/);
  });

  it("TA-512: each 404 of the run of 15 November 2026 is declared for the role that met it, and for no other role", async () => {
    const m = await load();
    expect(BY_DESIGN).toHaveLength(12);
    expect(BY_DESIGN.reduce((n, d) => n + d.roles.length, 0)).toBe(15);
    for (const d of BY_DESIGN) {
      const e = doorOf(d.door);
      expect(e, d.door).toBeDefined();
      // Per role, not per door: nothing declared door-wide, and exactly the roles that met the 404.
      expect(e!.emptyBodyStatus, `${d.door}: no door-wide status`).toBeUndefined();
      expect(Object.keys(e!.statusByRole ?? {}).sort(), `${d.door}: declared for ${d.roles.join(" and ")}`).toEqual([...d.roles].sort());
      for (const role of d.roles) {
        expect(permits(e!, role), `${d.door}: ${role} is let in`).toBe(true);
        expect(declaredStatus(e!, role), `${d.door} as ${role}: ${d.why}`).toBe(404);
      }
      expect(m.fixedAddressRead(e!), `${d.door}: a fixed-address read`).toBe(true);
      // Every other role the door lets in keeps the default, and must be answered 200.
      for (const role of ROLES as readonly Role[]) {
        if (d.roles.includes(role) || !permits(e!, role)) continue;
        expect(declaredStatus(e!, role) ?? m.defaultGetStatus(e!), `${d.door} as ${role}`).toEqual([200]);
      }
    }
  });

  it("TA-512: the report still lists an undeclared 404 at a fixed address, and says it failed the run", async () => {
    const { NotFoundReport } = await load();
    const report = new NotFoundReport();
    report.note({ method: "GET", path: "/api/v1/zz/a" }, "TEACHER", "/api/v1/zz/a", 404);
    report.note({ method: "GET", path: "/api/v1/zz/a" }, "ADMIN", "/api/v1/zz/a", 200);
    const lines = report.lines();
    expect(lines[0]).toBe("· not found (report): GET /api/v1/zz/a as TEACHER");
    const last = lines.at(-1)!;
    expect(last).toMatch(/^not-found report \(TA-512\): 1 of 2 calls at 1 of 1 fixed-address reads judged by the default \[200\] answered 404 to a permitted role; each failed the run/);
    expect(last).not.toMatch(/none failed|before the default becomes/);
  });

  it("TA-512: the sweep's header, the report's own and CI's step say what the default is now", () => {
    const flat = (text: string) => text.replace(/\n\s*\*\s?/g, " ").replace(/\n\s*#\s?/g, " ").replace(/\s+/g, " ");
    const sweep = read("scripts/api-sweep.ts");
    const header = flat(sweep.slice(0, sweep.indexOf("*/")));
    expect(header).toMatch(/where nothing is declared, 200 at a fixed address \(no parameter in its catalog path\) and 200 or 404 at a path that names a parameter/);
    expect(header).not.toMatch(/a permitted role's 404 is accepted by default/);
    expect(header).not.toMatch(/fail none of them|until then the default above stands/);
    const report = read("scripts/sweep-not-found.ts");
    expect(flat(report.slice(0, report.indexOf("*/")))).not.toMatch(/until then the default is unchanged/);
    const workflow = read("../../.github/workflows/battery.yml");
    const at = workflow.indexOf("- name: API sweep · every endpoint as every role");
    expect(at).toBeGreaterThan(0);
    const step = flat(workflow.slice(at, workflow.indexOf("- name: API sweep not-found list", at)));
    expect(step).not.toMatch(/fails none of them/);
    expect(step).toMatch(/a 404 there fails the run/);
  });
});
