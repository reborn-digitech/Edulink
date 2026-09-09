import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { AppAdminHome } from "@/screens/operator/app-admin";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

/** The content team: no school, no role, the flag on the account. */
const CURATOR = {
  user: { id: "u-cur", name: "ZZ Curator", preferredName: null, email: "cur@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: false, isAppAdmin: true },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const COMPETITIONS = {
  items: [
    { id: "c1", title: "ZZ Maths Olympiad", summary: "For classes 6 to 10.", status: "PUBLISHED", organizerName: "EduLink", registrationClosesAt: "2026-12-01T00:00:00.000Z", createdAt: ago(2 * 86_400_000) },
    { id: "c2", title: "ZZ Essay Prize", summary: "Five hundred words.", status: "DRAFT", organizerName: "ZZ Trust", registrationClosesAt: null, createdAt: ago(3_600_000) },
  ],
};

describe("the content team's home", () => {
  it("loads, then shows the name, the Content badge and the competitions with their status", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { "GET /api/v1/appadmin/competitions": gate.answer }, { me: CURATOR });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(COMPETITIONS));
    await screen.findByText("ZZ Maths Olympiad");
    expect(screen.getByText("ZZ Curator")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByText("ZZ Essay Prize")).toBeTruthy();
    expect(screen.getByText(/^For classes 6 to 10\. · EduLink · .*2026 · posted 2 days ago$/)).toBeTruthy();
    expect(screen.getByText(/^Five hundred words\. · ZZ Trust · posted 1 hour ago$/)).toBeTruthy();
    expect(screen.getAllByText("Live").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Draft").length).toBeGreaterThanOrEqual(2);
    expect(calls().some((c) => c.line === "GET /api/v1/appadmin/competitions")).toBe(true);
  });

  it("the status chips narrow the list on the phone; a row, posting and the bank open the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { "GET /api/v1/appadmin/competitions": () => json(COMPETITIONS) }, { me: CURATOR });
    await screen.findByText("ZZ Maths Olympiad");
    await fireEvent.press(screen.getByRole("radio", { name: "Draft" }));
    await waitFor(() => expect(screen.queryByText("ZZ Maths Olympiad")).toBeNull());
    expect(screen.getByText("ZZ Essay Prize")).toBeTruthy();
    // One GET: the web narrows the same list the same way, without asking again.
    expect(calls().filter((c) => c.line.startsWith("GET /api/v1/appadmin/competitions")).length).toBe(1);
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Essay Prize,/ }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/appadmin`);
    await fireEvent.press(screen.getByRole("button", { name: "Post a competition" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/appadmin/new`);
    await fireEvent.press(screen.getByRole("button", { name: "Question bank" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/appadmin/bank`);
    open.mockRestore();
  });

  it("nothing posted: the door is the web's form; a status with nothing in it clears itself", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<AppAdminHome />, "ADMIN", { "GET /api/v1/appadmin/competitions": () => json({ items: [] }) }, { me: CURATOR });
    expect(await screen.findByText("No platform competitions yet")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Post a competition" })[1]!);
    expect(open).toHaveBeenCalledWith(`${API_BASE}/appadmin/new`);
    await fireEvent.press(screen.getByRole("radio", { name: "Withdrawn" }));
    expect(await screen.findByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    expect(await screen.findByText("No platform competitions yet")).toBeTruthy();
    open.mockRestore();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AppAdminHome />, "ADMIN", { "GET /api/v1/appadmin/competitions": refused("Not now.") }, { me: CURATOR });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/appadmin/competitions")).length).toBe(2));
  });
});
