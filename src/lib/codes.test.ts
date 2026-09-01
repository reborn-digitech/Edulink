import { describe, expect, it } from "vitest";
import { nameCarriesSection, withSection } from "./codes";

describe("nameCarriesSection", () => {
  it("says when a class name already ends in its section, so the letter prints once", () => {
    expect(nameCarriesSection("Class 7A", "A")).toBe(true);
    expect(nameCarriesSection("Class 7 (2028–29) A", "A")).toBe(true);
    expect(nameCarriesSection("ZZ Grade 3 · A", "A")).toBe(true);
    expect(nameCarriesSection("Class 5 Sunflower", "Sunflower")).toBe(true);
    expect(nameCarriesSection("Class 7", "A")).toBe(false);
    expect(nameCarriesSection("Class 7", null)).toBe(false);
    // "Maria" ends in "a" — that is not section A.
    expect(nameCarriesSection("Maria", "A")).toBe(false);
  });
});

describe("withSection", () => {
  it("binds a bare letter to a number and spaces it after a word", () => {
    expect(withSection("Class 6", "A")).toBe("Class 6A");
    expect(withSection("Class 6", "B")).toBe("Class 6B");
    expect(withSection("Sunflower", "A")).toBe("Sunflower A");
  });

  it("leaves a name that already ends in the section alone", () => {
    expect(withSection("Grade 7 A", "A")).toBe("Grade 7 A");
    expect(withSection("Class 6A", "A")).toBe("Class 6A");
  });

  it("⚠ does not suffix a stream code the name already spells out", () => {
    // The senior-school split wart: "Grade 11 Science" + "Sci" must not
    // become "Grade 11 Science Sci".
    expect(withSection("Grade 11 Science", "Sci")).toBe("Grade 11 Science");
    expect(withSection("Grade 11 Commerce", "Com")).toBe("Grade 11 Commerce");
    expect(withSection("Grade 11 Arts", "Art")).toBe("Grade 11 Arts");
    // …but a real letter section on a named stream still attaches.
    expect(withSection("Grade 11 Science", "A")).toBe("Grade 11 Science A");
    // A code the name does NOT express is still appended.
    expect(withSection("Grade 11 Science", "Com")).toBe("Grade 11 Science Com");
  });

  it("returns the name unchanged when there is no section", () => {
    expect(withSection("Class 6", "")).toBe("Class 6");
  });
});
