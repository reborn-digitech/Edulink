import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AppAdminHome } from "@/screens/operator/app-admin";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/** The content team: no school, no role, the flag on the account. */
const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();
const LIST = "/api/v1/appadmin/competitions";
const status = (id: string) => `/api/v1/appadmin/competitions/${id}/status`;

const COMPETITIONS = {
  items: [
    { id: "c1", title: "ZZ Maths Olympiad", summary: "For classes 6 to 10.", status: "PUBLISHED", organizerName: "Relay", registrationClosesAt: "2026-12-01T00:00:00.000Z", createdAt: ago(2 * 86_400_000) },
    { id: "c2", title: "ZZ Essay Prize", summary: "Five hundred words.", status: "DRAFT", organizerName: "ZZ Trust", registrationClosesAt: null, createdAt: ago(3_600_000) },
  ],
};

beforeEach(() => {
  mockRouter.push.mockReset();
});

describe("the content team's home", () => {
  it("loads, then shows the name, the Content badge and the competitions with their status", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { [`GET ${LIST}`]: gate.answer }, { me: CURATOR });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(COMPETITIONS));
    await screen.findByText("ZZ Maths Olympiad");
    expect(screen.getByText("ZZ Curator")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("ZZ Essay Prize")).toBeTruthy();
    expect(screen.getByText(/^For classes 6 to 10\. · Relay · .*2026 · posted 2 days ago$/)).toBeTruthy();
    expect(screen.getByText(/^Five hundred words\. · ZZ Trust · posted 1 hour ago$/)).toBeTruthy();
    expect(screen.getAllByText("Live").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Draft").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("button", { name: "Withdraw ZZ Maths Olympiad" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Publish ZZ Essay Prize" })).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${LIST}`)).toBe(true);
  });

  it("the status chips narrow the list on the phone; posting and the bank are the app's own screens", async () => {
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { [`GET ${LIST}`]: () => json(COMPETITIONS) }, { me: CURATOR });
    await screen.findByText("ZZ Maths Olympiad");
    await fireEvent.press(screen.getByRole("radio", { name: "Draft" }));
    await waitFor(() => expect(screen.queryByText("ZZ Maths Olympiad")).toBeNull());
    expect(screen.getByText("ZZ Essay Prize")).toBeTruthy();
    // One GET: the web narrows the same list the same way, without asking again.
    expect(calls().filter((c) => c.line.startsWith(`GET ${LIST}`)).length).toBe(1);
    await fireEvent.press(screen.getByRole("button", { name: "Post a competition" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/(app)/competition-new");
    await fireEvent.press(screen.getByRole("button", { name: "Question bank" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith("/(app)/question-bank");
  });

  it("a draft is published after a second tap that says who will see it, and the list re-reads", async () => {
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { [`GET ${LIST}`]: () => json(COMPETITIONS), [`POST ${status("c2")}`]: () => json({ ok: true, status: "PUBLISHED" }) }, { me: CURATOR });
    await fireEvent.press(await screen.findByRole("button", { name: "Publish ZZ Essay Prize" }));
    expect(screen.getByText("Every school on this server will see it once published.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Publish: ZZ Essay Prize" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${status("c2")}`)?.body).toEqual({ status: "PUBLISHED" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${LIST}`)).toHaveLength(2));
  });

  it("withdrawing a live one asks twice, Cancel keeps it, and a refusal is the server's sentence with a retry", async () => {
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { [`GET ${LIST}`]: () => json(COMPETITIONS), [`POST ${status("c1")}`]: refused("ZZ not now.") }, { me: CURATOR });
    await fireEvent.press(await screen.findByRole("button", { name: "Withdraw ZZ Maths Olympiad" }));
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw ZZ Maths Olympiad" }));
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw: ZZ Maths Olympiad" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    expect(calls().find((c) => c.line === `POST ${status("c1")}`)?.body).toEqual({ status: "ARCHIVED" });
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${status("c1")}`)).toHaveLength(2));
  });

  it("nothing posted: the door is the app's form; a status with nothing in it clears itself", async () => {
    await mountStaff(<AppAdminHome />, "ADMIN", { [`GET ${LIST}`]: () => json({ items: [] }) }, { me: CURATOR });
    expect(await screen.findByText("No platform competitions yet")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Post a competition" })[1]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/competition-new");
    await fireEvent.press(screen.getByRole("radio", { name: "Withdrawn" }));
    expect(await screen.findByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    expect(await screen.findByText("No platform competitions yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { [`GET ${LIST}`]: refused("Not now.") }, { me: CURATOR });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith(`GET ${LIST}`)).length).toBe(2));
  });
});
