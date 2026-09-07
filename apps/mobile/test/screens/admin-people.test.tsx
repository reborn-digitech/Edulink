import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { People } from "@/screens/staff/people";
import { gated, json, mountStaff, refused } from "./staff-harness";

const person = (membershipId: string, role: string, name: string, extra: Record<string, unknown> = {}) => ({
  membershipId, role, status: "ACTIVE", name, preferredName: null, email: `${membershipId}@zz.test`, avatarKey: null, birthdateKey: null, studentCode: null, title: null, subjects: [], joinedAt: "2026-06-01T00:00:00.000Z", leftAt: null, suspendedAt: null, suspendedReason: null, enrolledIn: [], teaches: [], staffRecord: null, schoolRecord: null, scheduledDeparture: null, pendingParentInvites: [], ...extra,
});
const DIRECTORY = {
  members: [person("m2", "TEACHER", "ZZ Teacher", { teaches: ["ZZ Class A"] }), person("m7", "STUDENT", "ZZ Pupil", { studentCode: "ZZ-007", enrolledIn: ["ZZ Class A"], email: null })],
  total: 2, page: 1, pages: 1, pageSize: 50,
  classes: [{ id: "c1", name: "ZZ Class A" }],
  roleCounts: [{ role: "TEACHER", count: 1 }, { role: "STUDENT", count: 1 }],
  suspendedCount: 0, leftCount: 1,
  filters: { q: "", role: null, status: "ACTIVE", classId: null, sort: "name" },
};
const EMPTY = { ...DIRECTORY, members: [], total: 0, roleCounts: [] };
const INVITES = { invites: [{ id: "i1", role: "TEACHER", email: "new@zz.test", name: "ZZ Newcomer", classId: null, status: "PENDING", expiresAt: "2026-09-20T00:00:00.000Z", expired: false, createdAt: "2026-09-06T00:00:00.000Z", acceptedAt: null }], counts: { PENDING: 1, ACCEPTED: 4, REVOKED: 0 } };

describe("people for the office", () => {
  it("the directory loads with counts, rows, and a search that asks the API", async () => {
    const gate = gated();
    const { calls } = await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DIRECTORY));
    await screen.findByText("ZZ Teacher");
    expect(screen.getByText("1 Teacher · 1 Student")).toBeTruthy();
    expect(screen.getByText("Teacher · m2@zz.test · ZZ Class A")).toBeTruthy();
    expect(screen.getByText("Student · No email · ZZ Class A")).toBeTruthy();
    expect(screen.getByText("ZZ-007")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/people?status=ACTIVE&page=1")).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Search the directory"), "pupil");
    await fireEvent(screen.getByLabelText("Search the directory"), "submitEditing");
    await fireEvent.press(screen.getByRole("radio", { name: "Students" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/admin/people?q=pupil&role=STUDENT&status=ACTIVE&page=1")).toBe(true));
  });

  it("nobody yet offers the invitations; nobody matching offers to clear", async () => {
    await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": () => json(EMPTY) });
    expect(await screen.findByText("Nobody here yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Left (1)" }));
    expect(await screen.findByText("Nobody matches those filters")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("Nobody here yet")).toBeTruthy();
  });

  it("invites: the pending list, sending a pasted list, and withdrawing one", async () => {
    const { calls } = await mountStaff(<People />, "ADMIN", {
      "GET /api/v1/admin/people": () => json(DIRECTORY),
      "GET /api/v1/admin/people/invites": () => json(INVITES),
      "POST /api/v1/admin/people/invites": () => json({ sent: 2, outcomes: [{ email: "a@zz.test", name: "", status: "sent" }, { email: "b@zz.test", name: "", status: "sent" }], problems: [] }),
      "POST /api/v1/admin/people/invites/i1/revoke": () => json({ ok: true }),
    });
    await fireEvent.press(await screen.findByRole("radio", { name: "Invites" }));
    await screen.findByText("ZZ Newcomer");
    expect(screen.getByText("1 waiting to be accepted")).toBeTruthy();
    await fireEvent.press(screen.getByRole("radio", { name: "Student" }));
    await fireEvent.changeText(screen.getByLabelText("Emails"), "a@zz.test\nb@zz.test");
    await fireEvent.press(screen.getByRole("button", { name: "Send invitations" }));
    await screen.findByText("2 invitations sent");
    expect(calls().find((c) => c.line === "POST /api/v1/admin/people/invites")?.body).toEqual({ role: "STUDENT", csv: "a@zz.test\nb@zz.test" });
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw invitation for ZZ Newcomer" }));
    await screen.findByText("Invitation withdrawn");
    expect(calls().some((c) => c.line === "POST /api/v1/admin/people/invites/i1/revoke")).toBe(true);
  });

  it("a principal's People is the staff roster", async () => {
    await mountStaff(<People />, "PRINCIPAL", { "GET /api/v1/admin/staff": () => json({ staff: [], total: 0, roleCounts: [], subjectOptions: [] }) });
    expect(await screen.findByText("No staff yet")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mountStaff(<People />, "ADMIN", { "GET /api/v1/admin/people": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line.startsWith("GET /api/v1/admin/people")).length).toBe(2));
  });
});
