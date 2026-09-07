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

    // Every enabled table is forced, and every table has a write policy. A count
    // that drifts apart means a table was half-configured.
    expect(forced).toHaveLength(enabled.length);

    /**
     * ONE APPEND-ONLY TABLE, NAMED, so that "a table with no tenant isolation
     * policy" cannot become a category things drift into.
     *
     * `OperatorAccess` is the operator's visitor book and deliberately has no
     * `_tenant_isolation` policy: reads are the school's, writes are the
     * operator's, and DELETE is nobody's. Listing it here means a SECOND table
     * appearing without isolation still fails this test, which is the whole
     * point of counting.
     */
    const APPEND_ONLY = ["OperatorAccess"];
    const isolation = sql.match(/CREATE POLICY "\w+_tenant_isolation"/g) ?? [];
    expect(isolation).toHaveLength(enabled.length - APPEND_ONLY.length);

    for (const table of APPEND_ONLY) {
      expect(sql).toContain(`CREATE POLICY "${table}_readable"`);
      expect(sql).toContain(`CREATE POLICY "${table}_operator_insert"`);
      expect(sql).toContain(`CREATE POLICY "${table}_operator_update"`);
    }
    // Some tables carry a SECOND, read-only policy; never fewer than one each.
    expect(policies.length).toBeGreaterThanOrEqual(enabled.length);
    expect(policies.length).toBeGreaterThanOrEqual(20);
  });

  it("⚠ nobody at all may DELETE from the operator's visitor book", () => {
    const sql = readFileSync(resolve(ROOT, "prisma/rls.sql"), "utf8");

    /**
     * THE PROPERTY THE WHOLE OVERSIGHT FEATURE RESTS ON.
     *
     * An operator may now open a school and is bound to it exactly as an admin
     * is. What makes that defensible rather than a master key is that the
     * school can see it happened — so the record of it must survive both
     * parties. Postgres denies what no policy permits, so the guarantee is the
     * ABSENCE of a policy, and an absence is precisely the kind of thing a
     * later edit adds back without noticing.
     *
     * Asserted by reading the generated SQL rather than by trusting the
     * generator, because the generator is the thing that would be edited.
     */
    expect(sql).toContain('CREATE POLICY "OperatorAccess_readable"');
    expect(sql).not.toMatch(/CREATE POLICY "OperatorAccess\w*"\s+ON "OperatorAccess"\s+FOR DELETE/);
    expect(sql).not.toMatch(/ON "OperatorAccess"\s+FOR ALL/);
  });

  it("⚠ every read-widening policy is SELECT-only and has no WITH CHECK", () => {
    // THE PROPERTY A DELETE CAN VIOLATE. Postgres applies WITH CHECK to INSERT
    // and UPDATE only; a DELETE is authorised by USING alone. So a clause added
    // to USING purely to make a row readable also makes it deletable. That is
    // not hypothetical — it shipped, and `npm run rls:verify` caught it by
    // deleting one school's global post as another school.
    //
    // The fix is structural: widened predicates live in their own FOR SELECT
    // policy, and every write goes through the tenant-only one. This asserts the
    // structure so the fix cannot be undone by a later edit to the generator.
    const sql = readFileSync(resolve(ROOT, "prisma/rls.sql"), "utf8");
    const readable = [...sql.matchAll(/CREATE POLICY "(\w+_readable)" ON "\w+"([\s\S]*?);\n/g)];

    expect(readable.length).toBeGreaterThan(0);
    for (const [, name, body] of readable) {
      expect(body, `${name} must be FOR SELECT`).toMatch(/FOR SELECT/);
      expect(body, `${name} must not carry a WITH CHECK`).not.toMatch(/WITH CHECK/);
    }
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
