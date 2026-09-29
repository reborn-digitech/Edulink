import { describe, expect, it } from "vitest";
import { codeFromList, MOTHER_TONGUES, NATIONALITIES, PIN_CODE } from "@edulink/contracts";
import { academicYearName } from "@/lib/academic-year";

/**
 * What a sheet reads is a name from a list, a number of a known length or a
 * year in one shape — decided where it is typed, not where it is printed.
 */

const from = (key: string) => new Date(`${key}T00:00:00Z`);

describe("an academic year's name", () => {
  it("is its years with an en dash, however the dash was typed", () => {
    for (const typed of ["2026–27", "2026-27", "2026/27", " 2026 - 27 ", "2026–2027"]) {
      expect(academicYearName(typed, from("2026-06-15")), typed).toBe("2026–27");
    }
    expect(academicYearName("2099-00", from("2099-04-01"))).toBe("2099–00");
  });

  it("is one year for a school whose year is the calendar's", () => {
    expect(academicYearName("2027", from("2027-01-04"))).toBe("2027");
  });

  it("⚠ is refused when it is not a year, skips a year, or is not the year the dates start in", () => {
    for (const typed of ["", "AY 26/27", "Next year", "26-27", "2026–28", "2026–26", "2026-7"]) {
      expect(academicYearName(typed, from("2026-06-15")), typed).toBeNull();
    }
    // Named for one year and dated in another: every serial of the year would carry the wrong one.
    expect(academicYearName("2025–26", from("2026-06-15"))).toBeNull();
    expect(academicYearName("2027", from("2026-06-15"))).toBeNull();
  });
});

describe("a name from a list", () => {
  it("is the list's code from the code or the English name, in any capitals; anything else is nothing", () => {
    expect(codeFromList(MOTHER_TONGUES, "MARATHI")).toBe("MARATHI");
    expect(codeFromList(MOTHER_TONGUES, "  marathi ")).toBe("MARATHI");
    expect(codeFromList(NATIONALITIES, "Sri Lankan")).toBe("SRI_LANKAN");
    expect(codeFromList(NATIONALITIES, "sri-lankan")).toBe("SRI_LANKAN");
    for (const typed of ["", "Marathi, Hindi", "मराठी", "Ahirani", "MARATHI "+"x"]) expect(codeFromList(MOTHER_TONGUES, typed), typed).toBeNull();
  });

  it("the lists hold what they say: no code twice, English among the languages, Indian first", () => {
    expect(new Set(MOTHER_TONGUES).size).toBe(MOTHER_TONGUES.length);
    expect(MOTHER_TONGUES).toContain("ENGLISH");
    expect(MOTHER_TONGUES.at(-1)).toBe("OTHER");
    expect(NATIONALITIES[0]).toBe("INDIAN");
  });
});

describe("a PIN code", () => {
  it("is six digits and does not start with nought", () => {
    for (const ok of ["411001", "110001", "999999"]) expect(PIN_CODE.test(ok), ok).toBe(true);
    for (const bad of ["", "41100", "4110011", "011001", "41100A", "411 001", "４１１００１"]) expect(PIN_CODE.test(bad), bad).toBe(false);
  });
});
