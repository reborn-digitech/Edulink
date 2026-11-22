import { AccessibilityInfo, Linking, Platform } from "react-native";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { onlineManager } from "@tanstack/react-query";
import { operatorPartnersSchema, operatorPlansSchema, operatorSchoolDetailSchema, operatorSchoolSupportSchema, schoolTermsSchema } from "@edulink/contracts";
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

/** The school's terms (decision 0010; phase 8): its own 20 % off our ₹100, premium for students on and not billed while the Student plan is not asked for. */
const TERMS = schoolTermsSchema.parse({
  schoolId: "s1",
  name: "ZZ Northgate",
  kind: "SCHOOL",
  planCode: "starter",
  termsSet: true,
  termsSetAt: ago(86_400_000),
  subscription: { mode: "OWN_DISCOUNT", discountBps: 2000 },
  subscriptionFigure: { basePaise: 10_000, discountBps: 2000, paysPaise: 8000, source: "OWN_DISCOUNT", tierCode: null },
  premiumStudents: true,
  premiumTeachers: false,
  premium: { mode: "OURS" },
  premiumFigure: { basePaise: 5000, discountBps: 0, paysPaise: 5000, source: "OURS", tierCode: null },
  premiumBilled: false,
  premiumNotBilled: "PLAN_NOT_ASKED",
  premiumWaitsFor: ["STUDENT"],
  note: "ZZ the head asked",
  status: "TRIAL",
  startsOn: "2026-09-14",
  renewsOn: "2026-10-14",
  paidOn: null,
  state: "FREE",
  stateDay: "2026-10-14",
  noTierChosen: false,
  pupils: 412,
  bill: null,
});

const mount = (overrides: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <OperatorSchool />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/operator/schools/s1": () => json(DETAIL), "GET /api/v1/operator/schools/s1/support": () => json(SUPPORT), "GET /api/v1/operator/plans": () => json(PLANS), "GET /api/v1/operator/partners": () => json(PARTNERS), "GET /api/v1/operator/schools/s1/terms": () => json(TERMS), ...overrides },
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

  it("the corrections card: where it stands, the partner line; the payment shown, never typed; Trial and Due named with the renewal date while nothing is paid; a change sends only what changed with its reason, and a refusal stays above the fields", async () => {
    let refuse = false;
    const { calls } = await mount({
      "POST /api/v1/operator/schools/s1/subscription": () => (refuse ? json({ error: "That status cannot follow the current one.", code: "BAD_REQUEST" }, 422) : json({ ok: true })),
    });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByText("Status and dates (corrections)")).toBeTruthy();
    // The pill names the status; the chips name the renewal date with Trial and Due while nothing is paid (C1).
    expect(screen.getByText("Trial")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Trial: free until 14/10/2026" })).toBeTruthy();
    expect(screen.getByText("Due in 12 days")).toBeTruthy();
    // The pill and the partner chip.
    expect(screen.getAllByText("ZZ Partner · 12.5%")).toHaveLength(2);
    // The payment is recorded with Record payment on the web: shown here, never typed (§7).
    expect(screen.getByText("No payment recorded yet.")).toBeTruthy();
    expect(screen.queryByLabelText("Paid on")).toBeNull();
    expect(screen.queryByLabelText("Payment reference")).toBeNull();
    const save = screen.getByRole("button", { name: "Save subscription" });
    expect(save).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Due on"), "2026-10-01");
    await fireEvent.press(screen.getByRole("radio", { name: "Due: owed from 01/10/2026" }));
    // No reason yet: the button waits. The reason's hint says the school can read it.
    expect(save).toBeDisabled();
    expect(screen.getByText("The school can read this reason.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Reason for the change"), "the renewal was the 1st");
    await fireEvent.press(save);
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/schools/s1/subscription")?.body).toEqual({ status: "DUE", dueAt: "2026-10-01", reason: "the renewal was the 1st" }));
    expect(await screen.findByText("Subscription saved")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1").length).toBe(2));

    refuse = true;
    await fireEvent.press(screen.getByRole("radio", { name: "Ended" }));
    await fireEvent.changeText(screen.getByLabelText("Reason for the change"), "no");
    await fireEvent.press(screen.getByRole("button", { name: "Save subscription" }));
    expect(await screen.findByText("That status cannot follow the current one.")).toBeTruthy();
  });

  it("the corrections card at a school that has paid: the payment read-only with its reference, and Trial and Due as plain statuses", async () => {
    const PAID = { ...DETAIL, subscription: { ...DETAIL.subscription, status: "ACTIVE" as const, paidAt: "2026-10-02", paidRef: "UTR-1" } };
    await mount({ "GET /api/v1/operator/schools/s1": () => json(PAID) });
    await screen.findByText("ZZ Northgate");
    expect(screen.getByText("Paid on 02/10/2026, reference UTR-1. A payment is changed only by recording one.")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Trial" })).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Due" })).toBeTruthy();
    expect(screen.queryByText("No payment recorded yet.")).toBeNull();
  });

  it("the subscription and premium card: what the school pays and premium's switches; a switch is asked first with what it does, written on Confirm against the terms as read with no Undo, and Keep writes nothing", async () => {
    const after = { ...TERMS, premiumTeachers: true };
    const SAID = "ZZ Northgate will get premium for teachers. 2 people at the school will be told.";
    const { calls } = await mount({
      "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
        const preview = Boolean((JSON.parse(String(init.body)) as { preview?: boolean }).preview);
        return json({ preview, terms: after, changed: true, told: 2, ...(preview ? { sentence: SAID } : {}) });
      },
    });
    await screen.findByText("ZZ Northgate");
    // The web card's lines (C7 point 7e): the subscription a student a year + GST and how; premium on and not billed, why
    // alone in the price's place (C2b, C3), said once, as the school's; a switch carries no hint of another role's.
    expect(await screen.findByText("Shalaghar subscription: ₹80 a student a year + GST (its own 20 % off our ₹100)")).toBeTruthy();
    expect(screen.getAllByText("Premium add-on: Premium on, not billed: the Student plan is not asked for")).toHaveLength(1);
    const students = screen.getByRole("switch", { name: "Premium for students at ZZ Northgate" });
    const teachers = screen.getByRole("switch", { name: "Premium for teachers at ZZ Northgate" });
    expect(students.props.accessibilityState.checked).toBe(true);
    expect(teachers.props.accessibilityState.checked).toBe(false);
    expect(students.props.accessibilityHint).toBeUndefined();
    expect(teachers.props.accessibilityHint).toBeUndefined();

    await fireEvent.press(teachers);
    expect(await screen.findByText("Switch premium on for teachers at ZZ Northgate?")).toBeTruthy();
    expect(screen.getByText(SAID)).toBeTruthy();
    const asRead = { termsSetAt: TERMS.termsSetAt, premiumStudents: true, premiumTeachers: false, subscription: TERMS.subscription, premium: TERMS.premium, note: "ZZ the head asked" };
    expect(calls().filter((c) => c.line === "PUT /api/v1/operator/schools/s1/terms").map((c) => c.body)).toEqual([{ premium: { teachers: true }, expect: asRead, preview: true }]);
    // Keep: nothing more is sent.
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    expect(screen.queryByText("Switch premium on for teachers at ZZ Northgate?")).toBeNull();
    expect(calls().filter((c) => c.line === "PUT /api/v1/operator/schools/s1/terms")).toHaveLength(1);

    await fireEvent.press(teachers);
    await fireEvent.press(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "PUT /api/v1/operator/schools/s1/terms").map((c) => c.body).at(-1)).toEqual({ premium: { teachers: true }, expect: asRead, preview: false }));
    expect(await screen.findByText("Premium saved")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1/terms").length).toBe(2));
    // Prices, Record payment and many schools at once are the web's.
    expect(screen.getByText("Prices, Record payment and changes for many schools are on the web.")).toBeTruthy();
  });

  it("the subscription and premium card: a college has no teachers' premium; a switch refused because the terms moved says so and reads them again; offline, the switches wait", async () => {
    let calls: () => { line: string; body: unknown }[] = () => [];
    ({ calls } = await mount({
      "GET /api/v1/operator/schools/s1/terms": () => json({ ...TERMS, kind: "COLLEGE", premiumStudents: false }),
      "PUT /api/v1/operator/schools/s1/terms": () => json({ error: "This school's terms were changed while this was open. Look at them again, then save.", code: "CONFLICT" }, 409),
    }));
    await screen.findByText("ZZ Northgate");
    const students = await screen.findByRole("switch", { name: "Premium for students at ZZ Northgate" });
    expect(screen.queryByRole("switch", { name: "Premium for teachers at ZZ Northgate" })).toBeNull();
    await fireEvent.press(students);
    expect(await screen.findByText("This school's terms were changed while this was open. Look at them again, then save.")).toBeTruthy();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1/terms").length).toBe(2));
    onlineManager.setOnline(false);
    try {
      await waitFor(() => expect(screen.getByRole("switch", { name: "Premium for students at ZZ Northgate" }).props.accessibilityState.disabled).toBe(true));
    } finally {
      onlineManager.setOnline(true);
    }
  });

  it("the second review of phase 8: Confirm sends the terms its question was asked with though a pull to refresh read them again meanwhile (E2, E8); the card shows the terms the door answered at once (E4); Keep waits while the save is out (E11)", async () => {
    const asRead = { termsSetAt: TERMS.termsSetAt, premiumStudents: true, premiumTeachers: false, subscription: TERMS.subscription, premium: TERMS.premium, note: "ZZ the head asked" };
    const after = { ...TERMS, premiumTeachers: true };
    let reads = 0;
    const saving = gated();
    const later = gated();
    const { calls } = await mount({
      "GET /api/v1/operator/schools/s1/terms": (req) => {
        reads += 1;
        if (reads === 1) return json(TERMS);
        if (reads === 2) return json({ ...TERMS, note: "ZZ changed by another" });
        return later.answer(req);
      },
      "PUT /api/v1/operator/schools/s1/terms": (req) => {
        const body = JSON.parse(String(req.init.body)) as { preview?: boolean };
        return body.preview ? json({ preview: true, terms: after, changed: true, told: 2 }) : saving.answer(req);
      },
    });
    await screen.findByText("ZZ Northgate");
    const teachers = await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" });
    await fireEvent.press(teachers);
    expect(await screen.findByText("Switch premium on for teachers at ZZ Northgate?")).toBeTruthy();
    // Pull to refresh while the question is open: the page and its card are read again (E8).
    const refreshOf = (node: unknown): (() => void) | null => {
      const n = node as { props?: Record<string, unknown>; children?: unknown[] } | null;
      if (!n || typeof n !== "object") return null;
      const control = n.props?.refreshControl as { props?: { onRefresh?: unknown } } | undefined;
      if (typeof control?.props?.onRefresh === "function") return control.props.onRefresh as () => void;
      for (const child of n.children ?? []) {
        const found = refreshOf(child);
        if (found) return found;
      }
      return null;
    };
    await act(async () => {
      refreshOf(screen.toJSON())!();
    });
    await waitFor(() => expect(reads).toBe(2));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    // The save goes with the terms the question was asked against, not those just read (E2).
    await waitFor(() => expect(calls().filter((c) => c.line === "PUT /api/v1/operator/schools/s1/terms").map((c) => c.body).at(-1)).toEqual({ premium: { teachers: true }, expect: asRead, preview: false }));
    // While it is out, Keep waits (E11): read once the render that follows the press has landed (the save is held open).
    await waitFor(() => expect(screen.getByRole("button", { name: "Keep" })).toBeDisabled());
    saving.open(() => json({ preview: false, terms: after, changed: true, told: 2 }));
    expect(await screen.findByText("Premium saved")).toBeTruthy();
    // The answered terms at once, while the re-read is still out (E4).
    await waitFor(() => expect(screen.getByRole("switch", { name: "Premium for teachers at ZZ Northgate" }).props.accessibilityState.checked).toBe(true));
    expect(reads).toBeGreaterThanOrEqual(3);
  });

  it("the second review of phase 8, D6: a Confirm the server refuses is said, closes the question and reads the terms again; switching off is asked and sent as off", async () => {
    let refuse = true;
    const { calls } = await mount({
      "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
        const body = JSON.parse(String(init.body)) as { preview?: boolean; premium: { students?: boolean } };
        if (body.preview) return json({ preview: true, terms: { ...TERMS, premiumStudents: body.premium.students ?? TERMS.premiumStudents }, changed: true, told: 1 });
        return refuse ? json({ error: "This school's terms were changed while this was open. Look at them again, then save.", code: "CONFLICT" }, 409) : json({ preview: false, terms: { ...TERMS, premiumStudents: false }, changed: true, told: 1 });
      },
    });
    await screen.findByText("ZZ Northgate");
    const students = await screen.findByRole("switch", { name: "Premium for students at ZZ Northgate" });
    await fireEvent.press(students);
    expect(await screen.findByText("Switch premium off for students at ZZ Northgate?")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("This school's terms were changed while this was open. Look at them again, then save.")).toBeTruthy();
    expect(screen.queryByText("Switch premium off for students at ZZ Northgate?")).toBeNull();
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/operator/schools/s1/terms").length).toBeGreaterThanOrEqual(2));
    refuse = false;
    await fireEvent.press(screen.getByRole("switch", { name: "Premium for students at ZZ Northgate" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Confirm" }));
    await waitFor(() => expect((calls().filter((c) => c.line === "PUT /api/v1/operator/schools/s1/terms").map((c) => c.body).at(-1) as { premium: unknown; preview: boolean }).premium).toEqual({ students: false }));
    expect(await screen.findByText("Premium saved")).toBeTruthy();
  });

  const BILLED = { ...TERMS, subscription: { mode: "OURS" }, subscriptionFigure: { basePaise: 10_000, discountBps: 0, paysPaise: 10_000, source: "OURS", tierCode: null }, premiumBilled: true, premiumNotBilled: null, premiumWaitsFor: [] };
  it.each([
    ["premium on and billed", BILLED, ["Shalaghar subscription: ₹100 a student a year + GST (ours; it moves with ours)", "Premium add-on: ₹50 more a student a year + GST (ours; it moves with ours)"]],
    ["premium off, at its own price", { ...BILLED, premiumStudents: false, premium: { mode: "OWN_PRICE", pricePaise: 7500 }, premiumFigure: { basePaise: 5000, discountBps: 0, paysPaise: 7500, source: "OWN_PRICE", tierCode: null } }, ["Premium add-on: ₹75 if on"]],
    ["free by agreement", { ...BILLED, subscription: { mode: "OWN_DISCOUNT", discountBps: 10_000 }, subscriptionFigure: { basePaise: 10_000, discountBps: 10_000, paysPaise: 0, source: "OWN_DISCOUNT", tierCode: null } }, ["Shalaghar subscription: Free by agreement"]],
    ["a college on its tier, less its own discount", { ...BILLED, kind: "COLLEGE", planCode: "college-affiliated", subscription: { mode: "OWN_DISCOUNT", discountBps: 1000 }, subscriptionFigure: { basePaise: 19_900, discountBps: 1000, paysPaise: 17_910, source: "OWN_DISCOUNT", tierCode: "college-affiliated" } }, ["Shalaghar subscription: ₹179.10 a student a year + GST (its tier, Affiliated college, less its own 10 %)"]],
    ["terms not set, as before", { ...TERMS, termsSet: false, termsSetAt: null }, ["Shalaghar subscription: Terms not set"]],
    ["no tier chosen, as before", { ...TERMS, kind: "COLLEGE", subscriptionFigure: null, noTierChosen: true }, ["Shalaghar subscription: No tier chosen: no price until one is"]],
    ["a college with its plan asked for and no tier: no bill, so the tier's reason in premium's place (the review of bace327b, T1)", { ...BILLED, kind: "COLLEGE", subscriptionFigure: null, noTierChosen: true }, ["Premium add-on: Premium on, not billed: no tier chosen"]],
  ])("C7 point 7e: the card's lines read as the web card's: %s", async (_label, terms, lines) => {
    await mount({ "GET /api/v1/operator/schools/s1/terms": () => json(terms) });
    for (const line of lines) expect(await screen.findByText(line)).toBeTruthy();
  });

  it("C7 point 7d: an older server's terms, with no lines, draw none (the review of bace327b, T3)", async () => {
    await mount();
    expect(await screen.findByRole("switch", { name: "Premium for students at ZZ Northgate" })).toBeTruthy();
    expect(screen.queryByText(/premium makes no difference yet/)).toBeNull();
    expect(screen.queryByText(/Switched off for everyone/)).toBeNull();
    expect(screen.queryByText(/Vidura is not switched on/)).toBeNull();
  });

  it("C7 points 7d and 7f: C2's lines the terms door answers stand beside the switches, and after a save the card shows the answered terms with theirs at once", async () => {
    const PLANS = "The Student plan is not asked for, so premium for students makes no difference yet: its features are open to every student wherever they are switched on.";
    const VIDURA = "Vidura is not switched on for this school, so its premium does not include Vidura until it is.";
    const OFF = "Switched off for everyone, so premium does not open them: Job board.";
    const saving = gated();
    let reads = 0;
    const later = gated();
    await mount({
      "GET /api/v1/operator/schools/s1/terms": (req) => {
        reads += 1;
        return reads === 1 ? json({ ...TERMS, lines: [PLANS, VIDURA] }) : later.answer(req);
      },
      "PUT /api/v1/operator/schools/s1/terms": (req) => {
        const body = JSON.parse(String(req.init.body)) as { preview?: boolean };
        const after = { ...TERMS, premiumTeachers: true, lines: [PLANS, OFF, VIDURA] };
        return body.preview ? json({ preview: true, terms: after, changed: true, told: 2 }) : saving.answer(req);
      },
    });
    expect(await screen.findByText(PLANS)).toBeTruthy();
    expect(screen.getByText(VIDURA)).toBeTruthy();
    expect(screen.queryByText(OFF)).toBeNull();
    await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
    await fireEvent.press(await screen.findByRole("button", { name: "Confirm" }));
    saving.open(() => json({ preview: false, terms: { ...TERMS, premiumTeachers: true, lines: [PLANS, OFF, VIDURA] }, changed: true, told: 2 }));
    expect(await screen.findByText("Premium saved")).toBeTruthy();
    // The answered terms and their lines, while the re-read is still out.
    expect(await screen.findByText(OFF)).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Premium for teachers at ZZ Northgate" }).props.accessibilityState.checked).toBe(true);
    expect(reads).toBeGreaterThanOrEqual(2);
    later.open(() => json({ ...TERMS, premiumTeachers: true, lines: [PLANS, OFF, VIDURA] }));
  });

  it("C7 point 7c: under its own question the sheet shows the door's sentence of what the switch will do and composes nothing of price, bill or who is told; where a server sends none, the question stands alone", async () => {
    const SAID = "ZZ Northgate will get premium for teachers. Premium add-on for students and teachers: ₹50 more a student a year (ours; it moves with ours), billed once the Student or the Teacher plan is asked for. Figures are before GST. 2 people at the school will be told.";
    let said: string | undefined = SAID;
    await mount({
      "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
        const body = JSON.parse(String(init.body)) as { preview?: boolean };
        return json({ preview: Boolean(body.preview), terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2, ...(body.preview && said ? { sentence: said } : {}) });
      },
    });
    await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
    expect(await screen.findByText("Switch premium on for teachers at ZZ Northgate?")).toBeTruthy();
    expect(screen.getByText(SAID)).toBeTruthy();
    expect(screen.queryByText("Premium on, not billed: the Student plan is not asked for")).toBeNull();
    expect(screen.queryByText("2 people at the school will be told.")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Keep" }));
    // An older server: no sentence, so the question stands alone, and the phone says nothing of price, bill or who is told.
    said = undefined;
    await fireEvent.press(screen.getByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
    expect(await screen.findByText("Switch premium on for teachers at ZZ Northgate?")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeTruthy();
    expect(screen.queryByText(SAID)).toBeNull();
    expect(screen.queryByText("Premium on, not billed: the Student plan is not asked for")).toBeNull();
    expect(screen.queryByText(/will be told/)).toBeNull();
  });

  it("C7 point 7g: offline, the card says why the switches wait in the house's note for a decision sent live, and Confirm waits too", async () => {
    await mount({ "PUT /api/v1/operator/schools/s1/terms": () => json({ preview: true, terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2 }) });
    await screen.findByRole("switch", { name: "Premium for students at ZZ Northgate" });
    expect(screen.queryByText("You are offline. A decision is sent at once, never saved on the phone: try again when the signal is back.")).toBeNull();
    // A question asked while online, then the signal lost: Confirm waits too (the review of bace327b, T2).
    await fireEvent.press(screen.getByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    await act(async () => {
      onlineManager.setOnline(false);
    });
    try {
      expect(await screen.findByText("You are offline. A decision is sent at once, never saved on the phone: try again when the signal is back.")).toBeTruthy();
      expect(screen.getByRole("switch", { name: "Premium for students at ZZ Northgate" }).props.accessibilityState.disabled).toBe(true);
      expect(confirm).toBeDisabled();
    } finally {
      await act(async () => {
        onlineManager.setOnline(true);
      });
    }
  });

  it("C7 point 7g: a Confirm that got no answer (status 0) or any 5xx says the switch may have been saved and reads the terms again; a 409 is the refusal it is", async () => {
    const MAY = "The server could not be reached or did not answer, so the switch may have been saved. Check it before switching again.";
    const answers: (() => Response)[] = [
      () => {
        throw new TypeError("Network request failed");
      },
      () => new Response("<html>502 Bad Gateway</html>", { status: 502, statusText: "Bad Gateway" }),
      () => json({ error: "Something went wrong. Please try again.", code: "SERVER" }, 500),
    ];
    let save: () => Response = answers[0]!;
    let reads = 0;
    await mount({
      "GET /api/v1/operator/schools/s1/terms": () => {
        reads += 1;
        return json(TERMS);
      },
      "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
        const body = JSON.parse(String(init.body)) as { preview?: boolean };
        return body.preview ? json({ preview: true, terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2 }) : save();
      },
    });
    const confirmOnce = async () => {
      await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
      await fireEvent.press(await screen.findByRole("button", { name: "Confirm" }));
    };
    for (const answer of answers.slice(0, 2)) {
      save = answer;
      const before = reads;
      await confirmOnce();
      expect(await screen.findByText(MAY)).toBeTruthy();
      expect(screen.queryByText("Switch premium on for teachers at ZZ Northgate?")).toBeNull();
      await waitFor(() => expect(reads).toBeGreaterThan(before));
      expect(screen.queryByText("Premium saved")).toBeNull();
    }
    // The server's own 500 too: the door words its answer after the save, so the switch may have been saved (the review of
    // bace327b, P1, the coordinator's reading of C7.7g); it answered, so it is said in a sentence of its own (C7b point 5, E4).
    // A 409, a decision of the server's, is the refusal it is.
    save = answers[2]!;
    const beforeOwn = reads;
    await confirmOnce();
    expect(await screen.findByText("The server met an error, so the switch may have been saved. Check it before switching again.")).toBeTruthy();
    expect(screen.queryByText(MAY)).toBeNull();
    expect(screen.queryByText("Something went wrong. Please try again.")).toBeNull();
    await waitFor(() => expect(reads).toBeGreaterThan(beforeOwn));
    save = () => json({ error: "This school's terms were changed while this was open. Look at them again, then save.", code: "CONFLICT" }, 409);
    await confirmOnce();
    expect(await screen.findByText("This school's terms were changed while this was open. Look at them again, then save.")).toBeTruthy();
    expect(screen.queryByText(MAY)).toBeNull();
    expect(screen.queryByText(/The server met an error/)).toBeNull();
  });

  it("the read of part 6, P1: on Android the question is not announced, TalkBack hearing the two live regions, which stay polite", async () => {
    const SAID = "ZZ Northgate will get premium for teachers. 2 people at the school will be told.";
    const os = Platform.OS;
    Platform.OS = "android";
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    announce.mockClear();
    try {
      await mount({
        "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
          const body = JSON.parse(String(init.body)) as { preview?: boolean };
          return json({ preview: Boolean(body.preview), terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2, ...(body.preview ? { sentence: SAID } : {}) });
        },
      });
      await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
      expect((await screen.findByText("Switch premium on for teachers at ZZ Northgate?")).props.accessibilityLiveRegion).toBe("polite");
      expect(screen.getByText(SAID).props.accessibilityLiveRegion).toBe("polite");
      expect(announce.mock.calls.map((call) => String(call[0])).filter((said) => said.startsWith("Switch premium"))).toEqual([]);
    } finally {
      Platform.OS = os;
      announce.mockRestore();
    }
  });

  it("the review of bace327b, P2: an answer the phone cannot read after Confirm (a newer server's value, a 4xx page) says the switch may have been saved and the app may need an update, reads the terms again, and never shows an issue list or a page's text", async () => {
    const UNREADABLE = "The server's answer could not be read, so the switch may have been saved, and the app may need an update. Check it before switching again.";
    let save: () => Response = () => json({ preview: false, terms: { ...TERMS, premiumTeachers: true, state: "SOMETHING_NEW" }, changed: true, told: 2 });
    let reads = 0;
    await mount({
      "GET /api/v1/operator/schools/s1/terms": () => {
        reads += 1;
        return json(TERMS);
      },
      "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
        const body = JSON.parse(String(init.body)) as { preview?: boolean };
        return body.preview ? json({ preview: true, terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2 }) : save();
      },
    });
    for (const next of [save, () => new Response("<html>404 Not Found</html>", { status: 404, statusText: "Not Found" })]) {
      save = next;
      const before = reads;
      await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
      await fireEvent.press(await screen.findByRole("button", { name: "Confirm" }));
      expect(await screen.findByText(UNREADABLE)).toBeTruthy();
      expect(screen.queryByText(/invalid_enum_value|<html>|"code"/)).toBeNull();
      expect(screen.queryByText("Premium saved")).toBeNull();
      await waitFor(() => expect(reads).toBeGreaterThan(before));
    }
  });

  it("the review of bace327b, P3: two taps on Confirm inside one frame send one write", async () => {
    const saving = gated();
    const { calls } = await mount({
      "PUT /api/v1/operator/schools/s1/terms": (req) => {
        const body = JSON.parse(String(req.init.body)) as { preview?: boolean };
        return body.preview ? json({ preview: true, terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2 }) : saving.answer(req);
      },
    });
    await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
    const confirm = await screen.findByRole("button", { name: "Confirm" });
    await act(async () => {
      fireEvent.press(confirm);
      fireEvent.press(confirm);
    });
    saving.open(() => json({ preview: false, terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2 }));
    expect(await screen.findByText("Premium saved")).toBeTruthy();
    expect(calls().filter((c) => c.line === "PUT /api/v1/operator/schools/s1/terms" && !(c.body as { preview?: boolean }).preview)).toHaveLength(1);
  });

  it("the review of bace327b, P5, and of 06ce1ebf, E5: the question and the server's sentence are said once as the question opens (an announcement off Android, the live regions for TalkBack), and the question stands under the switches, above C2's lines", async () => {
    const SAID = "ZZ Northgate will get premium for teachers. 2 people at the school will be told.";
    const PLANS = "The Student plan is not asked for, so premium for students makes no difference yet: its features are open to every student wherever they are switched on.";
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => {});
    // The preset's mock keeps the earlier cases' calls (toasts, questions): only this case's are read.
    announce.mockClear();
    try {
      await mount({
        "GET /api/v1/operator/schools/s1/terms": () => json({ ...TERMS, lines: [PLANS] }),
        "PUT /api/v1/operator/schools/s1/terms": ({ init }) => {
          const body = JSON.parse(String(init.body)) as { preview?: boolean };
          return json({ preview: Boolean(body.preview), terms: { ...TERMS, premiumTeachers: true }, changed: true, told: 2, ...(body.preview ? { sentence: SAID } : {}) });
        },
      });
      await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
      expect((await screen.findByText("Switch premium on for teachers at ZZ Northgate?")).props.accessibilityLiveRegion).toBe("polite");
      expect(screen.getByText(SAID).props.accessibilityLiveRegion).toBe("polite");
      expect(announce.mock.calls.map((call) => call[0]).filter((said) => String(said).startsWith("Switch premium"))).toEqual([`Switch premium on for teachers at ZZ Northgate? ${SAID}`]);
      // Under the switch that was pressed, above C2's lines: the texts and labels in the order they are drawn.
      const order: string[] = [];
      const walk = (node: unknown): void => {
        if (typeof node === "string") order.push(node);
        else if (Array.isArray(node)) node.forEach(walk);
        else if (node && typeof node === "object") {
          const n = node as { props?: { accessibilityLabel?: unknown }; children?: unknown };
          if (typeof n.props?.accessibilityLabel === "string") order.push(n.props.accessibilityLabel);
          walk(n.children ?? []);
        }
      };
      walk(screen.toJSON());
      const at = (text: string) => order.findIndex((said) => said.includes(text));
      expect(at("Premium for teachers at ZZ Northgate")).toBeGreaterThanOrEqual(0);
      expect(at("Premium for teachers at ZZ Northgate")).toBeLessThan(at("Switch premium on for teachers at ZZ Northgate?"));
      expect(at("Switch premium on for teachers at ZZ Northgate?")).toBeLessThan(at(PLANS));
    } finally {
      announce.mockRestore();
    }
  });

  it("C7 point 7g: a question whose preview got no answer says only that the server could not be reached, and opens nothing", async () => {
    await mount({
      "PUT /api/v1/operator/schools/s1/terms": () => {
        throw new TypeError("Network request failed");
      },
    });
    await fireEvent.press(await screen.findByRole("switch", { name: "Premium for teachers at ZZ Northgate" }));
    expect(await screen.findByText("The server could not be reached.")).toBeTruthy();
    expect(screen.queryByText("Switch premium on for teachers at ZZ Northgate?")).toBeNull();
    expect(screen.queryByText(/may have been saved/)).toBeNull();
  });

  it("the corrections card, E9: a day that is not on the calendar holds the button, as one not in the form does", async () => {
    await mount({ "POST /api/v1/operator/schools/s1/subscription": () => json({ ok: true }) });
    await screen.findByText("ZZ Northgate");
    await fireEvent.changeText(screen.getByLabelText("Due on"), "2026-02-30");
    await fireEvent.changeText(screen.getByLabelText("Reason for the change"), "moved");
    expect(screen.getByRole("button", { name: "Save subscription" })).toBeDisabled();
    expect(screen.getByText("Use a real date in YYYY-MM-DD form.")).toBeTruthy();
  });

  it("the corrections card: a date that is not a day holds the button; the partner is changed from the partners read", async () => {
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
