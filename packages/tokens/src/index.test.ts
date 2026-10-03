import { describe, expect, it } from "vitest";
import { accents, canvas, familyFor, frame, frameAccents, palette, radius, tap, wash } from "./index";

describe("@edulink/tokens", () => {
  it("has the same keys in both themes, all hex", () => {
    expect(Object.keys(palette.dark)).toEqual(Object.keys(palette.light));
    for (const theme of ["light", "dark"] as const) {
      for (const value of Object.values(palette[theme])) expect(value).toMatch(/^#[0-9a-f]{6}$/);
      for (const fam of Object.values(accents[theme])) for (const value of Object.values(fam)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
  it("the frame is dark's navy in both themes, its accents dark's, the canvas tinted only in light", () => {
    expect(frame.light).toEqual(frame.dark);
    for (const [key, value] of Object.entries(frame.dark)) expect(value, key).toBe(palette.dark[key as keyof typeof palette.dark]);
    expect(frameAccents.light).toBe(accents.dark);
    expect(frameAccents.dark).toBe(accents.dark);
    expect(canvas.dark).toBe(palette.dark.bg);
    expect(canvas.light).not.toBe(palette.light.bg);
    expect(canvas.light).toMatch(/^#[0-9a-f]{6}$/);
    expect(wash.alpha).toBeGreaterThan(0);
    expect(wash.alpha).toBeLessThan(0.5);
  });
  it("maps every role to a family, the principal to the admin's and an expert to the teacher's", () => {
    expect(familyFor("PRINCIPAL")).toBe("admin");
    expect(familyFor("EXPERT")).toBe("teacher");
    expect(familyFor(null)).toBe("teacher");
    expect(["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"].map(familyFor)).toEqual(["driver", "librarian", "warden", "alumnus"]);
  });
  it("radii are the web's rems in points and the tap target is 48", () => {
    expect(radius).toEqual({ sm: 8, md: 14, lg: 20, xl: 28 });
    expect(tap).toBe(48);
  });
});
