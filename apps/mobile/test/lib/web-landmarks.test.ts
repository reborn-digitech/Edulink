import { markTabBar } from "@/lib/web-landmarks";

/** QA-67: the navigator's tab bar is the web target's navigation landmark; a screen's own tabs inside its main are not. */
type Fake = { attrs: Record<string, string>; parentElement: Fake | null; inMain: boolean; closest(selector: string): unknown; getAttribute(name: string): string | null; setAttribute(name: string, value: string): void };
const el = (parent: Fake | null, inMain = false): Fake => {
  const e: Fake = { attrs: {}, parentElement: parent, inMain, closest: () => (e.inMain ? {} : null), getAttribute: (n) => e.attrs[n] ?? null, setAttribute: (n, v) => void (e.attrs[n] = v) };
  return e;
};

describe("the tab bar on the web target (QA-67)", () => {
  it("names the bar's container navigation, never a screen's own tabs", () => {
    const screenHost = el(null, true);
    const screenTabs = el(screenHost, true);
    const barHost = el(null);
    const barTabs = el(barHost);
    expect(markTabBar({ querySelectorAll: () => [screenTabs, barTabs] }, "Main")).toBe(true);
    expect(barHost.attrs).toEqual({ role: "navigation", "aria-label": "Main" });
    expect(screenHost.attrs).toEqual({});
  });

  it("finds nothing to name before the bar is drawn", () => {
    expect(markTabBar({ querySelectorAll: () => [] }, "Main")).toBe(false);
  });
});
