import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { saveProfileSchema, staffProfileSchema } from "@edulink/contracts";
import { TeacherProfile } from "@/screens/teacher/profile";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PROFILE = staffProfileSchema.parse({
  schoolName: "ZZ School",
  title: "Senior teacher",
  classes: [{ id: ID.class1, name: "ZZ 5A" }],
  pupilsTaught: 24,
  sinceYear: 2019,
  subjects: ["Maths", "Science"],
  user: { name: "ZZ Teacher", preferredName: "ZZ T", bio: "ZZ bio", avatarKey: null, email: "t@zz.test", birthdate: "1988-04-02", birthdateEditable: true },
  reviews: { responseCount: 12, byQuestion: { CLARITY: 4.5, SUPPORT: 4.2 }, overall: 4.3 },
  record: { staffNumber: "ZZ-17", designation: "PGT", qualification: "M.Sc.", joinedOnKey: "2019-06-01", leaveDaysPerYear: 12, birthdateKey: "1988-04-02", serviceJoinedOnKey: "2015-06-15" },
  balance: { entitlement: 12, used: 3, pending: 1, remaining: 9, yearName: "2026-27" },
});

describe("the teacher's profile", () => {
  it("loads, then shows the figures, the record, the leave, the subjects and the ratings", async () => {
    const gate = gated();
    await mountStaff(<TeacherProfile />, "TEACHER", { "GET /api/v1/staff/profile": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PROFILE));
    await screen.findByText("ZZ-17");
    expect(screen.getByText("ZZ School · Senior teacher · ZZ 5A")).toBeTruthy();
    expect(screen.getByLabelText("Classes: 1")).toBeTruthy();
    expect(screen.getByLabelText("Pupils: 24")).toBeTruthy();
    expect(screen.getByLabelText("Since: 2019")).toBeTruthy();
    expect(screen.getByText("PGT")).toBeTruthy();
    expect(screen.getByText("M.Sc.")).toBeTruthy();
    // The DCF's two dates beside the day they joined this school.
    expect(screen.getByText("Joined the school on")).toBeTruthy();
    expect(screen.getByText(/^(1 Jun 2019|Jun 1, 2019)$/)).toBeTruthy();
    // "Date of birth" is the editable field above and the office's record row below.
    expect(screen.getAllByText("Date of birth")).toHaveLength(2);
    expect(screen.getByText(/^(2 Apr 1988|Apr 2, 1988)$/)).toBeTruthy();
    expect(screen.getByText("Joined service on")).toBeTruthy();
    expect(screen.getByText(/^(15 Jun 2015|Jun 15, 2015)$/)).toBeTruthy();
    expect(screen.getByText("3 of 12 days used · 9 left")).toBeTruthy();
    expect(screen.getByText("1 more being asked for")).toBeTruthy();
    expect(screen.getByText("Maths")).toBeTruthy();
    expect(screen.getByText("4.3")).toBeTruthy();
    expect(screen.getByText("12 answers so far")).toBeTruthy();
    expect(screen.getByText("Explains things clearly")).toBeTruthy();
    expect(screen.getByText("4.5")).toBeTruthy();
    expect(screen.getByText("Is fair to everyone")).toBeTruthy();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    expect(screen.getByLabelText("What should we call you?")).toHaveDisplayValue("ZZ T");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("saves the name and the line about you with the body the contract takes; the avatar picker is the app's own", async () => {
    const { calls } = await mountStaff(<TeacherProfile />, "TEACHER", {
      "GET /api/v1/staff/profile": () => json(PROFILE),
      "POST /api/v1/staff/profile": () => json({ ok: true }),
    });
    await screen.findByText("ZZ-17");
    await fireEvent.changeText(screen.getByLabelText("What should we call you?"), "ZZ Tee");
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await screen.findByText("Saved");
    const post = calls().find((c) => c.line === "POST /api/v1/staff/profile")!;
    expect(saveProfileSchema.parse(post.body)).toEqual({ preferredName: "ZZ Tee", bio: "ZZ bio", avatarKey: "preset:fox-sunset", birthdate: "1988-04-02" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/profile")).toHaveLength(2));
    expect(screen.getByRole("image", { name: PROFILE.user.name })).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Change my look" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/avatar");
  });

  it("nothing on file, no subjects, no ratings, a locked birthdate: each says so", async () => {
    await mountStaff(<TeacherProfile />, "TEACHER", {
      "GET /api/v1/staff/profile": () =>
        json({ ...PROFILE, title: null, classes: [], subjects: [], record: null, reviews: { responseCount: 0, byQuestion: {}, overall: null }, user: { ...PROFILE.user, birthdate: null, birthdateEditable: false }, balance: { entitlement: null, used: 2, pending: 0, remaining: null, yearName: null } }),
    });
    await screen.findByText("Nothing on file yet — the office fills this in.");
    expect(screen.getByText("ZZ School")).toBeTruthy();
    expect(screen.getByText("No subjects recorded yet.")).toBeTruthy();
    expect(screen.getByText("No ratings yet")).toBeTruthy();
    expect(screen.getByText("Not on file — ask the school office.")).toBeTruthy();
    expect(screen.getByText("No entitlement set — 2 days approved this year")).toBeTruthy();
    expect(screen.queryByLabelText("Date of birth")).toBeNull();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherProfile />, "TEACHER", { "GET /api/v1/staff/profile": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/profile").length).toBe(2));
  });
});
