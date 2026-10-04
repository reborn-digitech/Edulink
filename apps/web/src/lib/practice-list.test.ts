import { describe, expect, it } from "vitest";
import { PRACTICE_PAGE_SIZE, practiceListing } from "./practice-list";

/** B-13: a college student's practice page has no school class chips, and every list is paged. */
const bank = [
  ...Array.from({ length: 60 }, (_, i) => ({ id: `s${i}`, subject: i % 2 ? "MATHS" : "SCIENCE", classLevel: 3 + (i % 10) })),
  { id: "apt", subject: "APTITUDE", classLevel: 13 },
  { id: "rea", subject: "REASONING", classLevel: 13 },
  { id: "cod", subject: "CODING", classLevel: 13 },
];

describe("practiceListing", () => {
  it("at a college offers no class chips, puts the placement banks first and pages the rest", () => {
    const l = practiceListing(bank, { college: true, enrolledGrade: 1 });
    expect(l.grades).toEqual([]);
    expect(l.gradeNum).toBeNull();
    expect(l.shown.slice(0, 3).map((t) => t.id)).toEqual(["apt", "rea", "cod"]);
    expect(l.shown).toHaveLength(PRACTICE_PAGE_SIZE);
    expect(l.pages).toBe(Math.ceil(63 / PRACTICE_PAGE_SIZE));
    // A class asked for in the address is ignored at a college.
    expect(practiceListing(bank, { college: true, grade: "5", enrolledGrade: null }).gradeNum).toBeNull();
    const last = practiceListing(bank, { college: true, enrolledGrade: null, page: "99" });
    expect(last.page).toBe(last.pages);
    expect(last.shown.length).toBe(63 - (last.pages - 1) * PRACTICE_PAGE_SIZE);
  });

  it("at a school keeps the class chips and the own-grade default", () => {
    const l = practiceListing(bank, { college: false, enrolledGrade: 5 });
    expect(l.grades).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    expect(l.gradeNum).toBe(5);
    expect(l.shown.every((t) => t.classLevel === 5)).toBe(true);
    expect(practiceListing(bank, { college: false, grade: "all", enrolledGrade: 5 }).gradeNum).toBeNull();
  });
});
