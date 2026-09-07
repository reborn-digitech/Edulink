import { describe, expect, it } from "vitest";
import { accents, familyFor, palette, radius, tap } from "./index";

describe("@edulink/tokens", () => {
  it("has the same keys in both themes, all hex", () => {
    expect(Object.keys(palette.dark)).toEqual(Object.keys(palette.light));
    for (const theme of ["light", "dark"] as const) {
      for (const value of Object.values(palette[theme])) expect(value).toMatch(/^#[0-9a-f]{6}$/);
      for (const fam of Object.values(accents[theme])) for (const value of Object.values(fam)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it("maps every role to a family, the principal to the admin's and an expert to the teacher's", () => {
    expect(familyFor("PRINCIPAL")).toBe("admin");
    expect(familyFor("EXPERT")).toBe("teacher");
    expect(familyFor(null)).toBe("teacher");
  });
  it("radii are the web's rems in points and the tap target is 48", () => {
    expect(radius).toEqual({ sm: 8, md: 14, lg: 20, xl: 28 });
    expect(tap).toBe(48);
  });
});
