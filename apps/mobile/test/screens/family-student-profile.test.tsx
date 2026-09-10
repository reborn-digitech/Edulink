import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, ME_STUDENT, mockRouter, pending, refused, renderFamily, press } from "./family-helpers";
import { StudentProfile } from "@/screens/family/student-profile";

const PROFILE = {
  name: "ZZ Pupil Full",
  preferredName: null,
  bio: null,
  avatarKey: null,
  birthdate: "2015-03-04",
  birthdateEditable: false,
  handle: "zz.pupil",
  studentCode: "ZZ-007",
  schoolName: "ZZ School",
  className: "ZZ 5A",
  previousSchools: [{ id: "r1", schoolName: "ZZ Old School", gradeLevel: "4", joinedAt: "2023-06-01T00:00:00.000Z", leftAt: "2025-03-31T00:00:00.000Z", reason: "Moved house", attendancePercent: 92, reportCardCount: 2 }],
  practice: { topicsPractised: 4, topicsCompleted: 1 },
  competitions: [{ id: "ce1", title: "ZZ Maths Olympiad", status: "RESULTS", rank: 3 }],
  badges: [
    { id: "b1", labelKey: "practice.badgeWeek", descriptionKey: "practice.badgeWeekHint", earned: true, icon: "star" },
    { id: "b2", labelKey: "practice.badgeSolid", descriptionKey: "practice.badgeSolidHint", earned: false, progress: { current: 1, target: 3 }, icon: "medal" },
  ],
};
const PATH = "/api/v1/family/student/profile";

describe("the pupil's profile", () => {
  it("is loading while the profile is on its way", async () => {
    await renderFamily(<StudentProfile />, ME_STUDENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows how the pupil looks and what they have done, and saves a preferred name", async () => {
    const { fetch } = await renderFamily(<StudentProfile />, ME_STUDENT, { [PATH]: (init) => (init?.method === "POST" ? { ok: true } : PROFILE) });
    expect(await screen.findByText("ZZ Old School")).toBeTruthy();
    expect(screen.getByText("ZZ School · ZZ 5A")).toBeTruthy();
    expect(screen.getByText("zz.pupil")).toBeTruthy();
    expect(screen.getByText("ZZ-007")).toBeTruthy();
    expect(screen.getByText(/2015 · A grown-up is linked to you/)).toBeTruthy();
    expect(screen.getByText("ZZ Maths Olympiad")).toBeTruthy();
    expect(screen.getByText("Placed 3")).toBeTruthy();
    expect(screen.getByLabelText("Topics tried: 4")).toBeTruthy();
    expect(screen.getByText("Here all week")).toBeTruthy();
    expect(screen.getByText("Badge earned")).toBeTruthy();
    expect(screen.getByText("1 / 3")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("What should we call you?"), "Pip");
    expect(screen.getByText("Unsaved changes")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ preferredName: "Pip", bio: "", avatarKey: "preset:fox-sunset" });
    expect(await screen.findByText("Saved")).toBeTruthy();
  });

  it("a date of birth is sent only while the pupil may still set it, and only when it changed", async () => {
    const { fetch } = await renderFamily(<StudentProfile />, ME_STUDENT, { [PATH]: (init) => (init?.method === "POST" ? { ok: true } : { ...PROFILE, birthdate: null, birthdateEditable: true, avatarKey: "preset:cat-mint" }) });
    await fireEvent.changeText(await screen.findByLabelText("Date of birth"), "4 March");
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Date of birth"), "2015-03-04");
    await press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(calls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ preferredName: "", bio: "", avatarKey: "preset:cat-mint", birthdate: "2015-03-04" });
  });

  it("the avatar is drawn; the picker and practising are the app's own screens", async () => {
    await renderFamily(<StudentProfile />, ME_STUDENT, { [PATH]: () => ({ ...PROFILE, avatarKey: "preset:cat-mint" }) });
    expect(await screen.findByRole("image", { name: "ZZ Pupil Full" })).toBeTruthy();
    await press(screen.getByRole("button", { name: "Change my look" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/avatar");
    await press(screen.getByRole("button", { name: "Keep practising →" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/practice");
  });

  it("a refused save is an alert", async () => {
    await renderFamily(<StudentProfile />, ME_STUDENT, { [PATH]: (init) => (init?.method === "POST" ? refused(422, "ZZ too long")(init, new URL("http://api.test/")) : PROFILE) });
    await fireEvent.changeText(await screen.findByLabelText("A bit about you"), "ZZ drums");
    await press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ too long");
  });

  it("a refusal is an alert with a retry", async () => {
    await renderFamily(<StudentProfile />, ME_STUDENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
