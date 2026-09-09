import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { en } from "@edulink/i18n/en";
import { ALL_TAB_SCREENS, HIDDEN_SCREENS, MENU, menuFor, TABS } from "@/lib/nav";

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
