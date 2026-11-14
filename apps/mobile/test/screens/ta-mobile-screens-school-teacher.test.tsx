/**
 * The teacher's screens of the testing analysis of 13 November 2026, batch mobile-screens-school:
 * TA-166 (the gradebook's unsaved marks), TA-566 (a register mark tapped just before Back),
 * TA-169 (Try again after a failed draft) and TA-501 (taking back a leave request on the phone).
 *
 * The router here is what the Tabs navigator does to a mounted screen: `mockNav.open(params)`
 * replaces the params and every reader of useLocalSearchParams is drawn again; nothing is
 * mounted twice (as in ta-013-reopened-screen.test.tsx).
 */
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { attendanceClassesSchema, registerSchema, staffAssignmentsSchema, staffLeaveSchema, teachingGradebookSchema, teachingGradesBodySchema, teachingNewAssignmentSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { AssignmentDetail } from "@/screens/teacher/assignment-detail";
import { Register } from "@/screens/teacher/register";
import { TeacherAssignments } from "@/screens/teacher/assignments";
import { TeacherLeave } from "@/screens/teacher/leave";
import { gated, json, mountStaff, refused } from "./staff-harness";
import { callsTo, fakeApi, ID, json as tJson, renderTeacher, resetOutbox, tap } from "./teacher-support";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
const mockNav = (() => {
  let params: Record<string, string> = {};
  const readers = new Set<() => void>();
  return {
    read: () => params,
    subscribe: (reader: () => void) => {
      readers.add(reader);
      return () => {
        readers.delete(reader);
      };
    },
    open: (next: Record<string, string>) => {
      params = next;
      for (const reader of [...readers]) reader();
    },
  };
})();
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react") as typeof import("react");
  return { useRouter: () => mockRouter, usePathname: () => "/", useLocalSearchParams: () => React.useSyncExternalStore(mockNav.subscribe, mockNav.read) };
});
jest.mock("expo-image", () => {
  const React = jest.requireActual<typeof import("react")>("react");
  const { View } = jest.requireActual<typeof import("react-native")>("react-native");
  return { Image: (props: object) => React.createElement(View, { ...props, testID: "expo-image" }) };
});

beforeEach(() => {
  resetOutbox();
  mockNav.open({});
});

/* ---------------------------------------------------------------- TA-166 */

const A = "czz00000000000000000a1";
const B = "czz00000000000000000b2";
const row = (membershipId: string, name: string) => ({ membershipId, name, fullName: `${name} Rao`, avatarKey: null, submittedAt: null, submissionStatus: null, late: false, scoreMilli: null, letter: null, comment: null, gradedAt: null, work: null });
const bookOf = (id: string, title: string) =>
  teachingGradebookSchema.parse({
    assignment: { id, title, body: "", category: "Homework", subject: null, pointsMilli: 20_000, dueAt: null, publishedAt: "2026-09-01T08:00:00.000Z", classId: ID.class1, className: "ZZ 5A", attachments: [] },
    rows: [row(ID.pupil1, "ZZ Asha"), row(ID.pupil2, "ZZ Bhavesh")],
    stats: { total: 2, submitted: 0, graded: 0, averagePercent: null },
  });
const detail = () => (
  <ToastProvider>
    <AssignmentDetail />
  </ToastProvider>
);

describe("TA-166: the gradebook's unsaved marks", () => {
  it("TA-166: marks typed on one assignment are not carried to the next assignment of the class, even when its answer is already cached", async () => {
    mockNav.open({ assignmentId: B });
    await mountStaff(detail(), "TEACHER", { [`GET /api/v1/teaching/assignments/${A}`]: () => json(bookOf(A, "ZZ Homework 1")), [`GET /api/v1/teaching/assignments/${B}`]: () => json(bookOf(B, "ZZ Homework 2")) });
    await screen.findByText("ZZ Homework 2");
    // Homework 1, marks typed and not saved.
    await act(async () => mockNav.open({ assignmentId: A }));
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ Asha/ }));
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Asha"), "12");
    expect(screen.getByText("1 not saved yet")).toBeTruthy();
    // Back to Homework 2, whose answer the cache already holds: nothing of Homework 1's comes with it.
    await act(async () => mockNav.open({ assignmentId: B }));
    await screen.findByText("ZZ Homework 2");
    expect(screen.queryByText(/not saved yet/)).toBeNull();
  });

  it("TA-166: a mark typed while a save is in flight stays on screen and unsaved", async () => {
    mockNav.open({ assignmentId: A });
    const gate = gated();
    const { calls } = await mountStaff(detail(), "TEACHER", { [`GET /api/v1/teaching/assignments/${A}`]: () => json(bookOf(A, "ZZ Homework 1")), [`POST /api/v1/teaching/assignments/${A}/grades`]: gate.answer });
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ Asha/ }));
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Asha"), "12");
    await fireEvent.press(screen.getByRole("button", { name: "Save marks" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST /api/v1/teaching/assignments/${A}/grades`)).toHaveLength(1));
    // The teacher goes on to the next pupil while the save is on its way.
    await fireEvent.press(screen.getByRole("button", { name: "Next pupil" }));
    await fireEvent.changeText(screen.getByLabelText("Mark for ZZ Bhavesh"), "15");
    await act(async () => gate.open(() => json({ saved: 1, cleared: 0, rejected: 0 })));
    await screen.findByText("Marks saved: 1");
    expect(teachingGradesBodySchema.parse(calls().find((c) => c.line === `POST /api/v1/teaching/assignments/${A}/grades`)!.body).grades).toEqual([{ studentMembershipId: ID.pupil1, score: 12, comment: "" }]);
    await waitFor(() => expect(screen.getByLabelText("Mark for ZZ Bhavesh")).toHaveDisplayValue("15"));
    expect(screen.getByText("1 not saved yet")).toBeTruthy();
  });
});

/* ---------------------------------------------------------------- TA-566 */

const CLASSES = attendanceClassesSchema.parse({
  dateKey: "2026-09-07",
  today: "2026-09-07",
  calendar: { closed: false, entries: [], nonTeachingDay: false },
  classes: [{ id: ID.class1, name: "ZZ 5A", subject: null, color: null, students: 2, taken: true }],
  unmarkedCount: 0,
});
const REGISTER = registerSchema.parse({
  class: { id: ID.class1, name: "ZZ 5A", subject: null, color: null },
  dateKey: "2026-09-07",
  roster: [
    { membershipId: ID.pupil1, name: "ZZ Asha", fullName: "ZZ Asha Rao", avatarKey: null, status: "PRESENT", note: null },
    { membershipId: ID.pupil2, name: "ZZ Bhavesh", fullName: "ZZ Bhavesh Patil", avatarKey: null, status: "PRESENT", note: null },
  ],
  finalizedAt: null,
  takenAt: null,
  duty: { reason: "CLASS_TEACHER", coverUntil: null },
  readOnly: false,
  calendar: { closed: false, entries: [], nonTeachingDay: false },
});

describe("TA-566: a register mark tapped just before Back", () => {
  it("TA-566: is still sent when Back is pressed before the 700 ms batch would have gone", async () => {
    const fetch = fakeApi({ "/api/v1/staff/attendance/classes": () => tJson(CLASSES), "/api/v1/staff/attendance/register": () => tJson(REGISTER), "/api/attendance": () => tJson({ applied: 1, rejected: [] }) });
    await renderTeacher(<Register />);
    await tap(await screen.findByRole("button", { name: /ZZ 5A, 2 students/ }));
    await screen.findByText("Attendance complete");
    await tap(screen.getAllByRole("radio", { name: "Absent" })[0]!);
    await tap(screen.getByRole("button", { name: "Back" }));
    await screen.findByText("Attendance done");
    await waitFor(() => expect(callsTo(fetch, "/api/attendance")).toHaveLength(1), { timeout: 3000 });
    const body = callsTo(fetch, "/api/attendance")[0]!.body as { classId: string; marks: { studentMembershipId: string; status: string }[] };
    expect(body.classId).toBe(ID.class1);
    expect(body.marks).toEqual([expect.objectContaining({ studentMembershipId: ID.pupil1, status: "ABSENT" })]);
  });
});

/* ---------------------------------------------------------------- TA-169 */

const LIST = staffAssignmentsSchema.parse({
  year: { name: "2026-27", thisYearCount: 1, allCount: 1 },
  showingAllYears: false,
  classOptions: [{ id: ID.class1, name: "ZZ 5A" }],
  filters: { classId: null, state: null },
  total: 1,
  assignments: [
    { id: A, title: "ZZ Fractions worksheet", category: "Homework", pointsMilli: 20_000, dueAt: null, publishedAt: "2026-09-01T08:00:00.000Z", createdAt: "2026-09-01T08:00:00.000Z", class: { id: ID.class1, name: "ZZ 5A", color: null, students: 24 }, submissions: 0, graded: 0 },
  ],
});

describe("TA-169: Try again after a failed Save as draft", () => {
  it("TA-169: retries the draft, and never publishes the work or tells the class", async () => {
    let posts = 0;
    const { calls } = await mountStaff(<TeacherAssignments />, "TEACHER", {
      "GET /api/v1/staff/assignments": () => json(LIST),
      "POST /api/v1/teaching/assignments": (req) => {
        posts += 1;
        return posts === 1 ? refused("ZZ the server is busy", 503)(req) : json({ assignmentId: B, notified: 0, handouts: 0 }, 201);
      },
    });
    await fireEvent.press(await screen.findByRole("button", { name: "New assignment" }));
    await fireEvent.changeText(screen.getByLabelText("Title"), "ZZ Reading log");
    await fireEvent.press(screen.getByRole("button", { name: "Save as draft" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ the server is busy");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/teaching/assignments")).toHaveLength(2));
    const bodies = calls()
      .filter((c) => c.line === "POST /api/v1/teaching/assignments")
      .map((c) => teachingNewAssignmentSchema.parse(c.body));
    expect(bodies.map((b) => b.publish)).toEqual([false, false]);
  });
});

/* ---------------------------------------------------------------- TA-501 */

const LEAVE = staffLeaveSchema.parse({
  today: "2026-09-07",
  balance: { entitlement: 12, used: 3, pending: 1, remaining: 9, yearName: "2026-27" },
  requests: [
    { id: "l1", status: "PENDING", kind: "CASUAL", fromDateKey: "2026-09-10", toDateKey: "2026-09-11", reason: "ZZ family event", decisionNote: null, applicantName: "ZZ Teacher", applicantMembershipId: "m1", nominatedName: null, decidedByName: null, decidedAt: null },
    { id: "l2", status: "APPROVED", kind: "SICK", fromDateKey: "2026-08-03", toDateKey: "2026-08-03", reason: "ZZ fever", decisionNote: null, applicantName: "ZZ Teacher", applicantMembershipId: "m1", nominatedName: null, decidedByName: "ZZ Principal", decidedAt: "2026-08-02T10:00:00.000Z" },
    { id: "l3", status: "APPROVED", kind: "CASUAL", fromDateKey: "2026-09-20", toDateKey: "2026-09-20", reason: "ZZ wedding", decisionNote: null, applicantName: "ZZ Teacher", applicantMembershipId: "m1", nominatedName: null, decidedByName: "ZZ Principal", decidedAt: "2026-09-02T10:00:00.000Z" },
    { id: "l4", status: "DECLINED", kind: "CASUAL", fromDateKey: "2026-09-25", toDateKey: "2026-09-25", reason: "ZZ trip", decisionNote: null, applicantName: "ZZ Teacher", applicantMembershipId: "m1", nominatedName: null, decidedByName: "ZZ Principal", decidedAt: "2026-09-02T10:00:00.000Z" },
  ],
  staff: [],
});

describe("TA-501: taking back a leave request on the phone", () => {
  it("TA-501: a waiting request, or an approved one not yet begun, offers Withdraw, and the door is called only after a second tap", async () => {
    const { calls } = await mountStaff(<TeacherLeave />, "TEACHER", { "GET /api/v1/staff/leave": () => json(LEAVE), "POST /api/v1/staff/leave/l1/withdraw": () => json({ ok: true }) });
    await screen.findByText(/ZZ family event/);
    // As the web's form offers it: the waiting request and the approved one still ahead, not one begun or declined.
    expect(screen.getAllByRole("button", { name: "Withdraw this request" })).toHaveLength(2);
    await fireEvent.press(screen.getAllByRole("button", { name: "Withdraw this request" })[0]!);
    expect(screen.getByText("Withdraw this request? If somebody was down to cover, they are told.")).toBeTruthy();
    expect(calls().filter((c) => c.line.endsWith("/withdraw"))).toHaveLength(0);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    await screen.findByText("Withdrawn");
    expect(calls().filter((c) => c.line === "POST /api/v1/staff/leave/l1/withdraw")).toHaveLength(1);
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/staff/leave")).toHaveLength(2));
  });

  it("TA-501: a refused withdrawal says so and keeps the request", async () => {
    await mountStaff(<TeacherLeave />, "TEACHER", { "GET /api/v1/staff/leave": () => json(LEAVE), "POST /api/v1/staff/leave/l1/withdraw": refused("ZZ already decided", 409) });
    await screen.findByText(/ZZ family event/);
    await fireEvent.press(screen.getAllByRole("button", { name: "Withdraw this request" })[0]!);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw" }));
    expect(await screen.findByText("ZZ already decided")).toBeTruthy();
    expect(screen.getByText(/ZZ family event/)).toBeTruthy();
  });
});
