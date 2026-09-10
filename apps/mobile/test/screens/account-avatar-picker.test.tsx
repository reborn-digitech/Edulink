import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { familyStudentProfileSaveSchema, familyStudentProfileSchema, saveProfileSchema, staffProfileSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { AvatarPicker } from "@/screens/shared/avatar-picker";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const PUPIL = familyStudentProfileSchema.parse({
  name: "ZZ Pupil Full",
  preferredName: "ZZ Ash",
  bio: "ZZ drums",
  avatarKey: "preset:fox-sunset",
  birthdate: null,
  birthdateEditable: false,
  handle: null,
  studentCode: null,
  schoolName: "ZZ School",
  className: null,
  previousSchools: [],
  practice: { topicsPractised: 0, topicsCompleted: 0 },
  competitions: [],
  badges: [],
});
const TEACHER = staffProfileSchema.parse({
  schoolName: "ZZ School",
  title: null,
  classes: [],
  pupilsTaught: 0,
  sinceYear: 2020,
  subjects: [],
  user: { name: "ZZ Teacher", preferredName: null, bio: null, avatarKey: null, email: null, birthdate: null, birthdateEditable: false },
  reviews: { responseCount: 0, byQuestion: {}, overall: null },
  record: null,
  balance: { entitlement: null, used: 0, pending: 0, remaining: null, yearName: null },
});
const STUDENT_PATH = "/api/v1/family/student/profile";

const mount = (role: RoleCode, answers: Answers) =>
  mountStaff(
    <ToastProvider>
      <AvatarPicker />
    </ToastProvider>,
    role,
    answers,
  );

describe("the avatar picker", () => {
  it("loads, then a pupil's current look is chosen; another is saved with the rest of their profile", async () => {
    const gate = gated();
    const { calls } = await mount("STUDENT", { [`GET ${STUDENT_PATH}`]: gate.answer, [`POST ${STUDENT_PATH}`]: () => json({ ok: true }) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PUPIL));
    expect(await screen.findByRole("radio", { name: "Sunset fox" })).toBeChecked();
    expect(screen.getAllByRole("radio")).toHaveLength(72);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "Mint cat" }));
    expect(screen.getByRole("radio", { name: "Mint cat" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Sunset fox" })).not.toBeChecked();
    expect(screen.getByText("Mint cat")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved")).toBeTruthy();
    const body = calls().find((c) => c.line === `POST ${STUDENT_PATH}`)?.body;
    expect(familyStudentProfileSaveSchema.parse(body)).toEqual({ preferredName: "ZZ Ash", bio: "ZZ drums", avatarKey: "preset:cat-mint" });
    // The shell draws the avatar from /me, so the person is read again.
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/me").length).toBeGreaterThanOrEqual(2));
  });

  it("a teacher's look is saved through the teacher's profile, their words unchanged", async () => {
    const { calls } = await mount("TEACHER", { "GET /api/v1/staff/profile": () => json(TEACHER), "POST /api/v1/staff/profile": () => json({ ok: true }) });
    const owl = await screen.findByRole("radio", { name: "Sky owl" });
    expect(owl).not.toBeChecked();
    await fireEvent.press(owl);
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(saveProfileSchema.parse(calls().find((c) => c.line === "POST /api/v1/staff/profile")?.body)).toEqual({ preferredName: "", bio: "", avatarKey: "preset:owl-sky" });
  });

  it("anyone else (an expert) saves through the account; a refusal is said in the server's words", async () => {
    let tries = 0;
    const { calls } = await mount("EXPERT", { "POST /api/v1/account/avatar": () => (++tries === 1 ? json({ error: "ZZ Not one of the drawings.", code: "BAD_REQUEST" }, 422) : json({ ok: true })) });
    await fireEvent.press(await screen.findByRole("radio", { name: "Berry penguin" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("ZZ Not one of the drawings.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/account/avatar").map((c) => c.body)).toEqual([{ avatarKey: "preset:penguin-berry" }, { avatarKey: "preset:penguin-berry" }]);
  });

  it("a refused profile is an alert with a retry", async () => {
    const { calls } = await mount("STUDENT", { [`GET ${STUDENT_PATH}`]: refused("ZZ Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `GET ${STUDENT_PATH}`).length).toBe(2));
  });
});
