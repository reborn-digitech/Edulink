import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * A3-S-15 / R-63, the pages (risks batch, 5 Oct 2026; found by package 1A): an approved expulsion ends a boarder's
 * place on its effective day, read at the time through `liveAllotmentWhere(today)` (src/lib/hostel.ts, the one
 * reader). A hostel page that lists allotments by `status: "ACTIVE"` alone still offered an expelled boarder (the
 * squad's room-change picker did); no hostel page may read them so.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("hostel pages read live allotments through the one reader", () => {
  it("no hostel page or component asks hostelAllotment for status ACTIVE alone", () => {
    const roots = ["src/app/(app)/hostel", "src/components/hostel"].map((r) => join(process.cwd(), r));
    const bad: string[] = [];
    for (const file of roots.flatMap(files)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/hostelAllotment\.(findMany|findFirst|count)\(\{\s*where:\s*\{[^}]*status:\s*"ACTIVE"/g)) bad.push(`${relative(process.cwd(), file)}:${text.slice(0, m.index).split("\n").length}`);
    }
    expect(bad).toEqual([]);
  });

  it("the squad page's boarders are the live ones", () => {
    expect(readFileSync(join(process.cwd(), "src/app/(app)/hostel/squad/page.tsx"), "utf8")).toContain("...liveAllotmentWhere(today)");
  });
});
