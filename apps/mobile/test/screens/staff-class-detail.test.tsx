import { fireEvent, screen } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffClassDetail } from "@/screens/staff/class-detail";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASS = { id: "c1", name: "ZZ Class A", color: null, archived: false };
const pupil = (membershipId: string, name: string, present: number, absent: number, percent: number | null) => ({ membershipId, name, marks: { "2026-09-01": "PRESENT" }, present, late: 0, absent, excused: 0, percent });
const HISTORY = {
  classes: [CLASS],
  month: "2026-09",
  history: {
    class: CLASS,
    month: "2026-09",
    days: [{ dateKey: "2026-09-01", present: 28, late: 1, absent: 1, excused: 0, percent: 96.7 }],
    pupils: [pupil("p2", "ZZ Pupil Two", 3, 2, 60), pupil("p1", "ZZ Pupil One", 5, 0, 100), pupil("p3", "ZZ Pupil Three", 0, 0, null)],
    percent: 86.7,
  },
};
const INSIGHTS = {
  span: 30,
  window: { fromDateKey: "2026-08-08", toDateKey: "2026-09-07" },
  sort: "name",
  grades: ["6"],
  gradeFilter: null,
  concernPercent: 75,
  classes: [{ classId: "c1", name: "ZZ Class A", section: "A", gradeLevel: "6", pupils: 3, sessionsTaken: 5, attendance: { counts: { PRESENT: 8, LATE: 0, ABSENT: 2, EXCUSED: 0 }, marks: 10, percent: 80 }, progress: { percent: 66, pupilsCounted: 2, pupilsWithNoMarks: 1 }, reportCards: [{ title: "Term 1", published: 2, drafts: 1 }] }],
};
const STAFFING = { classes: [{ id: "c1", name: "ZZ Class A", subject: null, gradeLevel: "6", section: "A", room: "12", color: null, joinCode: "ZZAAAA", archivedAt: null, pupils: 3, teachers: [{ membershipId: "m2", name: "ZZ Teacher", role: "LEAD" }], leaderless: false }], activeCount: 1, archivedCount: 0, leaderlessCount: 0 };
const staffMember = (membershipId: string, name: string, role: string) => ({ membershipId, role, name, preferredName: null, avatarKey: null, subjects: [], staffRecord: null, leadClasses: [], balance: null });
const STAFF = { staff: [staffMember("m2", "ZZ Teacher", "TEACHER"), staffMember("m5", "ZZ New Teacher", "TEACHER"), staffMember("m6", "ZZ Office", "ADMIN")], total: 3, roleCounts: [], subjectOptions: [] };
const asOffice = (answers: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <StaffClassDetail classId="c1" />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/admin/attendance/history": () => json(HISTORY), "GET /api/v1/admin/classes": () => json(STAFFING), ...answers },
  );

beforeEach(() => mockRouter.push.mockClear());

describe("one class for the office", () => {
  it("for a principal: the insight, the report cards, and the roll alphabetically with concerns flagged", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffClassDetail classId="c1" />, "PRINCIPAL", { "GET /api/v1/admin/attendance/history": gate.answer, "GET /api/v1/staff/principal/classes": () => json(INSIGHTS) });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(HISTORY));
    await screen.findByText("ZZ Pupil One");
    expect(screen.getByText("Grade 6 · Section A")).toBeTruthy();
    expect(screen.getByLabelText("Attendance: 80%")).toBeTruthy();
    expect(screen.getByText("Term 1: 2 published, 1 draft")).toBeTruthy();
    expect(screen.getByText("Everybody")).toBeTruthy();
    const names = screen.getAllByText(/^ZZ Pupil/).map((n) => n.props.children);
    expect(names).toEqual(["ZZ Pupil One", "ZZ Pupil Three", "ZZ Pupil Two"]);
    expect(screen.getByText("No attendance marks in this window")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Archive class" })).toBeNull();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance/history?classId=c1")).toBe(true);
  });

  it("for an admin: who marks the attendance, who is in it, and past attendance in the app", async () => {
    await asOffice();
    await screen.findByText("ZZ Teacher");
    expect(screen.getByText("Class teacher")).toBeTruthy();
    expect(screen.getByText("Who is in this class")).toBeTruthy();
    expect(screen.getByText("3 on the roll · In alphabetical order · 2026-09")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Past attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/attendance", params: { view: "history", classId: "c1" } });
  });

  it("the office adds a teacher from the teaching staff, and takes one off after a confirm", async () => {
    const { calls } = await asOffice({ "GET /api/v1/admin/staff": () => json(STAFF), "POST /api/v1/admin/classes/c1/teacher": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a teacher" }));
    expect(await screen.findByRole("radio", { name: "ZZ New Teacher" })).toBeTruthy();
    // Already on the class, and the office itself, are not offered.
    expect(screen.queryByRole("radio", { name: "ZZ Teacher" })).toBeNull();
    expect(screen.queryByRole("radio", { name: "ZZ Office" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ New Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Assign" }));
    expect(await screen.findByText("Class teacher assigned")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/admin/classes/c1/teacher")?.body).toEqual({ teacherMembershipId: "m5", assigned: true });
    await fireEvent.press(screen.getByRole("button", { name: "Take ZZ Teacher off this class" }));
    expect(calls().filter((c) => c.line === "POST /api/v1/admin/classes/c1/teacher").length).toBe(1);
    await fireEvent.press(screen.getByRole("button", { name: "Take ZZ Teacher off this class" }));
    expect(await screen.findByText("ZZ Teacher is no longer on this class")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/admin/classes/c1/teacher")[1]!.body).toEqual({ teacherMembershipId: "m2", assigned: false });
  });

  it("archiving asks first, says who stops seeing the class, then goes back to the classes", async () => {
    const { calls } = await asOffice({ "POST /api/v1/admin/classes/c1/archive": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Archive class" }));
    expect(screen.getByText("Archive ZZ Class A?")).toBeTruthy();
    expect(screen.getByText("3 students will no longer see this class, and no more attendance can be marked for it.")).toBeTruthy();
    expect(calls().some((c) => c.line.endsWith("/archive"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Archive: ZZ Class A" }));
    expect(await screen.findByText("ZZ Class A archived")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/admin/classes/c1/archive")?.body).toEqual({ archived: true });
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a refused assignment is the server's sentence", async () => {
    await asOffice({ "GET /api/v1/admin/staff": () => json(STAFF), "POST /api/v1/admin/classes/c1/teacher": refused("That teacher is not in your school.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a teacher" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ New Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Assign" }));
    expect(await screen.findByText("That teacher is not in your school.")).toBeTruthy();
  });

  it("a class nobody is on says so; the office's door is admitting pupils", async () => {
    await asOffice({ "GET /api/v1/admin/attendance/history": () => json({ classes: [], month: "2026-09", history: null }) });
    expect(await screen.findByText("Nobody on this roll")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Admit pupils from a list" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/intake");
  });

  it("a class nobody is on, for a principal, says so", async () => {
    await mountStaff(<StaffClassDetail classId="c9" />, "PRINCIPAL", { "GET /api/v1/admin/attendance/history": () => json({ classes: [], month: "2026-09", history: null }), "GET /api/v1/staff/principal/classes": () => json(INSIGHTS) });
    expect(await screen.findByText("Nobody on this roll")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffClassDetail classId="c1" />, "ADMIN", { "GET /api/v1/admin/attendance/history": refused("Not now."), "GET /api/v1/admin/classes": () => json(STAFFING) });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await screen.findByRole("alert");
    expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/attendance/history")).length).toBeGreaterThanOrEqual(2);
  });
});
