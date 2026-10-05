import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { operatorPartnersSchema, operatorPlansSchema, operatorSchoolDetailSchema, operatorSchoolSupportSchema } from "@edulink/contracts";
import { OperatorSchool } from "@/screens/operator/school";
import { ToastProvider } from "@/components";
import { API_BASE } from "@/lib/api";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: { schoolId: "s1" } as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

beforeEach(() => {
  mockRouter.params = { schoolId: "s1" };
  mockRouter.back.mockClear();
});

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};

const NOW = Date.now();
const ago = (ms: number) => new Date(NOW - ms).toISOString();

const DETAIL = operatorSchoolDetailSchema.parse({
  school: {
    id: "s1",
    name: "ZZ Northgate",
    code: "NORTH-7X9K",
    contactEmail: "office@zz.test",
    contactPhone: null,
    website: null,
    addressLine: null,
    city: "Pune",
    region: "Maharashtra",
    postalCode: null,
    country: "India",
    gradeLow: "1",
    gradeHigh: "10",
    timezone: "Asia/Kolkata",
    createdAt: ago(3 * 86_400_000),
    removedAt: null,
    verifiedAt: null,
  },
  invites: [
    { id: "i1", email: "head@zz.test", name: "ZZ Head", role: "PRINCIPAL", status: "PENDING", createdAt: ago(2 * 3_600_000), expiresAt: ago(-7 * 86_400_000) },
    { id: "i2", email: "admin@zz.test", name: null, role: "ADMIN", status: "ACCEPTED", createdAt: ago(5 * 86_400_000), expiresAt: ago(-2 * 86_400_000) },
  ],
  access: [{ id: "x1", operatorName: "ZZ Operator", reason: "ZZ checking the register", startedAt: ago(3_600_000), live: false }],
  // The commercial record (2026-10-02): a trial twelve days from its due date, a clerk to call, a partner at 12.5 %.
  subscription: { status: "TRIAL", startsAt: "2026-09-14", dueAt: "2026-10-14", daysToDue: 12, invoicedAt: null, invoiceRef: null, paidAt: null, paidRef: null },
  contact: { name: "ZZ Clerk", role: "Clerk", phone: "+910000000001", email: null },
  commission: { partnerId: "cp1", partnerName: "ZZ Partner", percentTenths: 125 },
});
const PARTNERS = operatorPartnersSchema.parse({
  items: [
    { id: "cp1", name: "ZZ Partner", phone: null, email: null, percentTenths: 125, notes: "", createdAt: ago(30 * 86_400_000), schools: [], owedThisMonthPaise: 0 },
    { id: "cp2", name: "ZZ Other", phone: null, email: null, percentTenths: 50, notes: "", createdAt: ago(30 * 86_400_000), schools: [], owedThisMonthPaise: 0 },
  ],
});
const REMOVED = { ...DETAIL, school: { ...DETAIL.school, removedAt: ago(86_400_000) } };

/** The school's office, its plan and this month's usage — the support read (2026-10-01). */
const SUPPORT = operatorSchoolSupportSchema.parse({
  admins: [
    { userId: "u-admin", name: "ZZ Admin", email: "admin@zz.test", role: "ADMIN", liveSessions: 2, lastSeenAt: ago(3_600_000) },
    { userId: "u-head", name: "ZZ Head", email: null, role: "PRINCIPAL", liveSessions: 0, lastSeenAt: null },
  ],
  plan: { id: "p1", code: "starter", name: "Starter" },
  planSince: ago(10 * 86_400_000),
  usage: {
    month: "2026-10",
    plan: { id: "p1", code: "starter", name: "Starter" },
    counts: { pupils: 120, messages: 2300, storageMb: 40, activeUsers: 61 },
    caps: { pupils: 100, messages: 5000, storageMb: null },
    over: { pupils: true, messages: false, storageMb: false },
    computedAt: ago(6 * 3_600_000),
  },
});
const PLANS = operatorPlansSchema.parse({
  items: [
    { id: "p1", code: "starter", name: "Starter", pupilCap: 100, messageCap: 5000, storageCapMb: null, priceMonthlyPaise: 49900, createdAt: ago(30 * 86_400_000), schools: 1 },
    { id: "p2", code: "campus", name: "Campus", pupilCap: null, messageCap: null, storageCapMb: 2048, priceMonthlyPaise: null, createdAt: ago(30 * 86_400_000), schools: 0 },
  ],
});
const CHECKED = { ...DETAIL, school: { ...DETAIL.school, verifiedAt: ago(2 * 86_400_000) } };

const mount = (overrides: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <OperatorSchool />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/operator/schools/s1": () => json(DETAIL), "GET /api/v1/operator/schools/s1/support": () => json(SUPPORT), "GET /api/v1/operator/plans": () => json(PLANS), "GET /api/v1/operator/partners": () => json(PARTNERS), ...overrides },
    { me: OPERATOR },
  );

describe("one school, for the operator", () => {
  it("loads, then shows the name, the join code and zone, the invitations, who has looked inside, and the one door to the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const gate = gated();
    await mount({ "GET /api/v1/operator/schools/s1": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(DETAIL));
    expect(await screen.findByText("ZZ Northgate")).toBeTruthy();
    expect(screen.getByText("Join code NORTH-7X9K · Asia/Kolkata")).toBeTruthy();
    // Twice: in the invitations and, pending, under "Help the office" with its send-again door.
    // That card is drawn from the support read, a query of its own that can
    // land after the school's (CI's runner, 2026-10-01), so it is waited for.
    await waitFor(() => expect(screen.getAllByText("head@zz.test")).toHaveLength(2));
    expect(screen.getByText(/^Principal · ZZ Head · 2 hours ago/)).toBeTruthy();
    expect(screen.getByText("Pending")).toBeTruthy();
    expect(screen.getByText("Accepted")).toBeTruthy();
    // Only the pending invitation can be withdrawn.
    expect(screen.getByRole("button", { name: "Revoke: head@zz.test" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Revoke: admin@zz.test" })).toBeNull();
    expect(screen.getByText(/^ZZ checking the register · /)).toBeTruthy();
    expect(screen.getByLabelText("City").props.value).toBe("Pune");
    expect(screen.getByText("Erasing stays on the web on purpose: nothing comes back, so it asks for the school's exact name there.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Erase school permanently" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/s1`);
    open.mockRestore();
  });

  it("invites a principal by email, then says so and reads the page again; a refusal stays under the email", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/schools/s1/invites": () => (refuse ? json({ error: "An invitation is already waiting for them.", code: "BAD_REQUEST" }, 422) : json({ ok: true }, 201)),
    });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "Principal" }));
    expect(screen.getByText("Reads the school whole, and decides who may be away. No attendance marking, no gradebook.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Email"), " new-head@zz.test ");
    await fireEvent.changeText(screen.getByLabelText("Name (optional)"), "ZZ New Head");
    await fireEvent.press(screen.getByRole("button", { name: "Send invitation" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/invites")?.body).toEqual({ email: "new-head@zz.test", name: "ZZ New Head", role: "PRINCIPAL" }));
    expect(await screen.findByText("Invitation sent")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBe(2));
    expect(screen.getByLabelText("Email").props.value).toBe("");

    refuse = true;
    await fireEvent.changeText(screen.getByLabelText("Email"), "head@zz.test");
    await fireEvent.press(screen.getByRole("button", { name: "Send invitation" }));
    expect(await screen.findByText("An invitation is already waiting for them.")).toBeTruthy();
    // The role chosen stays chosen after a send: a second principal is one field away. No name, no name sent.
    expect(calls().filter((c) => c.line === "POST /api/v1/operator/schools/s1/invites")[1]?.body).toEqual({ email: "head@zz.test", role: "PRINCIPAL" });
  });

  it("withdraws a pending invitation only after a confirm; a refusal is a toast with the server's sentence", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/invites/i1/revoke": () => (refuse ? json({ error: "That invitation is no longer pending.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await screen.findByText("ZZ Northgate");
    await fireEvent.press(screen.getByRole("button", { name: "Revoke: head@zz.test" }));
    expect(screen.getByText("Withdraw the invitation to head@zz.test? The link in it stops working.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(calls().some((c) => c.line.endsWith("/revoke"))).toBe(false);

    await fireEvent.press(screen.getByRole("button", { name: "Revoke: head@zz.test" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/operator/invites/i1/revoke")).toBe(true));
    expect(await screen.findByText("Invitation withdrawn")).toBeTruthy();

    refuse = true;
    await fireEvent.press(screen.getByRole("button", { name: "Revoke: head@zz.test" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Not revoked: That invitation is no longer pending.")).toBeTruthy();
  });

  it("corrects the details, sending only what changed; the lib's refusal is an alert above the button", async () => {
    let refuse = false;
    const { calls } = await mount({
      "PATCH /api/v1/operator/schools/s1": () => (refuse ? json({ error: "The lowest grade cannot be above the highest.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("City"), " ZZ Nashik ");
    await fireEvent.changeText(screen.getByLabelText("Lowest grade"), "3");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(calls().find((c) => c.line === "PATCH /api/v1/operator/schools/s1")?.body).toEqual({ city: "ZZ Nashik", gradeLow: "3" }));
    expect(await screen.findByText("Saved")).toBeTruthy();

    refuse = true;
    await fireEvent.changeText(screen.getByLabelText("Highest grade"), "2");
    await fireEvent.press(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("The lowest grade cannot be above the highest.")).toBeTruthy();
    // The form keeps what was typed, so the operator corrects it rather than starting again.
    expect(screen.getByLabelText("Highest grade").props.value).toBe("2");
  });

  it("a school not yet checked: says what waits on the check, and approves only after a confirm; Keep sends nothing", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/verification": () => json({ ok: true }) });
    expect(await screen.findByText("Has this school been checked?")).toBeTruthy();
    expect(screen.getByText("Awaiting check")).toBeTruthy();
    expect(screen.getByText(/^Nobody has checked this school yet\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Withdraw approval" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Approve school" }));
    expect(screen.getByText("Approve this school? It will be able to bring over pupils who have left another school.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(calls().some((c) => c.line === "POST /api/v1/operator/schools/s1/verification")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Approve school" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/verification")?.body).toEqual({ verified: true }));
    expect(await screen.findByText("School approved")).toBeTruthy();
    // The page is read again, so the mark shows as the server holds it.
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBeGreaterThanOrEqual(2));
  });

  it("a checked school: says when, and withdraws the approval after a confirm; a refusal is a toast with the server's sentence", async () => {
    const { calls } = await mount({
      "GET /api/v1/operator/schools/s1": () => json(CHECKED),
      "POST /api/v1/operator/schools/s1/verification": () => json({ ok: true }),
    });
    expect(await screen.findByText("Checked 2 days ago")).toBeTruthy();
    expect(screen.getByText(/^This school has been checked\./)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Approve school" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Withdraw approval" }));
    expect(screen.getByText(/^Withdraw this school's approval\?/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/verification")?.body).toEqual({ verified: false }));
    expect(await screen.findByText("Approval withdrawn")).toBeTruthy();
  });

  it("the check refused by the server: the sentence is a toast and the question stays open", async () => {
    await mount({ "POST /api/v1/operator/schools/s1/verification": refused("That school has been removed from this server.", 422) });
    await fireEvent.press(await screen.findByRole("button", { name: "Approve school" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("That school has been removed from this server.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
  });

  it("removes only behind the school's exact name, typed, and sends the name for the server to check too", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/remove": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    const typed = screen.getByLabelText("Type the school's name to confirm removing it: ZZ Northgate");
    expect(screen.getByRole("button", { name: "Remove school" })).toBeDisabled();
    await fireEvent.changeText(typed, "ZZ Northgat");
    expect(screen.getByText("That did not match the school's name, so nothing was removed.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Remove school" })).toBeDisabled();
    await fireEvent.changeText(typed, " ZZ Northgate ");
    await fireEvent.press(screen.getByRole("button", { name: "Remove school" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/remove")?.body).toEqual({ confirmName: "ZZ Northgate" }));
    expect(await screen.findByText("School removed")).toBeTruthy();
  });

  it("a removed school: the badge, what removal did, and restore after a confirm — no invitations, no removal", async () => {
    const { calls } = await mount({
      "GET /api/v1/operator/schools/s1": () => json(REMOVED),
      "POST /api/v1/operator/schools/s1/restore": () => json({ ok: true }),
    });
    expect(await screen.findByText("removed yesterday")).toBeTruthy();
    expect(screen.getByText("Removed")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Remove school" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Approve school" })).toBeNull();
    expect(screen.queryByLabelText("Email")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Restore school" }));
    expect(screen.getByText("Put this school back on the server? Everything removal ended comes back.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/operator/schools/s1/restore")).toBe(true));
    expect(await screen.findByText("School restored")).toBeTruthy();
  });

  it("with no school id: an empty state whose door goes back", async () => {
    mockRouter.params = {};
    await mount();
    expect(await screen.findByText("No such school.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "All schools" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/schools/s1": refused("No such school.", 503) });
    expect(await screen.findByRole("alert")).toHaveTextContent("No such school.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBe(2));
  });
});

describe("help for the office, the plan and the usage (2026-10-01)", () => {
  it("lists the school's admins with their live sessions, the plan and since when, and this month's usage with the over-cap figure", async () => {
    await mount();
    await screen.findByText("ZZ Northgate");
    expect(await screen.findByText("ZZ Admin")).toBeTruthy();
    expect(screen.getByText("2 live sessions")).toBeTruthy();
    expect(screen.getByText(/^Administrator · admin@zz.test · Last seen 1 hour ago/)).toBeTruthy();
    expect(screen.getByText("Not signed in anywhere")).toBeTruthy();
    expect(screen.getByText("On this plan last week")).toBeTruthy();
    expect(screen.getByText("Usage · 2026-10")).toBeTruthy();
    expect(screen.getByText("Over cap")).toBeTruthy();
    expect(screen.getByLabelText("Pupils: 120 of 100")).toBeTruthy();
    expect(screen.getByLabelText("Texts: 2,300 of 5,000".replace(/,/g, ""))).toBeTruthy();
    expect(screen.getByLabelText("Storage: 40 MB")).toBeTruthy();
    expect(screen.getByLabelText("Active people: 61")).toBeTruthy();
    expect(screen.getByText("Counted 6 hours ago")).toBeTruthy();
  });

  it("sends a pending invitation again, with the toast; a refusal is a toast with the server's sentence", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/schools/s1/support/resend-invite": () => (refuse ? json({ error: "That invitation is no longer pending.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Send again: head@zz.test" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/support/resend-invite")?.body).toEqual({ inviteId: "i1" }));
    expect(await screen.findByText("Invitation sent again with a fresh link")).toBeTruthy();
    refuse = true;
    await fireEvent.press(screen.getByRole("button", { name: "Send again: head@zz.test" }));
    expect(await screen.findByText("That invitation is no longer pending.")).toBeTruthy();
  });

  it("emails an admin a sign-in link only after a confirm that says no password is set; Keep sends nothing", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/support/sign-in-link": () => json({ ok: true }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Email a sign-in link: ZZ Admin" }));
    expect(screen.getByText("Email ZZ Admin a one-time sign-in link? No password is set or shown to you.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(calls().some((c) => c.line.endsWith("/sign-in-link"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Email a sign-in link: ZZ Admin" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/support/sign-in-link")?.body).toEqual({ userId: "u-admin" }));
    expect(await screen.findByText("Sign-in link sent; it works once, for twenty minutes")).toBeTruthy();
  });

  it("signs an admin out everywhere after a confirm, and says how many sessions ended; a refusal is a toast", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/schools/s1/support/sign-out": () => (refuse ? json({ error: "That account is disabled.", code: "BAD_REQUEST" }, 422) : json({ ok: true, sessionsEnded: 2 })),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Sign out everywhere: ZZ Admin" }));
    expect(screen.getByText(/^Sign ZZ Admin out of every device\?/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/support/sign-out")?.body).toEqual({ userId: "u-admin" }));
    expect(await screen.findByText("Signed out of 2 sessions")).toBeTruthy();
    refuse = true;
    await fireEvent.press(screen.getByRole("button", { name: "Sign out everywhere: ZZ Head" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("That account is disabled.")).toBeTruthy();
  });

  it("changes the plan from the list of plans, the button waiting for a change; the manage door opens the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/plan": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    expect(await screen.findByRole("radio", { name: "Campus (campus)" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Set plan" })).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "No plan" }));
    await fireEvent.press(screen.getByRole("button", { name: "Set plan" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/plan")?.body).toEqual({ planId: null }));
    expect(await screen.findByText("Plan set; the school's office has been told")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Manage plans" }));
    expect(open).toHaveBeenCalledWith(`${API_BASE}/root/plans`);
    open.mockRestore();
  });

  it("a school the nightly job has not counted yet says so, and a support read that fails is an alert with a retry", async () => {
    const { calls } = await mount({ "GET /api/v1/operator/schools/s1/support": () => json({ ...SUPPORT, usage: { ...SUPPORT.usage, counts: null, over: { pupils: false, messages: false, storageMb: false }, computedAt: null } }) });
    await screen.findByText("ZZ Northgate");
    expect(await screen.findByText("Not written yet — the nightly job has not run for this month.")).toBeTruthy();
    expect(screen.queryByText("Over cap")).toBeNull();
    expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1/support").length).toBe(1);
  });

  it("the subscription card: where it stands, the partner line; a change sends only what changed with its reason, and a refusal stays above the fields", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/schools/s1/subscription": () => (refuse ? json({ error: "That status cannot follow the current one.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await screen.findByText("ZZ Northgate");
    // Twice: the pill and the chip.
    expect(screen.getAllByText("Trial")).toHaveLength(2);
    expect(screen.getByText("Due in 12 days")).toBeTruthy();
    // The pill and the partner chip.
    expect(screen.getAllByText("ZZ Partner · 12.5%")).toHaveLength(2);
    const save = screen.getByRole("button", { name: "Save subscription" });
    expect(save).toBeDisabled();
    await fireEvent.press(screen.getByRole("radio", { name: "Active" }));
    await fireEvent.changeText(screen.getByLabelText("Paid on"), "2026-10-02");
    await fireEvent.changeText(screen.getByLabelText("Payment reference"), " UTR-1 ");
    // No reason yet: the button waits.
    expect(save).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Reason for the change"), "seen on the statement");
    await fireEvent.press(save);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/subscription")?.body).toEqual({ status: "ACTIVE", paidAt: "2026-10-02", paidRef: "UTR-1", reason: "seen on the statement" }));
    expect(await screen.findByText("Subscription saved")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBe(2));

    refuse = true;
    await fireEvent.press(screen.getByRole("radio", { name: "Ended" }));
    await fireEvent.changeText(screen.getByLabelText("Reason for the change"), "no");
    await fireEvent.press(screen.getByRole("button", { name: "Save subscription" }));
    expect(await screen.findByText("That status cannot follow the current one.")).toBeTruthy();
  });

  it("the subscription card: a date that is not a day holds the button; the partner is changed from the partners read", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/subscription": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    await fireEvent.changeText(screen.getByLabelText("Due on"), "14/10/2026");
    await fireEvent.changeText(screen.getByLabelText("Reason for the change"), "moved");
    expect(screen.getByRole("button", { name: "Save subscription" })).toBeDisabled();
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Due on"), "2026-10-14");
    await fireEvent.press(await screen.findByRole("radio", { name: "ZZ Other · 5%" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save subscription" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/subscription")?.body).toEqual({ commissionPartnerId: "cp2", reason: "moved" }));
  });

  it("the point of contact: the fields hold what is recorded, the button waits for a change, and a save reads the page again", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/schools/s1/contact": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByLabelText("Contact phone number").props.value).toBe("+910000000001");
    expect(screen.getByRole("button", { name: "Save contact" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Contact role"), " Head clerk ");
    await fireEvent.press(screen.getByRole("button", { name: "Save contact" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/contact")?.body).toEqual({ name: "ZZ Clerk", role: "Head clerk", phone: "+910000000001", email: null }));
    expect(await screen.findByText("Contact saved")).toBeTruthy();
  });
});
