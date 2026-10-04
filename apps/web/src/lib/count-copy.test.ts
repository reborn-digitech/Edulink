import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { translator } from "./i18n/dictionary";
import { componentsStateText, coverageLineText, mentoringLinkText, mentoringSummaryText, waitingCompaniesText, weeksTaughtText } from "./count-copy";

/**
 * B-17 (4 Oct 2026): "Mentoring (1 groups)", "1 parts · 0 countersigned",
 * "1 mentoring groups", "1 companies to check", and "0 of 0 weeks taught"
 * for a course with no plan. The `…One` sibling is chosen at one; a course
 * with no plan says so.
 */
const en = translator("en");
const mr = translator("mr");
const hi = translator("hi");

describe("counted lines agree with their count", () => {
  it("one reads singular, many plural, in English", () => {
    expect(mentoringLinkText(en, 1)).toBe("Mentoring (1 group)");
    expect(mentoringLinkText(en, 2)).toBe("Mentoring (2 groups)");
    expect(componentsStateText(en, { components: 1, moderated: 0, released: 0 })).toBe("1 part · 0 countersigned · 0 released");
    expect(componentsStateText(en, { components: 3, moderated: 1, released: 0 })).toBe("3 parts · 1 countersigned · 0 released");
    expect(mentoringSummaryText(en, 1, 1)).toBe("1 mentoring group, 1 student mentored.");
    expect(mentoringSummaryText(en, 1, 12)).toBe("1 mentoring group, 12 students mentored.");
    expect(mentoringSummaryText(en, 3, 1)).toBe("3 mentoring groups, 1 student mentored.");
    expect(mentoringSummaryText(en, 3, 12)).toBe("3 mentoring groups, 12 students mentored.");
    expect(waitingCompaniesText(en, 1)).toBe("1 company to check");
    expect(waitingCompaniesText(en, 4)).toBe("4 companies to check");
    expect(weeksTaughtText(en, 0, 1)).toBe("0 of 1 week taught");
    expect(weeksTaughtText(en, 3, 12)).toBe("3 of 12 weeks taught");
  });

  it("a course with no plan says so rather than 0 of 0", () => {
    expect(weeksTaughtText(en, 0, 0)).toBe(en("academics.planNone"));
    expect(coverageLineText(en, { taught: 0, planned: 0, expected: 0, elapsed: 40 })).toBe(en("academics.planNone"));
    expect(weeksTaughtText(mr, 0, 0)).toBe(mr("academics.planNone"));
    expect(coverageLineText(en, { taught: 1, planned: 1, expected: 1, elapsed: 40 })).toBe("1 of 1 week taught; 1 expected by now, the term 40% through.");
  });

  it("no line leaves a placeholder or an English word in Marathi or Hindi", () => {
    for (const t of [mr, hi]) {
      for (const s of [
        mentoringLinkText(t, 1),
        componentsStateText(t, { components: 1, moderated: 0, released: 0 }),
        mentoringSummaryText(t, 1, 1),
        mentoringSummaryText(t, 1, 5),
        mentoringSummaryText(t, 5, 1),
        waitingCompaniesText(t, 1),
        weeksTaughtText(t, 0, 1),
        coverageLineText(t, { taught: 0, planned: 1, expected: 1, elapsed: 10 }),
      ]) {
        expect(s).not.toMatch(/\{\w+\}/);
        expect(s).not.toMatch(/[A-Za-z]{3}/);
      }
    }
  });
});

describe("the pages choose through these helpers", () => {
  it("no page passes a count straight into a key that has a …One sibling here", () => {
    const keys = ["academics.weeksTaught", "academics.coverageLine", "academics.componentsState", "academics.mentoringLink", "academics.mentoringSummary", "placement.waitingCompanies"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
          const src = readFileSync(p, "utf8");
          for (const key of keys) if (src.includes(`t("${key}"`)) offenders.push(`${p}: ${key}`);
        }
      }
    };
    walk("src/app");
    walk("src/components");
    expect(offenders).toEqual([]);
  });

  it("the stock line does not count a free-text unit (\"0 piece left\")", () => {
    // The unit is whatever the office typed, so English cannot agree it with the number; the web line names it apart.
    expect(en("inventory.stockLine", { onHand: 0, unit: "piece", level: 5 })).toBe("Stock 0 (piece) · reorder at 5");
    const page = readFileSync("src/app/(app)/admin/inventory/page.tsx", "utf8");
    expect(page).not.toContain('t("inventory.onHandOf"');
  });
});
