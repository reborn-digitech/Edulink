import { Linking } from "react-native";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffFees } from "@/screens/staff/fees";
import { duesPath, FeesDues } from "@/screens/staff/fees-dues";
import { FeePupil } from "@/screens/staff/fee-pupil";
import { FeeClaims } from "@/screens/staff/fee-claims";
import { gated, json, mountStaff, refused } from "./staff-harness";

/** The router is the harness's, so a test can read where a row went; the pupil screen reads its id from the params. */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const PUPIL = "czz000000000000000pupil1";
const PAY = "czz0000000000000000pay01";
const YEAR = { id: "y1", name: "2026-27" };

const OVERVIEW = {
  year: YEAR,
  todayKey: "2026-09-17",
  totals: { demandedPaise: 50_000_000, collectedPaise: 30_000_000, outstandingPaise: 20_000_000, overduePaise: 5_000_000 },
  pupils: { onPlan: 48, withoutPlan: 2 },
  byGrade: [{ gradeLevel: "5", pupils: 24, demandedPaise: 25_000_000, collectedPaise: 15_000_000, outstandingPaise: 10_000_000, overduePaise: 2_500_000 }],
  ageing: { current: 15_000_000, d30: 3_000_000, d90: 1_500_000, d90plus: 500_000 },
  methodsThisMonth: [{ method: "CASH", count: 3, amountPaise: 300_000 }],
  recent: [{ paymentId: PAY, pupilName: "ZZ Asha", amountPaise: 100_000, method: "CASH", status: "PAID", when: "2026-09-10T05:00:00.000Z", serial: "ZZ/2026/000001", receiptId: "r1" }],
  claims: { waiting: 2, stale: 1 },
  initiatedOnline: 0,
  structures: 1,
  heads: 3,
  options: { online: false, upi: true },
};

const DUES = {
  rows: [
    { studentMembershipId: PUPIL, name: "ZZ Asha", studentCode: "ZZ-P-01", className: "ZZ 5A", gradeLevel: "5", netPaise: 1_250_000, paidPaise: 100_000, outstandingPaise: 1_150_000, overduePaise: 500_000, nextDueKey: "2026-10-15", hasPlan: true },
    { studentMembershipId: "czz000000000000000pupil2", name: "ZZ Bhavesh", studentCode: null, className: "ZZ 5A", gradeLevel: "5", netPaise: 0, paidPaise: 0, outstandingPaise: 0, overduePaise: 0, nextDueKey: null, hasPlan: false },
  ],
  total: 2,
  page: 1,
  pageSize: 50,
  year: YEAR,
  todayKey: "2026-09-17",
  classes: [{ id: "c1", name: "ZZ 5A" }],
};

const LEDGER = {
  pupil: { studentMembershipId: PUPIL, name: "ZZ Asha", studentCode: "ZZ-P-01", gradeLevel: "5", className: "ZZ 5A", leftAt: null },
  year: YEAR,
  plan: { structureId: "st1", structureName: "ZZ Grade 5 fees" },
  demands: [
    { id: "d1", label: "ZZ Term 1", dueDateKey: "2026-06-15", grossPaise: 500_000, concessionPaise: 50_000, netPaise: 450_000, paidPaise: 100_000, outstandingPaise: 350_000, status: "PART", overdue: true, lines: [] },
    { id: "d2", label: "ZZ Term 2", dueDateKey: "2026-10-15", grossPaise: 750_000, concessionPaise: 0, netPaise: 750_000, paidPaise: 0, outstandingPaise: 750_000, status: "OPEN", overdue: false, lines: [] },
  ],
  concessions: [{ id: "cn1", headId: null, headName: null, kind: "PERCENT", value: 1000, reason: "ZZ sibling", grantedBy: "ZZ Office", createdAt: "2026-04-01T05:00:00.000Z", revokedAt: null }],
  payments: [
    { id: PAY, amountPaise: 100_000, method: "CASH", status: "PAID", reference: null, note: null, paidAt: "2026-04-02T05:00:00.000Z", claimedAt: null, createdAt: "2026-04-02T05:00:00.000Z", collectedBy: "ZZ Office", payer: null, receipt: { id: "r1", serial: "ZZ/2026/000001" }, reversalReason: null, refundedPaise: 0 },
  ],
  totals: { netPaise: 1_200_000, paidPaise: 100_000, outstandingPaise: 1_100_000, overduePaise: 350_000 },
  heads: [{ id: "h1", name: "Tuition" }],
  structures: [{ id: "st1", name: "ZZ Grade 5 fees", gradeLevel: "5" }],
  todayKey: "2026-09-17",
};

const CLAIMS = {
  claims: [
    { paymentId: PAY, studentMembershipId: PUPIL, pupilName: "ZZ Asha", className: "ZZ 5A", amountPaise: 500_000, utr: "ZZ12345678901", reference: "ZZ-REF-42", claimedAt: "2026-09-10T05:00:00.000Z", createdAt: "2026-09-10T04:00:00.000Z", payer: "ZZ Parent", stale: true },
  ],
  waitingForUtr: 1,
  staleAfterDays: 7,
};

const pupil = () => (
  <ToastProvider>
    <FeePupil />
  </ToastProvider>
);

beforeEach(() => {
  mockRouter.push.mockClear();
  mockRouter.params = {};
});

describe("the fees overview", () => {
  it("loads, then shows the figures, the grade rows, the claims, and the doors", async () => {
    const gate = gated();
    await mountStaff(<StaffFees />, "ADMIN", { "GET /api/v1/fees/overview": gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    expect(await screen.findByLabelText("Asked for: ₹5,00,000")).toBeTruthy();
    expect(screen.getByLabelText("Collected: ₹3,00,000")).toBeTruthy();
    expect(screen.getByLabelText("Outstanding: ₹2,00,000")).toBeTruthy();
    expect(screen.getByLabelText("Overdue: ₹50,000")).toBeTruthy();
    expect(screen.getByLabelText("Pupils on a plan: 48")).toBeTruthy();
    expect(screen.getByLabelText("UPI payments to confirm: 2")).toBeTruthy();
    expect(screen.getByText("1 waiting too long")).toBeTruthy();
    expect(screen.getByText("Grade 5")).toBeTruthy();
    expect(screen.getByText(/24 pupils · Collected ₹1,50,000 · Overdue ₹25,000/)).toBeTruthy();
    expect(screen.getByLabelText("Over 90 days: ₹5,000")).toBeTruthy();
    expect(screen.getByText("ZZ Asha · ₹1,000")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: /^Dues,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/fees-dues");
    await fireEvent.press(screen.getByRole("button", { name: /^Confirm UPI payments,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/fee-claims");
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await fireEvent.press(screen.getByRole("button", { name: /^Structures,/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/admin/fees/structures"));
    open.mockRestore();
  });

  it("the head reads without the office's doors", async () => {
    await mountStaff(<StaffFees />, "PRINCIPAL", { "GET /api/v1/fees/overview": () => json(OVERVIEW) });
    expect(await screen.findByLabelText("Asked for: ₹5,00,000")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /^Confirm UPI payments,/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Settings,/ })).toBeNull();
    expect(screen.getByRole("button", { name: /^Structures,/ })).toBeTruthy();
  });

  it("no year yet is a door to the calendar", async () => {
    await mountStaff(<StaffFees />, "ADMIN", { "GET /api/v1/fees/overview": () => json({ ...OVERVIEW, year: null }) });
    expect(await screen.findByText(/Set the academic year on the calendar page/)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Calendar" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/calendar");
  });

  it("a refusal is an alert with a retry", async () => {
    await mountStaff(<StaffFees />, "ADMIN", { "GET /api/v1/fees/overview": refused("Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("Not now.");
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

const STRUCTURES = {
  structures: [
    { id: "czz00000000000000000st01", name: "ZZ Grade 5 fees", gradeLevel: "5", academicYearId: "y1", yearName: "2026-27", instalments: 2, totalPaise: 1_250_000, pupils: 24, publishedAt: "2026-04-01T05:00:00.000Z", archivedAt: null, selfEnrol: false },
    { id: "czz00000000000000000st02", name: "ZZ Draft", gradeLevel: null, academicYearId: "y1", yearName: "2026-27", instalments: 1, totalPaise: 100_000, pupils: 0, publishedAt: null, archivedAt: null, selfEnrol: false },
  ],
  year: YEAR,
  heads: 3,
};
const SETTINGS = { upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ", bankNote: null, gateway: null, sealingAvailable: true, transport: "devbox", webhookUrl: "http://api.test/api/webhooks/razorpay/s1", pupilFeeViewAge: null };

describe("plans open to families and the pupil's age", () => {
  it("the office opens a published plan with a switch; a draft is not offered", async () => {
    const { calls } = await mountStaff(<StaffFees />, "ADMIN", {
      "GET /api/v1/fees/overview": () => json(OVERVIEW),
      "GET /api/v1/fees/structures": () => json(STRUCTURES),
      "GET /api/v1/fees/settings": () => json(SETTINGS),
      "POST /api/v1/fees/structures/czz00000000000000000st01/self-enrol": () => json({ ok: true }),
    });
    const toggle = await screen.findByRole("switch", { name: "ZZ Grade 5 fees" });
    expect(screen.queryByRole("switch", { name: "ZZ Draft" })).toBeNull();
    expect(screen.getByText(/Grade 5 · ₹12,500 · Office only/)).toBeTruthy();
    await fireEvent.press(toggle);
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/fees/structures/czz00000000000000000st01/self-enrol")).toBe(true));
    expect(calls().find((c) => c.line.startsWith("POST /api/v1/fees/structures/"))!.body).toEqual({ open: true });
  });

  it("the age pupils may see their fees from is saved with the other settings kept as they are; a bad age is refused on the phone", async () => {
    const { calls } = await mountStaff(<StaffFees />, "ADMIN", {
      "GET /api/v1/fees/overview": () => json(OVERVIEW),
      "GET /api/v1/fees/structures": () => json(STRUCTURES),
      "GET /api/v1/fees/settings": () => json(SETTINGS),
      "POST /api/v1/fees/settings": () => json({ ok: true }),
    });
    const box = await screen.findByLabelText("Pupils may see their fee dues from age");
    expect(screen.getByText("Pupils do not see fees")).toBeTruthy();
    await fireEvent.changeText(box, "3");
    expect(screen.getByText("The age must be a whole number between 5 and 25.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await fireEvent.changeText(box, "14");
    expect(screen.getByText("From age 14")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(calls().some((c) => c.line === "POST /api/v1/fees/settings")).toBe(true));
    expect(calls().find((c) => c.line === "POST /api/v1/fees/settings")!.body).toEqual({ upiId: "zzschool@upi", upiPayee: "ZZ School", receiptPrefix: "ZZ", bankNote: null, pupilFeeViewAge: 14 });
    expect(await screen.findByText("Saved.")).toBeTruthy();
  });

  it("the head sees neither card", async () => {
    await mountStaff(<StaffFees />, "PRINCIPAL", { "GET /api/v1/fees/overview": () => json(OVERVIEW), "GET /api/v1/fees/structures": () => json(STRUCTURES) });
    expect(await screen.findByLabelText("Asked for: ₹5,00,000")).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "ZZ Grade 5 fees" })).toBeNull();
    expect(screen.queryByText("Fees for pupils")).toBeNull();
  });
});

describe("the dues", () => {
  it("builds the query the server documents", () => {
    expect(duesPath("all", "", 1)).toBe("/api/v1/fees/dues");
    expect(duesPath("overdue", "Asha Rao", 2)).toBe("/api/v1/fees/dues?status=overdue&q=Asha%20Rao&page=2");
  });

  it("lists every pupil, the chips and the search ask the API, and a row opens the pupil", async () => {
    const { calls } = await mountStaff(<FeesDues />, "ADMIN", { "GET /api/v1/fees/dues": () => json(DUES) });
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
    expect(screen.getByText(/ZZ 5A · ZZ-P-01 · Overdue ₹5,000 · Paid ₹1,000/)).toBeTruthy();
    expect(screen.getByText(/Not on a plan this year/)).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/fees/dues")).toBe(true);
    await fireEvent.press(screen.getByRole("radio", { name: "Overdue" }));
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/fees/dues?status=overdue")).toBe(true));
    await fireEvent.changeText(screen.getByLabelText("Search by name or code"), "Asha");
    await fireEvent(screen.getByLabelText("Search by name or code"), "submitEditing");
    await waitFor(() => expect(calls().some((c) => c.line === "GET /api/v1/fees/dues?status=overdue&q=Asha")).toBe(true));
    await fireEvent.press(await screen.findByRole("button", { name: /^ZZ Asha,/ }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/(app)/fee-pupil", params: { studentMembershipId: PUPIL } });
  });

  it("the office reminds everyone overdue, after a second press; the head cannot", async () => {
    const { calls } = await mountStaff(<FeesDues />, "ADMIN", { "GET /api/v1/fees/dues": () => json(DUES), "POST /api/v1/fees/remind": () => json({ families: 3, demands: 5 }) });
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("button", { name: "Send reminders to everyone overdue" }));
    // The question repeats the step on a danger button, with a way back.
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(calls().some((c) => c.line.startsWith("POST /api/v1/fees/remind"))).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Send reminders to everyone overdue" }));
    // The button is now the question's own (danger) one, with the same words.
    await fireEvent.press(screen.getByRole("button", { name: "Send reminders to everyone overdue" }));
    expect(await screen.findByText("Reminders sent to 3 families.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/fees/remind").length).toBe(1);
  });

  it("the head has no reminder button", async () => {
    await mountStaff(<FeesDues />, "PRINCIPAL", { "GET /api/v1/fees/dues": () => json(DUES) });
    await screen.findByText("ZZ Asha");
    expect(screen.queryByRole("button", { name: "Send reminders to everyone overdue" })).toBeNull();
  });

  it("nobody matching offers to clear the filters", async () => {
    await mountStaff(<FeesDues />, "ADMIN", { "GET /api/v1/fees/dues": ({ url }) => json(url.searchParams.get("status") === "paid" ? { ...DUES, rows: [], total: 0 } : DUES) });
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("radio", { name: "Fully paid" }));
    expect(await screen.findByText("Nobody matches.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
  });
});

describe("one pupil's ledger", () => {
  it("shows the plan, the instalments, the payments with their receipts on the web, and the concessions", async () => {
    mockRouter.params = { studentMembershipId: PUPIL };
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mountStaff(pupil(), "PRINCIPAL", { [`GET /api/v1/fees/pupils/${PUPIL}`]: () => json(LEDGER) });
    expect(await screen.findByText("Fees · ZZ Asha")).toBeTruthy();
    expect(screen.getByText("ZZ Grade 5 fees")).toBeTruthy();
    expect(screen.getByLabelText("Outstanding: ₹11,000")).toBeTruthy();
    expect(screen.getByText("ZZ Term 1")).toBeTruthy();
    expect(screen.getByText(/Overdue · Concession ₹500/)).toBeTruthy();
    expect(screen.getByText("₹1,000 · Cash")).toBeTruthy();
    expect(screen.getByText(/Taken by ZZ Office · Receipt ZZ\/2026\/000001 · Opens on the web/)).toBeTruthy();
    expect(screen.getByText("Every head · 10 %")).toBeTruthy();
    // The head reads: no counter.
    expect(screen.queryByText("Take a payment")).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: /^₹1,000 · Cash,/ }));
    expect(open).toHaveBeenCalledWith(expect.stringContaining("/fees/receipts/r1"));
    open.mockRestore();
  });

  it("the office takes a payment: rupees become paise, the method and reference go with it, and the serial is said", async () => {
    mockRouter.params = { studentMembershipId: PUPIL };
    const { calls } = await mountStaff(pupil(), "ADMIN", {
      [`GET /api/v1/fees/pupils/${PUPIL}`]: () => json(LEDGER),
      "POST /api/v1/fees/payments": () => json({ paymentId: "czz0000000000000000pay02", receiptId: "r2", serial: "ZZ/2026/000002", already: false }),
    });
    await screen.findByText("Take a payment");
    // An amount that is not one is refused on the phone.
    await fireEvent.changeText(screen.getByLabelText("Amount (₹)"), "abc");
    await fireEvent.press(screen.getByRole("button", { name: "Record and issue receipt" }));
    expect(await screen.findByText("That is not a valid amount.")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/fees/payments")).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Amount (₹)"), "1,250.50");
    await fireEvent.press(screen.getByRole("radio", { name: "Cheque" }));
    await fireEvent.changeText(screen.getByLabelText("Reference"), "CHQ 000123");
    await fireEvent.press(screen.getByRole("button", { name: "Record and issue receipt" }));
    expect(await screen.findByText("Receipt ZZ/2026/000002 issued.")).toBeTruthy();
    const post = calls().find((c) => c.line === "POST /api/v1/fees/payments")!;
    expect(post.body).toEqual(expect.objectContaining({ studentMembershipId: PUPIL, amountPaise: 125050, method: "CHEQUE", reference: "CHQ 000123", note: null }));
    expect(String((post.body as { clientId: string }).clientId).length).toBeGreaterThanOrEqual(8);
    // The ledger is read again with the receipt on it.
    await waitFor(() => expect(calls().filter((c) => c.line === `GET /api/v1/fees/pupils/${PUPIL}`).length).toBe(2));
  });

  it("a refused payment is said under the form, with the field the server named", async () => {
    mockRouter.params = { studentMembershipId: PUPIL };
    await mountStaff(pupil(), "ADMIN", {
      [`GET /api/v1/fees/pupils/${PUPIL}`]: () => json(LEDGER),
      "POST /api/v1/fees/payments": () => json({ error: "That is more than is due.", code: "BAD_REQUEST", issues: { amountPaise: "That is more than is due." } }, 422),
    });
    await screen.findByText("Take a payment");
    await fireEvent.changeText(screen.getByLabelText("Amount (₹)"), "99999");
    await fireEvent.press(screen.getByRole("button", { name: "Record and issue receipt" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("That is more than is due.");
  });

  it("without an id, offers the dues", async () => {
    await mountStaff(pupil(), "ADMIN", {});
    expect(await screen.findByText("That was not found.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Dues" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/fees-dues");
  });
});

describe("the UPI claims", () => {
  it("lists each claim with its UTR and the stale mark; confirming issues the receipt", async () => {
    const { calls } = await mountStaff(<FeeClaims />, "ADMIN", { "GET /api/v1/fees/claims": () => json(CLAIMS), [`POST /api/v1/fees/claims/${PAY}/confirm`]: () => json({ receiptId: "r3", serial: "ZZ/2026/000003" }) });
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
    expect(screen.getByText("ZZ12345678901")).toBeTruthy();
    expect(screen.getByText("ZZ-REF-42")).toBeTruthy();
    expect(screen.getByText("Waiting more than 7 days")).toBeTruthy();
    expect(screen.getByText("1 started and not yet claimed")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Confirmed — receipt ZZ/2026/000003.")).toBeTruthy();
    expect(calls().some((c) => c.line === `POST /api/v1/fees/claims/${PAY}/confirm`)).toBe(true);
  });

  it("rejecting asks why first, and sends the reason", async () => {
    const { calls } = await mountStaff(<FeeClaims />, "ADMIN", { "GET /api/v1/fees/claims": () => json(CLAIMS), [`POST /api/v1/fees/claims/${PAY}/reject`]: () => json({ ok: true }) });
    await screen.findByText("ZZ Asha");
    await fireEvent.press(screen.getByRole("button", { name: "Reject" }));
    expect(calls().some((c) => c.line.endsWith("/reject"))).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Tell the family why"), "ZZ no such credit on the statement");
    await fireEvent.press(screen.getByRole("button", { name: "Reject" }));
    expect(await screen.findByText("Rejected; the family has been told.")).toBeTruthy();
    expect(calls().find((c) => c.line === `POST /api/v1/fees/claims/${PAY}/reject`)?.body).toEqual({ reason: "ZZ no such credit on the statement" });
  });

  it("nothing waiting is a door back to fees; the head is told it is the office's", async () => {
    await mountStaff(<FeeClaims />, "ADMIN", { "GET /api/v1/fees/claims": () => json({ claims: [], waitingForUtr: 0, staleAfterDays: 7 }) });
    expect(await screen.findByText("Nothing waiting.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Fees" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/fees");
    const { calls } = await mountStaff(<FeeClaims />, "PRINCIPAL", {});
    expect(await screen.findByText("Only the school office can do that.")).toBeTruthy();
    expect(calls().some((c) => c.line === "GET /api/v1/fees/claims")).toBe(false);
  });
});
