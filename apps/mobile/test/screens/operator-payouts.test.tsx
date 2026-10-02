import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigPayoutsSchema } from "@edulink/contracts";
import { OperatorPayouts } from "@/screens/operator/payouts";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};
const PATH = "/api/v1/operator/gigs/payouts";
const VIEW = (over: Record<string, unknown> = {}) =>
  gigPayoutsSchema.parse({
    paymentsEnabled: true,
    transport: "devbox",
    month: "2026-10",
    commissionThisMonthPaise: 4500,
    gstThisMonthPaise: 810,
    heldPaise: 16460,
    duePaise: 8230,
    paidOutThisMonthPaise: 8230,
    refundedThisMonthPaise: 10000,
    company: { legalName: "ZZ Shalaghar Private Limited", gstin: "27AAACZ1234A1Z5", address: null, stateCode: "27", sacCode: "998599", invoicePrefix: "SG", gstPercent: 18, missing: [] },
    failures: [{ paymentId: "sp7", expertName: "ZZ Dr Rao", amountPaise: 10000, action: "REFUND", lastError: "ZZ gateway unreachable", attempts: 2, since: "2026-10-01T10:00:00.000Z" }],
    toPay: [{ id: "po2", expertUserId: "u-rao", expertName: "ZZ Dr Rao", payee: { payeeName: "Meenakshi Rao", upiId: "meenakshi@upi", bankLast4: null, ifsc: null, gstStateCode: "27", gstin: null, status: "ACTIVE" }, netPaise: 8230, paymentsCount: 1, createdAt: "2026-10-02T09:00:00.000Z" }],
    paid: [{ id: "po1", expertUserId: "u-rao", expertName: "ZZ Dr Rao", netPaise: 8230, paymentsCount: 1, reference: "UTR123456789012", paidAt: "2026-10-01T09:00:00.000Z", invoiceId: "inv1", invoiceNumber: "SG/2026-27/0001", note: null }],
    ...over,
  });
const mount = (overrides: Answers = {}) => mountStaff(<OperatorPayouts />, "ADMIN", { [`GET ${PATH}`]: () => json(VIEW()), ...overrides }, { me: OPERATOR });

describe("paid seats on the operator's console", () => {
  it("reads the switch, the month's money, what is to pay now and where, what waits to be retried, and the payouts paid with their invoice", async () => {
    await mount();
    expect(await screen.findByRole("switch", { name: "Paid seats are on" })).toBeTruthy();
    expect(screen.getByText("₹45")).toBeTruthy();
    expect(screen.getByText("₹8.10")).toBeTruthy();
    expect(screen.getByText("₹164.60")).toBeTruthy();
    expect(screen.getAllByText("ZZ Dr Rao · ₹82.30 for 1 seat(s)")).toHaveLength(2);
    expect(screen.getByText("Meenakshi Rao · UPI meenakshi@upi · GST state 27")).toBeTruthy();
    expect(screen.getByText("ZZ Dr Rao · ₹100 · refund · 2 attempt(s)")).toBeTruthy();
    expect(screen.getByText("ZZ gateway unreachable")).toBeTruthy();
    expect(screen.getByText(/UTR123456789012 · SG\/2026-27\/0001/)).toBeTruthy();
  });

  it("records the company's transfer with the body the contract takes, turns paid seats off, and tries a waiting refund again", async () => {
    const { calls } = await mount({
      [`POST ${PATH}/switch`]: () => json({ paymentsEnabled: false }),
      [`POST /api/v1/operator/gigs/payments/sp7/retry`]: () => json({ outcome: "refunded" }),
      [`POST ${PATH}/po2/pay`]: () => json({ payout: { id: "po2", netPaise: 8230, paymentsCount: 1, reference: "UTR999999999999" }, invoice: { id: "inv2", number: "SG/2026-27/0002", totalPaise: 1770 } }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Record the transfer to ZZ Dr Rao" }));
    await fireEvent.changeText(screen.getByLabelText("Reference (UTR) of the transfer"), "utr999999999999");
    await fireEvent.changeText(screen.getByLabelText("Note (optional)"), "ZZ by NEFT");
    await fireEvent.press(screen.getByRole("button", { name: "Record the transfer to ZZ Dr Rao" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}/po2/pay`)?.body).toEqual({ reference: "utr999999999999", note: "ZZ by NEFT" }));
    expect(await screen.findByText("Recorded: ₹82.30 to ZZ Dr Rao; invoice SG/2026-27/0002 issued.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("switch", { name: "Paid seats are on" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}/switch`)?.body).toEqual({ on: false }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again: ZZ Dr Rao" }));
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/operator/gigs/payments/sp7/retry")).toHaveLength(1));
    expect(await screen.findByText("Tried: refunded")).toBeTruthy();
  });

  it("the company's missing details are named and the record button waits; nothing due, nothing waiting and no payout are said", async () => {
    await mount({ [`GET ${PATH}`]: () => json(VIEW({ paymentsEnabled: false, failures: [], paid: [], company: { legalName: null, gstin: null, address: null, stateCode: null, sacCode: "998599", invoicePrefix: "SG", gstPercent: 18, missing: ["legalName", "gstin", "stateCode"] } })) });
    expect(await screen.findByRole("switch", { name: "Paid seats are off" })).toBeTruthy();
    expect(screen.getByText("Still to set before a payout can be recorded: the legal name, the GSTIN, the state code.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record the transfer to ZZ Dr Rao" })).toBeDisabled();
    expect(screen.getByText("Nothing is waiting.")).toBeTruthy();
    expect(screen.getByText("No payout yet.")).toBeTruthy();
    await mount({ [`GET ${PATH}`]: () => json(VIEW({ toPay: [] })) });
    expect(await screen.findByText("Nothing is due to any expert.")).toBeTruthy();
  });

  it("a list that cannot be read is an alert with a retry", async () => {
    await mount({ [`GET ${PATH}`]: refused("ZZ not now") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now");
  });
});
