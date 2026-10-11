/**
 * The desks batch's integration (11 Oct 2026): small rules the twelve builders' reports listed as looking wrong,
 * each held where it was fixed so it does not come back.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("the desks batch's loose ends", () => {
  it("nav.ts no longer says the clinical and studio desks are coming (both are built)", () => {
    const nav = read("src/lib/nav.ts");
    expect(nav).not.toMatch(/records are coming/);
    expect(nav).toContain('href: "/duties/clinical"');
    expect(nav).toContain('href: "/duties/studio"');
  });

  it("the review desk's pending figure says what to do, not who was building it", () => {
    for (const dict of [en, hi, mr]) {
      const body = dict.quizReview.figurePendingBody;
      expect(body).not.toMatch(/figure builder|चित्र-निर्माता|आकृती-निर्माता/);
    }
    // quiz-publish-jobs (11 Oct 2026): the review queue is the bank desk now; the sentence says the batch is loaded again and the item is held meanwhile.
    expect(en.quizReview.figurePendingBody).toMatch(/loaded again/);
    expect(en.quizReview.figurePendingBody).toMatch(/pupils do not see the item/);
    expect(hi.quizReview.figurePendingBody.trim().endsWith("।")).toBe(true);
    expect(mr.quizReview.figurePendingBody.trim().endsWith(".")).toBe(true);
  });

  it("the palette offers no quick action whose page's entry is hidden here (a school's exams at a college)", () => {
    const palette = read("src/components/nav/command-palette.tsx");
    expect(palette).toMatch(/QUICK_ACTIONS\[role\]\.filter\(\(a\) => !hiddenHrefs\.includes\(a\.href\)\)/);
  });

  it("a guardian's own unseated child reads as no lectures on /parent/academics, a stranger's id as not found", () => {
    const src = read("src/lib/academics-homes.ts");
    const body = src.slice(src.indexOf("export async function familyAcademics"));
    const own = body.indexOf("db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, studentMembershipId: childId");
    expect(own).toBeGreaterThan(0);
    expect(body.indexOf('throw new AccessError("access.entryNotFound", "NOT_FOUND")')).toBeGreaterThan(own);
  });

  it("demo:schools keeps every other generator's roster section when it rewrites docs/demo-schools.md, and the marker", () => {
    const src = read("scripts/demo-schools.ts");
    expect(src).toContain("<!-- helpIndex: false -->\n# Demo schools");
    expect(src).toMatch(/matchAll\(\/<!-- \(\[a-z-\]\+\):begin -->/);
  });
});
