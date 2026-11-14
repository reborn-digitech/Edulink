/**
 * TA-263 (testing analysis of 13 November 2026, the 'test-infra' batch): the vitest set-up and the Playwright
 * set-up wrote to whatever database the URL named. tests/setup.ts deleted every login-lockout counter and
 * e2e/global-setup.ts deleted the stale "e2e" sessions and switched every platform feature on, with no local
 * database guard, though the seed, zz:fixtures and the demo builders ask scripts/local-db-guard.mjs first. With
 * DATABASE_ADMIN_URL exported to production, or a fly proxy on the port .env names, `npx vitest run` would have
 * wiped production's counters and `npm run e2e` switched paid features on for every school.
 *
 * Now both set-ups, the Playwright teardown and zz:token (the BDD run's and the phone suites' sign-in) call
 * refuseUnlessLocalDatabase before their first write. The cases read the files' text (nothing here runs a
 * set-up, so nothing is written whatever the database is) and call the guard with a client that fails the
 * case if it is ever asked anything.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { localDatabaseVerdict, refuseUnlessLocalDatabase } from "../scripts/local-db-guard.mjs";

const ROOT = join(__dirname, "..");
const read = (path: string) => readFileSync(join(ROOT, path), "utf8");

/** The index of the guard's call and of the first write, in a file's text (the guard's own lines excluded). */
function guardBeforeWrites(path: string, writes: RegExp): { guard: number; firstWrite: number } {
  const text = read(path);
  return { guard: text.search(/await refuseUnlessLocalDatabase\((setupDb|db),/), firstWrite: text.search(writes) };
}

describe("TA-263: the test set-ups ask whether the database is on this machine before they write", () => {
  it("TA-263: the vitest set-up asks the guard before it deletes a rate-limit counter", () => {
    const order = guardBeforeWrites("tests/setup.ts", /\.rateLimit\.deleteMany\(/);
    expect(order.firstWrite).toBeGreaterThan(-1);
    expect(order.guard).toBeGreaterThan(-1);
    expect(order.guard).toBeLessThan(order.firstWrite);
  });

  it("TA-263: the Playwright set-up asks before its first delete, create or upsert, and its teardown before it removes anything", () => {
    // Inside the function Playwright calls, before its first write and before the first session it mints (mint(),
    // defined above it, is called from it alone).
    const text = read("e2e/global-setup.ts");
    const start = text.indexOf("export default async function globalSetup()");
    const body = text.slice(start);
    const guard = body.search(/await refuseUnlessLocalDatabase\(db,/);
    const firstWrite = body.search(/db\.(session|platformFeature|examSeries|examSlot|classTeacher)\.(deleteMany|upsert|create|update|updateMany)\(/);
    expect(start).toBeGreaterThan(-1);
    expect(firstWrite).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(-1);
    expect(guard).toBeLessThan(firstWrite);
    expect(guard).toBeLessThan(body.indexOf("await mint("));
    expect(text.indexOf("await mint(")).toBeGreaterThan(start);
    const teardown = guardBeforeWrites("e2e/global-teardown.ts", /removeHarnessExam\(db|db\.(session|platformFeature)\.(deleteMany|updateMany)\(/);
    expect(teardown.firstWrite).toBeGreaterThan(-1);
    expect(teardown.guard).toBeGreaterThan(-1);
    expect(teardown.guard).toBeLessThan(teardown.firstWrite);
  });

  it("TA-263: zz:token, which the BDD run and the phone suites sign in with, asks before it mints or purges", () => {
    const text = read("scripts/zz-token.ts");
    const main = text.indexOf("async function main()");
    const guard = text.indexOf("await refuseUnlessLocalDatabase(db", main);
    expect(guard).toBeGreaterThan(main);
    expect(guard).toBeLessThan(text.indexOf("return purge()", main));
  });

  it("TA-263: under NODE_ENV=production the guard refuses before it asks the server anything", async () => {
    const env = process.env as Record<string, string | undefined>;
    const was = env.NODE_ENV;
    let asked = 0;
    const client = {
      $queryRawUnsafe: async <T = unknown>(): Promise<T> => {
        asked += 1;
        throw new Error("the guard asked the server");
      },
    };
    env.NODE_ENV = "production";
    try {
      await expect(refuseUnlessLocalDatabase(client, "the vitest suites")).rejects.toThrow(/NODE_ENV=production/);
    } finally {
      env.NODE_ENV = was;
    }
    expect(asked).toBe(0);
  });

  it("TA-263: the verdicts the set-ups now rely on: a Docker bridge address off CI and Fly's private network are refused", () => {
    expect(localDatabaseVerdict("172.18.0.2", { ci: false }).local).toBe(false);
    expect(localDatabaseVerdict("172.18.0.2", { ci: true }).local).toBe(true);
    expect(localDatabaseVerdict("fdaa::3", { ci: true }).local).toBe(false);
    expect(localDatabaseVerdict("127.0.0.1").local).toBe(true);
    expect(localDatabaseVerdict(null).local).toBe(true);
  });
});
