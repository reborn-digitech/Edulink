import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { adminClassesSchema, adminInvitesSchema, inviteCreatedSchema, officeInvitePreviewSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { InvitePeople } from "@/screens/staff/invites";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const INVITES = adminInvitesSchema.parse({
  invites: [
    { id: "i1", role: "TEACHER", email: "new@zz.test", name: "ZZ Newcomer", classId: null, status: "PENDING", expiresAt: "2026-09-20T00:00:00.000Z", expired: false, createdAt: "2026-09-06T00:00:00.000Z", acceptedAt: null },
    { id: "i2", role: "STUDENT", email: "late@zz.test", name: null, classId: null, status: "PENDING", expiresAt: "2026-09-01T00:00:00.000Z", expired: true, createdAt: "2026-08-20T00:00:00.000Z", acceptedAt: null },
  ],
  counts: { PENDING: 2, ACCEPTED: 4, REVOKED: 0 },
});
const CLASSES = adminClassesSchema.parse({
  classes: [{ id: "c1", name: "ZZ Class A", subject: null, gradeLevel: "6", section: "A", room: null, color: null, joinCode: "ZZAAAA", archivedAt: null, pupils: 30, teachers: [], leaderless: true }],
  activeCount: 1,
  archivedCount: 0,
  leaderlessCount: 1,
});
const PREVIEW = officeInvitePreviewSchema.parse({
  valid: [
    { line: 1, name: "ZZ Priya", email: "priya@zz.test", subjects: ["Maths"] },
    { line: 2, name: "", email: "tom@zz.test", subjects: [] },
  ],
  problems: [{ line: 3, value: "not-an-address", reasonKey: "invites.invalidEmail" }],
});
const SENT = inviteCreatedSchema.parse({
  sent: 2,
  outcomes: [
    { email: "priya@zz.test", name: "ZZ Priya", status: "sent" },
    { email: "tom@zz.test", name: "", status: "sent" },
    { email: "dup@zz.test", name: "", status: "skipped", reasonKey: "invites.alreadyInvited" },
  ],
  problems: [],
});
const LIST = "ZZ Priya,priya@zz.test,Maths\ntom@zz.test\nnot-an-address";
const BASE: Answers = { "GET /api/v1/admin/people/invites": () => json(INVITES), "GET /api/v1/admin/classes": () => json(CLASSES) };
const mount = (answers: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <InvitePeople />
    </ToastProvider>,
    "ADMIN",
    { ...BASE, ...answers },
  );

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

describe("inviting people", () => {
  it("loads, then shows the invitations still waiting and the class chips", async () => {
    const gate = gated();
    const { calls } = await mount({ "GET /api/v1/admin/people/invites": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(INVITES));
    await screen.findByText("ZZ Newcomer");
    expect(screen.getByText("Pending (2)")).toBeTruthy();
    expect(screen.getByText(/^Teacher · new@zz\.test · Expires /)).toBeTruthy();
    expect(screen.getByText("late@zz.test")).toBeTruthy();
    expect(screen.getByText("Expired")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Teacher" })).toBeChecked();
    expect(await screen.findByRole("radio", { name: "ZZ Class A" })).toBeTruthy();
    expect(screen.getByText("Assign to class")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Check the list" })).toBeDisabled();
    expect(calls().some((c) => c.line === "GET /api/v1/admin/people/invites")).toBe(true);
  });

  it("checks the list with the server's parser first, then sends it with the role and the class", async () => {
    const { calls } = await mount({ "POST /api/v1/office/invites/preview": () => json(PREVIEW), "POST /api/v1/admin/people/invites": () => json(SENT) });
    await screen.findByText("ZZ Newcomer");
    await fireEvent.press(screen.getByRole("radio", { name: "Student" }));
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Class A" }));
    expect(screen.getByText("Add to class")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Emails"), LIST);
    await fireEvent.press(screen.getByRole("button", { name: "Check the list" }));
    await screen.findByText("2 ready to invite · 1 need a look");
    expect(calls().find((c) => c.line === "POST /api/v1/office/invites/preview")?.body).toEqual({ csv: LIST });
    expect(screen.getByText("ZZ Priya, tom@zz.test")).toBeTruthy();
    expect(screen.getByText("line 3 · not-an-address")).toBeTruthy();
    expect(screen.getByText("Not a valid email address")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/admin/people/invites")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Send 2 invitations" }));
    expect(await screen.findByText("2 invitations sent")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/admin/people/invites")?.body).toEqual({ role: "STUDENT", csv: LIST, classId: "c1" });
    expect(screen.getByText("2 invitations on the way")).toBeTruthy();
    expect(screen.getByText("1 not sent")).toBeTruthy();
    expect(screen.getByText("An invitation is already waiting for them")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/people/invites").length).toBe(2));
    await fireEvent.press(screen.getByRole("button", { name: "Invite more" }));
    expect(screen.getByLabelText("Emails")).toHaveDisplayValue("");
  });

  it("typing again after a check asks for a fresh one before anything is sent", async () => {
    await mount({ "POST /api/v1/office/invites/preview": () => json(PREVIEW) });
    await fireEvent.changeText(await screen.findByLabelText("Emails"), LIST);
    await fireEvent.press(screen.getByRole("button", { name: "Check the list" }));
    await screen.findByRole("button", { name: "Send 2 invitations" });
    await fireEvent.changeText(screen.getByLabelText("Emails"), `${LIST}\nmore@zz.test`);
    expect(screen.queryByRole("button", { name: "Send 2 invitations" })).toBeNull();
    expect(screen.getByRole("button", { name: "Check the list" })).toBeTruthy();
  });

  it("resends at once; withdrawing asks first, then posts and says so", async () => {
    const { calls } = await mount({ "POST /api/v1/office/invites/i1/resend": () => json({ ok: true }), "POST /api/v1/admin/people/invites/i1/revoke": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Resend invitation to ZZ Newcomer" }));
    expect(await screen.findByText("Invitation resent")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/office/invites/i1/resend")).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw invitation for ZZ Newcomer" }));
    expect(calls().some((c) => c.line.endsWith("/revoke"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw? ZZ Newcomer" }));
    expect(await screen.findByText("Invitation withdrawn")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/admin/people/invites/i1/revoke")).toBe(true);
  });

  it("nobody waiting says so, with a door to the list; a checklist step's role arrives chosen", async () => {
    mockRouter.params = { role: "STUDENT" };
    await mount({ "GET /api/v1/admin/people/invites": () => json({ invites: [], counts: { PENDING: 0, ACCEPTED: 0, REVOKED: 0 } }) });
    expect(await screen.findByText("No invitations waiting")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Student" })).toBeChecked();
    await fireEvent.press(screen.getByRole("button", { name: "Invite people" }));
    expect(screen.getByLabelText("Emails")).toBeTruthy();
  });

  it("a refused send is the server's sentence, and the list stays as typed", async () => {
    await mount({ "POST /api/v1/office/invites/preview": () => json(PREVIEW), "POST /api/v1/admin/people/invites": refused("That list is too large. Split it into smaller batches.", 422) });
    await fireEvent.changeText(await screen.findByLabelText("Emails"), LIST);
    await fireEvent.press(screen.getByRole("button", { name: "Check the list" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Send 2 invitations" }));
    expect(await screen.findByText("That list is too large. Split it into smaller batches.")).toBeTruthy();
    expect(screen.getByLabelText("Emails")).toHaveDisplayValue(LIST);
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/admin/people/invites": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/admin/people/invites").length).toBe(2));
  });
});

describe("inviting a module role's staff (3 Oct 2026)", () => {
  it("offers a driver, the library's desk and a warden, never an alumnus, and no class for them", async () => {
    await mount();
    await screen.findByText("ZZ Newcomer");
    expect(await screen.findByRole("radio", { name: "ZZ Class A" })).toBeTruthy();
    for (const name of ["Driver", "Librarian", "Warden"]) expect(screen.getByRole("radio", { name })).toBeTruthy();
    expect(screen.queryByRole("radio", { name: "Alumnus" })).toBeNull();
    await fireEvent.press(screen.getByRole("radio", { name: "Driver" }));
    expect(screen.getByRole("radio", { name: "Driver" })).toBeChecked();
    expect(screen.queryByRole("radio", { name: "ZZ Class A" })).toBeNull();
  });
});
