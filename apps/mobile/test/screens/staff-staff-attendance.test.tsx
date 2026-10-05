import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { staffMonthSchema, staffRegisterSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { StaffAttendance } from "@/screens/staff/staff-attendance";
import { json, mountStaff, type Answers } from "./staff-harness";

/** The screen's doors go into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const ANITA = "czz0000000000000000sa1";
const BALA = "czz0000000000000000sa2";
const CHITRA = "czz0000000000000000sa3";
const DEV = "czz0000000000000000sa4";
const PATH = "/api/v1/office/staff-attendance";

const REGISTER = staffRegisterSchema.parse({
  dateKey: "2026-09-17",
  today: "2026-09-18",
  closed: false,
  closedName: null,
  checkInMinute: 540,
  lateGraceMinutes: 15,
  rows: [
    { membershipId: ANITA, name: "ZZ Anita", role: "TEACHER", avatarKey: null, status: "PRESENT", source: "SELF", checkedInAt: "2026-09-17T03:34:00.000Z", note: null, onLeave: false },
    { membershipId: BALA, name: "ZZ Bala", role: "TEACHER", avatarKey: null, status: null, source: null, checkedInAt: null, note: null, onLeave: false },
    { membershipId: CHITRA, name: "ZZ Chitra", role: "ADMIN", avatarKey: null, status: "ON_LEAVE", source: "LEAVE", checkedInAt: null, note: null, onLeave: true },
    { membershipId: DEV, name: "ZZ Dev", role: "TEACHER", avatarKey: null, status: null, source: null, checkedInAt: null, note: null, onLeave: false },
  ],
  counts: { total: 4, present: 1, late: 0, halfDay: 0, absent: 0, onLeave: 1, unmarked: 2 },
});

const MONTH = staffMonthSchema.parse({
  month: "2026-09",
  previousMonth: "2026-08",
  nextMonth: null,
  workingDays: 15,
  rows: [
    { membershipId: ANITA, name: "ZZ Anita", role: "TEACHER", present: 12, late: 1, halfDay: 0, absent: 0, onLeave: 2, unmarked: 0, workingDays: 15, percent: 92.3 },
    { membershipId: BALA, name: "ZZ Bala", role: "TEACHER", present: 0, late: 0, halfDay: 0, absent: 0, onLeave: 0, unmarked: 15, workingDays: 15, percent: null },
  ],
});

/** The register answers for whichever day is asked, echoing the date so the arrows can be seen to move it; a Sunday comes back closed. */
const answers = (): Answers => ({
  [`GET ${PATH}`]: ({ url }) => {
    const date = url.searchParams.get("date") ?? REGISTER.dateKey;
    return json({ ...REGISTER, dateKey: date, closed: date === "2026-09-20", closedName: null });
  },
  [`POST ${PATH}`]: () => json({ marked: 2 }),
  [`POST ${PATH}/settings`]: () => json({ ok: true }),
  [`GET ${PATH}/month`]: () => json(MONTH),
});

const compose = () => (
  <ToastProvider>
    <StaffAttendance />
  </ToastProvider>
);

describe("the staff register", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads the day with its counts, every person with how they were recorded, and the leave hint", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("ZZ Anita");
    expect(calls().some((c) => c.line === `GET ${PATH}`)).toBe(true);
    expect(screen.getByText("1 present · 0 late · 0 absent · 1 on leave · 2 not marked")).toBeTruthy();
    expect(screen.getByText(/^Teacher · Recorded by a check-in · \d{2}:\d{2}$/)).toBeTruthy();
    expect(screen.getAllByText("Teacher · Not marked")).toHaveLength(2);
    expect(screen.getByText("School admin · Recorded by approved leave")).toBeTruthy();
    expect(screen.getByText("An approved leave covers this day.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Present: ZZ Anita" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "On leave: ZZ Chitra" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Half day: ZZ Dev" })).not.toBeChecked();
    expect(screen.getByText("Staff day starts 09:00 · Grace 15 minutes · Late after 09:15")).toBeTruthy();
    // Nothing tapped yet: nothing to save.
    expect(screen.getByRole("button", { name: "Save the register" })).toBeDisabled();
  });

  it("'mark everyone present' fills only the unmarked rows, a tap changes one, and Save posts exactly those", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await fireEvent.press(await screen.findByRole("button", { name: "Mark everyone present" }));
    expect(screen.getByRole("radio", { name: "Present: ZZ Bala" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Present: ZZ Dev" })).toBeChecked();
    // The people already recorded are left as they were.
    expect(screen.getByRole("radio", { name: "On leave: ZZ Chitra" })).toBeChecked();
    expect(screen.queryByRole("button", { name: "Mark everyone present" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "Absent: ZZ Dev" }));
    expect(screen.getByRole("radio", { name: "Present: ZZ Dev" })).not.toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Save the register" }));
    expect(await screen.findByText("Staff register saved.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}`)?.body).toEqual({
      date: "2026-09-17",
      entries: [
        { membershipId: BALA, status: "PRESENT" },
        { membershipId: DEV, status: "ABSENT" },
      ],
    });
  });

  it("the day arrows ask the API for that day, and tomorrow is out of reach", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("ZZ Anita");
    expect(screen.getByText("Thu, 17/09/2026")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Previous day" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?date=2026-09-16`)).toBe(true));
    await screen.findByText("Wed, 16/09/2026");
    await fireEvent.press(screen.getByRole("button", { name: "Today" }));
    await screen.findByText("Thu, 17/09/2026");
    await fireEvent.press(screen.getByRole("button", { name: "Next day" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}?date=2026-09-18`)).toBe(true));
    await screen.findByText("Fri, 18/09/2026");
    // Today: no further forward, and no "Today" button to press.
    expect(screen.getByRole("button", { name: "Next day" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Today" })).toBeNull();
  });

  it("a Sunday says it is closed", async () => {
    await mountStaff(compose(), "ADMIN", { ...answers(), [`GET ${PATH}`]: () => json({ ...REGISTER, dateKey: "2026-09-20", today: "2026-09-21", closed: true, closedName: null }) });
    expect(await screen.findByText("Closed: Sunday")).toBeTruthy();
  });

  it("'This month' lists the month per person, and its arrows move the month", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await screen.findByText("ZZ Anita");
    await fireEvent.press(screen.getByRole("tab", { name: "This month" }));
    await screen.findByText("Teacher · P 12 · L 1 · A 0 · Leave 2");
    expect(calls().some((c) => c.line === `GET ${PATH}/month`)).toBe(true);
    expect(screen.getByText("15 working days")).toBeTruthy();
    expect(screen.getByText("92%")).toBeTruthy();
    expect(screen.getByText("Teacher · P 0 · L 0 · A 0 · Leave 0")).toBeTruthy();
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next month" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("button", { name: "Previous month" }));
    await waitFor(() => expect(calls().some((c) => c.line === `GET ${PATH}/month?month=2026-08`)).toBe(true));
  });

  it("changing the check-in time posts minutes, refuses a time that is not HH:MM, and says when it is saved", async () => {
    const { calls } = await mountStaff(compose(), "ADMIN", answers());
    await fireEvent.press(await screen.findByRole("button", { name: "Change the check-in time" }));
    const start = screen.getByLabelText("Staff day starts");
    const grace = screen.getByLabelText("Grace");
    expect(start.props.value).toBe("09:00");
    expect(grace.props.value).toBe("15");
    await fireEvent.changeText(start, "9");
    expect(screen.getByText("Use HH:MM.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await fireEvent.changeText(start, "08:30");
    await fireEvent.changeText(grace, "10");
    expect(screen.getByText("Late after 08:40")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Check-in time saved.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST ${PATH}/settings`)?.body).toEqual({ checkInMinute: 510, lateGraceMinutes: 10 });
    // Folded away again once saved.
    expect(screen.queryByLabelText("Staff day starts")).toBeNull();
  });

  it("a school with no staff yet is sent to the staff page", async () => {
    await mountStaff(compose(), "PRINCIPAL", { ...answers(), [`GET ${PATH}`]: () => json({ ...REGISTER, rows: [], counts: { total: 0, present: 0, late: 0, halfDay: 0, absent: 0, onLeave: 0, unmarked: 0 } }) });
    await screen.findByText("No staff yet");
    await fireEvent.press(screen.getByRole("button", { name: "Staff" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/staff");
  });
});
