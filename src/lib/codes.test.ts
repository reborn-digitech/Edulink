import { describe, expect, it } from "vitest";
import { nameCarriesSection } from "./codes";

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
