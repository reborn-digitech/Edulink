/**
 * B-12 (the walk of 4 October 2026): a librarian or a warden who typed their
 * own menu's /accounts/no-dues at a school — where its module, ACADEMICS, is
 * off and the menu hides it — landed on "Where would you like to go?". The
 * gate now names that case, and the signed-in layout answers it 404.
 */
import { describe, expect, it } from "vitest";
import { modulePagePermitted, ownPageModuleOff } from "@/lib/role-gate";

const NORTHGATE = ["ALUMNI", "HOSTEL", "INVENTORY", "LIBRARY", "PAYROLL", "TRANSPORT"];
const VIDYA = [...NORTHGATE, "ACADEMICS", "EXAMS", "IQAC", "PLACEMENT", "ADMISSIONS", "SCHOLARSHIPS"];

describe("a limited role's own menu page behind a module the school has off", () => {
  it("is named as such at a school, for the library desk and the warden", () => {
    for (const role of ["LIBRARIAN", "WARDEN"] as const) {
      expect(modulePagePermitted(role, "/accounts/no-dues", NORTHGATE)).toBe(false);
      expect(ownPageModuleOff(role, "/accounts/no-dues", NORTHGATE)).toBe(true);
    }
  });

  it("opens at a college, where the module is on", () => {
    expect(modulePagePermitted("LIBRARIAN", "/accounts/no-dues", VIDYA)).toBe(true);
    expect(ownPageModuleOff("LIBRARIAN", "/accounts/no-dues", VIDYA)).toBe(false);
  });

  it("is not claimed for a page outside the role's menu: that is still the chooser", () => {
    expect(ownPageModuleOff("LIBRARIAN", "/admin/people", NORTHGATE)).toBe(false);
    expect(ownPageModuleOff("WARDEN", "/teacher/classes", NORTHGATE)).toBe(false);
  });
});
