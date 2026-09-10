import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminTimetableSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { TimetableEditor } from "@/screens/staff/timetable-editor";
import { gated, json, mountStaff, refused, type Answer, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const P1 = { id: "p1", name: "Period 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1, archivedAt: null };
const P2 = { id: "p2", name: "Break", startMinute: 585, endMinute: 600, kind: "BREAK", position: 2, archivedAt: null };
const P3 = { id: "p3", name: "Period 2", startMinute: 600, endMinute: 645, kind: "LESSON", position: 3, archivedAt: null };
const OLD = { id: "p4", name: "ZZ Old", startMinute: 700, endMinute: 745, kind: "LESSON", position: 4, archivedAt: "2026-08-01T00:00:00.000Z" };
const CLASSES = [
  { id: "c1", name: "ZZ Class A", gradeLevel: "6", section: "A", room: "12", },
  { id: "c2", name: "ZZ Class B", gradeLevel: "6", section: "B", room: null },
];
const STAFF = [
  { membershipId: "m2", name: "ZZ Teacher", load: 3 },
  { membershipId: "m3", name: "ZZ Busy", load: 5 },
];
const DAY = adminTimetableSchema.parse({ periods: [P1, P2, P3, OLD], classes: CLASSES, selectedClassId: null, grid: null, staff: STAFF, busy: {} });
const WEEK = adminTimetableSchema.parse({
  periods: [P1, P2, P3, OLD],
  classes: CLASSES,
  selectedClassId: "c1",
  grid: {
    periods: [P1, P2, P3],
    days: [
      { weekday: 1, dateKey: "2026-09-07", closed: false, closedName: null, isToday: true },
      { weekday: 2, dateKey: "2026-09-08", closed: false, closedName: null, isToday: false },
    ],
    slots: [{ id: "s1", classId: "c1", className: "ZZ Class A", periodId: "p1", weekday: 1, subject: "ZZ Maths", room: "Lab", teacherMembershipId: "m2", teacherName: "ZZ Teacher", coveringMembershipId: null, coveringName: null, uncovered: false, borrowed: false }],
  },
  staff: STAFF,
  busy: { m3: { "1:p3": "ZZ Class B" } },
});
/** The school's day without a class; that class's week with one — the way the endpoint answers. */
const answer: Answer = ({ url }) => json(url.searchParams.get("classId") ? WEEK : DAY);
const mount = (answers: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <TimetableEditor />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/admin/timetable": answer, ...answers },
  );

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

describe("the timetable editor: the school day", () => {
  it("loads, then shows the day's periods, the breaks, and what was retired", async () => {
    const gate = gated();
    const { calls } = await mount({ "GET /api/v1/admin/timetable": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DAY));
    await screen.findByText("Period 1");
    expect(screen.getByText("09:00 – 09:45")).toBeTruthy();
    expect(screen.getByText("09:45 – 10:00 · break")).toBeTruthy();
    expect(screen.getByText("1 retired period")).toBeTruthy();
    expect(screen.getByText("ZZ Old")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/timetable")).toBe(true);
  });

  it("a period is edited in place; backwards times are caught before anything is sent", async () => {
    const { calls } = await mount({ "POST /api/v1/office/timetable/periods/p1": () => json({ ok: true, id: "p1" }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit: Period 1" }));
    expect(screen.getByLabelText("Name")).toHaveDisplayValue("Period 1");
    expect(screen.getByLabelText("Starts")).toHaveDisplayValue("09:00");
    await fireEvent.changeText(screen.getByLabelText("Ends"), "08:00");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("The period has to end after it starts.")).toBeTruthy();
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Name"), "ZZ First");
    await fireEvent.changeText(screen.getByLabelText("Ends"), "09:50");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("ZZ First updated")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/periods/p1")?.body).toEqual({ name: "ZZ First", startMinute: 540, endMinute: 590, kind: "LESSON" });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/timetable").length).toBe(2));
  });

  it("retiring asks first; a retired period comes back", async () => {
    const { calls } = await mount({ "POST /api/v1/office/timetable/periods/p3/retire": () => json({ ok: true, id: "p3" }), "POST /api/v1/office/timetable/periods/p4/retire": () => json({ ok: true, id: "p4" }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Retire: Period 2" }));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Retire Period 2" }));
    expect(await screen.findByText("Period 2 retired")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/periods/p3/retire")?.body).toEqual({ retired: true });
    await fireEvent.press(screen.getByRole("button", { name: "Bring back: ZZ Old" }));
    expect(await screen.findByText("ZZ Old is back on the day")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/periods/p4/retire")?.body).toEqual({ retired: false });
  });

  it("a new period is added with its kind", async () => {
    const { calls } = await mount({ "POST /api/v1/admin/timetable/periods": () => json({ ok: true, id: "p9" }, 201) });
    await fireEvent.press(await screen.findByRole("button", { name: "Add a period" }));
    await fireEvent.changeText(screen.getByLabelText("Name"), "ZZ Assembly");
    await fireEvent.changeText(screen.getByLabelText("Starts"), "08:30");
    await fireEvent.changeText(screen.getByLabelText("Ends"), "08:45");
    await fireEvent.press(screen.getByRole("radio", { name: "Break" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("ZZ Assembly added")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/admin/timetable/periods")?.body).toEqual({ name: "ZZ Assembly", startMinute: 510, endMinute: 525, kind: "BREAK" });
  });

  it("a school with no day yet says so, and the door is the first period", async () => {
    await mount({ "GET /api/v1/admin/timetable": () => json({ ...DAY, periods: [] }) });
    expect(await screen.findByText("No timetable yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Add one period" }));
    expect(screen.getByLabelText("Name")).toBeTruthy();
  });

  it("a refused save is the server's sentence", async () => {
    await mount({ "POST /api/v1/office/timetable/periods/p1": refused("A period has to be at least 5 minutes long.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit: Period 1" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("A period has to be at least 5 minutes long.")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/timetable": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/timetable")).length).toBe(2));
  });
});

describe("the timetable editor: a class's week", () => {
  it("opens on the class it was sent, one day at a time, with each lesson and the free periods", async () => {
    mockRouter.params = { classId: "c1" };
    const { calls } = await mount();
    await screen.findByText("ZZ Maths");
    expect(calls().some((c) => c.line === "GET /api/v1/admin/timetable?classId=c1")).toBe(true);
    expect(screen.getByRole("radio", { name: "ZZ Class A" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Monday" })).toBeChecked();
    expect(screen.getByText("ZZ Class A · Monday")).toBeTruthy();
    expect(screen.getByRole("button", { name: "ZZ Maths, Period 1 · 09:00 – 09:45 · ZZ Teacher · Lab" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Free, Period 2 · 10:00 – 10:45" })).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Class B" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/timetable?classId=c2")).toBe(true));
  });

  it("a free period opens a sheet: subject, a teacher (with who is already teaching then) and a room", async () => {
    mockRouter.params = { classId: "c1" };
    const { calls } = await mount({ "POST /api/v1/admin/timetable/slots": () => json({ ok: true, id: "s2" }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Free, Period 2 · 10:00 – 10:45" }));
    expect(screen.getByText("Add a lesson at Period 2, Monday")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Busy · Already teaching then" })).toBeTruthy();
    expect(screen.getByText("1 free at this time; 1 already teaching.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByText("Say what is taught in this lesson.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Subject"), "ZZ Hindi");
    await fireEvent.press(screen.getByRole("radio", { name: "ZZ Teacher" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("ZZ Hindi set for Monday")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/admin/timetable/slots")?.body).toEqual({ classId: "c1", periodId: "p3", weekday: 1, subject: "ZZ Hindi", teacherMembershipId: "m2", room: null });
  });

  it("taking a lesson out asks first", async () => {
    mockRouter.params = { classId: "c1" };
    const { calls } = await mount({ "POST /api/v1/office/timetable/slots/clear": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "ZZ Maths, Period 1 · 09:00 – 09:45 · ZZ Teacher · Lab" }));
    expect(screen.getByLabelText("Subject")).toHaveDisplayValue("ZZ Maths");
    await fireEvent.press(screen.getByRole("button", { name: "Remove" }));
    expect(calls().some((c) => c.line.startsWith("POST"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Remove ZZ Maths" }));
    expect(await screen.findByText("Lesson removed")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/slots/clear")?.body).toEqual({ classId: "c1", periodId: "p1", weekday: 1 });
  });

  it("a school with no classes is offered one", async () => {
    await mount({ "GET /api/v1/admin/timetable": () => json({ ...DAY, classes: [] }) });
    await screen.findByText("Period 1");
    await fireEvent.press(screen.getByRole("radio", { name: "A class's week" }));
    expect(await screen.findByText("No classes yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Create a class" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/class-new");
  });
});
