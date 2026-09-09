import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { mentoringPageSchema } from "@edulink/contracts";
import { Mentoring } from "@/screens/shared/mentoring";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/shared/mentoring";
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const PAGE = mentoringPageSchema.parse({
  threads: [
    { id: "mt1", status: "ACTIVE", purpose: "ZZ Engineering routes", studentMembershipId: "p1", studentName: "ZZ Asha", expertName: "ZZ Mentor", schoolName: "ZZ School", awaitingConsent: false, unread: 2 },
    { id: "mt2", status: "PENDING_CONSENT", purpose: "ZZ Music practice", studentMembershipId: "p2", studentName: "ZZ Ravi", expertName: "ZZ Tutor", schoolName: "ZZ School", awaitingConsent: true, unread: 0 },
    { id: "mt3", status: "CLOSED", purpose: "ZZ Reading club", studentMembershipId: "p3", studentName: "ZZ Meera", expertName: "ZZ Coach", schoolName: "ZZ School", awaitingConsent: false, unread: 0 },
  ],
  requests: [{ threadId: "mt4", studentName: "ZZ Kiran", studentMembershipId: "p4", expertName: "ZZ Guide", expertHeadline: "Robotics", expertVerified: true, purpose: "ZZ Robotics help", askedAt: hourAgo }],
});

beforeEach(() => {
  mockRouter.push.mockReset();
});

describe("mentoring", () => {
  it("loads, then lists every mentorship with its status, the unread count, and opens one", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Mentoring />, "STUDENT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PAGE));
    await screen.findByText("ZZ Asha & ZZ Mentor");
    expect(screen.getByText("ZZ Engineering routes")).toBeTruthy();
    // "Active" and "Closed" are each a status on a row and a filter chip.
    expect(screen.getAllByText("Active")).toHaveLength(2);
    expect(screen.getByText("2 new")).toBeTruthy();
    expect(screen.getByText("Waiting for a guardian")).toBeTruthy();
    expect(screen.getAllByText("Closed")).toHaveLength(2);
    // The request queue is the office's, not a pupil's.
    expect(screen.queryByText("ZZ Kiran & ZZ Guide")).toBeNull();
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: /ZZ Asha & ZZ Mentor/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/mentoring/thread", params: { threadId: "mt1" } });
  });

  it("the status chips narrow the list; nothing matching offers the whole list back", async () => {
    await mountStaff(<Mentoring />, "STUDENT", { [`GET ${PATH}`]: () => json(PAGE) });
    await screen.findByText("ZZ Asha & ZZ Mentor");
    await fireEvent.press(screen.getByRole("radio", { name: "Closed" }));
    expect(screen.getByText("ZZ Meera & ZZ Coach")).toBeTruthy();
    expect(screen.queryByText("ZZ Asha & ZZ Mentor")).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "All" }));
    expect(screen.getByText("ZZ Asha & ZZ Mentor")).toBeTruthy();
  });

  it("the office sees the requests waiting on it and decides them on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<Mentoring />, "ADMIN", { [`GET ${PATH}`]: () => json(PAGE) });
    await screen.findByText("1 pupil asking for a mentor");
    expect(screen.getByText("ZZ Kiran & ZZ Guide")).toBeTruthy();
    expect(screen.getByText(/^ZZ Robotics help · asked 1 hour ago$/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open on the web" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/mentoring`);
    await fireEvent.press(screen.getByRole("button", { name: "Set up mentoring" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/mentoring`);
    open.mockRestore();
  });

  it("a guardian is told how many are waiting on their yes", async () => {
    await mountStaff(<Mentoring />, "PARENT", { [`GET ${PATH}`]: () => json(PAGE) });
    expect(await screen.findByText("1 mentorship(s) need your agreement before anyone can send a message.")).toBeTruthy();
  });

  it("nothing yet: a pupil asks on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<Mentoring />, "STUDENT", { [`GET ${PATH}`]: () => json({ threads: [], requests: [] }) });
    expect(await screen.findByText("No mentoring yet")).toBeTruthy();
    // Two doors for a pupil: the standing button and the empty state's own; either opens the web's form.
    await fireEvent.press(screen.getAllByRole("button", { name: "Ask for a mentor" })[1]!);
    expect(open).toHaveBeenCalledWith(`${API_BASE}/mentoring`);
    open.mockRestore();
  });

  it("nothing yet: a guardian is sent to the experts", async () => {
    await mountStaff(<Mentoring />, "PARENT", { [`GET ${PATH}`]: () => json({ threads: [], requests: [] }) });
    await screen.findByText("No mentoring yet");
    await fireEvent.press(screen.getByRole("button", { name: "Experts" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/experts");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Mentoring />, "TEACHER", { [`GET ${PATH}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
