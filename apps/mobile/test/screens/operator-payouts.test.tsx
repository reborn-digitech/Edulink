import * as Sharing from "expo-sharing";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { OperatorPayouts } from "@/screens/operator/payouts";
import { OPERATOR_PAYOUTS, ROUTE_READY } from "./gig-fixtures";
import { json, mountStaff, refused, type Answers } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};
const PATH = "/api/v1/operator/gigs/payouts";
const VIEW = OPERATOR_PAYOUTS;
const mount = (overrides: Answers = {}) => mountStaff(<OperatorPayouts />, "ADMIN", { [`GET ${PATH}`]: () => json(VIEW()), ...overrides }, { me: OPERATOR });

describe("paid seats on the operator's console", () => {
  it("reads Route's checklist and the experts' linked accounts, the switch, the month's money, the legacy payout to pay by hand, what waits to be retried, and what was released or paid", async () => {
    await mount();
    expect(await screen.findByText("Razorpay Route status")).toBeTruthy();
    expect(screen.getByText("✓ A gateway key on this server (devbox)")).toBeTruthy();
    expect(screen.getByText("✓ The sessions webhook's secret is set")).toBeTruthy();
    expect(screen.getByText("✓ At least one expert's account activated by Razorpay (1 so far)")).toBeTruthy();
    expect(screen.getByText("1 with Razorpay for review, 1 need attention, 2 ready to link")).toBeTruthy();
    expect(screen.getByText("Linked with Razorpay: ready to be paid")).toBeTruthy();
    expect(screen.getByText("Razorpay needs more from you")).toBeTruthy();
    expect(screen.getByText("new bank details not yet sent · Razorpay asks about: settlements.ifsc_code")).toBeTruthy();
    expect(screen.getByText("ZZ IFSC not recognised")).toBeTruthy();
    expect(screen.getByText("identity papers not verified · details incomplete")).toBeTruthy();
    expect(screen.getByText("Not linked with Razorpay yet")).toBeTruthy();
    expect(screen.getByText("Payments to this expert are stopped.")).toBeTruthy();

    expect(screen.getByRole("switch", { name: "Paid seats are on" })).not.toBeDisabled();
    expect(screen.queryByText(/cannot be switched on yet/)).toBeNull();
    expect(screen.getByText("₹45")).toBeTruthy();
    expect(screen.getByText("₹8.10")).toBeTruthy();
    expect(screen.getByText("Released this month")).toBeTruthy();
    expect(screen.getAllByText("₹164.60").length).toBeGreaterThan(0);
    // A due figure from before Route is shown; nothing was paid out by hand this month, so that tile is not.
    expect(screen.getByText("Due to experts")).toBeTruthy();
    expect(screen.queryByText("Paid out this month")).toBeNull();

    expect(screen.getByText("To pay now")).toBeTruthy();
    expect(screen.getByText(/^Payouts the company recorded by hand before Route; no new seat comes here\. Pay each expert/)).toBeTruthy();
    expect(screen.getByText("Meenakshi Rao · Bank account ending 3456 · HDFC0001234 · GST state 27")).toBeTruthy();
    expect(screen.getByText("ZZ Dr Rao · ₹100 · refund · 2 attempt(s)")).toBeTruthy();
    expect(screen.getByText("ZZ gateway unreachable")).toBeTruthy();
    expect(screen.getByText("ZZ Dr Rao · ₹164.60 for 2 seat(s)")).toBeTruthy();
    expect(screen.getByText(/^Released through Razorpay on .* · SG\/2026-27\/0003$/)).toBeTruthy();
    expect(screen.getByText(/UTR123456789012 · SG\/2026-27\/0001/)).toBeTruthy();
  });

  it("links every ready expert and says what came of it", async () => {
    const { calls } = await mount({ "POST /api/v1/operator/gigs/route/link": () => json({ run: { tried: 2, activated: 1, pending: 1, refused: 0 } }) });
    await fireEvent.press(await screen.findByRole("button", { name: "Link every ready expert" }));
    expect(await screen.findByText("Done: 1 activated, 1 waiting for Razorpay, 0 refused.")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/operator/gigs/route/link")).toHaveLength(1);
  });

  it("a refused link-all is an alert", async () => {
    await mount({ "POST /api/v1/operator/gigs/route/link": refused("ZZ gateway down") });
    await fireEvent.press(await screen.findByRole("button", { name: "Link every ready expert" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ gateway down");
  });

  it("until Route is ready the switch cannot be turned on and says why; no gateway, no link-all; no legacy payout, no To pay now", async () => {
    const { calls } = await mount({ [`GET ${PATH}`]: () => json(VIEW({ paymentsEnabled: false, toPay: [], duePaise: 0, routeAccounts: [], route: { ...ROUTE_READY, gatewaySet: false, activated: 0, ready: false } })) });
    const off = await screen.findByRole("switch", { name: "Paid seats are off" });
    expect(off).toBeDisabled();
    expect(screen.getByText("Paid seats cannot be switched on yet: Razorpay Route must be working on the company's account (see the checklist).")).toBeTruthy();
    expect(screen.getByText("○ A gateway key on this server (devbox)")).toBeTruthy();
    expect(screen.getByText("○ At least one expert's account activated by Razorpay (0 so far)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Link every ready expert" })).toBeDisabled();
    expect(screen.getByText("No expert has saved their details yet.")).toBeTruthy();
    expect(screen.queryByText("To pay now")).toBeNull();
    expect(screen.queryByText("Due to experts")).toBeNull();
    await fireEvent.press(off);
    expect(calls().some((c) => c.line === `POST ${PATH}/switch`)).toBe(false);
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

  it("the company's missing details are named and the record button waits; nothing waiting and no payout are said", async () => {
    await mount({ [`GET ${PATH}`]: () => json(VIEW({ failures: [], paid: [], company: { legalName: null, gstin: null, address: null, stateCode: null, sacCode: "998599", invoicePrefix: "SG", gstPercent: 18, missing: ["legalName", "gstin", "stateCode"] } })) });
    expect(await screen.findByText("Still to set before a payout can be recorded: the legal name, the GSTIN, the state code.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Record the transfer to ZZ Dr Rao" })).toBeDisabled();
    expect(screen.getByText("Nothing is waiting.")).toBeTruthy();
    expect(screen.getByText("No payout yet.")).toBeTruthy();
  });

  it("a legacy payee with a UPI id and none saved are both said", async () => {
    await mount({
      [`GET ${PATH}`]: () =>
        json(
          VIEW({
            toPay: [
              { id: "po2", expertUserId: "u-rao", expertName: "ZZ Dr Rao", payee: { payeeName: "Meenakshi Rao", upiId: "meenakshi@upi", bankLast4: null, ifsc: null, gstStateCode: "27", gstin: "27ABCDE1234F1Z5", status: "SUSPENDED" }, netPaise: 8230, paymentsCount: 1, createdAt: "2026-09-28T09:00:00.000Z" },
              { id: "po4", expertUserId: "u-iyer", expertName: "ZZ Dr Iyer", payee: { payeeName: null, upiId: null, bankLast4: null, ifsc: null, gstStateCode: null, gstin: null, status: "NONE" }, netPaise: 5000, paymentsCount: 1, createdAt: "2026-09-28T09:00:00.000Z" },
            ],
          }),
        ),
    });
    expect(await screen.findByText("Meenakshi Rao · UPI meenakshi@upi · GST state 27 · GSTIN 27ABCDE1234F1Z5")).toBeTruthy();
    expect(screen.getByText("No payee details yet: the expert must say where to pay them.")).toBeTruthy();
  });

  it("a list that cannot be read is an alert with a retry", async () => {
    await mount({ [`GET ${PATH}`]: refused("ZZ not now") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now");
  });

  it("TA-189: a paid payout's invoice is fetched from the operator's door to the share sheet; a refusal is an alert", async () => {
    const PDF = "GET /api/v1/operator/gigs/invoices/inv1/pdf";
    const { calls } = await mount({ [PDF]: () => new Response(new Uint8Array([0x25, 0x50, 0x44, 0x46]), { status: 200, headers: { "content-type": "application/pdf" } }), "GET /api/v1/operator/gigs/invoices/inv3/pdf": refused("ZZ no such invoice") });
    await fireEvent.press(await screen.findByRole("button", { name: "Invoice PDF: SG/2026-27/0001" }));
    await waitFor(() => expect(Sharing.shareAsync).toHaveBeenCalledWith(expect.stringMatching(/SG 2026-27 0001\.pdf$/), expect.objectContaining({ mimeType: "application/pdf" })));
    expect(calls().filter((c) => c.line === PDF)).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: "Invoice PDF: SG/2026-27/0003" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ no such invoice");
  });
});
