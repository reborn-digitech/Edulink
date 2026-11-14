/**
 * The harness's own hygiene, from the testing analysis of 13 November 2026 (source reads; nothing runs or is written).
 *
 *   TA-465: the page sweep and the Playwright harness deleted every session of their kind (userAgent "sweep", "e2e"),
 *           so a second run on the same database lost its sessions to the first one's ending (a wall of 307 to /login).
 *           The sweep now deletes the sessions it minted, by id; the harness's set-up deletes only expired ones and its
 *           tear-down the ones its set-up wrote to .sessions.json; a spec that mints its own deletes those by hash.
 *   TA-513: early returns let cases pass with nothing asserted when a fixture was absent: two in tenancy.test.ts, and
 *           the practice bank's in worksheets and the report card annexure, which now skip on a laptop and fail on CI.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const read = (path: string) => readFileSync(resolve(__dirname, "..", path), "utf8");

describe("TA-465: each run removes its own sessions", () => {
  it("TA-465: the page sweep deletes the sessions it minted, by id, and never every sweep session", () => {
    const sweep = read("scripts/sweep.ts");
    expect(sweep).not.toMatch(/session\.deleteMany\(\{ where: \{ userAgent: "sweep" \} \}\)/);
    expect(sweep.match(/session\.deleteMany\(\{ where: \{ id: \{ in: minted \} \} \}\)/g)).toHaveLength(3);
    // Both of its mints record the row they made.
    expect(sweep.match(/minted\.push\(/g)).toHaveLength(2);
  });

  it("TA-465: the Playwright harness's set-up deletes only expired sessions and its tear-down only its own", () => {
    const setup = read("e2e/global-setup.ts");
    const teardown = read("e2e/global-teardown.ts");
    expect(setup).not.toMatch(/session\.deleteMany\(\{ where: \{ userAgent: "e2e" \} \}\)/);
    expect(setup).toMatch(/userAgent: "e2e", expiresAt: \{ lt: new Date\(\) \}/);
    expect(teardown).not.toMatch(/session\.deleteMany\(\{ where: \{ userAgent: "e2e" \} \}\)/);
    expect(teardown).toMatch(/tokenHash: \{ in: hashes \}/);
  });

  it("TA-465: every spec that mints a session of its own deletes exactly those, by their token hashes, in its afterAll", () => {
    const dir = resolve(__dirname, "..", "e2e");
    const minting = readdirSync(dir).filter((f) => f.endsWith(".spec.ts") && /db\.session\.create\(/.test(read(`e2e/${f}`)));
    expect(minting.length).toBeGreaterThan(0);
    for (const file of minting) {
      const source = read(`e2e/${file}`);
      expect(source, file).toMatch(/minted\.push\(tokenHash\)/);
      const afterAll = source.slice(source.indexOf("test.afterAll("));
      expect(afterAll, file).toMatch(/session\.deleteMany\(\{ where: \{ tokenHash: \{ in: minted \} \} \}\)/);
      // Not by user agent and a fixture person: that signs out another spec's, or another run's, actor who is the same person.
      expect(afterAll, file).not.toMatch(/userAgent: "e2e", userId:/);
    }
  });
});

describe("TA-513: no case passes with nothing asserted", () => {
  it("TA-513: tenancy.test.ts asserts the seed's assignment rather than returning past it", () => {
    const source = read("tests/tenancy.test.ts");
    expect(source).not.toMatch(/if \(!assignment\) return/);
  });

  it("TA-513: the practice bank's cases skip or fail, never return, when the chapter is not loaded", () => {
    for (const file of ["tests/worksheets.test.ts", "tests/report-card-annexure.test.ts"]) {
      const source = read(file);
      // A return in beforeAll is set-up; one inside a case is a vacuous pass.
      expect(source.match(/^ {4}if \(!hasBank\) return;$/gm), file).toBeNull();
      expect(source, file).toMatch(/if \(!hasBank\) return noBank\(skip\);/);
    }
  });
});
