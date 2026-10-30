import { Share } from "react-native";
import { screen, waitFor } from "@testing-library/react-native";
import { classWeightsSchema, staffClassDetailSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { TeacherClassDetail } from "@/screens/teacher/class-detail";
import { callsTo, fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const DETAIL = staffClassDetailSchema.parse({
  class: { id: ID.class1, name: "ZZ 5A", subject: "Maths", gradeLevel: "5", room: "Room 3", color: null, joinCode: "ZZ-CODE", archived: false },
  today: { dateKey: "2026-09-07", registerTakenAt: null, recordsToday: 0 },
  roster: [
    { membershipId: ID.pupil1, name: "ZZ Asha", fullName: "ZZ Asha Rao", avatarKey: null, percent: 96.4, absences: 1, hasGuardian: true },
    { membershipId: ID.pupil2, name: "ZZ Bhavesh", fullName: "ZZ Bhavesh Patil", avatarKey: null, percent: 82, absences: 5, hasGuardian: false },
  ],
  ofConcern: 1,
  withoutGuardian: 1,
  toGrade: 3,
  recentAssignments: [
    { id: "a1", title: "ZZ Fractions sheet", dueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(), publishedAt: new Date().toISOString(), graded: 1 },
    { id: "a2", title: "ZZ Draft quiz", dueAt: null, publishedAt: null, graded: 0 },
  ],
  weights: [],
  categoriesInUse: ["Homework"],
});
const PATH = `/api/v1/staff/classes/${ID.class1}`;
const page = () => (
  <ToastProvider>
    <TeacherClassDetail />
  </ToastProvider>
);

beforeEach(() => {
  resetOutbox();
  mockRouter.push.mockReset();
  mockRouter.params = { classId: ID.class1 };
});

describe("one class", () => {
  it("loads the class named in the URL, with today's register, the code, the roster and the recent work", async () => {
    const fetch = fakeApi({ [PATH]: () => json(DETAIL) });
    await renderTeacher(page());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("2 on the roll · Maths · 5 · Room 3");
    expect(callsTo(fetch, PATH)).toHaveLength(1);
    expect(screen.getByLabelText("Attendance today: To do")).toBeTruthy();
    expect(screen.getByLabelText("To mark: 3")).toBeTruthy();
    expect(screen.getByLabelText("Attendance concern: 1")).toBeTruthy();
    expect(screen.getByText("ZZ-CODE")).toBeTruthy();
    expect(screen.getByText("96%")).toBeTruthy();
    expect(screen.getByText("82% · Below 90% in 28 days")).toBeTruthy();
    expect(screen.getByText("Absent: 5")).toBeTruthy();
    expect(screen.getAllByText("No guardian").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("ZZ Fractions sheet")).toBeTruthy();
    expect(screen.getByText("Due in 3 days · 1 of 2 marked")).toBeTruthy();
    expect(screen.getByText("Draft · 0 of 2 marked")).toBeTruthy();
  });

  it("the register, the marks grid, the report cards, the syllabus, setting work, a piece of work and a pupil's family each open on the phone", async () => {
    fakeApi({ [PATH]: () => json(DETAIL) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Mark the attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/attendance", params: { classId: ID.class1 } });
    await tap(screen.getByRole("button", { name: "Enter exam marks" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/marks", params: { classId: ID.class1 } });
    await tap(screen.getByRole("button", { name: "Report cards" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/report-cards", params: { classId: ID.class1 } });
    await tap(screen.getByRole("button", { name: "Syllabus" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/syllabus", params: { classId: ID.class1 } });
    await tap(screen.getByRole("button", { name: "Set work" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/assignments", params: { classId: ID.class1, compose: "1" } });
    await tap(screen.getByRole("button", { name: /^ZZ Fractions sheet/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/assignment", params: { assignmentId: "a1" } });
    await tap(screen.getByRole("button", { name: "Message ZZ Asha’s guardians" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/remark-new", params: { membershipId: ID.pupil1 } });
    await tap(screen.getByRole("button", { name: "Health card: ZZ Bhavesh" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/pupil-health", params: { membershipId: ID.pupil2 } });
    await tap(screen.getByRole("button", { name: "Record an incident for ZZ Asha" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/incident-new", params: { membershipId: ID.pupil1, name: "ZZ Asha" } });
  });

  it("a class the timetable alone sends the teacher to: their subjects said, set work offered, no register, report cards, code or weights (owner's item 1)", async () => {
    fakeApi({ [PATH]: () => json({ ...DETAIL, class: { ...DETAIL.class, joinCode: null }, formTeacher: false, subjects: ["English"] }) });
    await renderTeacher(page());
    await screen.findByText("2 on the roll · Maths · 5 · Room 3");
    expect(screen.getByText(/^You take this class for English on the timetable\./)).toBeTruthy();
    expect(screen.queryByLabelText("Attendance today: To do")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark the attendance" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Report cards" })).toBeNull();
    expect(screen.queryByText("ZZ-CODE")).toBeNull();
    // The health card stays the class's own teachers' (coordinator's follow-up to decision 3).
    expect(screen.queryByRole("button", { name: /^Health card/ })).toBeNull();
    expect(screen.getByLabelText("To mark: 3")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Set work" }).length).toBeGreaterThanOrEqual(1);
  });

  it("a timetable-only class with nobody on it offers no code to share: the server sends none (qb-B, QB-02)", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
    fakeApi({ [PATH]: () => json({ ...DETAIL, class: { ...DETAIL.class, joinCode: null }, formTeacher: false, subjects: ["English"], roster: [], recentAssignments: [] }) });
    await renderTeacher(page());
    expect(await screen.findByText("Nobody has joined yet")).toBeTruthy();
    expect(screen.queryByText("Share the class code above and students can add themselves.")).toBeNull();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
    expect(share).not.toHaveBeenCalled();
    share.mockRestore();
  });

  it("the figures about pupils filter the roster", async () => {
    fakeApi({ [PATH]: () => json(DETAIL) });
    await renderTeacher(page());
    await tap(await screen.findByRole("radio", { name: "No guardian · 1" }));
    expect(screen.queryByText("ZZ Asha")).toBeNull();
    expect(screen.getByText("ZZ Bhavesh")).toBeTruthy();
    await tap(screen.getByRole("radio", { name: "Attendance concern · 1" }));
    expect(screen.getByText("ZZ Bhavesh")).toBeTruthy();
    await tap(screen.getByRole("radio", { name: "All · 2" }));
    expect(screen.getByText("ZZ Asha")).toBeTruthy();
  });

  it("the class code is shared from the phone; an empty roster says so and its door is the same share", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" });
    fakeApi({ [PATH]: () => json({ ...DETAIL, today: { ...DETAIL.today, registerTakenAt: new Date().toISOString() }, roster: [], recentAssignments: [] }) });
    await renderTeacher(page());
    await screen.findByRole("button", { name: "Edit today's attendance" });
    expect(screen.getByText("Nobody has joined yet")).toBeTruthy();
    expect(screen.getByText("Share the class code above and students can add themselves.")).toBeTruthy();
    const buttons = screen.getAllByRole("button", { name: "Share" });
    expect(buttons).toHaveLength(2);
    await tap(buttons[1]!);
    expect(share).toHaveBeenCalledWith({ message: expect.stringContaining("ZZ-CODE") });
    share.mockRestore();
    expect(screen.getByText("Nothing set yet for this class.")).toBeTruthy();
  });

  it("grade weights must add to 100 before they save, and save as the contract takes them", async () => {
    const fetch = fakeApi({ [PATH]: () => json(DETAIL), [`${PATH}/weights`]: () => json({ ok: true }) });
    await renderTeacher(page());
    expect(await screen.findByText("No weighting")).toBeTruthy();
    await tap(screen.getByRole("button", { name: "Add a category" }));
    await typeInto(screen.getByLabelText("Category 1 name"), "Homework");
    await typeInto(screen.getByLabelText("Category 1 weight, percent"), "60");
    expect(screen.getByText("Total 60% — must be 100%")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save weights" })).toBeDisabled();
    await tap(screen.getByRole("button", { name: "Add a category" }));
    await typeInto(screen.getByLabelText("Category 2 name"), "Classwork");
    await typeInto(screen.getByLabelText("Category 2 weight, percent"), "40");
    expect(screen.getByText("Total 100%")).toBeTruthy();
    await tap(screen.getByRole("button", { name: "Save weights" }));
    expect(await screen.findByText("Weights saved.")).toBeTruthy();
    const [call] = callsTo(fetch, `${PATH}/weights`);
    expect(call!.method).toBe("POST");
    expect(classWeightsSchema.parse(call!.body)).toEqual({ rows: [{ name: "Homework", percent: 60 }, { name: "Classwork", percent: 40 }] });
    await tap(screen.getByRole("button", { name: "Remove category 2" }));
    expect(screen.queryByLabelText("Category 2 name")).toBeNull();
  });

  it("a refused save of the weights is an alert with a retry", async () => {
    const fetch = fakeApi({ [PATH]: () => json({ ...DETAIL, weights: [{ id: "w1", name: "Homework", weightBps: 10_000, position: 0 }] }), [`${PATH}/weights`]: () => refusal("ZZ weights locked", 422) });
    await renderTeacher(page());
    await tap(await screen.findByRole("button", { name: "Save weights" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ weights locked");
    await tap(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(callsTo(fetch, `${PATH}/weights`)).toHaveLength(2));
  });

  it("without a class id it says so", async () => {
    mockRouter.params = {};
    fakeApi({});
    await renderTeacher(page());
    expect(screen.getByRole("alert")).toHaveTextContent("That class could not be found");
  });

  it("a refusal is an alert with a retry", async () => {
    fakeApi({ [PATH]: () => refusal("ZZ not yours", 503) });
    await renderTeacher(page());
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not yours");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
