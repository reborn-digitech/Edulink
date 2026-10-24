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

const pageExists = (href: string) => existsSync(join(process.cwd(), "src", "app", "(app)", ...href.split("/").filter(Boolean), "page.tsx"));

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
