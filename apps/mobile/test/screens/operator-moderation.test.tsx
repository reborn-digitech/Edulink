import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { moderationSchema } from "@edulink/contracts";
import { PlatformModeration } from "@/screens/operator/moderation";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/** The content team: no school, no role, the flag on the account. */
const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const LIST = "/api/v1/appadmin/moderation";
const live = (over: Partial<Parameters<typeof moderationSchema.parse>[0] & object> = {}) =>
  moderationSchema.parse({
    status: "live",
    page: 1,
    pages: 1,
    counts: { live: 2, takenDown: 1, restored: 0 },
    items: [
      { postId: "p1", title: "ZZ Science fair", excerpt: "Our volcano", category: "EVENTS", schoolName: "ZZ Banyan", authorName: "Aarav", createdAt: "2026-09-30T04:00:00.000Z", commentCount: 3, status: "APPROVED", takedown: null },
      { postId: "p2", title: "ZZ Sports day", excerpt: "", category: "EVENTS", schoolName: "", authorName: "Meera Joshi", createdAt: "2026-09-29T04:00:00.000Z", commentCount: 0, status: "APPROVED", takedown: null },
    ],
    ...over,
  });
const DOWN = moderationSchema.parse({
  status: "takenDown",
  page: 1,
  pages: 1,
  counts: { live: 1, takenDown: 1, restored: 0 },
  items: [{ postId: "p1", title: "ZZ Science fair", excerpt: "", category: "", schoolName: "ZZ Banyan", authorName: "", createdAt: "2026-10-01T04:00:00.000Z", commentCount: 0, status: "TAKEN_DOWN", takedown: { reason: "Names a child in full", at: "2026-10-01T04:00:00.000Z", by: "ZZ Curator", restoredAt: null, restoredBy: null } }],
});
const mount = (answers: Parameters<typeof mountStaff>[2]) => mountStaff(<PlatformModeration />, "ADMIN", answers, { me: CURATOR });

beforeEach(() => mockRouter.push.mockReset());

describe("platform moderation", () => {
  it("loads, then lists every school's shared posts with the school named, a pupil by first name, and the counts on the chips", async () => {
    const gate = gated();
    const { calls } = await mount({ [`GET ${LIST}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(live()));
    await screen.findByText("ZZ Science fair");
    expect(screen.getByText(/ZZ Banyan · Aarav · .*3 comments · Our volcano/)).toBeTruthy();
    expect(screen.getByText(/School no longer on Relay · Meera Joshi/)).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Live (2)" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Taken down (1)" })).toBeTruthy();
    expect(screen.getByText("Held comments stay with the school that holds them.")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${LIST}?status=live&page=1`)).toBe(true);
  });

  it("a take-down is asked twice with a reason, sent, and the list re-reads", async () => {
    const { calls } = await mount({ [`GET ${LIST}`]: () => json(live()), [`POST ${LIST}/p1/takedown`]: () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Take down ZZ Science fair" }));
    const confirm = await screen.findByRole("button", { name: "Take down for every school: ZZ Science fair" });
    expect(confirm).toBeDisabled();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Why it is coming down"), "Names a child in full");
    await fireEvent.press(screen.getByRole("button", { name: "Take down for every school: ZZ Science fair" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${LIST}/p1/takedown`)?.body).toEqual({ reason: "Names a child in full" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith(`GET ${LIST}`))).toHaveLength(2));
  });

  it("the taken-down chip shows the reason and who, and a restore is one press; a refusal is the server's sentence with a retry", async () => {
    let fail = true;
    const { calls } = await mount({
      [`GET ${LIST}`]: (req) => json(req.url.searchParams.get("status") === "takenDown" ? DOWN : live()),
      [`POST ${LIST}/p1/restore`]: (req) => (fail ? refused("ZZ not now.")(req) : json({ ok: true })),
    });
    await screen.findByText("ZZ Science fair");
    await fireEvent.press(screen.getByRole("radio", { name: "Taken down (1)" }));
    // The date is the runner's locale's; the words around it are the sentence.
    expect(await screen.findByText(/^Taken down by ZZ Curator on .*2026: Names a child in full$/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Restore ZZ Science fair" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    fail = false;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${LIST}/p1/restore`)).toHaveLength(2));
  });

  it("an empty state has a door, and pages turn", async () => {
    const { calls } = await mount({ [`GET ${LIST}`]: (req) => json(live({ pages: 2, page: Number(req.url.searchParams.get("page")), ...(req.url.searchParams.get("page") === "2" ? { items: [] } : {}) })) });
    await screen.findByText("ZZ Science fair");
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Nothing here")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Refresh" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${LIST}?status=live&page=2`)).toHaveLength(2));
  });
});
