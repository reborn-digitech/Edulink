import { Share } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { AttendanceHistory } from "@/screens/staff/attendance-history";
import { gated, json, mountStaff, refused, type Answer } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const CLASSES = [
  { id: "c1", name: "ZZ Class A", color: null, archived: false },
  { id: "c2", name: "ZZ Class B", color: "#123456", archived: true },
];
const HISTORY = {
  class: CLASSES[0],
  month: "2026-09",
  days: [
    { dateKey: "2026-09-01", present: 28, late: 1, absent: 1, excused: 0, percent: 97 },
    { dateKey: "2026-09-02", present: 26, late: 0, absent: 3, excused: 1, percent: 87 },
  ],
  pupils: [
    { membershipId: "m7", name: "ZZ Pupil", marks: { "2026-09-01": "PRESENT", "2026-09-02": "ABSENT" }, present: 1, late: 0, absent: 1, excused: 0, percent: 50 },
    { membershipId: "m8", name: "ZZ Newcomer", marks: {}, present: 0, late: 0, absent: 0, excused: 0, percent: null },
  ],
  percent: 92,
};
/** Without a class the picker; with one, that class's month — the way the endpoint answers. */
const answer: Answer = ({ url }) => {
  const classId = url.searchParams.get("classId");
  const month = url.searchParams.get("month") ?? "2026-09";
  return json({ classes: CLASSES, month, history: classId ? { ...HISTORY, month, class: CLASSES.find((c) => c.id === classId) ?? CLASSES[0], days: month === "2026-09" ? HISTORY.days : [] } : null });
};
const FILE = { filename: "edulink-register-ZZ_Class_A-2026-09.csv", csv: "student_code,name,2026-09-01\n,ZZ Pupil,P\n", rows: 2 };

describe("past attendance", () => {
  it("loads, offers the classes, then shows one class's month with totals, days and pupils", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<AttendanceHistory />, "PRINCIPAL", { "GET /api/v1/admin/attendance/history": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json({ classes: CLASSES, month: "2026-09", history: null }));
    await screen.findByText("Choose a class");
    expect(screen.getByRole("radio", { name: "ZZ Class B (archived)" })).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance/history")).toBe(true);
  });

  it("choosing a class asks the API, and the month reads back with rate, day totals and each pupil", async () => {
    const { calls } = await mountStaff(<AttendanceHistory />, "PRINCIPAL", { "GET /api/v1/admin/attendance/history": answer });
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Class A" }));
    await screen.findByText("ZZ Class A · September 2026");
    expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance/history?classId=c1")).toBe(true);
    expect(screen.getByText("2 attendance sessions · 92% present or late across the month")).toBeTruthy();
    expect(screen.getByLabelText("Rate: 92%")).toBeTruthy();
    expect(screen.getByLabelText("Present: 54")).toBeTruthy();
    expect(screen.getByLabelText("Absent: 4")).toBeTruthy();
    expect(screen.getByText("P 28 · L 1 · A 1 · E 0")).toBeTruthy();
    expect(screen.getByText("ZZ Pupil")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();
    expect(screen.getByText("ZZ Newcomer")).toBeTruthy();
    // No CSV for a principal; the previous month asks the API.
    expect(screen.queryByRole("button", { name: "Download this month as CSV" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance/history?classId=c1&month=2026-08")).toBe(true));
    expect(await screen.findByText("No attendance was marked for ZZ Class A in August 2026.")).toBeTruthy();
  });

  it("an admin's CSV of the month goes to the share sheet", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const { calls } = await mountStaff(<AttendanceHistory initialClassId="c1" />, "ADMIN", { "GET /api/v1/admin/attendance/history": answer, "GET /api/v1/office/attendance/export/register": () => json(FILE) });
    await fireEvent.press(await screen.findByRole("button", { name: "Download this month as CSV" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: FILE.filename, message: FILE.csv }));
    expect(calls().some((c) => c.line === "GET /api/v1/office/attendance/export/register?classId=c1&month=2026-09")).toBe(true);
    share.mockRestore();
  });

  it("a refused export is the server's sentence", async () => {
    await mountStaff(
      <ToastProvider>
        <AttendanceHistory initialClassId="c1" />
      </ToastProvider>,
      "ADMIN",
      { "GET /api/v1/admin/attendance/history": answer, "GET /api/v1/office/attendance/export/register": refused("Class not found in your school.", 404) },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Download this month as CSV" }));
    expect(await screen.findByText("Class not found in your school.")).toBeTruthy();
  });

  it("no classes to read says so, with a door to the classes", async () => {
    await mountStaff(<AttendanceHistory />, "PRINCIPAL", { "GET /api/v1/admin/attendance/history": () => json({ classes: [], month: "2026-09", history: null }) });
    expect(await screen.findByText("No class history to show")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AttendanceHistory />, "ADMIN", { "GET /api/v1/admin/attendance/history": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/attendance/history")).length).toBe(2));
  });
});
