import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { enquiriesPageSchema } from "@edulink/contracts";
import { Enquiries } from "@/screens/shared/enquiries";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PATH = "/api/v1/shared/enquiries";
const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
const PAGE = enquiriesPageSchema.parse({
  inbox: [
    { id: "eq1", kind: "ADMISSION", status: "OPEN", schoolName: "ZZ School", subject: "", fromName: "ZZ Parent", lastMessageAt: hourAgo, lastMessagePreview: "Is there a place in Year 4?", unread: true },
    { id: "eq2", kind: "VACANCY", status: "CLOSED", schoolName: "ZZ School", subject: "Maths teacher", fromName: "ZZ Candidate", lastMessageAt: hourAgo, lastMessagePreview: "Thank you for your time.", unread: false },
  ],
  sent: [{ id: "eq3", kind: "ADMISSION", status: "OPEN", schoolName: "ZZ Other School", subject: "", fromName: "ZZ Head", lastMessageAt: hourAgo, lastMessagePreview: "Asking for a colleague.", unread: false }],
});

beforeEach(() => {
  mockRouter.push.mockReset();
});

describe("enquiries", () => {
  it("loads, then shows the school's inbox named after who asked and my own named after the school, and opens one", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Enquiries />, "ADMIN", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PAGE));
    await screen.findByText("ZZ Parent");
    expect(screen.getByText("For your school")).toBeTruthy();
    expect(screen.getByText("Yours")).toBeTruthy();
    expect(screen.getByText("ZZ Candidate — Maths teacher")).toBeTruthy();
    expect(screen.getByText("Admission — ZZ Other School")).toBeTruthy();
    expect(screen.getByText(/^Admission · 1 hour ago\s+Is there a place in Year 4\?$/)).toBeTruthy();
    expect(screen.getByText("New")).toBeTruthy();
    // "Closed" is both the filter chip and the badge on the closed one.
    expect(screen.getAllByText("Closed").length).toBeGreaterThanOrEqual(2);
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Parent/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/enquiries/detail", params: { enquiryId: "eq1" } });
  });

  it("the status and kind chips narrow the list; nothing matching clears them", async () => {
    await mountStaff(<Enquiries />, "ADMIN", { [`GET ${PATH}`]: () => json(PAGE) });
    await screen.findByText("ZZ Parent");
    await fireEvent.press(screen.getByRole("radio", { name: "Closed" }));
    expect(screen.queryByText("ZZ Parent")).toBeNull();
    expect(screen.getByText("ZZ Candidate — Maths teacher")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Admission" }));
    expect(screen.getByText("Nothing matches")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.getByText("ZZ Parent")).toBeTruthy();
  });

  it("nothing yet: staff are sent to their messages", async () => {
    await mountStaff(<Enquiries />, "TEACHER", { [`GET ${PATH}`]: () => json({ sent: [], inbox: [] }) });
    expect(await screen.findByText("No enquiries yet")).toBeTruthy();
    expect(screen.getByText("When somebody asks about admission or a vacancy, the conversation lands here.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });

  it("nothing yet: a guardian is sent to Explore, where a new enquiry starts", async () => {
    await mountStaff(<Enquiries />, "PARENT", { [`GET ${PATH}`]: () => json({ sent: [], inbox: [] }) });
    await screen.findByText("Find a school in Explore and ask about admission — the conversation will live here.");
    // Two doors for a guardian: the standing button and the empty state's own; either opens Explore.
    await fireEvent.press(screen.getAllByRole("button", { name: "Explore schools" })[1]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/explore");
    mockRouter.push.mockClear();
    await fireEvent.press(screen.getAllByRole("button", { name: "Explore schools" })[0]!);
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/explore");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Enquiries />, "PRINCIPAL", { [`GET ${PATH}`]: refused("ZZ not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
