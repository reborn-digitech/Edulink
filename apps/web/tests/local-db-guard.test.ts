import { describe, expect, it } from "vitest";
import { localDatabaseVerdict, refuseUnlessLocalDatabase } from "../scripts/local-db-guard.mjs";

/**
 * zz:fixtures, demo:schools and db:seed write known passwords or wipe every
 * school. They accepted any database whose URL said "localhost" — which a
 * `fly proxy` to production does. The server is asked where it answered.
 */
describe("localDatabaseVerdict — is the database server on this machine?", () => {
  it("accepts a unix socket (NULL) and the loopback in either family", () => {
    for (const addr of [null, undefined, "", "127.0.0.1", "127.0.0.1/32", "::1", "::ffff:127.0.0.1"]) {
      expect(localDatabaseVerdict(addr).local, String(addr)).toBe(true);
    }
  });

  it("⚠ refuses Fly's private network — a fly proxy tunnel — and says why", () => {
    const verdict = localDatabaseVerdict("fdaa:0:1a2b:a7b:1f5:9c3e:8e1c:2");
    expect(verdict.local).toBe(false);
    expect(verdict.why).toMatch(/Fly's private network/);
    expect(verdict.why).toMatch(/fly proxy/);
    // Not even on a CI runner.
    expect(localDatabaseVerdict("fdaa::3", { ci: true }).local).toBe(false);
  });

  it("refuses any other address, private or public", () => {
    for (const addr of ["10.0.0.5", "172.18.0.2", "192.168.1.20", "203.0.113.9", "2001:db8::1", "fd00::1"]) {
      const verdict = localDatabaseVerdict(addr);
      expect(verdict.local, addr).toBe(false);
      expect(verdict.why, addr).toMatch(/not this machine/);
    }
  });

  it("accepts CI's service container on its Docker bridge address, and only on CI", () => {
    expect(localDatabaseVerdict("172.18.0.2", { ci: true }).local).toBe(true);
    expect(localDatabaseVerdict("192.168.16.2", { ci: true }).local).toBe(true);
    expect(localDatabaseVerdict("10.0.0.5", { ci: true }).local).toBe(false);
    expect(localDatabaseVerdict("172.32.0.2", { ci: true }).local).toBe(false);
  });
});

describe("refuseUnlessLocalDatabase", () => {
  const client = (addr: string | null) => ({ $queryRawUnsafe: async <T,>() => [{ addr }] as T });

  it("asks the server and throws with the reason, naming the script", async () => {
    await expect(refuseUnlessLocalDatabase(client("fdaa::3"), "zz:fixtures")).rejects.toThrow(/refusing to run zz:fixtures: .*fly proxy/);
    await expect(refuseUnlessLocalDatabase(client("::1"), "db:seed")).resolves.toMatchObject({ local: true });
  });

  it("the real database these tests run against is on this machine", async () => {
    const { PrismaClient } = await import("@prisma/client");
    const db = new PrismaClient();
    try {
      await expect(refuseUnlessLocalDatabase(db, "the test suite")).resolves.toMatchObject({ local: true });
    } finally {
      await db.$disconnect();
    }
  });

  it("is called by every script that writes known passwords or wipes schools, before it writes", async () => {
    const { readFileSync } = await import("node:fs");
    expect(readFileSync("scripts/zz-fixtures.ts", "utf8")).toMatch(/await refuseUnlessLocalDatabase\(db, what\)/);
    expect(readFileSync("scripts/zz-fixtures.ts", "utf8")).toMatch(/async function main\(\) \{\n  await refuseUnlessLocal\(\);/);
    expect(readFileSync("scripts/demo-schools.ts", "utf8")).toMatch(/async function main\(\) \{\n  await refuseUnlessLocal\("demo:schools"\);/);
    expect(readFileSync("prisma/seed.ts", "utf8")).toMatch(/await refuseUnlessLocalDatabase\(db, "db:seed"\);\n  console\.log\("Seeding/);
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
    expect(pkg.scripts["db:reset"]).toMatch(/^node scripts\/with-admin-db\.mjs node scripts\/local-db-guard\.mjs db:reset && /);
  });
});
