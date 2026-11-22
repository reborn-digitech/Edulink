/**
 * The terms report writes nothing, and that is held by its source, not assumed (scripts/terms-report.ts; the coordinating
 * session's C4 and C4a point 7 of 21 November 2026): no create, update, delete or upsert of any table, no raw statement but
 * the one that opens its transaction READ ONLY, that statement first in an interactive transaction with an explicit
 * timeout, and none of the library's readers, which may write (activePlans creates missing plan rows). A pure source test.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(__dirname, "../scripts/terms-report.ts"), "utf8");
// The code, less its comments, so that the doc's own words do not count.
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"])\/\/.*$/gm, "$1");

describe("the terms report writes nothing", () => {
  it("no write of any table, and no raw statement but SET TRANSACTION READ ONLY", () => {
    expect(code).not.toMatch(/\.(create|createMany|createManyAndReturn|update|updateMany|updateManyAndReturn|upsert|delete|deleteMany)\(/);
    expect(code).not.toMatch(/\$(executeRawUnsafe|queryRawUnsafe|queryRaw)\b/);
    // Nor a raw statement in its call form (tx.$executeRaw(Prisma.sql`…`)), which the tagged form below would not catch.
    expect(code).not.toMatch(/\$executeRaw\s*\(/);
    const raws = code.match(/\$executeRaw`[^`]*`/g) ?? [];
    expect(raws).toEqual(["$executeRaw`SET TRANSACTION READ ONLY`"]);
  });

  it("the SET opens an interactive transaction with an explicit timeout, before any read", () => {
    const opened = code.indexOf("$transaction(");
    const set = code.indexOf("SET TRANSACTION READ ONLY");
    const firstRead = code.search(/\btx\.\w+\.(findUnique|findMany|findFirst|count|aggregate|groupBy)\(/);
    expect(opened).toBeGreaterThan(-1);
    expect(set).toBeGreaterThan(opened);
    expect(firstRead).toBeGreaterThan(set);
    expect(code).toMatch(/timeout: \d[\d_]*/);
  });

  it("reads through none of the library's readers, and needs one scope and only one", () => {
    expect(code).not.toMatch(/from "\.\.\/src\/lib\/(person-plans|school-terms|subscriptions|plans|db)"/);
    expect(code).toContain("--fixtures");
    expect(code).toContain("process.exitCode = 2");
    expect(code).toContain(".length !== 1) return null;");
  });
});
