/**
 * QA-77 (QA campaign of 24 October 2026, U-7): `npx jest --ci <one file>` printed "Jest did not exit one second
 * after the test run has completed" and waited, for every screen test built on family-helpers.tsx. Its QueryClient
 * kept React Query's default five-minute garbage-collection timer, which outlives the test; the whole suite exited
 * only because Jest kills its workers, and a single file runs in band. A QueryClient made by a test harness now
 * carries `gcTime: Infinity` (no timer is set), as staff-harness.tsx and teacher-support.tsx already did.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = join(__dirname);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

describe("a test's query client leaves no timer behind", () => {
  it("every `new QueryClient(` under test/ sets gcTime: Infinity for queries and mutations", () => {
    const offenders: string[] = [];
    let seen = 0;
    for (const file of files(ROOT).filter((f) => !f.endsWith("harness-open-handles.test.ts"))) {
      const src = readFileSync(file, "utf8");
      for (const match of src.matchAll(/new QueryClient\(([^;]*)\);/g)) {
        seen += 1;
        const args = match[1] ?? "";
        if ((args.match(/gcTime: Infinity/g) ?? []).length < 2) offenders.push(`${relative(ROOT, file)}: ${match[0].slice(0, 120)}`);
      }
    }
    expect(seen).toBeGreaterThanOrEqual(3);
    expect(offenders).toEqual([]);
  });
});
