import { screen, waitFor } from "@testing-library/react-native";
import { applyLeaveSchema, staffLeaveSchema } from "@edulink/contracts";
import { TeacherLeave } from "@/screens/teacher/leave";
import { callsTo, fakeApi, ID, json, refusal, renderTeacher, resetOutbox, tap, typeInto } from "./teacher-support";
import { json as staffJson, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const LEAVE = staffLeaveSchema.parse({
  today: "2026-09-07",
  balance: { entitlement: 12, used: 3, pending: 1, remaining: 9, yearName: "2026-27" },
  requests: [
    { id: "l1", status: "PENDING", kind: "CASUAL", fromDateKey: "2026-09-10", toDateKey: "2026-09-11", reason: "ZZ family event", decisionNote: null, applicantName: "ZZ Teacher", applicantMembershipId: "m1", nominatedName: "ZZ Colleague", decidedByName: null, decidedAt: null },
    { id: "l2", status: "APPROVED", kind: "SICK", fromDateKey: "2026-08-03", toDateKey: "2026-08-03", reason: "ZZ fever", decisionNote: "Get well", applicantName: "ZZ Teacher", applicantMembershipId: "m1", nominatedName: null, decidedByName: "ZZ Principal", decidedAt: "2026-08-02T10:00:00.000Z" },
  ],
  staff: [{ membershipId: ID.staff1, name: "ZZ Colleague" }],
});

beforeEach(() => resetOutbox());

describe("leave", () => {
  it("loads the balance and the requests made", async () => {
    fakeApi({ "/api/v1/staff/leave": () => json(LEAVE) });
    await renderTeacher(<TeacherLeave />);
    expect(screen.getByRole("progressbar")).toBeTruthy();
    await screen.findByText("3 of 12 days used · 9 left");
    expect(screen.getByText("1 more being asked for")).toBeTruthy();
    expect(screen.getByText("Academic year 2026-27")).toBeTruthy();
    expect(screen.getByText(/^Casual leave · /)).toBeTruthy();
    expect(screen.getByText(/ZZ family event · suggested cover: ZZ Colleague/)).toBeTruthy();
    expect(screen.getByText("waiting")).toBeTruthy();
    expect(screen.getByText("approved")).toBeTruthy();
    expect(screen.getByText(/ZZ fever · Get well/)).toBeTruthy();
  });

  it("no entitlement and no requests read as such", async () => {
    fakeApi({ "/api/v1/staff/leave": () => json({ ...LEAVE, balance: { entitlement: null, used: 2, pending: 0, remaining: null, yearName: null }, requests: [], staff: [] }) });
    await renderTeacher(<TeacherLeave />);
    await screen.findByText("No entitlement set — 2 days approved this year");
    expect(screen.getByText("Nothing waiting")).toBeTruthy();
    expect(screen.queryByText(/Who could cover/)).toBeNull();
  });

  it("applies with the body the contract takes, a kind and a suggested cover", async () => {
    const fetch = fakeApi({ "/api/v1/staff/leave": () => json(LEAVE) });
    fetch.mockImplementation(async (input: string, init?: RequestInit) => ((init?.method ?? "GET") === "POST" ? json({ id: "l3" }) : json(LEAVE)));
    await renderTeacher(<TeacherLeave />);
    await typeInto(await screen.findByLabelText("First day away"), "2026-09-21");
    await typeInto(screen.getByLabelText("Last day away"), "2026-09-22");
    await tap(screen.getByRole("radio", { name: "Sick leave" }));
    await typeInto(screen.getByLabelText("Why"), "ZZ dentist, two days");
    await tap(screen.getByRole("radio", { name: "ZZ Colleague" }));
    await tap(screen.getByRole("button", { name: "Send to the principal" }));
    await screen.findByText("Sent to the principal");
    const post = callsTo(fetch, "/api/v1/staff/leave").find((c) => c.method === "POST")!;
    expect(applyLeaveSchema.parse(post.body)).toEqual({ fromDateKey: "2026-09-21", toDateKey: "2026-09-22", kind: "SICK", reason: "ZZ dentist, two days", nominatedCoverMembershipId: ID.staff1 });
    expect(screen.getByLabelText("Why")).toHaveDisplayValue("");
    await waitFor(() => expect(callsTo(fetch, "/api/v1/staff/leave").filter((c) => c.method === "GET")).toHaveLength(2));
  });

  it("refuses bad dates and a missing reason before asking the server", async () => {
    const fetch = fakeApi({ "/api/v1/staff/leave": () => json(LEAVE) });
    await renderTeacher(<TeacherLeave />);
    await tap(await screen.findByRole("button", { name: "Send to the principal" }));
    expect(screen.getAllByText("Give both dates as YYYY-MM-DD.").length).toBeGreaterThan(0);
    expect(screen.getByText("Say briefly why. The principal sees this and nobody else.")).toBeTruthy();
    await typeInto(screen.getByLabelText("First day away"), "2026-09-22");
    await typeInto(screen.getByLabelText("Last day away"), "2026-09-21");
    await typeInto(screen.getByLabelText("Why"), "ZZ reason");
    await tap(screen.getByRole("button", { name: "Send to the principal" }));
    expect(screen.getByText("The last day cannot be before the first.")).toBeTruthy();
    expect(callsTo(fetch, "/api/v1/staff/leave").filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("a refusal from the server is shown with a retry", async () => {
    const fetch = fakeApi({ "/api/v1/staff/leave": () => json(LEAVE) });
    fetch.mockImplementation(async (input: string, init?: RequestInit) => ((init?.method ?? "GET") === "POST" ? refusal("ZZ already approved for those days", 409) : json(LEAVE)));
    await renderTeacher(<TeacherLeave />);
    await typeInto(await screen.findByLabelText("First day away"), "2026-09-21");
    await typeInto(screen.getByLabelText("Last day away"), "2026-09-21");
    await typeInto(screen.getByLabelText("Why"), "ZZ reason");
    await tap(screen.getByRole("button", { name: "Send to the principal" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ already approved for those days");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });

  it("a refused page is an alert with a retry", async () => {
    fakeApi({ "/api/v1/staff/leave": () => refusal("ZZ not staff", 403) });
    await renderTeacher(<TeacherLeave />);
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not staff");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

/**
 * G4-27 (risks batch, 5 Oct 2026): the button names who answers. The server's `decidedBy` wins (it knows whether the
 * institution has a principal); an older server's answer has none and the role decides — the principal for a teacher,
 * FACULTY or an HOD, the office for module staff and the college's desks.
 */
describe("who the leave goes to (G4-27)", () => {
  const leaveOf = (decidedBy?: "PRINCIPAL" | "OFFICE") => () => staffJson(decidedBy ? { ...LEAVE, decidedBy } : LEAVE);

  it.each([
    ["TEACHER", "Send to the principal"],
    ["FACULTY", "Send to the principal"],
    ["HOD", "Send to the principal"],
    ["DRIVER", "Send to the office"],
    ["LIBRARIAN", "Send to the office"],
    ["WARDEN", "Send to the office"],
    ["EXAM_CONTROLLER", "Send to the office"],
    ["IQAC", "Send to the office"],
    ["TPO", "Send to the office"],
    ["ACCOUNTS", "Send to the office"],
  ] as const)("%s with no hint from the server: %s", async (role, label) => {
    await mountStaff(<TeacherLeave />, role, { "GET /api/v1/staff/leave": leaveOf() });
    expect(await screen.findByRole("button", { name: label })).toBeTruthy();
  });

  it("a college with no principal: FACULTY's request goes to the office, and the form says so throughout", async () => {
    await mountStaff(<TeacherLeave />, "FACULTY", { "GET /api/v1/staff/leave": leaveOf("OFFICE"), "POST /api/v1/staff/leave": () => staffJson({ id: "l3" }) });
    await tap(await screen.findByRole("button", { name: "Send to the office" }));
    expect(screen.queryByRole("button", { name: "Send to the principal" })).toBeNull();
    expect(screen.getByText("Say briefly why. The office sees this and nobody else.")).toBeTruthy();
    expect(screen.getByText("A suggestion. The office decides, and may name somebody else.")).toBeTruthy();
    await typeInto(screen.getByLabelText("First day away"), "2026-09-21");
    await typeInto(screen.getByLabelText("Last day away"), "2026-09-21");
    await typeInto(screen.getByLabelText("Why"), "ZZ reason");
    await tap(screen.getByRole("button", { name: "Send to the office" }));
    expect(await screen.findByText("Sent to the office")).toBeTruthy();
  });

  it("the server's hint wins over the role: a librarian at a school whose rule names the principal", async () => {
    await mountStaff(<TeacherLeave />, "LIBRARIAN", { "GET /api/v1/staff/leave": leaveOf("PRINCIPAL") });
    expect(await screen.findByRole("button", { name: "Send to the principal" })).toBeTruthy();
  });
});
