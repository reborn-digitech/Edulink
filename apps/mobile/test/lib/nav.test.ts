import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { en } from "@edulink/i18n/en";
import { dictionaryFor, translatorFor } from "@edulink/i18n";
import { ALL_TAB_SCREENS, HIDDEN_SCREENS, MENU, menuFor, QUICK, TABS, tabShown } from "@/lib/nav";

const flat = JSON.stringify(en);
const hasKey = (key: string) => flat.includes(`"${key.split(".").pop()!}":`);

describe("the tab bar per role", () => {
  it("has at most four tabs, each a declared screen with a label the dictionary has", () => {
    for (const [role, tabs] of Object.entries(TABS)) {
      expect({ role, tabs: tabs.length <= 4 }).toEqual({ role, tabs: true });
      expect(tabs[0]!.name).toBe("index");
      for (const tab of tabs) {
        expect(ALL_TAB_SCREENS as readonly string[]).toContain(tab.name);
        expect({ key: tab.labelKey, present: hasKey(tab.labelKey) }).toEqual({ key: tab.labelKey, present: true });
      }
    }
  });

  it("labels every tab in a word or two in each language, so none is cut off at 390 px (B-14)", () => {
    // "Head of department" (18) and "Training and placement officer" (30) were cut off on the bar;
    // the longest that fit on the walk of 4 October 2026 was 17 ("आईक्यूएसी समन्वयक").
    const long: string[] = [];
    for (const locale of ["en", "hi", "mr"] as const) {
      const t = translatorFor(dictionaryFor(locale));
      for (const [role, tabs] of Object.entries(TABS)) for (const tab of tabs) if (t(tab.labelKey).length > 17) long.push(`${locale} ${role} ${t(tab.labelKey)}`);
    }
    expect(long).toEqual([]);
  });

  it("names every tab screen any role has, once", () => {
    const named = new Set(Object.values(TABS).flatMap((tabs) => tabs.map((t) => t.name)));
    for (const name of named) expect(ALL_TAB_SCREENS as readonly string[]).toContain(name);
    expect(new Set(ALL_TAB_SCREENS).size).toBe(ALL_TAB_SCREENS.length);
  });
});

/** Every route file under src/app/(app), as the navigator names it: "exams", "classes/detail", "mentoring" (an index file). */
function routeNames(): string[] {
  const root = join(__dirname, "..", "..", "src", "app", "(app)");
  const out: string[] = [];
  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) walk(full, `${prefix}${name}/`);
      else if (name.endsWith(".tsx") && name !== "_layout.tsx") out.push(`${prefix}${name.replace(/\.tsx$/, "")}`.replace(/\/index$/, ""));
    }
  };
  walk(root, "");
  return out.sort();
}

describe("the More sheet per role", () => {
  it("lists only screens that exist or web pages, with labels the dictionary has, and never repeats a tab", () => {
    const routes = new Set(routeNames());
    for (const [role, items] of Object.entries(MENU)) {
      const tabs = new Set(TABS[role as keyof typeof TABS].map((t) => t.name));
      for (const item of items) {
        expect({ role, key: item.labelKey, present: hasKey(item.labelKey) }).toEqual({ role, key: item.labelKey, present: true });
        if (item.screen !== undefined) {
          const name = item.screen.replace("/(app)/", "");
          expect({ role, screen: item.screen, exists: routes.has(name) }).toEqual({ role, screen: item.screen, exists: true });
          expect({ role, screen: item.screen, isTab: tabs.has(name) }).toEqual({ role, screen: item.screen, isTab: false });
        } else {
          expect(item.web.startsWith("/")).toBe(true);
        }
      }
      // Every group named has something in it, and the groups come in the web's order.
      expect(menuFor(role as keyof typeof MENU).every((g) => g.items.length > 0)).toBe(true);
    }
  });
});

describe("the navigator's screen list", () => {
  it("declares every route file: a tab, or hidden from the bar", () => {
    const declared = new Set<string>([...ALL_TAB_SCREENS, ...HIDDEN_SCREENS]);
    const missing = routeNames().filter((name) => !declared.has(name));
    expect(missing).toEqual([]);
    const stale = [...HIDDEN_SCREENS].filter((name) => !routeNames().includes(name));
    expect(stale).toEqual([]);
    expect(new Set([...ALL_TAB_SCREENS, ...HIDDEN_SCREENS]).size).toBe(ALL_TAB_SCREENS.length + HIDDEN_SCREENS.length);
  });
});

describe("the quick actions", () => {
  it("each opens a route file that exists, with a label and a hint the dictionary has", () => {
    const routes = new Set(routeNames());
    for (const [role, actions] of Object.entries(QUICK)) {
      for (const a of actions ?? []) {
        const name = a.href.replace("/(app)/", "");
        expect({ role, href: a.href, exists: routes.has(name) }).toEqual({ role, href: a.href, exists: true });
        expect({ role, key: a.labelKey, present: hasKey(a.labelKey) && hasKey(a.hintKey) }).toEqual({ role, key: a.labelKey, present: true });
      }
    }
  });
});

describe("the modules (3 Oct 2026)", () => {
  it("gives every module role a home tab, and draws a module's tab only while the school has it on", () => {
    for (const role of ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"] as const) expect(TABS[role][0]!.name).toBe("index");
    const messages = TABS.ALUMNUS.find((tab) => tab.name === "messages")!;
    expect(tabShown(messages, ["ALUMNI"])).toBe(true);
    expect(tabShown(messages, [])).toBe(false);
    expect(tabShown(TABS.TEACHER[0]!, [])).toBe(true);
  });

  it("leaves a module's More entries out while the school has it off, and lists them all without a list", () => {
    const labels = (modules?: string[]) => menuFor("ALUMNUS", modules).flatMap((g) => g.items.map((i) => i.labelKey));
    expect(labels(["ALUMNI"])).toContain("nav.bulletin");
    expect(labels([])).not.toContain("nav.bulletin");
    expect(labels()).toContain("nav.bulletin");
  });
});

describe("the college's roles (4 Oct 2026)", () => {
  it("gives each of the seven a home tab and More with the account; the six staff roles read the college's feed", () => {
    for (const role of ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "RECRUITER"] as const) {
      expect(TABS[role][0]!.name).toBe("index");
      expect(MENU[role].some((item) => item.screen === "/(app)/account")).toBe(true);
    }
    // The college's feed is a tab of the six staff roles (the integration, 4 Oct 2026), and my own leave is in their More.
    for (const role of ["FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const) {
      expect(TABS[role].some((tab) => tab.name === "bulletin")).toBe(true);
      expect(MENU[role].some((item) => item.screen === "/(app)/leave")).toBe(true);
    }
    expect(TABS.RECRUITER.some((tab) => tab.name === "bulletin")).toBe(false);
    expect(MENU.RECRUITER.some((item) => item.screen === "/(app)/bulletin" || item.screen === "/(app)/leave")).toBe(false);
  });

  it("gives faculty mentoring and an HOD their own teaching as tabs, each only while ACADEMICS is on", () => {
    const shown = (role: "FACULTY" | "HOD", modules: string[]) => TABS[role].filter((tab) => tabShown(tab, modules)).map((tab) => tab.name);
    // Messages is theirs whatever is on (5 Oct 2026, test/lib/college-messages.test.ts).
    expect(shown("FACULTY", ["ACADEMICS"])).toEqual(["index", "academics-mentoring", "bulletin", "messages"]);
    expect(shown("FACULTY", [])).toEqual(["index", "bulletin", "messages"]);
    expect(shown("HOD", ["ACADEMICS"])).toEqual(["index", "teaching", "bulletin", "messages"]);
    expect(shown("HOD", [])).toEqual(["index", "bulletin", "messages"]);
  });

  it("lists my appraisals for FACULTY and HOD, whom the head may appraise, whatever is on (A3-inventory-5)", () => {
    for (const role of ["FACULTY", "HOD"] as const) {
      const screens = menuFor(role, []).flatMap((g) => g.items.map((i) => i.screen));
      expect({ role, mine: screens.includes("/(app)/my-appraisals") }).toEqual({ role, mine: true });
    }
    for (const role of ["EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"] as const) expect(MENU[role].some((item) => item.screen === "/(app)/my-appraisals")).toBe(false);
  });

  it("puts my own leave in More for the three module staff roles, whose door names them", () => {
    for (const role of ["DRIVER", "LIBRARIAN", "WARDEN"] as const) expect(MENU[role].some((item) => item.screen === "/(app)/leave")).toBe(true);
    expect(MENU.ALUMNUS.some((item) => item.screen === "/(app)/leave")).toBe(false);
  });

  it("shows a student what their family sees only at a college (ACADEMICS on)", () => {
    const labels = (modules: string[]) => menuFor("STUDENT", modules).flatMap((g) => g.items.map((i) => i.labelKey));
    expect(labels(["ACADEMICS"])).toContain("consent.title");
    expect(labels(["ALUMNI"])).not.toContain("consent.title");
  });
});
