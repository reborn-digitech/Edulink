import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { trendsSchema } from "@edulink/contracts";
import { StaffTrends, trendsPath } from "@/screens/staff/trends";
import { json, mountStaff, offline } from "./staff-harness";

const mockRouter = { push: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));

const PATH = "/api/v1/principal/trends";

const VIEW = trendsSchema.parse({
  years: [
    { id: "y2", name: "2026–27", fromDateKey: "2026-04-01", toDateKey: "2027-03-31", current: true },
    { id: "y1", name: "2025–26", fromDateKey: "2025-04-01", toDateKey: "2026-03-31", current: false },
  ],
  passLinePercent: 35,
  terms: [
    { termId: "year:y1", yearName: "2025–26", termName: "2025–26", fromDateKey: "2025-04-01", toDateKey: "2026-03-31", attendancePercent: 50, examAveragePercent: 50, passPercent: 100, pupilsWithMarks: 2, bySubject: [{ subject: "Mathematics", averagePercent: 50, papers: 2 }], byTeacher: [], feeCollectionPercent: null, incidents: 0 },
    { termId: "t1", yearName: "2026–27", termName: "Term 1", fromDateKey: "2026-04-01", toDateKey: "2026-09-30", attendancePercent: 83.3, examAveragePercent: 50, passPercent: 50, pupilsWithMarks: 2, bySubject: [{ subject: "Mathematics", averagePercent: 60, papers: 2 }, { subject: "Science", averagePercent: 40, papers: 2 }], byTeacher: [{ membershipId: "m1", name: "ZZ Asha", averagePercent: 60, papers: 2 }], feeCollectionPercent: 75, incidents: 2 },
  ],
  cohorts: [{ gradeLevel: "8", thisYear: { yearName: "2026–27", attendancePercent: 87.5, examAveragePercent: 56.7, pupils: 2 }, lastYear: { yearName: "2025–26", attendancePercent: 50, examAveragePercent: 50, pupils: 2 } }],
});

describe("the school across terms", () => {
  it("asks for two years, lists each term's numbers, opens the breakdown by subject and teacher, and shows this year's grade beside last year's", async () => {
    const { calls } = await mountStaff(<StaffTrends />, "PRINCIPAL", { [`GET ${PATH}`]: () => json(VIEW) });
    expect(await screen.findByText("Term 1 · 2026–27")).toBeTruthy();
    expect(calls().some((c) => c.line === `GET ${trendsPath("2")}`)).toBe(true);
    expect(screen.getByText("2025–26 (whole year)")).toBeTruthy();
    expect(screen.getByText("2 incidents · 2 pupils with marks")).toBeTruthy();
    expect(screen.getByText("83%")).toBeTruthy();
    expect(screen.getByText("75%")).toBeTruthy();
    expect(screen.queryByText("ZZ Asha")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "By subject and teacher: Term 1 2026–27" }));
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
    expect(screen.getByText("Science")).toBeTruthy();
    expect(screen.getByText("Grade 8")).toBeTruthy();
    expect(screen.getByText("2026–27 · 2 pupils with marks")).toBeTruthy();
    expect(screen.getByText("2025–26 · 2 pupils with marks")).toBeTruthy();
  });

  it("the years chip asks for one year; no year at all is an empty state with a door to the calendar; the office reads the same", async () => {
    const { calls } = await mountStaff(<StaffTrends />, "ADMIN", { [`GET ${PATH}`]: ({ url }) => json(url.searchParams.get("years") === "1" ? { years: [], passLinePercent: 33, terms: [], cohorts: [] } : VIEW) });
    await screen.findByText("Term 1 · 2026–27");
    await fireEvent.press(screen.getByRole("radio", { name: "Last 1 years" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${trendsPath("1")}`)).toBe(true));
    expect(await screen.findByText("No academic year to read")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Calendar" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/calendar");
  });

  it("offline: the failure shows with a retry", async () => {
    await mountStaff(<StaffTrends />, "PRINCIPAL", { [`GET ${PATH}`]: offline });
    expect(await screen.findByRole("button", { name: "Try again" })).toBeTruthy();
  });
});
