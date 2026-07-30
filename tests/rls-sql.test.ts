import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * That the checked-in RLS policies still match the schema.
 *
 * `prisma/rls.sql` is generated, and the reason it is generated is the shape of
 * its failure mode. A table with RLS enabled and NO policy returns nothing to
 * anybody — annoying, obvious, fixed in minutes. A table that never had RLS
 * enabled returns EVERYTHING to EVERY tenant, and looks perfectly normal until
 * somebody notices another school's children in their list. Adding a model and
 * forgetting to regenerate is the second one.
 *
 * This cannot check that the policies WORK — that needs a running Postgres, and
 * this suite deliberately runs without a database server. `prisma/rls-verify.sql`
 * is the thing that proves behaviour, against a real database, before deploying.
 * All this checks is that the file on disk still describes the current schema.
 */

const ROOT = process.cwd();

describe("prisma/rls.sql", () => {
  it("⚠ is up to date with the schema", () => {
    // The generator's own --check mode, so there is one definition of "matches".
    expect(() =>
      execFileSync(
        "npx",
        ["tsx", "--tsconfig", "scripts/tsconfig.json", "scripts/gen-rls.ts", "--check"],
        { cwd: ROOT, stdio: "pipe" },
      ),
    ).not.toThrow();
  });

  it("covers every tenant table and forces the policy on each", () => {
    const sql = readFileSync(resolve(ROOT, "prisma/rls.sql"), "utf8");
    const enabled = sql.match(/ENABLE ROW LEVEL SECURITY/g) ?? [];
    const forced = sql.match(/FORCE ROW LEVEL SECURITY/g) ?? [];
    const policies = sql.match(/CREATE POLICY/g) ?? [];

    // Every enabled table is forced and has exactly one policy. A count that
    // drifts apart means a table was half-configured.
    expect(forced).toHaveLength(enabled.length);
    expect(policies).toHaveLength(enabled.length);
    expect(policies.length).toBeGreaterThanOrEqual(20);
  });

  it("⚠ reads the tenant from a setting that fails closed when unset", () => {
    const sql = readFileSync(resolve(ROOT, "prisma/rls.sql"), "utf8");
    // The `true` makes an unset variable NULL rather than raising. NULL through
    // string_to_array is NULL, and `= ANY (NULL)` is NULL — not true — so a
    // query that forgot to say who it is for sees nothing. Drop the `true` and
    // an unset variable raises instead, which is safe but turns every
    // unauthenticated page into a 500.
    const uses = sql.match(/current_setting\('app\.school_ids', true\)/g) ?? [];
    expect(uses.length).toBeGreaterThanOrEqual(20);
    expect(sql).not.toContain("current_setting('app.school_ids')\n");
    // A set, not one id — a parent spans schools and a teacher may hold two posts.
    expect(sql).toContain("= ANY (string_to_array(");
  });
});
