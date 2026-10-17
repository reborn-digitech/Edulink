import { fireEvent, screen } from "@testing-library/react-native";
import { StaffWebsite } from "@/screens/staff/website";
import { gated, json, mountStaff, refused } from "./staff-harness";

/**
 * The school's website on the phone (website-three, 17 Oct 2026): read-only for the office and the head — draft or
 * published, the live address, the "Ready: n of 7" list, the enquiries with the newest three, the visits — and "Edit on
 * the web" opening the editor in the browser. Another role is told it is the office's.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const SUMMARY_DOOR = "GET /api/v1/admin/site/summary";
const days = Array.from({ length: 30 }, (_, i) => ({ dateKey: `2026-09-${String(18 + (i % 12)).padStart(2, "0")}`, count: i === 29 ? 12 : 1 }));
const PUBLISHED = {
  state: "PUBLISHED",
  publishedAt: "2026-10-16T05:00:00.000Z",
  unpublishedChanges: true,
  address: "https://www.zz-northgate.test",
  checklist: [
    { code: "LOGO", done: true },
    { code: "ABOUT", done: true },
    { code: "HERO_PICTURE", done: true },
    { code: "CONTACT", done: true },
    { code: "ADMISSIONS", done: true },
    { code: "PICTURE_CONSENT", done: false },
    { code: "DOMAIN", done: false },
  ],
  ready: { done: 5, total: 7 },
  enquiries: {
    newCount: 1,
    total: 4,
    newest: [
      { id: "e1", name: "ZZ A new enquiry", createdAt: "2026-10-17T04:00:00.000Z", status: "NEW", wantsVisit: true },
      { id: "e2", name: "ZZ A replied enquiry", createdAt: "2026-10-16T04:00:00.000Z", status: "REPLIED", wantsVisit: false },
      { id: "e3", name: "ZZ A closed enquiry", createdAt: "2026-10-15T04:00:00.000Z", status: "CLOSED", wantsVisit: false },
    ],
  },
  visits: { total: 41, days },
  editPath: "/admin/website",
};
const DRAFT = { ...PUBLISHED, state: "DRAFT", publishedAt: null, unpublishedChanges: false, address: null, ready: { done: 2, total: 7 }, enquiries: { newCount: 0, total: 0, newest: [] }, visits: { total: 0, days } };

const openUrl = () => {
  const { Linking } = jest.requireActual<typeof import("react-native")>("react-native");
  return jest.spyOn(Linking, "openURL").mockResolvedValue(true);
};
beforeEach(() => mockRouter.push.mockClear());

describe("the school's website on the phone, read-only", () => {
  it("loads, then shows a published site with its address, the ready list, the newest enquiries and the visits", async () => {
    const gate = gated();
    await mountStaff(<StaffWebsite />, "ADMIN", { [SUMMARY_DOOR]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PUBLISHED));
    expect(await screen.findByText(/^Published /)).toBeTruthy();
    expect(screen.getByText("There are changes not yet published.")).toBeTruthy();
    expect(screen.getByText("Live at https://www.zz-northgate.test")).toBeTruthy();
    expect(screen.getByText("Ready: 5 of 7")).toBeTruthy();
    expect(screen.getByText("The school's logo")).toBeTruthy();
    expect(screen.getByText("The school's own domain")).toBeTruthy();
    expect(screen.getByText("1 new, 4 in all")).toBeTruthy();
    expect(screen.getByText("ZZ A new enquiry")).toBeTruthy();
    expect(screen.getByText(/^New · .* · Would like to visit$/)).toBeTruthy();
    expect(screen.getByText("ZZ A closed enquiry")).toBeTruthy();
    expect(screen.getByText("41 page views")).toBeTruthy();
  });

  it("opens the editor on the web from Edit on the web", async () => {
    const open = openUrl();
    await mountStaff(<StaffWebsite />, "PRINCIPAL", { [SUMMARY_DOOR]: () => json(PUBLISHED) });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit on the web" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/admin\/website$/));
    open.mockRestore();
  });

  it("says a site is still a draft, not on a domain, with no enquiries yet", async () => {
    await mountStaff(<StaffWebsite />, "ADMIN", { [SUMMARY_DOOR]: () => json(DRAFT) });
    expect(await screen.findByText("Draft: not published yet")).toBeTruthy();
    expect(screen.getByText("Not live on the school's own domain yet.")).toBeTruthy();
    expect(screen.getByText("Ready: 2 of 7")).toBeTruthy();
    expect(screen.getByText("No enquiries yet.")).toBeTruthy();
    expect(screen.getByText("0 page views")).toBeTruthy();
    expect(screen.queryByText("There are changes not yet published.")).toBeNull();
  });

  it("shows the server's refusal with a retry", async () => {
    await mountStaff(<StaffWebsite />, "ADMIN", { [SUMMARY_DOOR]: refused("The website module is not switched on.", 403) });
    expect(await screen.findByText("The website module is not switched on.")).toBeTruthy();
  });

  it("tells another role it is the office's, and asks the server nothing", async () => {
    const asked = jest.fn(() => json(PUBLISHED));
    await mountStaff(<StaffWebsite />, "TEACHER", { [SUMMARY_DOOR]: asked });
    expect(await screen.findByText("Only the office and the head see the website here.")).toBeTruthy();
    expect(asked).not.toHaveBeenCalled();
  });
});
