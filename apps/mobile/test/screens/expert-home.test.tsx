import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { expertBookingsSchema, expertProfileSchema } from "@edulink/contracts";
import { ExpertHome } from "@/screens/expert/home";
import { gated, json, me, mountStaff, refused } from "./staff-harness";

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
    const { calls } = await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(BOOKINGS));
    await screen.findByText("ZZ School b1");
    expect(screen.getByLabelText("Booked ahead: 1")).toBeTruthy();
    expect(screen.getByLabelText("Sessions held: 1")).toBeTruthy();
    expect(screen.getByLabelText("Messages: 2")).toBeTruthy();
    expect(screen.getByText("Coming up")).toBeTruthy();
    expect(screen.getByText("Your bookings")).toBeTruthy();
    expect(screen.getByText(/^ZZ Topic b1 · Thu, 10\/01\/2030, \d{1,2}:\d\d\s(AM|PM)/)).toBeTruthy();
    expect(screen.getByText("confirmed")).toBeTruthy();
    expect(screen.getByText("completed")).toBeTruthy();
    expect(screen.getByText("cancelled")).toBeTruthy();
    expect(screen.getByText("2 new")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/shared/expert/bookings")).toBe(true);
    // A booking's conversation is the app's own booking screen.
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ School b1, ZZ Topic b1/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/booking", params: { bookingId: "b1" } });
  });

  it("no bookings: says so, and the door is the availability tab", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: () => json({ bookings: [] }) });
    expect(await screen.findByText("No bookings yet")).toBeTruthy();
    expect(screen.getByText(/^Offer some times under Availability/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open your availability" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/availability");
  });

  it("while the profile is still under review, says so as the whole screen, with the web's door to the account and no list the bookings door refuses (QA-53)", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", { [PATH]: refused("ZZ Not an expert", 403), "GET /api/v1/shared/expert/profile": () => json(PROFILE) });
    expect(await screen.findByText("Your profile is being reviewed")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Set up your account meanwhile" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/account");
  });

  it("with expert sessions switched off, an expert under review is still told so, not offered a profile to fill in (QA-53)", async () => {
    const { calls } = await mountStaff(<ExpertHome />, "EXPERT", { "GET /api/v1/shared/expert/profile": () => json(PROFILE) }, { me: { ...me("EXPERT"), features: [] } });
    expect(await screen.findByText("Your profile is being reviewed")).toBeTruthy();
    expect(screen.queryByText(/^Sessions with schools are not open yet/)).toBeNull();
    expect(calls().some((c) => c.line.startsWith("GET /api/v1/shared/expert/bookings"))).toBe(false);
  });

  it("with expert sessions switched off, a listed expert reads that sessions are not open, with the profile", async () => {
    await mountStaff(<ExpertHome />, "EXPERT", { "GET /api/v1/shared/expert/profile": () => json({ ...PROFILE, profile: { ...PROFILE.profile, published: true } }) }, { me: { ...me("EXPERT"), features: [] } });
    expect(await screen.findByText(/^Sessions with schools are not open yet/)).toBeTruthy();
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
