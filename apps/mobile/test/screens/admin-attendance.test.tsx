import { Share } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { AdminAttendance } from "@/screens/staff/attendance";
import { formatDateKey, shiftMonth, thisMonthKey } from "@/screens/staff/shared";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's doors go into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const DATA = {
  windowDays: 30,
  trend: [
    { label: "W1", percent: 91, marks: 300 },
    { label: "W2", percent: null, marks: 0 },
  ],
  flags: [
    { studentMembershipId: "m7", name: "ZZ Pupil", className: "ZZ Class A", percent: 68, marks: 25, currentRun: 3, chronic: true, consecutive: true, guardianCount: 1 },
    { studentMembershipId: "m8", name: "ZZ Orphan", className: "ZZ Class A", percent: 80, marks: 20, currentRun: 4, chronic: false, consecutive: true, guardianCount: 0 },
  ],
  classes: [{ id: "c1", name: "ZZ Class A" }],
};

describe("the office's attendance landing", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows the trend, the children slipping, and the window asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<AdminAttendance />, "ADMIN", { "GET /api/v1/admin/attendance": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DATA));
    await screen.findByText("ZZ Pupil");
    expect(screen.getByLabelText("Attendance: 91%")).toBeTruthy();
    expect(screen.getByLabelText("Worth a conversation: 2")).toBeTruthy();
    expect(screen.getByText("ZZ Class A · 68% attendance · 3 sessions absent in a row · 25 sessions marked")).toBeTruthy();
    expect(screen.getByText("ZZ Class A · 4 sessions absent in a row · 20 sessions marked")).toBeTruthy();
    expect(screen.getByRole("button", { name: "No guardian linked: ZZ Orphan" })).toBeDisabled();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance?window=30&sort=percent")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Last 60 days" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance?window=60&sort=percent")).toBe(true));
    await fireEvent.press(screen.getByRole("radio", { name: "By name" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/attendance?window=60&sort=name")).toBe(true));
  });

  it("telling a family posts for that child and says so; a class row opens the register; past attendance is the app's", async () => {
    const onOpenRegister = jest.fn();
    const { calls } = await mountStaff(
      <ToastProvider>
        <AdminAttendance onOpenRegister={onOpenRegister} />
      </ToastProvider>,
      "ADMIN",
      { "GET /api/v1/admin/attendance": () => json(DATA), "POST /api/v1/office/attendance/alert": () => json({ notified: 1, skipped: false }) },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Tell the family: ZZ Pupil" }));
    expect(await screen.findByText("Told 1 guardians.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/attendance/alert")?.body).toEqual({ studentMembershipId: "m7" });
    await fireEvent.press(screen.getByRole("button", { name: "ZZ Class A, Mark the attendance" }));
    expect(onOpenRegister).toHaveBeenCalledWith("c1");
    await fireEvent.press(screen.getByRole("button", { name: "Past attendance" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/attendance", params: { view: "history" } });
  });

  it("a family told this week is not told again, and a refusal is the server's sentence", async () => {
    let sent = 0;
    await mountStaff(
      <ToastProvider>
        <AdminAttendance />
      </ToastProvider>,
      "ADMIN",
      {
        "GET /api/v1/admin/attendance": () => json(DATA),
        "POST /api/v1/office/attendance/alert": () => (sent++ === 0 ? json({ notified: 0, skipped: true }) : json({ error: "That pupil is not in this school.", code: "NOT_FOUND" }, 404)),
      },
    );
    await fireEvent.press(await screen.findByRole("button", { name: "Tell the family: ZZ Pupil" }));
    expect(await screen.findByText("This family was told within the last week — not sent again.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Tell the family: ZZ Pupil" }));
    expect(await screen.findByText("That pupil is not in this school.")).toBeTruthy();
  });

  it("the compliance files go to the share sheet: a class's month (this one or earlier), and the enrolment summary", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: "sharedAction" } as never);
    const earlier = shiftMonth(thisMonthKey(), -1);
    const { calls } = await mountStaff(<AdminAttendance />, "ADMIN", {
      "GET /api/v1/admin/attendance": () => json(DATA),
      "GET /api/v1/office/attendance/export/register": () => json({ filename: "edulink-register-ZZ.csv", csv: "student_code,name\n,ZZ Pupil\n", rows: 1 }),
      "GET /api/v1/office/attendance/export/enrolment": () => json({ filename: "edulink-enrolment.csv", csv: "grade_level,classes\n6,1\n", rows: 1 }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Download attendance (CSV)" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "edulink-register-ZZ.csv", message: "student_code,name\n,ZZ Pupil\n" }));
    expect(calls().some((c) => c.line === `GET /api/v1/office/attendance/export/register?classId=c1&month=${thisMonthKey()}`)).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: formatDateKey(`${earlier}-01`, "en", { month: "long", year: "numeric" }) }));
    await fireEvent.press(screen.getByRole("button", { name: "Download attendance (CSV)" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET /api/v1/office/attendance/export/register?classId=c1&month=${earlier}`)).toBe(true));
    await fireEvent.press(screen.getByRole("button", { name: "Download enrolment summary (CSV)" }));
    await waitFor(() => expect(share).toHaveBeenCalledWith({ title: "edulink-enrolment.csv", message: "grade_level,classes\n6,1\n" }));
    share.mockRestore();
  });

  it("nobody flagged and no classes: each says so, with a door", async () => {
    const onOpenHistory = jest.fn();
    await mountStaff(<AdminAttendance onOpenHistory={onOpenHistory} />, "ADMIN", { "GET /api/v1/admin/attendance": () => json({ ...DATA, flags: [], classes: [] }) });
    expect(await screen.findByText("Nobody is flagged. Every attendance session tells the same steady story.")).toBeTruthy();
    expect(screen.getByText("No classes yet")).toBeTruthy();
    // The doors: the history the caller wires, and the classes tab.
    const history = screen.getAllByRole("button", { name: "Past attendance" });
    await fireEvent.press(history[history.length - 1]!);
    expect(onOpenHistory).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button", { name: "Classes" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/classes");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<AdminAttendance />, "ADMIN", { "GET /api/v1/admin/attendance": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/attendance")).length).toBe(2));
  });
});
