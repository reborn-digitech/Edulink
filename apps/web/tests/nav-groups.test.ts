/**
 * THE OFFICE'S MENU IN SEVEN GROUPS (the owner's decision of 27 October 2026, item 3). The office's rail had 59
 * entries under three headings, 33 of them under "Running things". It now reads Teaching, People and records,
 * Attendance and cover, Money, Communication, Modules and Setup under the five primaries, each group collapsible,
 * and a person's own pages (my letters, payslips, items, profile, account) sit under the account menu, on the web
 * and in the phone's More. This holds: every entry of every role in a group its role draws; no page the office or the
 * head reached before lost; the personal pages out of the rail; the open state's rules; and the phone's groups equal
 * to the web's.
 */
import { describe, expect, it } from "vitest";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import type { Role } from "@/lib/constants";
import {
  CLASSIC_GROUPS,
  GROUPS_CLOSED_BY_DEFAULT,
  ME_GROUP,
  NAV,
  NAV_GROUP_KEY,
  OFFICE_GROUPS,
  PHONE_BAR,
  groupOpen,
  navGroupsFor,
  navOpenStorageKey,
  personalItems,
  railFor,
  sheetFor,
  type NavItem,
} from "@/lib/nav";
import { MENU, MENU_GROUP_KEY, menuFor, menuGroupsFor, ME_MENU_GROUP } from "../../mobile/src/lib/nav";

const ROLES = Object.keys(NAV) as Role[];

/** Every href the office's menu had on 27 October 2026, before the regrouping (git show 2670e735:apps/web/src/lib/nav.ts). */
const ADMIN_BEFORE = [
  "/admin", "/admin/people", "/admin/classes", "/admin/timetable", "/admin/exams", "/admin/report-cards", "/admin/certificates", "/admin/signatures",
  "/admin/records", "/admin/filings", "/admin/admissions", "/admin/syllabus", "/admin/attendance", "/admin/staff-attendance", "/admin/attendance-devices",
  "/admin/fees/tally", "/admin/substitutions", "/admin/calendar", "/admin/fees", "/admin/messaging", "/admin/circulars", "/admin/incidents",
  "/admin/transport", "/principal/leave", "/principal/trends", "/admin/reviews", "/admin/safety", "/admin/settings", "/admin/alumni", "/admin/website",
  "/remarks", "/joins", "/bulletin", "/bulletin/council", "/experts", "/admin/vacancies", "/enquiries", "/mentoring", "/admin/sessions", "/competitions",
  "/archive", "/admin/inventory", "/admin/payroll", "/account/payslips", "/account/letters", "/account/items", "/library", "/admin/hostel",
  "/admin/academics", "/admin/college-admissions", "/accounts", "/admin/college-campus", "/exam-cell", "/placement", "/iqac", "/admin/committees",
  "/admin/faculty-records", "/principal/college", "/admin/stream-records",
];
/** And the head's, the same day. */
const PRINCIPAL_BEFORE = [
  "/principal", "/principal/classes", "/principal/leave", "/admin/reviews", "/exams", "/admin/report-cards", "/admin/certificates", "/admin/signatures",
  "/admin/records", "/admin/filings", "/admin/admissions", "/admin/syllabus", "/principal/timetable", "/principal/decisions", "/principal/trends",
  "/admin/staff-attendance", "/admin/attendance-devices", "/admin/substitutions", "/admin/calendar", "/admin/fees", "/admin/messaging", "/admin/circulars",
  "/admin/website", "/admin/incidents", "/admin/transport", "/remarks", "/joins", "/bulletin", "/bulletin/council", "/admin/vacancies", "/enquiries",
  "/competitions", "/admin/sessions", "/archive", "/account", "/admin/payroll", "/admin/inventory", "/account/payslips", "/account/letters", "/account/items",
  "/library", "/admin/hostel", "/admin/academics", "/accounts", "/admin/college-admissions", "/exam-cell", "/placement", "/principal/accreditation",
  "/admin/committees", "/admin/faculty-records", "/admin/stream-records",
];

/** The personal pages: under the account menu for every role that has them, never in the rail. */
const PERSONAL = ["/account", "/account/payslips", "/account/letters", "/account/items", "/teacher/profile", "/student/profile", "/expert/profile", "/faculty/profile"];

/** Where a page is reachable from the chrome on a desk: the rail (primaries and groups) or the account menu. */
function deskReach(role: Role, items: readonly NavItem[]): Set<string> {
  const rail = railFor(role, items);
  return new Set([...rail.primary, ...rail.groups.flatMap((g) => g.items), ...personalItems(items)].map((i) => i.href).concat("/account"));
}

describe("every entry has a group its role draws", () => {
  it("gives every entry that is not a primary a group, and every group named is the role's or the account menu's", () => {
    for (const role of ROLES) {
      const allowed = new Set<string>([...navGroupsFor(role), ME_GROUP]);
      for (const item of NAV[role]) {
        if (!item.primary) expect(item.group, `${role} ${item.href} has no group`).toBeDefined();
        if (item.group) expect(allowed.has(item.group), `${role} ${item.href} in ${item.group}`).toBe(true);
      }
    }
  });

  it("draws the office and the head in the seven groups, every other role in the three", () => {
    expect([...navGroupsFor("ADMIN")]).toEqual(["teaching", "people", "attendance", "money", "communication", "modules", "setup"]);
    expect(navGroupsFor("PRINCIPAL")).toEqual(navGroupsFor("ADMIN"));
    for (const role of ROLES.filter((r) => r !== "ADMIN" && r !== "PRINCIPAL")) expect(navGroupsFor(role), role).toEqual(CLASSIC_GROUPS);
  });

  it("names every group in the three languages, the dictionary's own words", () => {
    for (const key of Object.values(NAV_GROUP_KEY)) {
      const [ns, leaf] = key.split(".") as [string, string];
      for (const [locale, dict] of Object.entries({ en, hi, mr })) {
        const value = (dict as unknown as Record<string, Record<string, string>>)[ns]?.[leaf];
        expect(typeof value === "string" && value.length > 0, `${locale} ${key}`).toBe(true);
      }
    }
    expect(Object.keys(NAV_GROUP_KEY).sort()).toEqual([...OFFICE_GROUPS, ...CLASSIC_GROUPS, ME_GROUP].sort());
  });
});

describe("the office's seven groups hold what the owner listed", () => {
  // A school with every module on: the college's entries aside (ACADEMICS and the college modules stand for "a college").
  const COLLEGE_ONLY = new Set(["ACADEMICS", "ADMISSIONS", "EXAMS", "PLACEMENT", "IQAC"]);
  const school = NAV.ADMIN.filter((i) => !i.module || !COLLEGE_ONLY.has(i.module));
  const rail = railFor("ADMIN", school);
  const group = (name: string) => rail.groups.find((g) => g.group === name)?.items.map((i) => i.href) ?? [];

  it("keeps the five primaries on top", () => {
    expect(rail.primary.map((i) => i.href)).toEqual(["/admin", "/admin/people", "/admin/classes", "/admin/timetable", "/admin/exams"]);
  });

  it("puts each page in the group of its work", () => {
    expect(rail.groups.map((g) => g.group)).toEqual([...OFFICE_GROUPS]);
    expect(group("teaching").sort()).toEqual(["/admin/report-cards", "/admin/syllabus", "/admin/substitutions", "/competitions"].sort());
    expect(group("people").sort()).toEqual(["/admin/certificates", "/admin/records", "/admin/admissions", "/admin/alumni", "/joins", "/enquiries", "/archive"].sort());
    expect(group("attendance").sort()).toEqual(["/admin/attendance", "/admin/staff-attendance", "/principal/leave", "/admin/calendar"].sort());
    expect(group("money").sort()).toEqual(["/admin/fees", "/admin/payroll", "/admin/inventory", "/admin/fees/tally"].sort());
    expect(group("communication").sort()).toEqual(
      ["/remarks", "/bulletin", "/admin/circulars", "/admin/messaging", "/bulletin/council", "/admin/incidents", "/admin/safety", "/experts", "/admin/vacancies", "/mentoring", "/admin/sessions"].sort(),
    );
    expect(group("modules").sort()).toEqual(["/admin/transport", "/library", "/admin/hostel", "/admin/website"].sort());
    expect(group("setup").sort()).toEqual(["/admin/signatures", "/admin/attendance-devices", "/admin/filings", "/admin/reviews", "/principal/trends", "/admin/settings"].sort());
  });

  it("shortens the longest list: no group of the office's rail over eleven, where Running things held 33", () => {
    for (const g of rail.groups) expect(g.items.length, g.group).toBeLessThanOrEqual(11);
  });

  it("files the head's like pages in the same groups as the office's", () => {
    const officeGroup = new Map(NAV.ADMIN.map((i) => [i.href, i.group]));
    for (const item of NAV.PRINCIPAL) {
      const office = officeGroup.get(item.href);
      if (office && item.group) expect(item.group, item.href).toBe(office);
    }
  });
});

describe("no page lost", () => {
  it("reaches every page the office's and the head's menus had, on a desk and at a phone's width", () => {
    for (const [role, before] of [["ADMIN", ADMIN_BEFORE], ["PRINCIPAL", PRINCIPAL_BEFORE]] as const) {
      expect(new Set(NAV[role].map((i) => i.href)), role).toEqual(new Set(before));
      const desk = deskReach(role, NAV[role]);
      expect(before.filter((href) => !desk.has(href)), `${role} on a desk`).toEqual([]);
      const bar = new Set(PHONE_BAR[role].map((i) => i.href));
      const sheet = sheetFor(role, NAV[role], (item) => bar.has(item.href));
      const phone = new Set([...bar, ...sheet.flatMap((g) => g.items.map((i) => i.href)), ...personalItems(NAV[role]).map((i) => i.href), "/account"]);
      expect(before.filter((href) => !phone.has(href)), `${role} at a phone's width`).toEqual([]);
    }
  });

  it("reaches every entry of every role somewhere, whatever is hidden", () => {
    for (const role of ROLES) {
      const desk = deskReach(role, NAV[role]);
      // A primary past the fifth was never drawn on the rail; none exists, so every entry is reached.
      expect(NAV[role].filter((i) => !desk.has(i.href)).map((i) => i.href), role).toEqual([]);
    }
  });
});

describe("a person's own pages are the account menu's", () => {
  it("takes them out of the rail and the More sheet for every role, and lists them under the account menu", () => {
    for (const role of ROLES) {
      const rail = railFor(role, NAV[role]);
      const inRail = [...rail.primary, ...rail.groups.flatMap((g) => g.items)].map((i) => i.href);
      expect(inRail.filter((href) => PERSONAL.includes(href)), role).toEqual([]);
      const sheet = sheetFor(role, NAV[role], () => false).flatMap((g) => g.items.map((i) => i.href));
      expect(sheet.filter((href) => PERSONAL.includes(href)), role).toEqual([]);
      const mine = personalItems(NAV[role]).map((i) => i.href);
      for (const item of NAV[role]) if (PERSONAL.includes(item.href) && item.href !== "/account") expect(mine, `${role} ${item.href}`).toContain(item.href);
      // Nothing but a personal page goes there.
      expect(mine.filter((href) => !PERSONAL.includes(href)), role).toEqual([]);
    }
    expect(personalItems(NAV.ADMIN).map((i) => i.href)).toEqual(["/account/payslips", "/account/letters", "/account/items"]);
  });
});

describe("open and closed", () => {
  it("opens every group but Setup by default, keeps what the person chose, and always opens the group holding the page", () => {
    expect(GROUPS_CLOSED_BY_DEFAULT).toEqual(["setup"]);
    expect(groupOpen("setup", {}, false)).toBe(false);
    expect(groupOpen("money", {}, false)).toBe(true);
    expect(groupOpen("money", { money: false }, false)).toBe(false);
    expect(groupOpen("setup", { setup: true }, false)).toBe(true);
    expect(groupOpen("setup", { setup: false }, true)).toBe(true);
  });

  it("keeps the choice under a key that names the role", () => {
    expect(navOpenStorageKey("ADMIN")).toContain("ADMIN");
    expect(navOpenStorageKey("ADMIN")).not.toBe(navOpenStorageKey("PRINCIPAL"));
  });
});

describe("the phone's groups are the web's", () => {
  it("draws the same groups per role, with the person's own pages first in More", () => {
    for (const role of ROLES) {
      expect([...menuGroupsFor(role)], role).toEqual([...navGroupsFor(role)]);
      const drawn = menuFor(role).map((g) => g.group);
      expect(drawn.filter((g) => g !== ME_MENU_GROUP), role).toEqual([...navGroupsFor(role)].filter((g) => drawn.includes(g)));
      if (drawn.includes(ME_MENU_GROUP)) expect(drawn[0], role).toBe(ME_MENU_GROUP);
    }
    expect(MENU_GROUP_KEY).toEqual(NAV_GROUP_KEY);
  });

  it("files every office and head entry the two menus share — by its words or its web page — in the same group", () => {
    for (const role of ["ADMIN", "PRINCIPAL"] as const) {
      const web = NAV[role];
      const mismatched: string[] = [];
      for (const item of MENU[role]) {
        const twin = web.find((w) => w.labelKey === item.labelKey || (item.web !== undefined && w.href === item.web));
        if (twin?.group && twin.group !== item.group) mismatched.push(`${item.labelKey}: phone ${item.group}, web ${twin.group}`);
      }
      expect(mismatched, role).toEqual([]);
    }
  });

  it("puts a person's own pages under Me on the phone for every role, as the web's account menu", () => {
    const personalKeys = new Set(ROLES.flatMap((role) => NAV[role].filter((i) => i.group === ME_GROUP).map((i) => i.labelKey)));
    for (const role of ROLES) {
      for (const item of MENU[role]) {
        if (personalKeys.has(item.labelKey)) expect(item.group, `${role} ${item.labelKey}`).toBe(ME_MENU_GROUP);
        if (item.group === ME_MENU_GROUP) expect(personalKeys.has(item.labelKey), `${role} ${item.labelKey}`).toBe(true);
      }
    }
  });
});
