import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { StaffClasses } from "@/screens/staff/classes";
import { gated, json, mountStaff, refused } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const insight = (classId: string, name: string, percent: number) => ({
  classId,
  name,
  section: "A",
  gradeLevel: "6",
  pupils: 30,
  sessionsTaken: 12,
  attendance: { counts: { PRESENT: 300, LATE: 5, ABSENT: 20, EXCUSED: 2 }, marks: 327, percent },
  progress: { percent: 64, pupilsCounted: 29, pupilsWithNoMarks: 1 },
  reportCards: [],
});

const PRINCIPAL = { span: 30, window: { fromDateKey: "2026-08-08", toDateKey: "2026-09-07" }, sort: "name", grades: ["6", "7"], gradeFilter: null, concernPercent: 75, classes: [insight("c1", "ZZ Class A", 92), insight("c2", "ZZ Class B", 61)] };

const ADMIN = {
  classes: [
    { id: "c1", name: "ZZ Class A", subject: null, gradeLevel: "6", section: "A", room: "12", color: null, joinCode: "ZZAAAA", archivedAt: null, pupils: 30, teachers: [{ membershipId: "m2", name: "ZZ Teacher", role: "LEAD" }], leaderless: false },
    { id: "c2", name: "ZZ Class B", subject: null, gradeLevel: "6", section: "B", room: null, color: null, joinCode: "ZZBBBB", archivedAt: null, pupils: 28, teachers: [], leaderless: true },
  ],
  activeCount: 2,
  archivedCount: 1,
  leaderlessCount: 1,
};

describe("classes for the office", () => {
  it("for a principal: insights over a window, and the sort asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<StaffClasses />, "PRINCIPAL", { "GET /api/v1/staff/principal/classes": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(PRINCIPAL));
    await screen.findByText("ZZ Class A · A");
    expect(screen.getByText("61%")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/classes?days=30&sort=name")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Lowest attendance first" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/classes?days=30&sort=attendance")).toBe(true));
    await fireEvent.press(await screen.findByRole("radio", { name: "7" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/staff/principal/classes?days=30&sort=attendance&grade=7")).toBe(true));
  });

  it("for an admin: the list with leads and sizes, and a search on submit", async () => {
    const { calls } = await mountStaff(<StaffClasses />, "ADMIN", { "GET /api/v1/admin/classes": () => json(ADMIN) });
    await screen.findByText("ZZ Class B");
    expect(screen.getByText("2 active classes · 1 archived")).toBeTruthy();
    expect(screen.getByText("30 students · ZZ Teacher · Room 12")).toBeTruthy();
    expect(screen.getByText("28 students · No teacher assigned")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Search"), "class b");
    await fireEvent(screen.getByLabelText("Search"), "submitEditing");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/classes?q=class%20b")).toBe(true));
  });

  it("an admin with no classes is offered to create one", async () => {
    await mountStaff(<StaffClasses />, "ADMIN", { "GET /api/v1/admin/classes": () => json({ classes: [], activeCount: 0, archivedCount: 0, leaderlessCount: 0 }) });
    expect(await screen.findByText("No classes yet")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Create a class" })).toBeTruthy();
  });

  it("a principal with no classes sees the same empty state", async () => {
    await mountStaff(<StaffClasses />, "PRINCIPAL", { "GET /api/v1/staff/principal/classes": () => json({ ...PRINCIPAL, classes: [], grades: [] }) });
    expect(await screen.findByText("No classes yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<StaffClasses />, "PRINCIPAL", { "GET /api/v1/staff/principal/classes": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/staff/principal/classes")).length).toBe(2));
  });
});
