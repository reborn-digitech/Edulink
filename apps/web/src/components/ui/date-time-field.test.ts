import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { dateTimeValue } from "./date-time-field";

/**
 * B-16 (4 Oct 2026): the exam cell's session form and the placement forms
 * drew native `datetime-local` and `date` controls ("mm/dd/yyyy, --:-- --")
 * and the controller's signature was a bare "Choose File / No file chosen".
 */
describe("DateTimeField posts what a datetime-local field posted", () => {
  it("a date and a time join as YYYY-MM-DDTHH:mm, which the exam cell's actions parse as IST", () => {
    expect(dateTimeValue("2026-10-04", "14:30", "09:00")).toBe("2026-10-04T14:30");
    const posted = dateTimeValue("2026-10-04", "14:30", "09:00");
    expect(new Date(`${posted}:00+05:30`).toISOString()).toBe("2026-10-04T09:00:00.000Z");
  });

  it("no date posts nothing, so an optional window stays optional; a half-typed time takes the default shown", () => {
    expect(dateTimeValue("", "14:30", "09:00")).toBe("");
    expect(dateTimeValue("2026-10-04", "", "23:59")).toBe("2026-10-04T23:59");
    expect(dateTimeValue("2026-10-04", "1:3", "00:00")).toBe("2026-10-04T00:00");
  });
});

describe("the college's forms draw the app's date and file controls, not the browser's", () => {
  it("no native date, datetime-local or bare file input on the exam cell's or placement's pages", () => {
    const roots = ["src/app/(app)/exam-cell", "src/app/(app)/faculty/exams", "src/app/(app)/placement", "src/app/(app)/student/placement", "src/components/placement", "src/components/exam-cell"];
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (p.endsWith(".tsx")) {
          const src = readFileSync(p, "utf8");
          if (/type="(date|datetime-local)"/.test(src)) offenders.push(`${p}: native date`);
          if (/<input type="file"[^>]*className="text-sm"/.test(src)) offenders.push(`${p}: bare file input`);
        }
      }
    };
    roots.forEach(walk);
    expect(offenders).toEqual([]);
  });
});
