import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { myStaffAttendanceSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { MyAttendance } from "@/screens/teacher/my-attendance";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ME_PATH = "/api/v1/staff/attendance/me";
const CHECK_IN = "/api/v1/staff/attendance/check-in";
const AT = "2026-09-17T03:34:00.000Z";

const MINE = myStaffAttendanceSchema.parse({
  month: "2026-09",
  previousMonth: "2026-08",
  nextMonth: null,
  today: "2026-09-18",
  todayStatus: null,
  canCheckIn: true,
  checkInMinute: 540,
  lateGraceMinutes: 15,
  summary: { present: 10, late: 1, halfDay: 0, absent: 1, onLeave: 2, unmarked: 0, workingDays: 14, percent: 78.6 },
  days: [
    { dateKey: "2026-09-18", status: null, source: null, checkedInAt: null, note: null, closed: false },
    { dateKey: "2026-09-17", status: "PRESENT", source: "SELF", checkedInAt: AT, note: null, closed: false },
    { dateKey: "2026-09-16", status: "LATE", source: "SELF", checkedInAt: "2026-09-16T04:02:00.000Z", note: null, closed: false },
    { dateKey: "2026-09-15", status: "ON_LEAVE", source: "LEAVE", checkedInAt: null, note: null, closed: false },
    { dateKey: "2026-09-14", status: "ABSENT", source: "OFFICE", checkedInAt: null, note: "ZZ phoned in", closed: false },
    { dateKey: "2026-09-13", status: null, source: null, checkedInAt: null, note: null, closed: true },
  ],
});

/** After the check-in the day's answer flips: the button gone, today recorded. */
const DONE = { ...MINE, todayStatus: "PRESENT", canCheckIn: false, days: [{ ...MINE.days[0]!, status: "PRESENT", source: "SELF", checkedInAt: "2026-09-18T03:40:00.000Z" }, ...MINE.days.slice(1)] };

const compose = () => (
  <ToastProvider>
    <MyAttendance />
  </ToastProvider>
);

describe("my attendance", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("'I'm in' posts the check-in, says so, and today's line replaces the button", async () => {
    let checkedIn = false;
    const answers: Answers = {
      [`GET ${ME_PATH}`]: () => json(checkedIn ? DONE : MINE),
      [`POST ${CHECK_IN}`]: () => {
        checkedIn = true;
        return json({ status: "PRESENT", checkedInAt: "2026-09-18T03:40:00.000Z", late: false });
      },
    };
    const { calls } = await mountStaff(compose(), "TEACHER", answers);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await fireEvent.press(await screen.findByRole("button", { name: "I'm in" }));
    expect(await screen.findByText("Checked in. Have a good day.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${CHECK_IN}`)).toHaveLength(1);
    await screen.findByText(/^Checked in \d{2}:\d{2}$/);
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
  });

  it("a late check-in is told the time it had to beat", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json(MINE), [`POST ${CHECK_IN}`]: () => json({ status: "LATE", checkedInAt: "2026-09-18T04:40:00.000Z", late: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "I'm in" }));
    expect(await screen.findByText("Checked in — after 09:15, so it is marked late.")).toBeTruthy();
  });

  it("a refusal is the server's sentence", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json(MINE), [`POST ${CHECK_IN}`]: () => json({ error: "The school is closed today; there is nothing to check in to.", code: "FORBIDDEN" }, 403) });
    await fireEvent.press(await screen.findByRole("button", { name: "I'm in" }));
    expect(await screen.findByText("The school is closed today; there is nothing to check in to.")).toBeTruthy();
  });

  it("already recorded: no button, today's line instead — checked in, late, or on leave", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json(DONE) });
    await screen.findByText(/^Checked in \d{2}:\d{2}$/);
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
    expect(screen.getByText("Staff day starts 09:00 · Late after 09:15")).toBeTruthy();
  });

  it("late today reads as late", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json({ ...DONE, todayStatus: "LATE", days: [{ ...DONE.days[0]!, status: "LATE" }, ...DONE.days.slice(1)] }) });
    await screen.findByText(/^Checked in late, \d{2}:\d{2}$/);
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
  });

  it("on leave today reads as on leave", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json({ ...MINE, todayStatus: "ON_LEAVE", canCheckIn: false, days: MINE.days.slice(0, 3) }) });
    await screen.findByText("On leave");
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
  });

  it("marked by the office without a time reads as already recorded", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json({ ...MINE, todayStatus: "ABSENT", canCheckIn: false }) });
    await screen.findByText("Already recorded for today");
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
  });

  it("the month's figures and every day, each with how it was recorded; the arrows move the month", async () => {
    const { calls } = await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json(MINE) });
    await screen.findByText("Thu, 17/09/2026");
    expect(screen.getByLabelText("Present: 10")).toBeTruthy();
    expect(screen.getByLabelText("Late: 1")).toBeTruthy();
    expect(screen.getByLabelText("Absent: 1")).toBeTruthy();
    expect(screen.getByLabelText("Leave: 2")).toBeTruthy();
    expect(screen.getByLabelText("In: 79%")).toBeTruthy();
    expect(screen.getByText("14 working days")).toBeTruthy();
    expect(screen.getAllByText(/^Recorded by a check-in · \d{2}:\d{2}$/)).toHaveLength(2);
    expect(screen.getByText("Recorded by approved leave")).toBeTruthy();
    expect(screen.getByText("Recorded by the office · ZZ phoned in")).toBeTruthy();
    expect(screen.getByText("Closed")).toBeTruthy();
    expect(screen.getByText("Not marked")).toBeTruthy();
    // The status pills, beside the same words as the month's figures.
    expect(screen.getAllByText("Present")).toHaveLength(2);
    expect(screen.getAllByText("Late")).toHaveLength(2);
    expect(screen.getAllByText("Absent")).toHaveLength(2);
    expect(screen.getByText("On leave")).toBeTruthy();
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${ME_PATH}?month=2026-08`)).toBe(true));
  });

  it("a month with nothing in it says so and offers the Today screen", async () => {
    await mountStaff(compose(), "TEACHER", { [`GET ${ME_PATH}`]: () => json({ ...MINE, days: [] }) });
    await screen.findByText("Nothing recorded this month yet.");
    await fireEvent.press(screen.getByRole("button", { name: "Today" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)");
  });
});
