import { fireEvent, screen } from "@testing-library/react-native";
import { EarningsCard, GetPaidCard } from "@/screens/expert/earnings";
import { EARNINGS, PAYOUT, SAVED_PAYEE } from "./gig-fixtures";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

const GET = "GET /api/v1/expert/payout";
const LINK = "POST /api/v1/expert/payout/link";
const mountCard = (answers: Answers) => mountStaff(<GetPaidCard />, "EXPERT", answers);
const mountEarnings = (answers: Answers) => mountStaff(<EarningsCard />, "EXPERT", answers);

describe("the expert's Get paid card with Razorpay Route", () => {
  it("links with Razorpay through the link endpoint and shows where the review now stands", async () => {
    const after = PAYOUT(SAVED_PAYEE, { status: "UNDER_REVIEW", linked: true, readyToLink: true, locked: true, checkedAt: "2026-10-02T09:00:00.000Z" });
    const { calls } = await mountCard({ [GET]: () => json(PAYOUT(SAVED_PAYEE, { readyToLink: true })), [LINK]: () => json({ outcome: "pending", payout: after.payout, gate: after.gate }) });
    expect(await screen.findByText("Not linked with Razorpay yet")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Link with Razorpay" }));
    expect(await screen.findByText("Sent to Razorpay.")).toBeTruthy();
    expect(screen.getByText("Razorpay is checking it")).toBeTruthy();
    expect(screen.getByText(/^Last checked /)).toBeTruthy();
    // Linked, nothing to resend: the same button now asks again.
    expect(screen.getByRole("button", { name: "Check again" })).toBeTruthy();
    const call = calls().filter((c) => c.line === LINK);
    expect(call).toHaveLength(1);
    expect(call[0]?.body).toBeUndefined();
  });

  it("linked with Razorpay while the papers wait: says not ready yet and linked, never 'Not linked yet' over 'ready to be paid' (QA-62)", async () => {
    await mountCard({ [GET]: () => json(PAYOUT({ ...SAVED_PAYEE, kycVerified: false }, { status: "ACTIVATED", linked: true, readyToLink: false, locked: true }, { kycVerified: false, payoutActive: false })) });
    expect(await screen.findByText("Not ready to be paid yet")).toBeTruthy();
    expect(screen.getByText("Linked with Razorpay")).toBeTruthy();
    expect(screen.queryByText("Not linked yet")).toBeNull();
    expect(screen.queryByText("Linked with Razorpay: ready to be paid")).toBeNull();
  });

  it("linked and ready reads ready (QA-62)", async () => {
    await mountCard({ [GET]: () => json(PAYOUT({ ...SAVED_PAYEE, status: "ACTIVE" }, { status: "ACTIVATED", linked: true, readyToLink: true, locked: true })) });
    expect(await screen.findByText("Ready to be paid")).toBeTruthy();
    expect(screen.getByText("Linked with Razorpay: ready to be paid")).toBeTruthy();
  });

  it("new bank details to send, what Razorpay asks about and its last answer are said; the button sends them again", async () => {
    await mountCard({ [GET]: () => json(PAYOUT(SAVED_PAYEE, { status: "NEEDS_CLARIFICATION", linked: true, needsResend: true, readyToLink: true, locked: true, requirements: [{ field: "settlements.ifsc_code", reason: "invalid" }], error: "ZZ IFSC not recognised" })) });
    expect(await screen.findByText("Razorpay needs more from you")).toBeTruthy();
    expect(screen.getByText("You changed your bank details: send them to Razorpay before a seat can be sold.")).toBeTruthy();
    expect(screen.getByText("Razorpay asks about: settlements.ifsc_code")).toBeTruthy();
    expect(screen.getByText("Razorpay's last answer: ZZ IFSC not recognised")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Send the new bank details to Razorpay" })).not.toBeDisabled();
  });

  it("the link waits: for KYC, with the gateway off, while suspended, and while the form is open", async () => {
    await mountCard({ [GET]: () => json(PAYOUT({ ...SAVED_PAYEE, kycVerified: false }, { readyToLink: false }, { kycVerified: false })) });
    expect(await screen.findByText("The link waits for your identity papers to be verified.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link with Razorpay" })).toBeDisabled();

    await mountCard({ [GET]: () => json(PAYOUT({ ...SAVED_PAYEE, transport: "off" }, { readyToLink: true })) });
    expect(await screen.findByText("Paid seats are off on this server.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link with Razorpay" })).toBeDisabled();

    await mountCard({ [GET]: () => json(PAYOUT({ ...SAVED_PAYEE, status: "SUSPENDED", note: "ZZ papers expired" }, { readyToLink: true })) });
    expect(await screen.findByText("Payments to you are stopped")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link with Razorpay" })).toBeDisabled();

    await mountCard({ [GET]: () => json(PAYOUT(SAVED_PAYEE, { readyToLink: true })) });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.queryByRole("button", { name: "Link with Razorpay" })).toBeNull();
    await fireEvent.press(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Link with Razorpay" })).not.toBeDisabled();
  });

  it("once linked, the name, PAN, address, town, PIN and state are shut; a new bank account is saved and the rest kept", async () => {
    const locked = PAYOUT(SAVED_PAYEE, { status: "ACTIVATED", linked: true, readyToLink: true, locked: true });
    const { calls } = await mountCard({ [GET]: () => json(locked), "POST /api/v1/expert/payout": () => json(PAYOUT(SAVED_PAYEE, { status: "ACTIVATED", linked: true, readyToLink: true, locked: true, needsResend: true })) });
    await fireEvent.press(await screen.findByRole("button", { name: "Edit" }));
    expect(screen.getByText("Your name, PAN and address are with Razorpay; to change them, ask the operator.")).toBeTruthy();
    for (const label of ["Name of the payee", "PAN number", "Address (house, street, area)", "Town or city", "PIN code", "GST state code"]) expect(screen.getByLabelText(label).props.editable).toBe(false);
    for (const label of ["Bank account number", "IFSC code", "Mobile number", "GSTIN (optional)"]) expect(screen.getByLabelText(label).props.editable).not.toBe(false);
    expect(screen.getAllByText("Leave empty to keep the one saved.")).toHaveLength(2);
    await fireEvent.changeText(screen.getByLabelText("Bank account number"), "9999 0000 1111");
    await fireEvent.press(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/expert/payout")?.body).toEqual({ payeeName: "ZZ Meenakshi Rao", bankAccount: "9999 0000 1111", ifsc: "HDFC0001234", pan: null, addressLine: "ZZ 12 Lake Road", city: "ZZ Pune", postalCode: "411001", phone: "9800000001", gstStateCode: "27", gstin: null });
    expect(screen.getByRole("button", { name: "Send the new bank details to Razorpay" })).toBeTruthy();
  });

  it("a refused link is an alert", async () => {
    await mountCard({ [GET]: () => json(PAYOUT(SAVED_PAYEE, { readyToLink: true })), [LINK]: refused("ZZ Razorpay refused the PAN") });
    await fireEvent.press(await screen.findByRole("button", { name: "Link with Razorpay" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Razorpay refused the PAN");
  });
});

describe("the expert's earnings with Razorpay releases", () => {
  it("a released seat and a released payout are said, and Paid to you counts releases and hand payouts together; no Due tile when nothing is due", async () => {
    await mountEarnings({
      "GET /api/v1/expert/earnings": () =>
        json(
          EARNINGS(
            { heldPaise: 0, releasedPaise: 8230, paidOutPaise: 1000, payouts: [{ id: "po3", netPaise: 8230, paymentsCount: 1, status: "RELEASED", reference: null, paidAt: "2030-10-13T06:00:00.000Z", createdAt: "2030-10-13T06:00:00.000Z", invoiceId: "inv3", invoiceNumber: "SG/2030-31/0003" }] },
            { status: "RELEASED", releasedAt: "2030-10-13T06:00:00.000Z", payoutId: "po3" },
          ),
        ),
    });
    expect(await screen.findByText("Released to your bank")).toBeTruthy();
    expect(screen.getByText(/· Released on /)).toBeTruthy();
    expect(screen.getByLabelText("Paid to you: ₹92.30")).toBeTruthy();
    expect(screen.queryByLabelText(/^Due to you/)).toBeNull();
    expect(screen.getByText(/^₹82\.30 for 1 seat\(s\) · Released through Razorpay on /)).toBeTruthy();
  });

  it("a due figure from before Route still shows its tile and its date", async () => {
    await mountEarnings({ "GET /api/v1/expert/earnings": () => json(EARNINGS({ heldPaise: 0, duePaise: 8230 }, { status: "DUE", dueAt: "2030-10-15T06:00:00.000Z" })) });
    expect(await screen.findByLabelText("Due to you: ₹82.30")).toBeTruthy();
    expect(screen.getByText(/· Due since /)).toBeTruthy();
  });
});
