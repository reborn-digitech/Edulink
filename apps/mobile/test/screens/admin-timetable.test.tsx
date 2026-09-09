import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffTimetable } from "@/screens/staff/timetable";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's doors go into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASSES = [
  { id: "c1", name: "ZZ Class A", gradeLevel: "6", section: "A", room: "12" },
  { id: "c2", name: "ZZ Class B", gradeLevel: "6", section: "B", room: null },
];
const GRID = {
  periods: [
    { id: "p1", name: "Period 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1, archivedAt: null },
    { id: "p2", name: "Break", startMinute: 585, endMinute: 600, kind: "BREAK", position: 2, archivedAt: null },
    { id: "p3", name: "Period 2", startMinute: 600, endMinute: 645, kind: "LESSON", position: 3, archivedAt: null },
  ],
  days: [
    { weekday: 1, dateKey: "2026-09-07", closed: false, closedName: null, isToday: false },
    { weekday: 2, dateKey: "2026-09-08", closed: true, closedName: "ZZ Holiday", isToday: true },
  ],
  slots: [
    { id: "s1", classId: "c1", className: "ZZ Class A", periodId: "p1", weekday: 1, subject: "ZZ Maths", room: "Lab", teacherMembershipId: "m2", teacherName: "ZZ Teacher", coveringMembershipId: null, coveringName: null, uncovered: true, borrowed: false },
    { id: "s2", classId: "c1", className: "ZZ Class A", periodId: "p3", weekday: 1, subject: "ZZ Hindi", room: null, teacherMembershipId: "m3", teacherName: "ZZ Away", coveringMembershipId: "m4", coveringName: "ZZ Cover", uncovered: false, borrowed: false },
  ],
};
const WEEK = { weekOf: "2026-09-07", today: "2026-09-08", isThisWeek: true, classes: CLASSES, selectedClassId: "c1", grid: GRID, gaps: 1, unstaffed: 0 };

describe("class timetables", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows the week with the gap counted, the class chips and the days", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffTimetable />, "PRINCIPAL", { "GET /api/v1/staff/principal/timetable": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(WEEK));
    await screen.findByText("ZZ Maths");
    expect(screen.getByLabelText("Arrange cover: 1")).toBeTruthy();
    expect(screen.getByText("1 lesson has a teacher on leave and no cover this week.")).toBeTruthy();
    expect(screen.getByText("ZZ Teacher is away · no cover arranged")).toBeTruthy();
    expect(screen.getByText("ZZ Cover covering for ZZ Away")).toBeTruthy();
    expect(screen.getByText(/^Week of /)).toBeTruthy();
    expect(screen.getByText("Every lesson has a teacher assigned.")).toBeTruthy();
    expect(screen.getByText(/ · today · ZZ Holiday$/)).toBeTruthy();
    expect(screen.getByText("School is shut.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Class A" })).toBeChecked();
    expect(screen.queryByRole("button", { name: "Open the timetable" })).toBeNull();
    expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/timetable")).toBe(true);
    // The door out of a gap is the leave desk.
    await fireEvent.press(screen.getByRole("button", { name: "Arrange cover" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/leave");
  });

  it("another class and another week ask the API; an admin's editor is the web's", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mountStaff(<StaffTimetable />, "ADMIN", { "GET /api/v1/staff/principal/timetable": () => json(WEEK) });
    await screen.findByText("ZZ Maths");
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Class B" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/timetable?classId=c2")).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Next →" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/timetable?classId=c2&week=2026-09-14")).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Open the timetable" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/admin/timetable`);
    open.mockRestore();
  });

  it("no classes, no school day, nothing timetabled: each says so, with a door", async () => {
    await mountStaff(<StaffTimetable />, "PRINCIPAL", { "GET /api/v1/staff/principal/timetable": () => json({ ...WEEK, classes: [], selectedClassId: null, grid: null, gaps: 0, unstaffed: 0 }) });
    expect(await screen.findByText("No classes yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a week with nothing on it offers the next week", async () => {
    const { calls } = await mountStaff(<StaffTimetable />, "PRINCIPAL", { "GET /api/v1/staff/principal/timetable": () => json({ ...WEEK, grid: { ...GRID, slots: [] }, gaps: 0 }) });
    expect(await screen.findByText("Nothing timetabled yet")).toBeTruthy();
    await fireEvent.press(screen.getAllByRole("button", { name: "Next →" })[1]!);
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/timetable?week=2026-09-14")).toBe(true));
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffTimetable />, "PRINCIPAL", { "GET /api/v1/staff/principal/timetable": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/principal/timetable")).length).toBe(2));
  });
});
