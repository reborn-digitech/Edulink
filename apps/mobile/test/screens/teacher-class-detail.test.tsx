import { screen } from "@testing-library/react-native";
import { staffClassDetailSchema } from "@edulink/contracts";
import { TeacherClassDetail } from "@/screens/teacher/class-detail";
import { callsTo, fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap } from "./teacher-support";

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
  categoriesInUse: [],
});

beforeEach(() => {
  resetOutbox();
  mockRouter.push.mockReset();
  mockRouter.params = { classId: ID.class1 };
});

describe("one class", () => {
  it("loads the class named in the URL, with today's register, the roster and the recent work", async () => {
    const fetch = fakeApi({ [`/api/v1/staff/classes/${ID.class1}`]: () => json(DETAIL) });
    await renderTeacher(<TeacherClassDetail />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("Maths · 5 · Room 3");
    expect(callsTo(fetch, `/api/v1/staff/classes/${ID.class1}`)).toHaveLength(1);
    expect(screen.getByLabelText("Attendance today: To do")).toBeTruthy();
    expect(screen.getByLabelText("To mark: 3")).toBeTruthy();
    expect(screen.getByLabelText("Attendance concern: 1")).toBeTruthy();
    expect(screen.getByText("96%")).toBeTruthy();
    expect(screen.getByText("82% · Below 90% in 28 days")).toBeTruthy();
    expect(screen.getByText("Absent: 5")).toBeTruthy();
    expect(screen.getAllByText("No guardian").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("ZZ Fractions sheet")).toBeTruthy();
    expect(screen.getByText("Due in 3 days")).toBeTruthy();
    expect(screen.getByText("Draft")).toBeTruthy();
  });

  it("the register button opens today's register for this class; the marks button the grid", async () => {
    fakeApi({ [`/api/v1/staff/classes/${ID.class1}`]: () => json(DETAIL) });
    await renderTeacher(<TeacherClassDetail />);
    await tap(await screen.findByRole("button", { name: "Mark the attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/attendance", params: { classId: ID.class1 } });
    await tap(screen.getByRole("button", { name: "Enter exam marks" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/marks", params: { classId: ID.class1 } });
  });

  it("a register already taken offers to edit it; an empty roster and no work say so", async () => {
    fakeApi({ [`/api/v1/staff/classes/${ID.class1}`]: () => json({ ...DETAIL, today: { ...DETAIL.today, registerTakenAt: new Date().toISOString() }, roster: [], recentAssignments: [] }) });
    await renderTeacher(<TeacherClassDetail />);
    await screen.findByRole("button", { name: "Edit today's attendance" });
    expect(screen.getByText("Nobody has joined yet")).toBeTruthy();
    expect(screen.getByText("Nothing set yet for this class.")).toBeTruthy();
  });

  it("without a class id it says so", async () => {
    mockRouter.params = {};
    fakeApi({});
    await renderTeacher(<TeacherClassDetail />);
    expect(screen.getByRole("alert")).toHaveTextContent("That class could not be found");
  });

  it("a refusal is an alert with a retry", async () => {
    fakeApi({ [`/api/v1/staff/classes/${ID.class1}`]: () => refusal("ZZ not yours", 403) });
    await renderTeacher(<TeacherClassDetail />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not yours");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
