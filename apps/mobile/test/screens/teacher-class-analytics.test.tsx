import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { classAnalyticsSchema } from "@edulink/contracts";
import { ClassAnalytics, analyticsPath } from "@/screens/teacher/class-analytics";
import { json, mountStaff, offline } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASS = "czz0000000000000000cl1";
const PATH = `/api/v1/teaching/classes/${CLASS}/analytics`;

const VIEW = classAnalyticsSchema.parse({
  classId: CLASS,
  className: "ZZ 8A",
  window: "term",
  fromDateKey: "2026-08-01",
  toDateKey: "2026-10-01",
  windowName: "ZZ Term 1",
  pupils: 4,
  attendance: { percent: 87.5, marks: 16, registers: 4, trend: [{ label: "24/09", percent: 100, marks: 8 }, { label: "01/10", percent: 75, marks: 8 }] },
  exams: [
    { seriesId: "s1", name: "ZZ Exam 1", kind: "UNIT_TEST", dateKey: "2026-08-22", marked: 2, averagePercent: 70, distribution: { under33: 0, from33: 0, from50: 1, from75: 1 } },
    { seriesId: "s2", name: "ZZ Exam 2", kind: "MID_TERM", dateKey: "2026-09-26", marked: 4, averagePercent: 60, distribution: { under33: 0, from33: 1, from50: 2, from75: 1 } },
  ],
  work: { assignments: 3, expected: 12, submitted: 6, late: 3, missing: 6, completionPercent: 50 },
  flagged: [
    { membershipId: "p1", name: "ZZ Falling", flags: ["MARKS_FALLING"], attendancePercent: 100, recentPercents: [80, 70, 60], lateHandIns: 0 },
    { membershipId: "p2", name: "ZZ Low", flags: ["ATTENDANCE", "LATE_WORK"], attendancePercent: 50, recentPercents: [], lateHandIns: 3 },
  ],
});

beforeEach(() => {
  mockRouter.push.mockReset();
  mockRouter.params = { classId: CLASS };
});

describe("a class as numbers", () => {
  it("asks for the term window, shows the four numbers, each exam with its spread, the hand-ins and the flagged pupils by name", async () => {
    const { calls } = await mountStaff(<ClassAnalytics />, "TEACHER", { [`GET ${PATH}`]: () => json(VIEW) });
    expect(await screen.findByText("ZZ 8A: the numbers")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${analyticsPath(CLASS, "term")}`)).toBe(true);
    expect(screen.getByText("ZZ Term 1 · Aug 1 – Oct 1")).toBeTruthy();
    expect(screen.getByLabelText("Attendance: 88%")).toBeTruthy();
    expect(screen.getByLabelText("Exams: 2")).toBeTruthy();
    expect(screen.getByLabelText("Work handed in: 50%")).toBeTruthy();
    expect(screen.getByLabelText("Flagged: 2")).toBeTruthy();
    expect(screen.getByText("ZZ Exam 2")).toBeTruthy();
    expect(screen.getByText("Mid-term · Sep 26 · 4 marked")).toBeTruthy();
    expect(screen.getByText("0 under 33 · 1 at 33–49 · 2 at 50–74 · 1 at 75 and over")).toBeTruthy();
    expect(screen.getByLabelText("Late: 3")).toBeTruthy();
    expect(screen.getByLabelText("Missing: 6")).toBeTruthy();
    expect(screen.getByText("ZZ Falling")).toBeTruthy();
    expect(screen.getByText("Marks falling")).toBeTruthy();
    expect(screen.getByText("Attendance 100% · Marks 80% → 70% → 60%")).toBeTruthy();
    expect(screen.getByText("Attendance 50% · 3 late hand-ins")).toBeTruthy();
    expect(screen.getByText("Late work")).toBeTruthy();
  });

  it("the window chip asks for the last thirty days; nobody flagged is an empty state with a door to the register", async () => {
    const { calls } = await mountStaff(<ClassAnalytics />, "TEACHER", {
      [`GET ${PATH}`]: ({ url }) => json(url.searchParams.get("window") === "month" ? { ...VIEW, window: "month", windowName: null, exams: [], flagged: [], attendance: { ...VIEW.attendance, marks: 0 } } : VIEW),
    });
    await screen.findByText("ZZ 8A: the numbers");
    await fireEvent.press(screen.getByRole("radio", { name: "Last 30 days" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${analyticsPath(CLASS, "month")}`)).toBe(true));
    expect(await screen.findByText("Nobody is flagged")).toBeTruthy();
    expect(screen.getByText("No register taken in this window.")).toBeTruthy();
    expect(screen.getByText("No exam marks in this window yet.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Mark the attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/attendance", params: { classId: CLASS } });
  });

  it("without a class id the screen says so; offline shows a retry", async () => {
    mockRouter.params = {};
    await mountStaff(<ClassAnalytics />, "TEACHER", {});
    expect(await screen.findByText("That class could not be found")).toBeTruthy();
    mockRouter.params = { classId: CLASS };
    await mountStaff(<ClassAnalytics />, "TEACHER", { [`GET ${PATH}`]: offline });
    expect(await screen.findByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
