import { screen, waitFor } from "@testing-library/react-native";
import { myStaffAttendanceSchema, staffTodaySchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { TeacherHome } from "@/screens/teacher/home";
import { callsTo, fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap } from "./teacher-support";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const TODAY = staffTodaySchema.parse({
  dateKey: "2026-09-07",
  schoolName: "ZZ School",
  marksTodo: [{ classId: ID.class1, className: "ZZ 5A", slotId: ID.slot1, seriesName: "Term 1", kind: "UNIT_TEST", subject: "Maths", dateKey: "2026-09-04", marked: 3, classSize: 24 }],
  lessons: {
    closed: false,
    closedName: null,
    items: [{ slotId: "sl1", periodId: "p1", periodName: "Period 1", startMinute: 540, endMinute: 580, subject: "Maths", classId: ID.class1, className: "ZZ 5A", room: "Room 3", borrowed: false }],
    coveringToday: 0,
    classesTaughtThisWeek: 4,
  },
  formClasses: {
    classes: [
      { id: ID.class1, name: "ZZ 5A", color: null, students: 24, registerTaken: false },
      { id: ID.class2, name: "ZZ 5B", color: null, students: 1, registerTaken: true },
    ],
    registersLeft: 1,
    toGrade: 2,
    dueSoon: [{ id: "a1", title: "ZZ Fractions sheet", dueAt: new Date(Date.now() + 2 * 86_400_000).toISOString(), className: "ZZ 5A" }],
  },
});

const MINE = myStaffAttendanceSchema.parse({
  month: "2026-09",
  previousMonth: "2026-08",
  nextMonth: null,
  today: "2026-09-07",
  todayStatus: null,
  canCheckIn: true,
  checkInMinute: 540,
  lateGraceMinutes: 15,
  summary: { present: 4, late: 0, halfDay: 0, absent: 0, onLeave: 0, unmarked: 0, workingDays: 4, percent: 100 },
  days: [{ dateKey: "2026-09-07", status: null, source: null, checkedInAt: null, note: null, closed: false }],
});
const CHECKED_IN = { ...MINE, todayStatus: "PRESENT", canCheckIn: false, days: [{ ...MINE.days[0]!, status: "PRESENT", source: "SELF", checkedInAt: "2026-09-07T03:40:00.000Z" }] };

beforeEach(() => {
  resetOutbox();
  mockRouter.push.mockReset();
});

describe("the teacher's Today", () => {
  it("loads, then shows the registers, the lessons, the marks to enter and the work due", async () => {
    fakeApi({ "/api/v1/staff/today": () => json(TODAY) });
    await renderTeacher(<TeacherHome />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("1 still to take.");
    expect(screen.getByText(/^ZZ School · Mon/)).toBeTruthy();
    expect(screen.getByLabelText("Attendance left: 1")).toBeTruthy();
    expect(screen.getByLabelText("To grade: 2")).toBeTruthy();
    expect(screen.getByText("Maths · ZZ 5A")).toBeTruthy();
    expect(screen.getByText("Period 1 · 09:00–09:40 · Room 3")).toBeTruthy();
    expect(screen.getByText("Maths · Term 1")).toBeTruthy();
    expect(screen.getByText("ZZ 5A · 3 of 24 marked")).toBeTruthy();
    expect(screen.getByText(/ZZ 5A · Due in 2 days/)).toBeTruthy();
    expect(screen.getByText("ZZ 5B")).toBeTruthy();
  });

  it("a class row opens the register for that class; a paper opens the marks grid", async () => {
    fakeApi({ "/api/v1/staff/today": () => json(TODAY) });
    await renderTeacher(<TeacherHome />);
    await tap(await screen.findByRole("button", { name: /ZZ 5A, 24 students · To do/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/attendance", params: { classId: ID.class1 } });
    await tap(screen.getByRole("button", { name: /Maths · Term 1/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/marks", params: { classId: ID.class1, slotId: ID.slot1 } });
  });

  it("a teacher with no classes and no lessons sees the empty state", async () => {
    fakeApi({ "/api/v1/staff/today": () => json({ ...TODAY, marksTodo: [], formClasses: null, lessons: { ...TODAY.lessons, items: [] } }) });
    await renderTeacher(<TeacherHome />);
    await screen.findByText("No classes assigned yet");
    expect(screen.getByText("Ask an admin to add you to a class, and your day will appear here.")).toBeTruthy();
  });

  it("a closed school says so, and every register taken is celebrated", async () => {
    fakeApi({ "/api/v1/staff/today": () => json({ ...TODAY, lessons: { ...TODAY.lessons, closed: true, closedName: "ZZ Holiday", items: [] }, formClasses: { ...TODAY.formClasses, registersLeft: 0 } }) });
    await renderTeacher(<TeacherHome />);
    await screen.findByText("School is closed today — ZZ Holiday.");
    expect(screen.getByText("Every attendance is marked for today.")).toBeTruthy();
  });

  it("a refusal is an alert with a retry that asks again", async () => {
    const fetch = fakeApi({ "/api/v1/staff/today": () => refusal("ZZ server is resting", 503) });
    await renderTeacher(<TeacherHome />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ server is resting");
    fetch.mockImplementation(async () => json(TODAY));
    await tap(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(screen.getByText("1 still to take.")).toBeTruthy());
  });

  it("carries 'I'm in' at the top while the day allows it; the tap posts the check-in and today's line takes the button's place", async () => {
    let checkedIn = false;
    const fetch = fakeApi({
      "/api/v1/staff/today": () => json(TODAY),
      "/api/v1/staff/attendance/me": () => json(checkedIn ? CHECKED_IN : MINE),
      "/api/v1/staff/attendance/check-in": () => {
        checkedIn = true;
        return json({ status: "PRESENT", checkedInAt: "2026-09-07T03:40:00.000Z", late: false });
      },
    });
    await renderTeacher(
      <ToastProvider>
        <TeacherHome />
      </ToastProvider>,
    );
    await screen.findByText("1 still to take.");
    await tap(await screen.findByRole("button", { name: "I'm in" }));
    expect(await screen.findByText("Checked in. Have a good day.")).toBeTruthy();
    expect(callsTo(fetch, "/api/v1/staff/attendance/check-in").map((c) => c.method)).toEqual(["POST"]);
    await screen.findByText(/^Checked in \d{2}:\d{2}$/);
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
    await tap(screen.getByRole("button", { name: "This month" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/my-attendance");
  });

  it("without the staff register answering, the Today screen draws no check-in card and is otherwise unchanged", async () => {
    fakeApi({ "/api/v1/staff/today": () => json(TODAY) });
    await renderTeacher(<TeacherHome />);
    await screen.findByText("1 still to take.");
    expect(screen.queryByRole("button", { name: "I'm in" })).toBeNull();
    expect(screen.queryByText("My attendance")).toBeNull();
  });
});
