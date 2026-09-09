import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { staffTimetableSchema } from "@edulink/contracts";
import { TeacherTimetable, addDaysToKey, dayOrder } from "@/screens/teacher/timetable";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { ID } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const slot = (over: Record<string, unknown>) => ({
  id: "s0",
  classId: ID.class1,
  className: "ZZ 5A",
  periodId: "p1",
  weekday: 2,
  subject: "ZZ Maths",
  room: "Room 4",
  teacherMembershipId: "m1",
  teacherName: "ZZ Teacher",
  coveringMembershipId: null,
  coveringName: null,
  uncovered: false,
  borrowed: false,
  ...over,
});

const WEEK = staffTimetableSchema.parse({
  weekOf: "2026-09-07",
  today: "2026-09-08",
  isThisWeek: true,
  grid: {
    periods: [
      { id: "p1", name: "Period 1", startMinute: 540, endMinute: 580, kind: "LESSON", position: 1 },
      { id: "b1", name: "Break", startMinute: 580, endMinute: 600, kind: "BREAK", position: 2 },
      { id: "p2", name: "Period 2", startMinute: 600, endMinute: 640, kind: "LESSON", position: 3 },
    ],
    days: [
      { weekday: 1, dateKey: "2026-09-07", closed: false, closedName: null, isToday: false },
      { weekday: 2, dateKey: "2026-09-08", closed: false, closedName: null, isToday: true },
      { weekday: 3, dateKey: "2026-09-09", closed: true, closedName: "ZZ Holiday", isToday: false },
    ],
    slots: [
      slot({ id: "s1" }),
      slot({ id: "s2", classId: ID.class2, className: "ZZ 6B", periodId: "p2", subject: "ZZ Science", room: null, teacherMembershipId: "m9", teacherName: "ZZ Other", coveringMembershipId: "m1", coveringName: "ZZ Teacher", borrowed: true }),
      slot({ id: "s3", weekday: 1, subject: "ZZ English", room: "Room 1", coveringMembershipId: "m9", coveringName: "ZZ Cover" }),
      slot({ id: "s4", weekday: 1, periodId: "p2", subject: "ZZ Art", uncovered: true }),
    ],
  },
});

beforeEach(() => mockRouter.push.mockClear());

describe("the teacher's timetable", () => {
  it("moves a day key on the calendar and puts today first", () => {
    expect(addDaysToKey("2026-09-07", 7)).toBe("2026-09-14");
    expect(addDaysToKey("2026-09-07", -7)).toBe("2026-08-31");
    expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysToKey("nope", 1)).toBe("nope");
    expect(dayOrder(WEEK.grid.days).map((d) => d.weekday)).toEqual([2, 3, 1]);
  });

  it("loads, then shows today's lessons in period order with time, room and cover; another day on its chip", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<TeacherTimetable />, "TEACHER", { "GET /api/v1/staff/timetable": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(WEEK));
    await screen.findByText("ZZ Maths · ZZ 5A");
    expect(screen.getByText("Period 1 · 09:00–09:40 · Room 4")).toBeTruthy();
    expect(screen.getByText("ZZ Science · ZZ 6B")).toBeTruthy();
    // The word once on the borrowed lesson and once as the figure's caption.
    expect(screen.getAllByText("Covering")).toHaveLength(2);
    expect(screen.queryByText("ZZ English · ZZ 5A")).toBeNull();
    expect(screen.getByLabelText("Across the week: 4")).toBeTruthy();
    expect(screen.getByLabelText("Covering: 1")).toBeTruthy();
    expect(screen.getByRole("radio", { name: /^Tuesday .* · today$/ })).toBeChecked();
    await fireEvent.press(screen.getByRole("radio", { name: /^Monday/ }));
    expect(await screen.findByText("ZZ English · ZZ 5A")).toBeTruthy();
    expect(screen.getByText("ZZ Cover covering")).toBeTruthy();
    expect(screen.getByText("Teacher away · no cover arranged")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: /^Wednesday/ }));
    expect(await screen.findByText("ZZ Holiday")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Next →" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/timetable?week=2026-09-14")).toBe(true));
  });

  it("no school day set up, and nothing timetabled for you: each has a door", async () => {
    await mountStaff(<TeacherTimetable />, "TEACHER", { "GET /api/v1/staff/timetable": () => json({ ...WEEK, grid: { ...WEEK.grid, periods: [], slots: [] } }) });
    await screen.findByText("No timetable yet");
    await fireEvent.press(screen.getByRole("button", { name: "Today" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");

    const { calls } = await mountStaff(<TeacherTimetable />, "TEACHER", { "GET /api/v1/staff/timetable": () => json({ ...WEEK, grid: { ...WEEK.grid, slots: [] } }) });
    await screen.findByText("Nothing timetabled for you");
    await fireEvent.press(screen.getAllByRole("button", { name: "Next →" })[1]!);
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/timetable?week=2026-09-14")).toBe(true));
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<TeacherTimetable />, "TEACHER", { "GET /api/v1/staff/timetable": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/timetable")).length).toBe(2));
  });
});
