/**
 * Two of the web failures of the CI triage of 15 November 2026, held here.
 *
 *   R1  e2e/global-setup.ts and e2e/global-teardown.ts imported scripts/local-db-guard.mjs (09b19738 and a17f4711, for
 *       TA-263), and Playwright's loader rewrote the .mjs to CommonJS while Node loaded it as an ES module: the set-up
 *       threw "exports is not defined in ES module scope" before any test on every web browser job of runs 43584799007
 *       (a17f4711) and 43592779839 (ee1a3cf5), and every later push. They now ask the guard's command
 *       (e2e/local-database.ts) before they write, and no file under e2e/ imports a .mjs.
 *   E1  72c9c968 (TA-031) let a principal named as a register's cover take it, so /teacher/attendance admits PRINCIPAL,
 *       and the page sweep still expected the role's redirect (307) for its principal, who covers no class (runs
 *       43561321855 to 43592779839). It now expects the page, with nothing on it to take.
 *
 * The first two cases read files; the guard's cases run its command, which asks the server two things and writes nothing.
 */
import { describe, expect, it, vi } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { refuseUnlessLocalDatabaseAt } from "../e2e/local-database";

const ROOT = join(__dirname, "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/** An import, a re-export, a dynamic import or a require of a .mjs file. */
const IMPORTS_MJS = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)["'][^"']*\.mjs["']/;

/** Every source file under e2e/, the folders a run writes (its report, results and screenshots) left out. */
function e2eSources(dir = join(ROOT, "e2e")): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return ["report", "results", "__screenshots__", "node_modules"].includes(entry.name) ? [] : e2eSources(path);
    return /\.[cm]?[jt]sx?$/.test(entry.name) ? [path] : [];
  });
}

/** The database the suites themselves use (tests/setup.ts points DATABASE_URL at the owner's). */
const suitesDatabase = () => process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL;

describe("R1: the Playwright set-up runs, and still asks whether the database is on this machine first", () => {
  it("R1: no file under e2e/ imports a .mjs, which Playwright's loader turns to CommonJS and Node then loads as an ES module", () => {
    // The rule knows the spelling that broke CI, and passes the guard's path handed to a command.
    expect(IMPORTS_MJS.test('import { refuseUnlessLocalDatabase } from "../scripts/local-db-guard.mjs";')).toBe(true);
    expect(IMPORTS_MJS.test('const guard = await import("../scripts/local-db-guard.mjs");')).toBe(true);
    expect(IMPORTS_MJS.test('realpathSync(join(__dirname, "..", "scripts", "local-db-guard.mjs"))')).toBe(false);
    const files = e2eSources();
    expect(files.length).toBeGreaterThan(20);
    expect(files.filter((file) => IMPORTS_MJS.test(readFileSync(file, "utf8"))).map((file) => relative(ROOT, file))).toEqual([]);
  });

  it("R1: the set-up and the tear-down hand the guard's command the URL their own client writes to", () => {
    for (const file of ["e2e/global-setup.ts", "e2e/global-teardown.ts"]) {
      const text = read(file);
      expect(text, file).toMatch(/const databaseUrl = process\.env\.DATABASE_ADMIN_URL \?\? process\.env\.DATABASE_URL;\n\s*const db = new PrismaClient\(\{ datasourceUrl: databaseUrl \}\);/);
      expect(text, file).toMatch(/\n\s+refuseUnlessLocalDatabaseAt\(databaseUrl, "the Playwright suites' (set-up|teardown)"\);/);
    }
  });

  it("R1: the guard's command passes the suites' own database and prints its verdict", () => {
    const out = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    try {
      expect(() => refuseUnlessLocalDatabaseAt(suitesDatabase(), "the CI triage's case")).not.toThrow();
      expect(out.mock.calls.map((call) => String(call[0])).join("")).toMatch(/the CI triage's case: the server (answered on|is CI's own service container)/);
    } finally {
      out.mockRestore();
    }
  }, 30_000);

  it("R1: a database the guard cannot confirm, and a production NODE_ENV, are refused with the guard's own reason", () => {
    expect(() => refuseUnlessLocalDatabaseAt("postgresql://zz@127.0.0.1:9/edulink_dev", "the CI triage's case")).toThrow(/^refusing to run the CI triage's case: /);
    const env = process.env as Record<string, string | undefined>;
    const was = env.NODE_ENV;
    env.NODE_ENV = "production";
    try {
      expect(() => refuseUnlessLocalDatabaseAt(suitesDatabase(), "the CI triage's case")).toThrow(/^refusing to run the CI triage's case: NODE_ENV=production/);
    } finally {
      env.NODE_ENV = was;
    }
  }, 30_000);
});

describe("E1: the page sweep's principal on the register page follows who the page admits", () => {
  it("E1: a principal the page admits (TA-031, 72c9c968) is expected on it, given no register and no class to pick", () => {
    const page = read("src/app/(app)/teacher/attendance/page.tsx");
    const sweep = read("scripts/sweep.ts");
    const admitsPrincipal = /requireRole\([^)]*"PRINCIPAL"[^)]*\)/.test(page);
    expect(admitsPrincipal).toBe(true);
    // The role's redirect is expected only of a page that does not admit the role.
    expect(/check\(head, "\/teacher\/attendance", 307/.test(sweep)).toBe(!admitsPrincipal);
    const block = sweep.slice(sweep.indexOf('hit(head, "/teacher/attendance")'), sweep.indexOf('check(head, "/attendance/history"'));
    expect(block).toMatch(/expected: 200,/);
    for (const hook of ['data-empty-state="true"', 'data-testid="register-sync"', 'href="/teacher/attendance?classId=']) expect(block).toContain(hook);
    // The hooks the sweep reads are the page's own, so a hook renamed away cannot pass as an absence.
    expect(read("src/app/(app)/teacher/attendance/register.tsx")).toContain('data-testid="register-sync"');
    expect(page).toContain("href={`/teacher/attendance?classId=${klass.id}");
    expect(read("src/components/ui/states.tsx")).toContain('data-empty-state="true"');
  });
});
