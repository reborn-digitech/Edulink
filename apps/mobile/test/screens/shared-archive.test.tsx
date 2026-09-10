import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Archive } from "@/screens/shared/archive";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const YEAR = { id: "y1", name: "ZZ 2025-26", startDate: "2025-04-01T00:00:00.000Z", endDate: "2026-03-31T00:00:00.000Z", closedAt: "2026-04-03T00:00:00.000Z" };
const OLDER = { ...YEAR, id: "y2", name: "ZZ 2024-25" };
const BASE = { schoolId: "s1", schoolName: "ZZ School", timezone: "Asia/Kolkata", children: [], child: null, years: [YEAR, OLDER] };
const SCHOOL = { ...BASE, selected: { year: YEAR, pupil: null, teacher: null, school: { pupilsOnRoll: 420, attendance: { marked: 1000, present: 950 }, reportCardsPublished: 400, leavers: 12, badgesArchived: 88, examSeries: [{ id: "es1", name: "ZZ Finals", gradeLevel: "5" }] } } };
const PUPIL = {
  ...BASE,
  selected: {
    year: YEAR,
    teacher: null,
    school: null,
    pupil: {
      reportCards: [{ id: "rc1", title: "ZZ Term 1 report", publishedAt: "2025-10-01T00:00:00.000Z", className: "ZZ 5A" }],
      attendance: { marked: 200, present: 190 },
      badges: [{ badgeId: "b1", label: "ZZ Early bird", description: "Never late", permanent: true }],
      marks: { graded: 14, averagePercent: 81.4 },
    },
  },
};
const TEACHER = { ...BASE, selected: { year: YEAR, pupil: null, school: null, teacher: { classes: [{ classId: "c1", className: "ZZ Class 5A", registersTaken: 12, assignmentsSet: 3, reportCardsPublished: 1 }] } } };
const PATH = "GET /api/v1/shared/archive";

describe("past years", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows the year picked off the shelf and the school's numbers; another year asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<Archive />, "PRINCIPAL", { [PATH]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(SCHOOL));
    await screen.findByText("ZZ Finals");
    expect(screen.getByText("2 closed years")).toBeTruthy();
    expect(screen.getByLabelText("Pupils on the roll: 420")).toBeTruthy();
    expect(screen.getByLabelText("Attendance: 95%")).toBeTruthy();
    expect(screen.getByText("950 of 1000 marked days present")).toBeTruthy();
    expect(screen.getByRole("header", { name: "ZZ 2025-26" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ 2024-25" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/shared/archive?year=y2")).toBe(true));
  });

  it("a pupil's year: a report card opens in the app's exams screen, the badges and the marks are listed", async () => {
    await mountStaff(<Archive />, "STUDENT", { [PATH]: () => json(PUPIL) });
    await screen.findByText("ZZ Term 1 report");
    expect(screen.getByText("ZZ Early bird")).toBeTruthy();
    expect(screen.getByText("14 pieces of work graded, averaging 81%")).toBeTruthy();
    expect(screen.getByText("190 of 200 marked days present")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^ZZ Term 1 report/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/exams", params: { cardId: "rc1" } });
  });

  it("a teacher's year: each class with what it left behind", async () => {
    await mountStaff(<Archive />, "TEACHER", { [PATH]: () => json(TEACHER) });
    await screen.findByText("ZZ Class 5A");
    expect(screen.getByText("12 attendance days · 3 assignments set · 1 report cards")).toBeTruthy();
    expect(screen.getByLabelText("Assignments: 3")).toBeTruthy();
  });

  it("with no closed year, says so, and an admin's door is the calendar", async () => {
    await mountStaff(<Archive />, "ADMIN", { [PATH]: () => json({ ...BASE, years: [], selected: null }) });
    expect(await screen.findByText("No closed years yet")).toBeTruthy();
    expect(screen.getByText(/^Promoting classes moves children up/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open the calendar" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/calendar");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<Archive />, "ADMIN", { [PATH]: refused("ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/shared/archive")).length).toBe(2));
  });
});
