import { en } from "@edulink/i18n/en";
import { ALL_TAB_SCREENS, TABS } from "@/lib/nav";

describe("the tab bar per role", () => {
  it("has at most four tabs, each a declared screen with a label the dictionary has", () => {
    const flat = JSON.stringify(en);
    for (const [role, tabs] of Object.entries(TABS)) {
      expect({ role, tabs: tabs.length <= 4 }).toEqual({ role, tabs: true });
      expect(tabs[0]!.name).toBe("index");
      for (const tab of tabs) {
        expect(ALL_TAB_SCREENS as readonly string[]).toContain(tab.name);
        const leaf = tab.labelKey.split(".").pop()!;
        expect({ key: tab.labelKey, present: flat.includes(`"${leaf}":`) }).toEqual({ key: tab.labelKey, present: true });
      }
    }
  });

  it("names every tab screen any role has, once", () => {
    const named = new Set(Object.values(TABS).flatMap((tabs) => tabs.map((t) => t.name)));
    for (const name of named) expect(ALL_TAB_SCREENS as readonly string[]).toContain(name);
    expect(new Set(ALL_TAB_SCREENS).size).toBe(ALL_TAB_SCREENS.length);
  });
});
