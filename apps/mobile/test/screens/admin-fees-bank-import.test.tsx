import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffFees } from "@/screens/staff/fees";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

/**
 * The bank statement on the fees overview: pasted, checked by the server
 * (each line with what it would do), recorded on the button, with a line
 * the server refused reported against its number. The rest of the overview
 * is held by admin-fees.test.tsx.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const OVERVIEW = {
  year: { id: "y1", name: "2026-27" },
  todayKey: "2026-09-17",
  totals: { demandedPaise: 50_000_000, collectedPaise: 30_000_000, outstandingPaise: 20_000_000, overduePaise: 5_000_000 },
  pupils: { onPlan: 48, withoutPlan: 2 },
  byGrade: [],
  ageing: { current: 0, d30: 0, d90: 0, d90plus: 0 },
  methodsThisMonth: [],
  recent: [],
  claims: { waiting: 0, stale: 0 },
  initiatedOnline: 0,
  structures: 1,
  heads: 3,
  options: { online: false, upi: true },
};
const STATEMENT = "Date,Description,Reference,Credit\n01/09/2026,NEFT ZZ-P-01 RAVI,N245261234567890,12500.00\n02/09/2026,UPI,UTR123456789012,250\n03/09/2026,NEFT NOBODY,N999,10";
const LINE = (over: Record<string, unknown>) => ({ line: 2, dateKey: "2026-09-01", description: "NEFT ZZ-P-01 RAVI", reference: "N245261234567890", amountPaise: 1_250_000, method: "BANK", outcome: "new", studentMembershipId: "czz000000000000000pupil1", pupilName: "ZZ Asha", paymentId: null, problemKey: null, ...over });
const PREVIEW = {
  lines: [
    LINE({}),
    LINE({ line: 3, dateKey: "2026-09-02", description: "UPI", reference: "UTR123456789012", amountPaise: 25_000, method: "UPI", outcome: "claim", pupilName: "ZZ Bhavesh", paymentId: "czz0000000000000000pay01" }),
    LINE({ line: 4, dateKey: "2026-09-03", description: "NEFT NOBODY", reference: "N999", amountPaise: 1_000, outcome: "unmatched", studentMembershipId: null, pupilName: null, problemKey: "officeBulk.bankNoPupil" }),
  ],
  counts: { new: 1, claim: 1, already: 0, unmatched: 1 },
};
const mount = (answers: Answers = {}) =>
  mountStaff(
    <ToastProvider>
      <StaffFees />
    </ToastProvider>,
    "ADMIN",
    { "GET /api/v1/fees/overview": () => json(OVERVIEW), "GET /api/v1/fees/structures": () => json({ structures: [] }), "GET /api/v1/fees/settings": () => json({ upiId: null, upiPayee: null, receiptPrefix: "R", bankNote: null, pupilFeeViewAge: null, gateway: null }), ...answers },
  );

describe("the bank statement on the phone", () => {
  it("is checked first, each line with what it would do, then recorded on the button, and the refused line is named", async () => {
    const { calls } = await mount({
      "POST /api/v1/fees/bank-import/preview": () => json(PREVIEW),
      "POST /api/v1/fees/bank-import/commit": () => json({ recorded: 1, confirmed: 0, already: 0, unmatched: 1, failed: [{ line: 3, error: "ZZ That claim was already confirmed." }] }),
    });
    expect(await screen.findByRole("button", { name: "Check the statement" })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("The statement"), STATEMENT);
    await fireEvent.press(screen.getByRole("button", { name: "Check the statement" }));
    expect(await screen.findByText("1 to record · 1 claims to confirm · 0 already in the ledger · 1 to key by hand")).toBeTruthy();
    expect(screen.getByText("Record for ZZ Asha · Bank transfer · N245261234567890")).toBeTruthy();
    expect(screen.getByText("Confirm the claim of ZZ Bhavesh · UTR123456789012")).toBeTruthy();
    expect(screen.getByText("Key by hand · No pupil's code or UTR on the line · N999")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/fees/bank-import/preview")?.body).toEqual({ csv: STATEMENT });
    expect(calls().some((c) => c.line === "POST /api/v1/fees/bank-import/commit")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Record the matched lines (2)" }));
    expect(await screen.findByText("1 payments recorded and 0 claims confirmed; 1 left to key by hand.")).toBeTruthy();
    expect(screen.getByText("Line 3: ZZ That claim was already confirmed.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/fees/bank-import/commit")?.body).toEqual({ csv: STATEMENT });
    await waitFor(() => expect(calls().filter((c) => c.line === "GET /api/v1/fees/overview").length).toBeGreaterThanOrEqual(2));
  });

  it("a statement with nothing to record says so, and an unreadable one is the server's sentence", async () => {
    await mount({ "POST /api/v1/fees/bank-import/preview": () => json({ lines: [PREVIEW.lines[2]], counts: { new: 0, claim: 0, already: 0, unmatched: 1 } }) });
    await screen.findByRole("button", { name: "Check the statement" });
    await fireEvent.changeText(screen.getByLabelText("The statement"), "x");
    await fireEvent.press(screen.getByRole("button", { name: "Check the statement" }));
    expect(await screen.findByText("No line on the statement matched a pupil.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /Record the matched lines/ })).toBeNull();
  });

  it("an unreadable statement is the server's sentence, and the head has no card", async () => {
    await mount({ "POST /api/v1/fees/bank-import/preview": refused("The statement needs a credit or an amount column.", 422) });
    await screen.findByRole("button", { name: "Check the statement" });
    await fireEvent.changeText(screen.getByLabelText("The statement"), "x");
    await fireEvent.press(screen.getByRole("button", { name: "Check the statement" }));
    expect(await screen.findByText("The statement needs a credit or an amount column.")).toBeTruthy();
  });

  it("the head reads the overview without the card", async () => {
    await mountStaff(<StaffFees />, "PRINCIPAL", { "GET /api/v1/fees/overview": () => json(OVERVIEW) });
    await screen.findByLabelText(/Collected/);
    expect(screen.queryByText("Import a bank statement")).toBeNull();
  });
});
