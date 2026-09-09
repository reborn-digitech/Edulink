import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { expertBookingsSchema, expertProfileSchema } from "@edulink/contracts";
import { ExpertHome } from "@/screens/expert/home";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const booking = (id: string, status: string, startsAt: string, extra: Record<string, unknown> = {}) => ({
  id, topic: `ZZ Topic ${id}`, status, startsAt, endsAt: startsAt.replace("T09:30", "T10:30"), expertName: "ZZ Expert", schoolName: `ZZ School ${id}`, unread: 0, ...extra,
});
const BOOKINGS = expertBookingsSchema.parse({
  bookings: [
    booking("b1", "CONFIRMED", "2030-01-10T09:30:00.000Z", { unread: 2 }),
    booking("b2", "COMPLETED", "2026-01-05T09:30:00.000Z"),
    booking("b3", "CANCELLED", "2030-02-01T09:30:00.000Z"),
  ],
});
const PROFILE = expertProfileSchema.parse({
  profile: { headline: "ZZ Careers adviser", bio: "", organisation: null, specialisms: [], timezone: "Asia/Kolkata", offering: "SESSIONS", mentorCapacity: null, published: false, verified: false },
  impact: { sessionsDone: 0, sessionsBooked: 0, schoolsServed: 0, activeMentorships: 0, mentorCapacity: null, upcomingSlots: 0 },
});
const PATH = "GET /api/v1/shared/expert/bookings";

describe("the expert's bookings", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then leads with the counts and lists what is coming up before the rest", async () => {
    const gate = gated();
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BOOKINGS));
    await screen.findByText("ZZ School b1");
    expect(screen.getByLabelText("Booked ahead: 1")).toBeTruthy();
    expect(screen.getByLabelText("Sessions held: 1")).toBeTruthy();
    expect(screen.getByLabelText("Messages: 2")).toBeTruthy();
    expect(screen.getByText("Coming up")).toBeTruthy();
    expect(screen.getByText("Your bookings")).toBeTruthy();
    expect(screen.getByText(/^ZZ Topic b1 · .*9:30/)).toBeTruthy();
    expect(screen.getByText("confirmed")).toBeTruthy();
    expect(screen.getByText("completed")).toBeTruthy();
    expect(screen.getByText("cancelled")).toBeTruthy();
    expect(screen.getByText("2 new")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/shared/expert/bookings")).toBe(true);
    // A booking's conversation is the web's page.
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ School b1, ZZ Topic b1/ }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/experts/bookings/b1`);
    open.mockRestore();
  });

  it("no bookings: says so, and the door is the availability tab", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: () => json({ bookings: [] }) });
    expect(await screen.findByText("No bookings yet")).toBeTruthy();
    expect(screen.getByText(/^Offer some times under Availability/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open your availability" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/availability");
  });

  it("while the profile is still under review, says so over the list, with a door to the profile", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: () => json({ bookings: [] }), "GET /api/v1/shared/expert/profile": () => json(PROFILE) });
    expect(await screen.findByText("Your profile is being reviewed")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Profile" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/profile");
  });

  it("a listed expert sees no review note", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: () => json(BOOKINGS), "GET /api/v1/shared/expert/profile": () => json({ ...PROFILE, profile: { ...PROFILE.profile, published: true } }) });
    await screen.findByText("ZZ School b1");
    expect(screen.queryByText("Your profile is being reviewed")).toBeNull();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: refused("ZZ not an expert", 403) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not an expert");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/shared/expert/bookings").length).toBe(2));
  });
});
