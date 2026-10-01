import { Linking } from "react-native";
import { screen, waitFor } from "@testing-library/react-native";
import { bodyOf, calls, ID, ME_PARENT, ME_STUDENT, mockRouter, pending, refused, renderFamily, press, type } from "./family-helpers";
import { FamilyFees, POLL } from "@/screens/family/fees";

/** The school's checkout page opens in the in-app browser; here the call is only recorded. */
const mockOpenBrowser = jest.fn(async () => ({ type: "dismiss" }));
jest.mock("expo-web-browser", () => ({ openBrowserAsync: (...args: unknown[]) => mockOpenBrowser(...(args as [])) }));

const PAYMENT = "czz0000000000000000pay01";
const DEMAND = (id: string, label: string, dueDateKey: string, outstandingPaise: number, status = "OPEN", overdue = false) => ({
  id,
  label,
  dueDateKey,
  grossPaise: outstandingPaise,
  concessionPaise: 0,
  netPaise: outstandingPaise,
  paidPaise: status === "PAID" ? outstandingPaise : 0,
  outstandingPaise: status === "PAID" ? 0 : outstandingPaise,
  status,
  overdue,
  lines: [{ headId: "h1", code: "TUI", name: "Tuition", grossPaise: outstandingPaise, concessionPaise: 0 }],
});
const CHILD = {
  studentMembershipId: ID.child,
  name: "ZZ Asha",
  schoolId: "s1",
  schoolName: "ZZ School",
  year: { id: "y1", name: "2026-27" },
  options: { online: true, upi: { vpa: "zzschool@upi", payee: "ZZ School Trust" }, bankNote: "ZZ Bank, A/c 1234" },
  demands: [DEMAND("d1", "ZZ Term 1", "2026-06-15", 500000, "OPEN", true), DEMAND("d2", "ZZ Term 2", "2026-10-15", 750000), DEMAND("d0", "ZZ Admission", "2026-04-01", 100000, "PAID")],
  totals: { outstandingPaise: 1250000, overduePaise: 500000, paidPaise: 100000 },
  payments: [
    { id: "p1", amountPaise: 100000, method: "CASH", status: "PAID", reference: null, paidAt: "2026-04-01T05:00:00.000Z", createdAt: "2026-04-01T05:00:00.000Z", receiptId: "r1", serial: "ZZ/2026/000001", failedReason: null },
    { id: "p2", amountPaise: 500000, method: "UPI", status: "CLAIMED", reference: "ZZREF1", paidAt: null, createdAt: "2026-09-10T05:00:00.000Z", receiptId: null, serial: null, failedReason: null },
  ],
};
const FAMILY = { children: [{ studentMembershipId: ID.child, name: "ZZ Asha", schoolId: "s1", schoolName: "ZZ School" }], child: CHILD };
const UPI_START = { paymentId: PAYMENT, link: "upi://pay?pa=zzschool%40upi&am=12500.00", amountPaise: 1250000, payeeVpa: "zzschool@upi", payeeName: "ZZ School Trust", reference: "ZZ-REF-42", schoolName: "ZZ School", pupilName: "ZZ Asha" };
const CHECKOUT = (transport: "devbox" | "razorpay") => ({ paymentId: PAYMENT, orderId: "order_zz1", keyId: "rzp_test_zz", amountPaise: 1250000, currency: "INR", schoolName: "ZZ School", pupilName: "ZZ Asha", payerName: "ZZ Parent", payerEmail: null, transport });
const STATUS = (status: string) => ({ paymentId: PAYMENT, status, method: "ONLINE", amountPaise: 1250000, receiptId: status === "PAID" ? "r2" : null, serial: status === "PAID" ? "ZZ/2026/000002" : null, failedReason: null, checkout: null });

const PATH = "/api/v1/fees/family";
const CHECKOUT_PATH = "/api/v1/fees/family/checkout";
const UPI_PATH = "/api/v1/fees/family/upi";
const CLAIM_PATH = "/api/v1/fees/family/upi/claim";
const STATUS_PATH = `/api/v1/fees/family/payments/${PAYMENT}`;

beforeEach(() => {
  mockOpenBrowser.mockClear();
  POLL.intervalMs = 20;
  POLL.maxMs = 60_000;
});

describe("the family's fees", () => {
  it("is loading while the dues are on their way", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: pending });
    expect(await screen.findByRole("progressbar")).toBeTruthy();
  });

  it("shows the totals, the instalments still to pay (all chosen), the total, the payee note and the history", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY });
    expect(await screen.findByLabelText("Outstanding: ₹12,500")).toBeTruthy();
    expect(screen.getByLabelText("Overdue: ₹5,000")).toBeTruthy();
    expect(screen.getByLabelText("Paid this year: ₹1,000")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: /ZZ Term 1/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /ZZ Term 2/ })).toBeChecked();
    expect(screen.queryByRole("checkbox", { name: /ZZ Admission/ })).toBeNull();
    expect(screen.getByLabelText("Total: ₹12,500")).toBeTruthy();
    expect(screen.getByText(/You are paying ZZ School\./)).toBeTruthy();
    expect(screen.getByText("ZZ Bank, A/c 1234")).toBeTruthy();
    expect(screen.getByText("₹1,000 · Cash")).toBeTruthy();
    expect(screen.getByText(/Receipt ZZ\/2026\/000001 · Opens on the web/)).toBeTruthy();
    expect(screen.getByText(/Waiting for the office to confirm/)).toBeTruthy();
  });

  it("choosing fewer instalments changes the total, and the buttons wait when nothing is chosen", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY });
    await press(await screen.findByRole("checkbox", { name: /ZZ Term 1/ }));
    expect(screen.getByRole("checkbox", { name: /ZZ Term 1/ })).not.toBeChecked();
    expect(screen.getByLabelText("Total: ₹7,500")).toBeTruthy();
    await press(screen.getByRole("checkbox", { name: /ZZ Term 2/ }));
    expect(screen.getByLabelText("Total: ₹0")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Pay online" })).toBeDisabled();
    await press(screen.getByRole("checkbox", { name: /ZZ Term 1/ }));
    expect(screen.getByLabelText("Total: ₹5,000")).toBeTruthy();
  });

  it("paying by UPI starts the payment for the chosen dues, opens the UPI app, and the UTR is claimed", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { fetch } = await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [UPI_PATH]: () => UPI_START, [CLAIM_PATH]: () => ({ ok: true }) });
    await press(await screen.findByRole("checkbox", { name: /ZZ Term 2/ }));
    await press(screen.getByRole("button", { name: "Pay by UPI" }));
    expect(await screen.findByText("ZZ School Trust")).toBeTruthy();
    expect(bodyOf(calls(fetch, UPI_PATH)[0]!)).toEqual({ studentMembershipId: ID.child, demandIds: ["d1"] });
    expect(screen.getByText("zzschool@upi")).toBeTruthy();
    expect(screen.getByText("ZZ-REF-42")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Open UPI app" }));
    expect(open).toHaveBeenCalledWith(UPI_START.link);
    expect(screen.getByRole("button", { name: "I have paid — send the UTR" })).toBeDisabled();
    await type(screen.getByLabelText("UTR from your UPI app"), "ZZ12345678901");
    await press(screen.getByRole("button", { name: "I have paid — send the UTR" }));
    expect(await screen.findByText(/Thank you\. The office will confirm/)).toBeTruthy();
    expect(bodyOf(calls(fetch, CLAIM_PATH)[0]!)).toEqual({ paymentId: PAYMENT, utr: "ZZ12345678901" });
    // The dues are read again once the claim is in.
    await waitFor(() => expect(calls(fetch, PATH).length).toBe(2));
    open.mockRestore();
  });

  it("when no UPI app opens, the id is shown to pay by hand", async () => {
    const open = jest.spyOn(Linking, "openURL").mockRejectedValue(new Error("no app"));
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [UPI_PATH]: () => UPI_START });
    await press(await screen.findByRole("button", { name: "Pay by UPI" }));
    await press(await screen.findByRole("button", { name: "Open UPI app" }));
    expect(await screen.findByText(/No UPI app opened/)).toBeTruthy();
    open.mockRestore();
  });

  it("paying online in devbox mode says so and watches the payment until the receipt is issued", async () => {
    let asked = 0;
    const { fetch } = await renderFamily(<FamilyFees />, ME_PARENT, {
      [PATH]: () => FAMILY,
      [CHECKOUT_PATH]: () => CHECKOUT("devbox"),
      [STATUS_PATH]: () => STATUS(++asked < 2 ? "INITIATED" : "PAID"),
    });
    await press(await screen.findByRole("button", { name: "Pay online" }));
    expect(await screen.findByText(/Test mode: this server has no real gateway/)).toBeTruthy();
    expect(bodyOf(calls(fetch, CHECKOUT_PATH)[0]!)).toEqual({ studentMembershipId: ID.child, demandIds: ["d1", "d2"] });
    expect(await screen.findByText("Paid. Receipt ZZ/2026/000002.")).toBeTruthy();
    expect(mockOpenBrowser).not.toHaveBeenCalled();
    expect(calls(fetch, STATUS_PATH).length).toBeGreaterThanOrEqual(2);
    // Settled: the phone stops asking.
    const settledAt = calls(fetch, STATUS_PATH).length;
    await new Promise((r) => setTimeout(r, 80));
    expect(calls(fetch, STATUS_PATH).length).toBe(settledAt);
  });

  it("paying online with a real gateway opens the school's checkout page on the web and watches from here", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [CHECKOUT_PATH]: () => CHECKOUT("razorpay"), [STATUS_PATH]: () => STATUS("INITIATED") });
    await press(await screen.findByRole("button", { name: "Pay online" }));
    expect(await screen.findByText(/Checking with the school's gateway/)).toBeTruthy();
    expect(mockOpenBrowser).toHaveBeenCalledWith(expect.stringContaining(`/parent/fees?checkout=${PAYMENT}`));
    expect(screen.queryByText(/Test mode/)).toBeNull();
  });

  it("a failed payment is said, with the gateway's reason", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [CHECKOUT_PATH]: () => CHECKOUT("devbox"), [STATUS_PATH]: () => ({ ...STATUS("FAILED"), failedReason: "ZZ card declined" }) });
    await press(await screen.findByRole("button", { name: "Pay online" }));
    expect(await screen.findByText("ZZ card declined")).toBeTruthy();
  });

  it("after a minute without an answer, the phone stops asking and says the receipt will come", async () => {
    POLL.maxMs = 0;
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [CHECKOUT_PATH]: () => CHECKOUT("devbox"), [STATUS_PATH]: () => STATUS("INITIATED") });
    await press(await screen.findByRole("button", { name: "Pay online" }));
    expect(await screen.findByText(/Not confirmed yet/)).toBeTruthy();
  });

  it("a refused checkout is said where the button was", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [CHECKOUT_PATH]: refused(409, "The dues changed while you were looking.") });
    await press(await screen.findByRole("button", { name: "Pay online" }));
    expect(await screen.findByText("The dues changed while you were looking.")).toBeTruthy();
  });

  it("a school with no way to pay from here says so; nothing due is a thank-you", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => ({ ...FAMILY, child: { ...CHILD, options: { online: false, upi: null, bankNote: null } } }) });
    expect(await screen.findByText(/This school has not set up a way to pay from here yet/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pay online" })).toBeNull();
  });

  it("nothing due is a thank-you", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => ({ ...FAMILY, child: { ...CHILD, demands: [CHILD.demands[2]], totals: { outstandingPaise: 0, overduePaise: 0, paidPaise: 100000 } } }) });
    expect(await screen.findByText("Nothing is due. Thank you.")).toBeTruthy();
  });

  it("a receipt in the history opens on the web", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY });
    await press(await screen.findByRole("button", { name: /₹1,000 · Cash/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/fees/receipts/r1"));
    open.mockRestore();
  });

  it("no child linked, and a year not yet opened, each offer a door", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => ({ children: [], child: null }) });
    expect(await screen.findByText("No child is linked to your account yet.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Link to your child" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/link-child");
  });

  it("with two children the switcher asks the API for the other one", async () => {
    const { fetch } = await renderFamily(<FamilyFees />, ME_PARENT, {
      [PATH]: (_init, url) => ({ ...FAMILY, children: [...FAMILY.children, { studentMembershipId: ID.child2, name: "ZZ Bhavesh", schoolId: "s1", schoolName: "ZZ School" }], child: url.searchParams.get("childId") === ID.child2 ? { ...CHILD, studentMembershipId: ID.child2, name: "ZZ Bhavesh", year: null } : CHILD }),
    });
    await press(await screen.findByRole("button", { name: "ZZ Bhavesh, ZZ School" }));
    expect(await screen.findByText("The school has not opened this year's fees yet.")).toBeTruthy();
    expect(calls(fetch, PATH).some((c) => c.url.searchParams.get("childId") === ID.child2)).toBe(true);
  });

  it("a refusal is an alert with a retry", async () => {
    const { fetch } = await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: refused(500, "ZZ broke") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ broke");
    await press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls(fetch, PATH).length).toBe(2));
  });

  it("a teacher has no fees page here and is sent to messages", async () => {
    await renderFamily(<FamilyFees />, { ...ME_STUDENT, active: { ...ME_STUDENT.active, role: "TEACHER" }, contexts: [{ ...ME_STUDENT.contexts[0]!, role: "TEACHER" }] }, {});
    expect(await screen.findByText("Only a guardian can pay from here.")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Messages" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/messages");
  });
});

const PLANS_PATH = "/api/v1/family/fees/plans";
const ENROL_PATH = "/api/v1/family/fees/plans/enrol";
const CALENDAR_PATH = "/api/v1/family/fees/calendar";
const MINE_PATH = "/api/v1/family/fees/mine";
const PLAN = { id: "czz000000000000000plan01", name: "ZZ Grade 5 fees", gradeLevel: "5", totalPaise: 1_250_000, instalments: [{ id: "i1", label: "ZZ Term 1", dueDateKey: "2026-06-15", totalPaise: 500_000 }, { id: "i2", label: "ZZ Term 2", dueDateKey: "2026-10-15", totalPaise: 750_000 }] };
const PLANS = (over: Record<string, unknown> = {}) => ({ student: { studentMembershipId: ID.child, name: "ZZ Asha", gradeLevel: "5" }, year: { id: "y1", name: "2026-27" }, current: null, canEnrol: true, plans: [PLAN], ...over });
const CALENDAR = {
  student: { studentMembershipId: ID.child, name: "ZZ Asha" },
  year: { id: "y1", name: "2026-27" },
  todayKey: "2026-09-20",
  rows: [
    { date: "2026-06-15", title: "ZZ Term 1", amount: 500_000, status: "OVERDUE", kind: "INSTALMENT", demandId: "d1" },
    { date: "2026-10-08", title: "ZZ Term 2", amount: 750_000, status: "UPCOMING", kind: "REMINDER", demandId: "d2" },
    { date: "2026-10-15", title: "ZZ Term 2", amount: 750_000, status: "UPCOMING", kind: "INSTALMENT", demandId: "d2" },
  ],
};
const MINE = (over: Record<string, unknown> = {}) => ({
  allowed: true,
  fromAge: 14,
  reason: null,
  schoolName: "ZZ School",
  year: { id: "y1", name: "2026-27" },
  todayKey: "2026-09-20",
  demands: [DEMAND("d1", "ZZ Term 1", "2026-06-15", 500_000, "PAID"), DEMAND("d2", "ZZ Term 2", "2026-10-15", 750_000)],
  totals: { outstandingPaise: 750_000, overduePaise: 0, paidPaise: 500_000 },
  nextDue: { label: "ZZ Term 2", dueDateKey: "2026-10-15", amountPaise: 750_000 },
  ...over,
});

describe("choosing a fee plan and the payment calendar", () => {
  it("the open plans are offered while the child is on none; choosing one is confirmed, sent, and the dues are read again", async () => {
    const { fetch } = await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [PLANS_PATH]: () => PLANS(), [CALENDAR_PATH]: () => CALENDAR, [ENROL_PATH]: () => ({ ok: true, structureId: PLAN.id, demands: 2 }) });
    expect(await screen.findByText("ZZ Grade 5 fees")).toBeTruthy();
    expect(screen.getByText(/2 instalments · ₹12,500/)).toBeTruthy();
    expect(screen.getByText(/ZZ Term 1 · Jun 15, 2026 · ₹5,000/)).toBeTruthy();
    expect(calls(fetch, PLANS_PATH)[0]!.url.searchParams.get("student")).toBe(ID.child);
    await press(screen.getByRole("button", { name: "Choose this plan" }));
    expect(await screen.findByText("Put ZZ Asha on ZZ Grade 5 fees?")).toBeTruthy();
    await press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText(/ZZ Asha is on ZZ Grade 5 fees\./)).toBeTruthy();
    expect(bodyOf(calls(fetch, ENROL_PATH)[0]!)).toEqual({ student: ID.child, planId: PLAN.id });
    await waitFor(() => expect(calls(fetch, PATH).length).toBe(2));
  });

  it("once the child is on a plan the chooser is gone; with something paid it says only the office can change it; with no open plan it says so", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [PLANS_PATH]: () => PLANS({ current: { structureId: PLAN.id, structureName: "ZZ Grade 5 fees", paidPaise: 0 } }), [CALENDAR_PATH]: () => CALENDAR });
    expect(await screen.findByText("Payment calendar")).toBeTruthy();
    expect(screen.queryByText("Choose a fee plan")).toBeNull();
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [PLANS_PATH]: () => PLANS({ canEnrol: false }), [CALENDAR_PATH]: () => CALENDAR });
    expect(await screen.findByText(/only the office can change the plan/)).toBeTruthy();
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [PLANS_PATH]: () => PLANS({ plans: [] }), [CALENDAR_PATH]: () => CALENDAR });
    expect(await screen.findByText("No plan is open to families right now.")).toBeTruthy();
  });

  it("a refused choice is said in the card", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [PLANS_PATH]: () => PLANS(), [CALENDAR_PATH]: () => CALENDAR, [ENROL_PATH]: refused(403, "ZZ already on a plan") });
    await press(await screen.findByRole("button", { name: "Choose this plan" }));
    await press(await screen.findByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("ZZ already on a plan")).toBeTruthy();
  });

  it("the calendar lists every date with its kind, amount and state, in the server's order", async () => {
    await renderFamily(<FamilyFees />, ME_PARENT, { [PATH]: () => FAMILY, [PLANS_PATH]: () => PLANS(), [CALENDAR_PATH]: () => CALENDAR });
    expect(await screen.findByText("Jun 15, 2026 · ZZ Term 1")).toBeTruthy();
    expect(screen.getByText("Instalment · ₹5,000")).toBeTruthy();
    // "Overdue" is also the pick list's word for Term 1; the calendar's own pill sits beside its row.
    expect(screen.getAllByText("Overdue").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Oct 8, 2026 · ZZ Term 2")).toBeTruthy();
    expect(screen.getByText("Reminder · ₹7,500")).toBeTruthy();
    expect(screen.getAllByText("Upcoming")).toHaveLength(2);
  });
});

describe("a pupil's own fees", () => {
  it("at or past the school's age: the sentence to ask a grown-up, the totals, the next due date and the instalments — no way to pay", async () => {
    await renderFamily(<FamilyFees />, ME_STUDENT, { [MINE_PATH]: () => MINE() });
    expect(await screen.findByText(/Ask a grown-up at home to pay/)).toBeTruthy();
    expect(screen.getByLabelText("Outstanding: ₹7,500")).toBeTruthy();
    expect(screen.getByLabelText("Next due: Oct 15, 2026")).toBeTruthy();
    expect(screen.getByText("ZZ Term 2")).toBeTruthy();
    expect(screen.getByText(/Due Oct 15, 2026 · Paid ₹0/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pay online" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pay by UPI" })).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("under the age, without a date of birth, or where the school shows pupils nothing, says which", async () => {
    await renderFamily(<FamilyFees />, ME_STUDENT, { [MINE_PATH]: () => MINE({ allowed: false, reason: "UNDER_AGE", demands: [], nextDue: null }) });
    expect(await screen.findByText("Your school shows fees to pupils from age 14.")).toBeTruthy();
    await renderFamily(<FamilyFees />, ME_STUDENT, { [MINE_PATH]: () => MINE({ allowed: false, reason: "NO_BIRTHDATE", demands: [], nextDue: null }) });
    expect(await screen.findByText(/Your date of birth is not on file/)).toBeTruthy();
    await renderFamily(<FamilyFees />, ME_STUDENT, { [MINE_PATH]: () => MINE({ allowed: false, reason: "OFF", fromAge: null, demands: [], nextDue: null }) });
    expect(await screen.findByText("Your school does not show fees to pupils.")).toBeTruthy();
  });
});
