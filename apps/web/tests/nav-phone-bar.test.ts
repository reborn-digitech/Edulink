/**
 * QA-65 (QA campaign of 24 October 2026): one person finds the same places in the same order at a phone's width on the
 * web and in the phone app. The web's bottom bar below `lg` is PHONE_BAR (src/lib/nav.ts), the phone's is TABS
 * (apps/mobile/src/lib/nav.ts); both end in More. This holds the two lists against each other, tab by tab: the same
 * words, icon, module and feature, and a web page behind each tab.
 */
import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { NAV, PHONE_BAR } from "@/lib/nav";
import { TABS } from "../../mobile/src/lib/nav";

// A page under the signed-in shell, or one of the person's own under /account (owner-batch-item2a: a support worker's only tab is /account/payslips).
const pageExists = (href: string) =>
  existsSync(join(process.cwd(), "src", "app", "(app)", ...href.split("/").filter(Boolean), "page.tsx")) ||
  (href.startsWith("/account") && existsSync(join(process.cwd(), "src", "app", ...href.split("/").filter(Boolean), "page.tsx")));

describe("the bottom bar at a phone's width is the phone app's (QA-65)", () => {
  it("has the phone's tabs for every role, in order: words, icons, modules and features", () => {
    expect(Object.keys(PHONE_BAR).sort()).toEqual(Object.keys(TABS).sort());
    for (const role of Object.keys(TABS) as (keyof typeof TABS)[]) {
      const phone = TABS[role].map((tab) => ({ labelKey: tab.labelKey, icon: tab.icon, module: tab.module ?? null, feature: tab.feature ?? null }));
      const web = PHONE_BAR[role].map((item) => ({ labelKey: item.labelKey, icon: item.icon, module: item.module ?? null, feature: item.feature ?? null }));
      expect(web, role).toEqual(phone);
    }
  });

  it("opens a web page from every tab, and the role's own menu holds it or the tab's module guards it", () => {
    for (const [role, bar] of Object.entries(PHONE_BAR)) {
      for (const item of bar) {
        expect(pageExists(item.href), `${role} ${item.href}`).toBe(true);
        const inMenu = NAV[role as keyof typeof NAV].some((entry) => entry.href === item.href);
        expect(inMenu || Boolean(item.module), `${role} ${item.href}`).toBe(true);
      }
    }
  });

  it("names the same page for the same tab name wherever a role has it (Messages is /remarks, the feed /bulletin)", () => {
    for (const role of Object.keys(TABS) as (keyof typeof TABS)[]) {
      TABS[role].forEach((tab, i) => {
        if (tab.name === "messages") expect(PHONE_BAR[role][i]!.href).toBe("/remarks");
        if (tab.name === "bulletin") expect(PHONE_BAR[role][i]!.href).toBe("/bulletin");
      });
    }
  });
});

/**
 * QA-66: THE PARITY TABLE. Every entry of a role's web menu has a place on the phone: a tab, an entry of More (a screen
 * of its own, or the web page opened signed in), or a tab inside the role's phone home; one that has none is listed
 * here with why it is the web's alone. An entry counts as placed when the phone has an entry of the same words (the two
 * menus share their dictionary keys), a screen the phone's link table opens for that page, opens that page on the web,
 * or the bar holds it. A new web entry with no place
 * fails this until it is given one or written here; one written here that gains a place fails until it is struck out.
 */
const WEB_ONLY: Partial<Record<keyof typeof TABS, Record<string, string>>> = {
  ADMIN: {
    "/admin/attendance-devices": "registering a punch device and reading its key is set-up done once at a desk",
    "/admin/fees/tally": "the Tally export is a file for the accountant's computer",
  },
  PRINCIPAL: { "/admin/attendance-devices": "registering a punch device is set-up done once at a desk" },
  EXPERT: { "/expert/earnings": "the phone's Sessions tab carries the earnings card (EarningsCard); there is no screen of its own" },
  DRIVER: { "/bulletin/global": "the cross-school feed is a chip of the phone's feed, which the module roles do not have" },
  LIBRARIAN: {
    "/bulletin/global": "the cross-school feed is a chip of the phone's feed, which the module roles do not have",
    "/library/overdue": "a tab of the phone's library home (Overdue)",
    "/library/reservations": "a tab of the phone's library home (Reservations)",
    "/library/stocktake": "a tab of the phone's library home (Stock-take)",
    "/library/reading-room": "the reading-room register is a desk at the door with a scanner: web only for now",
  },
  WARDEN: {
    "/bulletin/global": "the cross-school feed is a chip of the phone's feed, which the module roles do not have",
    "/hostel/rollcall": "a tab of the phone's hostel home (Roll call)",
    "/hostel/leave": "a tab of the phone's hostel home (Leave)",
    "/hostel/night": "a tab of the phone's hostel home (Night)",
    "/hostel/visitors": "a tab of the phone's hostel home (Visitors)",
  },
  FACULTY: {
    "/duties/clinical": "opened from the duty card on the phone's home (DUTY_SCREENS), for the duty's holder",
    "/duties/studio": "opened from the duty card on the phone's home (DUTY_SCREENS), for the duty's holder",
  },
  HOD: {
    "/hod/visits": "the peer-team visit file is assembled and printed for a visit: web only",
    "/duties/clinical": "opened from the duty card on the phone's home (DUTY_SCREENS), for the duty's holder",
    "/duties/studio": "opened from the duty card on the phone's home (DUTY_SCREENS), for the duty's holder",
  },
  IQAC: { "/iqac/visits": "the peer-team visit file is assembled and printed for a visit: web only" },
  ACCOUNTS: {
    "/admin/fees/tally": "the Tally export is a file for the accountant's computer",
    "/admin/college-admissions/refunds": "an admission refund is recorded against the bank's own statement: web only for now",
  },
};

describe("the parity table: what the phone does not carry is said (QA-66)", () => {
  it("places every web menu entry on the phone or names it as the web's alone, with a reason", async () => {
    const { MENU } = await import("../../mobile/src/lib/nav");
    const { screenFor } = await import("../../mobile/src/lib/links");
    for (const role of Object.keys(TABS) as (keyof typeof TABS)[]) {
      const bar = new Set(PHONE_BAR[role].map((i) => i.href));
      const webs = new Set(MENU[role].map((i) => i.web).filter(Boolean));
      const words = new Set([...MENU[role].map((i) => i.labelKey), ...TABS[role].map((t) => t.labelKey)]);
      const screens = new Set(MENU[role].map((i) => i.screen).filter(Boolean));
      const opensScreen = (href: string) => screens.has(screenFor(href)?.pathname ?? "");
      const unplaced = (NAV[role as keyof typeof NAV] ?? []).filter((item) => !bar.has(item.href) && !webs.has(item.href) && !words.has(item.labelKey) && !opensScreen(item.href)).map((item) => item.href);
      expect(unplaced.sort(), role).toEqual(Object.keys(WEB_ONLY[role] ?? {}).sort());
      for (const why of Object.values(WEB_ONLY[role] ?? {})) expect(why.length, role).toBeGreaterThan(20);
    }
  });
});

/**
 * owner-batch-item2b (27 Oct 2026): WHAT A PLACED PAGE DOES THAT THE PHONE DOES NOT. The table above is about menu
 * entries; these are actions inside a page the phone does carry (its payroll screen is the office's read-only
 * summary), each with why it is the web's alone. The test holds the phone to it: no phone source calls the door.
 */
const WEB_ONLY_ACTIONS: { door: string; why: string }[] = [
  {
    door: "/api/v1/admin/payroll/runs/{month}/payments",
    why: "recording, voiding and the UTR sheet are done beside the run's slips and the bank's statement on the web; the phone has no run screen, and its payroll summary and payslips show the paid state",
  },
  // owner-batch-item5 (27 Oct 2026): a school's term route fees and month's mess bill.
  {
    door: "/api/v1/admin/transport/route-fees",
    why: "raising a term's route fees charges every rider's fee ledger at once, done at a desk beside the routes' fees and the fee pages; the phone's office transport screen reads the day and changes nothing",
  },
  {
    door: "/api/v1/admin/hostel/mess-bill",
    why: "billing the month's mess charges every boarder's fee ledger at once, done at a desk beside the houses' charges and the fee pages; the phone's office hostel screen is a read-only summary",
  },
];

describe("the actions the phone does not carry inside a page it has (owner-batch-item2b)", () => {
  it("names each with a reason, and no phone source calls its door", async () => {
    const { readdirSync, readFileSync, statSync } = await import("node:fs");
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name)) files.push(p);
      }
    };
    walk(join(process.cwd(), "..", "mobile", "src"));
    expect(files.length).toBeGreaterThan(50);
    for (const { door, why } of WEB_ONLY_ACTIONS) {
      expect(why.length).toBeGreaterThan(20);
      const stem = door.replace(/\{[^}]+\}/g, "").replace(/\/+/g, "/").split("/").filter(Boolean).slice(-1)[0]!;
      // The door's fixed head (before its first parameter), without /api/v1: "admin/payroll/runs", "admin/hostel/mess-bill".
      const head = door.split("{")[0]!.replace(/^\/api\/v1\//, "").replace(/\/$/, "");
      const callers = files.filter((f) => {
        const src = readFileSync(f, "utf8");
        return src.includes(head) && src.includes(`/${stem}`);
      });
      expect(callers, door).toEqual([]);
    }
  });
});
