import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminTimetableSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { TimetableEditor } from "@/screens/staff/timetable-editor";
import { json, mountStaff, refused, type Answer, type Answers } from "./staff-harness";

/**
 * The editor's two bulk doors: a pasted sheet checked by the server and
 * then written, and a class's week copied to its sister sections after a
 * confirm. The grid itself is held by office-timetable-editor.test.tsx.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const P1 = { id: "p1", name: "Period 1", startMinute: 540, endMinute: 585, kind: "LESSON", position: 1, archivedAt: null };
const CLASSES = [
  { id: "c1", name: "ZZ Class 5 A", gradeLevel: "5", section: "A", room: null },
  { id: "c2", name: "ZZ Class 5 B", gradeLevel: "5", section: "B", room: null },
  { id: "c3", name: "ZZ Class 5 C", gradeLevel: "5", section: "C", room: null },
  { id: "c4", name: "ZZ Class 6 A", gradeLevel: "6", section: "A", room: null },
];
const DAY = adminTimetableSchema.parse({ periods: [P1], classes: CLASSES, selectedClassId: null, grid: null, staff: [], busy: {} });
const WEEK = adminTimetableSchema.parse({
  periods: [P1],
  classes: CLASSES,
  selectedClassId: "c1",
  grid: {
    periods: [P1],
    days: [{ weekday: 1, dateKey: "2026-09-07", closed: false, closedName: null, isToday: true }],
    slots: [{ id: "s1", classId: "c1", className: "ZZ Class 5 A", periodId: "p1", weekday: 1, subject: "ZZ Maths", room: null, teacherMembershipId: null, teacherName: null, coveringMembershipId: null, coveringName: null, uncovered: false, borrowed: false }],
  },
  staff: [],
  busy: {},
});
const answer: Answer = ({ url }) => json(url.searchParams.get("classId") ? WEEK : DAY);
const SHEET = "day,period,class,subject,teacher\nMonday,1,ZZ Class 5 A,Maths,Mrs Nobody\nMonday,1,ZZ Class 9,History,";
const PREVIEW = {
  rows: [{ line: 2, weekday: 1, periodId: "p1", periodName: "Period 1", classId: "c1", className: "ZZ Class 5 A", subject: "Maths", room: null, teacherMembershipId: null, teacherName: null, teacherIssueKey: "timetable.notTeachingStaff", replaces: true }],
  problems: [{ line: 3, value: "Monday · 1 · ZZ Class 9 · History", reasonKey: "officeBulk.timetableUnknownClass", reasonVars: { class: "ZZ Class 9" } }],
  recognised: { day: true, period: true, className: true, subject: true, teacher: true, room: false },
};
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

describe("the sheet", () => {
  it("is checked by the server first — the row without its teacher and the line it cannot place are named — and written only on the button", async () => {
    const { calls } = await mount({
      "POST /api/v1/office/timetable/import/preview": () => json(PREVIEW),
      "POST /api/v1/office/timetable/import": () => json({ written: 1, replaced: 1, unstaffed: 1, classes: 1, problems: PREVIEW.problems }),
    });
    await fireEvent.press(await screen.findByRole("radio", { name: "From a sheet" }));
    expect(await screen.findByRole("button", { name: "Check the sheet" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("The sheet"), SHEET);
    await fireEvent.press(screen.getByRole("button", { name: "Check the sheet" }));
    expect(await screen.findByText("1 lessons ready to write · 1 replace a lesson already there · 1 will be written without a teacher · 1 need a look")).toBeTruthy();
    expect(screen.getByText("That person is not teaching staff at this school. · written without a teacher")).toBeTruthy();
    expect(screen.getByText('No class called "ZZ Class 9".')).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/import/preview")?.body).toEqual({ csv: SHEET });
    expect(calls().some((c) => c.line === "POST /api/v1/office/timetable/import")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Write 1 lesson" }));
    expect(await screen.findByText("1 lessons written across 1 classes. 1 are without a teacher; fill them from the free list.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/import")?.body).toEqual({ csv: SHEET });
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/timetable")).length).toBeGreaterThanOrEqual(2));
  });

  it("a sheet the server cannot read is its sentence; a school with no classes is sent to the day", async () => {
    await mount({ "POST /api/v1/office/timetable/import/preview": refused("The sheet needs day, period, class and subject columns.", 422) });
    await fireEvent.press(await screen.findByRole("radio", { name: "From a sheet" }));
    await screen.findByRole("button", { name: "Check the sheet" });
    await fireEvent.changeText(screen.getByLabelText("The sheet"), "x");
    await fireEvent.press(screen.getByRole("button", { name: "Check the sheet" }));
    expect(await screen.findByText("The sheet needs day, period, class and subject columns.")).toBeTruthy();
  });

  it("with no classes the sheet has nowhere to go, and the door is the school day", async () => {
    await mount({ "GET /api/v1/admin/timetable": () => json({ ...DAY, classes: [] }) });
    await fireEvent.press(await screen.findByRole("radio", { name: "From a sheet" }));
    expect(await screen.findByText("No classes yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "The school day" }));
    expect(await screen.findByText("Period 1")).toBeTruthy();
  });
});

describe("copy to sister sections", () => {
  it("offers the same grade's other sections, asks before it copies, and sends the chosen ones", async () => {
    mockRouter.params = { classId: "c1" };
    const { calls } = await mount({ "POST /api/v1/office/timetable/copy": () => json({ copied: 2, unstaffed: 2, classes: [{ classId: "c2", className: "ZZ Class 5 B", copied: 1 }, { classId: "c3", className: "ZZ Class 5 C", copied: 1 }] }) });
    await screen.findByText("ZZ Maths");
    expect(screen.getByRole("switch", { name: "ZZ Class 5 B" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "ZZ Class 5 C" })).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "ZZ Class 6 A" })).toBeNull();
    expect(screen.getByRole("button", { name: "Copy the week" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("switch", { name: "ZZ Class 5 B" }));
    await fireEvent.press(screen.getByRole("switch", { name: "ZZ Class 5 C" }));
    await fireEvent.press(screen.getByRole("button", { name: "Copy the week" }));
    expect(calls().some((c) => c.line === "POST /api/v1/office/timetable/copy")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Copy the week ZZ Class 5 A" }));
    expect(await screen.findByText("2 lessons copied to 2 sections, teachers left blank.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/office/timetable/copy")?.body).toEqual({ fromClassId: "c1", toClassIds: ["c2", "c3"] });
  });

  it("a class with no sister says so, and a refusal is the server's sentence", async () => {
    mockRouter.params = { classId: "c4" };
    await mount({ "GET /api/v1/admin/timetable": () => json({ ...WEEK, selectedClassId: "c4", grid: { ...WEEK.grid, slots: [{ ...WEEK.grid!.slots[0]!, classId: "c4", className: "ZZ Class 6 A" }] } }) });
    await screen.findByText("ZZ Maths");
    expect(screen.getByText("This class has no sister section to copy to.")).toBeTruthy();
  });

  it("a refused copy is the server's sentence", async () => {
    mockRouter.params = { classId: "c1" };
    await mount({ "POST /api/v1/office/timetable/copy": refused("There is nothing on that day to copy.", 422) });
    await screen.findByText("ZZ Maths");
    await fireEvent.press(screen.getByRole("switch", { name: "ZZ Class 5 B" }));
    await fireEvent.press(screen.getByRole("button", { name: "Copy the week" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm: Copy the week ZZ Class 5 A" }));
    expect(await screen.findByText("There is nothing on that day to copy.")).toBeTruthy();
  });
});
