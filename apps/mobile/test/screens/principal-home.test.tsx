import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { PrincipalHome } from "@/screens/staff/principal-home";
import { gated, json, mountStaff, offline, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const cls = (classId: string, name: string, percent: number | null) => ({
  classId,
  name,
  section: null,
  gradeLevel: "6",
  pupils: 30,
  sessionsTaken: 20,
  attendance: { counts: { PRESENT: 500, LATE: 10, ABSENT: 30, EXCUSED: 5 }, marks: 545, percent },
  progress: { percent: 70, pupilsCounted: 28, pupilsWithNoMarks: 2 },
  reportCards: [],
});

const OVERVIEW = {
  span: 30,
  window: { fromDateKey: "2026-08-08", toDateKey: "2026-09-07" },
  summary: { pupils: 120, classes: 2, attendancePercent: 91.4, registersMissingToday: 2, pendingLeave: 1, concerns: 1 },
  academicYear: { id: "y1", name: "2026-27" },
  runningTerm: { id: "t1", name: "Term 1", endDateKey: "2026-12-18" },
  concerns: [cls("c2", "ZZ Class B", 68.2)],
  classes: [cls("c1", "ZZ Class A", 95.1), cls("c2", "ZZ Class B", 68.2)],
  reviews: [{ membershipId: "m2", name: "ZZ Teacher", allTime: { responseCount: 12, byQuestion: { q1: 4.2 }, overall: 4.3 }, latest: { overall: 4.3, count: 12 }, previous: null, delta: null }],
};

describe("the principal's dashboard", () => {
  it("loads, then shows what can be fixed today and the classes", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    await screen.findByText("Classes worth a look");
    expect(screen.getAllByText("ZZ Class B")).toHaveLength(2);
    expect(screen.getByLabelText("Attendance not marked today: 2")).toBeTruthy();
    expect(screen.getByLabelText("Attendance: 91%")).toBeTruthy();
    expect(screen.getByRole("button", { name: /1 leave request waiting/ })).toBeTruthy();
    expect(screen.getByText("Classes worth a look")).toBeTruthy();
    expect(screen.getByText("ZZ Teacher")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/overview?days=30")).toBe(true);
  });

  it("the window picker asks the API for another span", async () => {
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json(OVERVIEW) });
    await screen.findByText("ZZ Class A");
    await fireEvent.press(screen.getByRole("radio", { name: "7 days" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/overview?days=7")).toBe(true));
    expect(screen.getByRole("radio", { name: "7 days" })).toBeChecked();
  });

  it("with no classes, says so", async () => {
    await mountStaff(<PrincipalHome />, "PRINCIPAL", { "GET /api/v1/staff/principal/overview": () => json({ ...OVERVIEW, classes: [], concerns: [], summary: { ...OVERVIEW.summary, classes: 0 } }) });
    expect(await screen.findByText("No classes yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry; a dropped connection too", async () => {
    let failures = 0;
    const { calls } = await mountStaff(<PrincipalHome />, "PRINCIPAL", {
      "GET /api/v1/staff/principal/overview": (req) => (failures++ === 0 ? refused("The dashboard could not be loaded.")(req) : offline(req)),
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("The dashboard could not be loaded.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/principal/overview")).length).toBe(2));
    expect(await screen.findByRole("alert")).toHaveTextContent("Network request failed");
  });
});
