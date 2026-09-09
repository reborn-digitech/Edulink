import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { expertProfileSchema, expertSaveProfileSchema } from "@edulink/contracts";
import { ExpertProfile } from "@/screens/expert/profile";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PROFILE = expertProfileSchema.parse({
  profile: { headline: "ZZ Careers adviser", bio: "ZZ Fifteen years in engineering.", organisation: "ZZ Works", specialisms: ["Olympiad maths", "Careers"], timezone: "Asia/Kolkata", offering: "SESSIONS", mentorCapacity: null, published: true, verified: true },
  impact: { sessionsDone: 4, sessionsBooked: 2, schoolsServed: 3, activeMentorships: 1, mentorCapacity: 3, upcomingSlots: 0 },
});
const UNLISTED = { profile: { ...PROFILE.profile, published: false, verified: false, bio: "", specialisms: [] }, impact: { ...PROFILE.impact, sessionsDone: 0, sessionsBooked: 0, activeMentorships: 0 } };
const PATH = "/api/v1/shared/expert/profile";

describe("the expert's profile", () => {
  it("loads, then shows the standing, the impact, the checklist and the words", async () => {
    const gate = gated();
    await mountStaff(<ExpertProfile />, "EXPERT", { [`GET ${PATH}`]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PROFILE));
    await screen.findByText("Listed");
    expect(screen.getByText("Verified")).toBeTruthy();
    expect(screen.getByText("Schools can find you and book your times.")).toBeTruthy();
    expect(screen.getByLabelText("Sessions held: 4")).toBeTruthy();
    expect(screen.getByLabelText("Booked ahead: 2")).toBeTruthy();
    expect(screen.getByLabelText("Schools: 3")).toBeTruthy();
    expect(screen.getByLabelText("Mentees: 1/3")).toBeTruthy();
    expect(screen.getByText(/^Write a short bio/)).toBeTruthy();
    expect(screen.getByLabelText("Headline")).toHaveDisplayValue("ZZ Careers adviser");
    expect(screen.getByLabelText("About you")).toHaveDisplayValue("ZZ Fifteen years in engineering.");
    expect(screen.getByLabelText("Where you work")).toHaveDisplayValue("ZZ Works");
    expect(screen.getByLabelText("Your timezone")).toHaveDisplayValue("Asia/Kolkata");
    expect(screen.getByRole("button", { name: "Remove Olympiad maths" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Workshops and sessions" })).toBeTruthy();
    // A sessions-only expert is not asked how many mentees they take.
    expect(screen.queryByLabelText("How many children at once?")).toBeNull();
  });

  it("not listed yet reads as such, and nothing yet hides the impact card", async () => {
    await mountStaff(<ExpertProfile />, "EXPERT", { [`GET ${PATH}`]: () => json(UNLISTED) });
    expect(await screen.findByText("Not listed yet")).toBeTruthy();
    expect(screen.getByText(/^Nobody can see you yet\./)).toBeTruthy();
    expect(screen.queryByText("Verified")).toBeNull();
    expect(screen.queryByText("Your impact")).toBeNull();
  });

  it("saves the profile with the body the contract takes: a tag removed, one added, mentoring with a cap", async () => {
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { [`GET ${PATH}`]: () => json(PROFILE), [`POST ${PATH}`]: () => json({ ok: true }) });
    await fireEvent.changeText(await screen.findByLabelText("Headline"), "ZZ Careers adviser, 15 years");
    await fireEvent.press(screen.getByRole("button", { name: "Remove Careers" }));
    await fireEvent.changeText(screen.getByLabelText("Add a specialism"), "Robotics");
    await fireEvent.press(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("button", { name: "Remove Robotics" })).toBeTruthy();
    expect(screen.getByLabelText("Add a specialism")).toHaveDisplayValue("");
    await fireEvent.press(screen.getByRole("radio", { name: "Both" }));
    await fireEvent.changeText(screen.getByLabelText("How many children at once?"), "5");
    await fireEvent.press(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByText("Profile saved");
    const post = calls().find((c) => c.line === `POST ${PATH}`)!;
    expect(expertSaveProfileSchema.parse(post.body)).toEqual({
      headline: "ZZ Careers adviser, 15 years",
      bio: "ZZ Fifteen years in engineering.",
      organisation: "ZZ Works",
      specialisms: ["Olympiad maths", "Robotics"],
      timezone: "Asia/Kolkata",
      offering: "BOTH",
      mentorCapacity: 5,
    });
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`)).toHaveLength(2));
  });

  it("a blank timezone is caught before the server is asked", async () => {
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { [`GET ${PATH}`]: () => json(PROFILE) });
    await fireEvent.changeText(await screen.findByLabelText("Your timezone"), "  ");
    await fireEvent.press(screen.getByRole("button", { name: "Save profile" }));
    expect(screen.getByText("Some of this needs another look.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(0);
  });

  it("a refused save is an alert with a retry", async () => {
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { [`GET ${PATH}`]: () => json(PROFILE), [`POST ${PATH}`]: refused("ZZ that headline is taken", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Save profile" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ that headline is taken");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${PATH}`)).toHaveLength(2));
  });

  it("a refused page is an alert with a retry", async () => {
    const { calls } = await mountStaff(<ExpertProfile />, "EXPERT", { [`GET ${PATH}`]: refused("ZZ no profile", 404) });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ no profile");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${PATH}`).length).toBe(2));
  });
});
