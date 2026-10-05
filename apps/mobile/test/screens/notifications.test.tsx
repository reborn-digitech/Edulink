import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import NotificationsRoute from "@/app/(app)/notifications";
import { json, mountStaff } from "./staff-harness";

/**
 * The bell (A3-journeys-14, audit of 5 October 2026): each notice is its own
 * button, named by its title, its words and whether it is read; a tap marks
 * that one read (POST /shared/notifications/{id}/read) and opens its link
 * through the app's link mapper, or on the web when the app has no screen.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: () => false, params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, usePathname: () => "/notifications", useLocalSearchParams: () => mockRouter.params }));

const at = "2026-10-05T09:00:00.000Z";
const notice = (id: string, title: string, body: string, url: string | null, read = false) => ({ id, kind: "POST", title, body, url, read, createdAt: at });
const list = {
  items: [
    notice("n1", "A notice from ZZ Head", "ZZ J3 Science centre trip", "/bulletin/p1"),
    notice("n2", "Your consent is needed", "", "/teacher/nowhere"),
    notice("n3", "Fees received", "Term 1", null, true),
  ],
  nextCursor: null,
  unreadCount: 2,
  totalCount: 3,
};

beforeEach(() => mockRouter.push.mockClear());

describe("the bell's rows", () => {
  it("are each a button named by the title, the words and the read state; a tap marks that one read and opens its screen", async () => {
    const { calls } = await mountStaff(<NotificationsRoute />, "PARENT", {
      "GET /api/v1/shared/notifications": () => json(list),
      "POST /api/v1/shared/notifications/n1/read": () => json({ ok: true }),
      "POST /api/v1/shared/notifications/n2/read": () => json({ ok: true }),
    });
    const first = await screen.findByRole("button", { name: "A notice from ZZ Head, ZZ J3 Science centre trip, Unread" });
    expect(screen.getByRole("button", { name: "Your consent is needed, Unread" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Fees received, Term 1, Read" })).toBeTruthy();

    await fireEvent.press(first);
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/shared/notifications/n1/read")).toBe(true));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/post", params: { postId: "p1" } });
    // Marking one read asks for the list again (and the tab badge, under the same key).
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/shared/notifications")).length).toBeGreaterThan(1));

    // A link the app has no screen for opens on the web, signed in there.
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await fireEvent.press(screen.getByRole("button", { name: "Your consent is needed, Unread" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/shared/notifications/n2/read")).toBe(true));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/^http:\/\/[^/]+\/teacher\/nowhere$/));

    // A read notice with no link: nothing to mark, nowhere to go.
    open.mockClear();
    mockRouter.push.mockClear();
    await fireEvent.press(screen.getByRole("button", { name: "Fees received, Term 1, Read" }));
    expect(calls().some((c) => c.line === "POST /api/v1/shared/notifications/n3/read")).toBe(false);
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    open.mockRestore();
  });

  it("an empty bell says so", async () => {
    await mountStaff(<NotificationsRoute />, "PARENT", { "GET /api/v1/shared/notifications": () => json({ items: [], nextCursor: null, unreadCount: 0, totalCount: 0 }) });
    expect(await screen.findByText("Nothing yet")).toBeTruthy();
  });
});
