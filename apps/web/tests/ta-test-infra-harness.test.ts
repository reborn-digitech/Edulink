/**
 * The harness's own clocks (testing analysis of 13 November 2026, the 'test-infra' batch). Nothing here writes
 * to the database: the cases call the scripts' pure parts and read the scripts' and the workflow's text.
 *
 *   TA-462  zz:token minted one-hour sessions and the phone's browser suite in CI, which has run 38 to 46 minutes
 *           and more, signed in with them: a slow run's tail was sent back to sign-in for the harness's reason.
 *   TA-463  zz:fixtures, the API sweep, the page sweep and the load check cut "today" in UTC while the schools
 *           keep India's clock, so between 00:00 and 05:29 IST they wrote and looked for the school's yesterday.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { todayKey } from "@/lib/dates";
import { tokenExpiry, tokenHours } from "../scripts/zz-token-hours";

const WEB = join(__dirname, "..");
const read = (path: string) => readFileSync(join(WEB, path), "utf8");

describe("TA-462: the phone's suites in CI sign in with tokens that outlast the run", () => {
  it("TA-462: zz:token takes --hours=N (1 to 24), one hour when it is not given", () => {
    expect(tokenHours([])).toBe(1);
    expect(tokenHours(["--tag=walk"])).toBe(1);
    expect(tokenHours(["--hours=6"])).toBe(6);
    expect(tokenHours(["--tag=x", "--hours=24"])).toBe(24);
    for (const bad of ["--hours=0", "--hours=25", "--hours=1.5", "--hours=", "--hours=six"]) expect(() => tokenHours([bad]), bad).toThrow(/--hours/);
    const now = Date.UTC(2026, 10, 14, 6, 0, 0);
    expect(tokenExpiry(6, now).toISOString()).toBe("2026-11-14T12:00:00.000Z");
    // The script mints with the flag's hours, not a fixed hour.
    const script = read("scripts/zz-token.ts");
    expect(script).not.toMatch(/expiresAt: new Date\(Date\.now\(\) \+ 3_600_000\)/);
    expect(script).toMatch(/expiresAt: tokenExpiry\(tokenHours\(flags\)\)/);
  });

  it("TA-462: the mobile contract step and the mobile browser step mint every token for six hours", () => {
    // The workflow's steps, each from its "- name:" line to the next (the web app has no YAML reader of its own).
    const workflow = readFileSync(join(WEB, "..", "..", ".github", "workflows", "battery.yml"), "utf8");
    const steps = workflow.split(/\n\s+- name: /).slice(1).map((chunk) => ({ name: chunk.split("\n")[0]!.trim(), run: chunk }));
    const minting = steps.filter((s) => /zz:token -- (?!--purge)/.test(s.run));
    expect(minting.map((s) => s.name)).toEqual(expect.arrayContaining([expect.stringMatching(/^Mobile contract tests/), expect.stringMatching(/^Mobile accessibility gate/)]));
    for (const step of minting) {
      const mints = step.run.split("\n").filter((line) => /zz:token -- (?!--purge)/.test(line));
      expect(mints.length, step.name).toBeGreaterThan(0);
      // One line per role, or the mint() function TA-460 gave both steps, which mints the role it is handed.
      for (const line of mints) expect(line, step.name).toMatch(/zz:token -- --hours=6 (?:[A-Z_]+|"\$1")\)"/);
    }
  });
});

/** The harness scripts that cut a school's "today". */
const TODAY_SCRIPTS = ["scripts/zz-fixtures.ts", "scripts/api-sweep.ts", "scripts/sweep.ts", "scripts/load-check.ts"];

describe("TA-463: the harness's 'today' is the school's, on India's clock", () => {
  it("TA-463: India's today across the boundary (00:00, 04:47, 05:29, 05:30, 23:59 IST) is not the UTC date before 05:30", () => {
    const at = (ist: string) => new Date(`${ist}+05:30`);
    const table: [string, string, string][] = [
      ["2026-11-16T00:00:00", "2026-11-16", "2026-11-15"],
      ["2026-11-16T04:47:00", "2026-11-16", "2026-11-15"],
      ["2026-11-16T05:29:59", "2026-11-16", "2026-11-15"],
      ["2026-11-16T05:30:00", "2026-11-16", "2026-11-16"],
      ["2026-11-16T23:59:00", "2026-11-16", "2026-11-16"],
    ];
    for (const [ist, school, utc] of table) {
      expect(todayKey("Asia/Kolkata", at(ist)), ist).toBe(school);
      expect(at(ist).toISOString().slice(0, 10), ist).toBe(utc);
    }
  });

  it("TA-463: no harness script takes a school's today from the UTC date", () => {
    for (const path of TODAY_SCRIPTS) {
      const text = read(path);
      const utcToday = text.split("\n").filter((line) => /new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/.test(line));
      expect(utcToday, path).toEqual([]);
    }
  });

  it("TA-463: the substitution board's absence and cover, and the sweeps that look for them, use the school's zone", () => {
    const fixtures = read("scripts/zz-fixtures.ts");
    for (const fn of ["buildSubstitutions", "buildHeadCover"]) {
      const start = fixtures.indexOf(`export async function ${fn}(`);
      const body = fixtures.slice(start, fixtures.indexOf("\n}\n", start));
      expect(body, fn).toMatch(/const today = await schoolToday\(school\.id\)/);
    }
    expect(read("scripts/api-sweep.ts")).toMatch(/todayKey: await schoolToday\(s\)/);
    expect(read("scripts/load-check.ts")).toMatch(/todayKey\(/);
  });
});
