/**
 * TA-509, the owner's decision of 14 November 2026: every Prisma call of a route handler or a server action looks
 * the caller up again (a session read, a membership transaction and its own tenant transaction with four
 * set_config calls), and nobody has counted what that costs. The decision changes no code now: the go-live
 * runbook's pre-launch load run, on staging from a second machine, counts the database statements per request and
 * profiles one door, and the owner decides before the first school. The runbooks are read as text.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repo = resolve(__dirname, "..", "..", "..");
const read = (path: string) => readFileSync(resolve(repo, path), "utf8");
const goLive = read("docs/runbooks/go-live.md");

/** The text of one numbered step of the go-live runbook, up to the next step or heading. */
function step(number: string): string {
  const at = goLive.indexOf(`- [ ] **${number} `);
  if (at < 0) throw new Error(`no step ${number}`);
  const rest = goLive.slice(at + 1);
  const next = rest.search(/\n- \[ \] \*\*|\n## /);
  return next < 0 ? rest : rest.slice(0, next);
}

describe("TA-509: the pre-launch load run measures the caller looked up per query", () => {
  it("TA-509: the go-live runbook has a pre-launch load run on staging, from a second machine, never production", () => {
    const run = step("3.11");
    expect(run).toMatch(/pre-launch load run/i);
    expect(run).toMatch(/staging/);
    expect(run).toMatch(/second machine/);
    expect(run).toMatch(/never on production/);
    expect(run).toContain("TA-509");
  });

  it("TA-509: that run counts the database statements per request with pg_stat_statements, for a read and a write", () => {
    const run = step("3.11");
    expect(run).toMatch(/statements per request/i);
    expect(run).toContain("pg_stat_statements_reset()");
    expect(run).toMatch(/sum\(calls\)/);
    expect(run).toContain("GET /api/v1/family/overview");
    expect(run).toMatch(/register POST/);
    // The reason is the pool, not "the database was never the limit".
    expect(run).toMatch(/P2028/);
  });

  it("TA-509: that run profiles one door and names what to read in the profile", () => {
    const run = step("3.11");
    expect(run).toMatch(/--cpu-prof/);
    expect(run).toContain("resolveRequestTenant");
    expect(run).toContain("ownMembershipIn");
    expect(run).toContain("set_config");
  });

  it("TA-509: the owner decides before the first school, and the first school waits for it", () => {
    const run = step("3.11");
    expect(run).toMatch(/\*\*Verify\.\*\*[^]*owner's decision[^]*before 7\.3/);
    expect(step("7.3")).toContain("3.11");
    const blockers = goLive.slice(goLive.indexOf("## Not yet possible until"));
    expect(blockers).toMatch(/\| [^|\n]*\(3\.11\) \| the first school \(7\.3\) \| engineer, owner \|/);
  });

  it("TA-509: the deploy runbook's pre-launch line points at the same run", () => {
    const deploy = read("docs/runbooks/deploy.md");
    expect(deploy).toMatch(/Before a launch, repeat the plan profile from a second machine[^]*go-live 3\.11/);
  });

  it("TA-509: no code changes now: the per-query lookup stays as the tenant resolver's comment describes it", () => {
    const tenant = read("apps/web/src/lib/tenant-request.ts");
    expect(tenant).toContain("export const resolveRequestTenant = cache(");
    expect(tenant).toMatch(/Anywhere else — a route handler, a server action — it silently does\s+\* nothing at all/);
  });
});
