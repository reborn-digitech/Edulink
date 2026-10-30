/**
 * owner-batch-item9 (27 Oct 2026): THE HEAD'S PAGES ON THE PHONE. Leave approval, the trends, the review rounds and the
 * safety centre are the head's; an ADMIN's tab and More entries for them show only while /api/v1/me's `adminDuties`
 * holds HEAD_PAGES (the head gave them, or the school has no head), as the web's menu does. The head's More gains the
 * safety centre, which opens to the head.
 */
import { MENU, TABS, dutiesOfMe, menuFor, tabShown } from "@/lib/nav";

const screens = (duties: string[]) => menuFor("ADMIN", undefined, duties).flatMap((g) => g.items.map((i) => i.screen ?? i.web));
const HEAD = ["/(app)/safety", "/(app)/reviews", "/(app)/trends"];

describe("the head's pages for the office on the phone", () => {
  it("the office's More lists safety, reviews and trends only holding HEAD_PAGES", () => {
    for (const screen of HEAD) {
      expect(screens([])).not.toContain(screen);
      expect(screens(["HEAD_PAGES"])).toContain(screen);
    }
    expect(MENU.ADMIN.filter((i) => i.duty).map((i) => i.screen).sort()).toEqual([...HEAD].sort());
  });

  it("the office's leave tab goes with the duty; the head's stays", () => {
    const leave = TABS.ADMIN.find((t) => t.name === "leave")!;
    expect(leave.duty).toBe("HEAD_PAGES");
    expect(tabShown(leave, [], [])).toBe(false);
    expect(tabShown(leave, [], ["HEAD_PAGES"])).toBe(true);
    const head = TABS.PRINCIPAL.find((t) => t.name === "leave")!;
    expect(tabShown(head, [], [])).toBe(true);
  });

  it("the head's More has the safety centre, with no duty", () => {
    const mine = menuFor("PRINCIPAL", undefined, []).flatMap((g) => g.items.map((i) => i.screen));
    for (const screen of HEAD) expect(mine).toContain(screen);
    expect(MENU.PRINCIPAL.some((i) => i.duty)).toBe(false);
  });

  it("dutiesOfMe joins a college teacher's duties and the office's", () => {
    expect(dutiesOfMe({ duties: ["LAB_INCHARGE"], adminDuties: ["HEAD_PAGES"] })).toEqual(["LAB_INCHARGE", "HEAD_PAGES"]);
    // An answer from a server before the field says nothing: no office duty.
    expect(dutiesOfMe({ duties: [] })).toEqual([]);
    expect(dutiesOfMe(null)).toEqual([]);
  });
});
