import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { LeaveDesk } from "@/screens/staff/leave";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The screen's empty state has a door into the app's own tabs; the router is the harness's, so a test can read where it went. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const candidate = (membershipId: string, name: string, clashes: number) => ({ membershipId, name, clashes, load: 10, teachesSubject: clashes === 0 });
const PENDING = {
  id: "l1",
  status: "PENDING",
  kind: "SICK",
  fromDateKey: "2026-09-10",
  toDateKey: "2026-09-11",
  reason: "ZZ reason: a fever.",
  decisionNote: null,
  applicantName: "ZZ Applicant",
  applicantMembershipId: "m5",
  nominatedName: "ZZ Cover",
  decidedByName: null,
  decidedAt: null,
  balance: { entitlement: 12, used: 4, pending: 2, remaining: 8, yearName: "2026-27" },
  dutyClasses: 1,
  suggestions: { lessonCount: 6, candidates: [candidate("m2", "ZZ Cover", 0), candidate("m3", "ZZ Busy", 2)], groups: [{ classId: "c1", className: "ZZ Class A", subject: "Maths", lessonCount: 6, candidates: [candidate("m2", "ZZ Cover", 0)] }] },
};
const DECIDED = { id: "l0", status: "APPROVED", kind: "CASUAL", fromDateKey: "2026-08-01", toDateKey: "2026-08-01", applicantName: "ZZ Earlier", applicantMembershipId: "m6", nominatedName: null, decidedByName: "ZZ Head", decidedAt: "2026-07-30T08:00:00.000Z" };
const DESK = { pending: [PENDING], decided: [DECIDED], staff: [{ membershipId: "m2", name: "ZZ Cover" }, { membershipId: "m3", name: "ZZ Busy" }] };

describe("the leave desk", () => {
  it("loads, then shows what is waiting with the balance and the cover suggestion, and what was decided", async () => {
    const gate = gated();
    await mountStaff(<LeaveDesk />, "PRINCIPAL", { "GET /api/v1/admin/leave": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DESK));
    await screen.findByText("ZZ Applicant");
    expect(screen.getByText("Waiting for you (1)")).toBeTruthy();
    expect(screen.getByText("4 of 12 used this year · 8 left")).toBeTruthy();
    expect(screen.getByText("ZZ reason: a fever.")).toBeTruthy();
    expect(screen.getByText("Applies to 1 class they are due in. They suggested ZZ Cover.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "ZZ Cover — free for all their lessons" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "ZZ Busy — already teaching through 2 of 6 lessons" })).toBeTruthy();
    expect(screen.getByText("ZZ Earlier")).toBeTruthy();
    expect(screen.getByText("approved")).toBeTruthy();
  });

  it("approving sends the decision with the cover for every slice, then says what was arranged", async () => {
    const { calls } = await mountStaff(<LeaveDesk />, "PRINCIPAL", { "GET /api/v1/admin/leave": () => json(DESK), "POST /api/v1/admin/leave/l1/decide": () => json({ ok: true, coversCreated: 1 }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Approve and arrange cover" }));
    await screen.findByText("Leave approved Cover arranged for 1 class.");
    const post = calls().find((c) => c.line === "POST /api/v1/admin/leave/l1/decide");
    expect(post?.body).toEqual({ decision: "APPROVED", coverMembershipId: "m2", coverAssignments: [{ classId: "c1", subject: "Maths", coverMembershipId: "m2" }] });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/leave").length).toBe(2));
  });

  it("declining asks why first, and sends the note without cover", async () => {
    const { calls } = await mountStaff(<LeaveDesk />, "ADMIN", { "GET /api/v1/admin/leave": () => json(DESK), "POST /api/v1/admin/leave/l1/decide": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Decline" }));
    await fireEvent.changeText(screen.getByLabelText("Why (they will see this)"), "ZZ: exams that week.");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm decline" }));
    await screen.findByText("Leave declined");
    const post = calls().find((c) => c.line === "POST /api/v1/admin/leave/l1/decide");
    expect(post?.body).toEqual({ decision: "DECLINED", note: "ZZ: exams that week.", coverMembershipId: null });
  });

  it("a refused decision is said, not swallowed", async () => {
    await mountStaff(<LeaveDesk />, "PRINCIPAL", { "GET /api/v1/admin/leave": () => json(DESK), "POST /api/v1/admin/leave/l1/decide": refused("That request has already been decided.", 409) });
    await fireEvent.press(await screen.findByRole("button", { name: "Approve and arrange cover" }));
    expect(await screen.findByText("Not saved: That request has already been decided.")).toBeTruthy();
  });

  it("nothing waiting says so", async () => {
    await mountStaff(<LeaveDesk />, "PRINCIPAL", { "GET /api/v1/admin/leave": () => json({ pending: [], decided: [], staff: [] }) });
    expect(await screen.findByText("Nothing waiting")).toBeTruthy();
    // The door out: the calendar, where approved leave shows who is away.
    await fireEvent.press(screen.getByRole("button", { name: "Calendar" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/calendar");
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<LeaveDesk />, "PRINCIPAL", { "GET /api/v1/admin/leave": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/leave").length).toBe(2));
  });
});
