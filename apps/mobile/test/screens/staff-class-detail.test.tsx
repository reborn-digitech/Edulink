import { Linking } from "react-native";
import { fireEvent, screen } from "@testing-library/react-native";
import { StaffClassDetail } from "@/screens/staff/class-detail";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

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
    expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance/history?classId=c1")).toBe(true);
  });

  it("for an admin: who marks the attendance, who is in it, and the staffing page on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(<StaffClassDetail classId="c1" />, "ADMIN", { "GET /api/v1/admin/attendance/history": () => json(HISTORY), "GET /api/v1/admin/classes": () => json(STAFFING) });
    await screen.findByText("ZZ Teacher");
    expect(screen.getByText("Who is in this class")).toBeTruthy();
    expect(screen.getByText("3 on the roll · In alphabetical order · 2026-09")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Class staffing" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/classes/c1`);
    await fireEvent.press(screen.getByRole("button", { name: "Past attendance" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/attendance/history?classId=c1`);
    open.mockRestore();
  });

  it("a class nobody is on says so", async () => {
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
