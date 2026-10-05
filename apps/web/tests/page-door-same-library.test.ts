import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A3-inventory-14, the pages' half (risks batch, 5 Oct 2026): the pages that had no door now have one (package 1),
 * and each page reads the very library call its door answers with, so the phone and the web cannot drift — one
 * reader, as for every other door. /suspended, /switch and MODULE_META stay page-only by decision (the catalog's docs
 * say so).
 */
const src = (rel: string) => join(process.cwd(), "src", rel);
const PAIRS: { what: string; fn: string; module: string; pages: string[]; door: string }[] = [
  {
    what: "celebrations",
    fn: "celebrationsFor",
    module: "@/lib/birthdays",
    pages: ["app/(app)/bulletin/celebrations/page.tsx", "components/celebrations/celebrations-link.tsx"],
    door: "app/api/v1/shared/bulletin/celebrations/route.ts",
  },
  { what: "the practice journey", fn: "journey", module: "@/lib/practice-insights", pages: ["app/(app)/student/practice/journey/page.tsx"], door: "app/api/v1/practice/journey/route.ts" },
  { what: "the operator's job health by school", fn: "crossSchoolJobHealth", module: "@/lib/job-health", pages: ["app/root/jobs/schools/page.tsx"], door: "app/api/v1/operator/jobs/schools/route.ts" },
];

describe("a page and its new door read the same library (A3-inventory-14)", () => {
  it.each(PAIRS)("$what: the page and GET door both call $fn from $module", ({ fn, module, pages, door }) => {
    expect(existsSync(src(door)), door).toBe(true);
    const imports = new RegExp(`import \\{[^}]*\\b${fn}\\b[^}]*\\} from "${module.replace(/[/@-]/g, (c) => `\\${c}`)}"`);
    for (const file of [...pages, door]) {
      const text = readFileSync(src(file), "utf8");
      expect(text, file).toMatch(imports);
      expect(text, file).toMatch(new RegExp(`\\b${fn}\\(`));
    }
  });

  it("the celebrations card on /teacher/classes is the shared component", () => {
    expect(readFileSync(src("app/(app)/teacher/classes/page.tsx"), "utf8")).toMatch(/CelebrationsLink/);
  });
});
