import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { gigDisputesSchema, gigFamilySessionsSchema } from "@edulink/contracts";
import { FamilySessions } from "@/screens/family/sessions";
import { OperatorPayouts } from "@/screens/operator/payouts";
import { OPERATOR_PAYOUTS } from "./gig-fixtures";
import { json, mountStaff } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/**
 * TA-122 (the owner's decision of 14 November 2026): on the phone, a seat the provider marked shows until when the
 * family may say it was not held, the answer says the operator will decide, a disputed seat reads as such, and the
 * operator's paid-seats screen lists the disputes and decides them through the new door.
 */
const PATH = "/api/v1/gigs/sessions";
const seat = (over: Record<string, unknown>) => ({ id: "b1", kind: "ONE_TO_ONE", title: "ZZ Marked held", startsAt: "2026-11-10T10:00:00.000Z", endsAt: "2026-11-10T10:30:00.000Z", providerName: "ZZ Dr Rao", providerKind: "EXPERT", purpose: "ZZ How do bridges stand?", status: "DELIVERED", meetingUrl: null, lateCancel: false, rating: null, paid: false, pricePaise: 0, payment: null, canConsent: false, canPay: false, canCancel: false, canRate: true, canReportUnheld: true, disputeUntil: "2026-11-12T10:01:00.000Z", ...over });
const view = (bookings: unknown[]) =>
  gigFamilySessionsSchema.parse({ freeCancelHours: 12, paymentsOn: false, children: [{ id: "m-child", name: "ZZ Asha", schoolName: "ZZ School", timeZone: "Asia/Kolkata", allowance: { ONE_TO_ONE: { allowed: 2, used: 1, left: 1 }, WORKSHOP: { allowed: 2, used: 0, left: 2 } }, bookings, open: [] }] });

const OPERATOR = {
  user: { id: "u-op", name: "ZZ Operator", preferredName: null, email: "op@zz.test", avatarKey: null, isMinor: false, locale: "en", isSuperuser: true, isAppAdmin: false },
  active: { schoolId: null, role: null, membershipId: null },
  contexts: [],
};
const DISPUTES = gigDisputesSchema.parse({ disputes: [{ bookingId: "b7", schoolName: "ZZ Riverside", kind: "ONE_TO_ONE", title: "ZZ Ask an engineer", startsAt: "2026-11-10T10:00:00.000Z", endsAt: "2026-11-10T10:30:00.000Z", providerName: "ZZ Dr Rao", providerKind: "EXPERT", mark: "DELIVERED", markedAt: "2026-11-10T10:01:00.000Z", disputedAt: "2026-11-10T12:00:00.000Z", paid: false, amountPaise: null, paymentStatus: null }] });

describe("TA-122: a marked seat disputed on the phone", () => {
  it("TA-122: the family reads until when it may object, says it was not held, and is told the operator decides; a disputed seat reads as such", async () => {
    const { calls } = await mountStaff(<FamilySessions />, "PARENT", {
      [`GET ${PATH}`]: () => json(view([seat({}), seat({ id: "b2", title: "ZZ Disputed", status: "DISPUTED", canRate: false, canReportUnheld: false, disputeUntil: null })])),
      [`POST ${PATH}/b1/unheld`]: () => json({ status: "DISPUTED" }),
    });
    expect(await screen.findByText(/^If it was not held, you may say so until /)).toBeTruthy();
    expect(screen.getByText("Not held, says the family: the operator decides")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "It was not held: ZZ Marked held" }));
    expect(await screen.findByText("Noted. The provider had marked it, so the operator will decide; any payment waits until then.")).toBeTruthy();
    expect(calls().filter((c) => c.line === `POST ${PATH}/b1/unheld`)).toHaveLength(1);
  });

  it("TA-122: the operator reads the disputes and decides one through the new door", async () => {
    const { calls } = await mountStaff(<OperatorPayouts />, "ADMIN", {
      "GET /api/v1/operator/gigs/payouts": () => json(OPERATOR_PAYOUTS()),
      "GET /api/v1/operator/gigs/disputes": () => json(DISPUTES),
      "POST /api/v1/operator/gigs/disputes/b7/decide": () => json({ status: "UNHELD" }),
    }, { me: OPERATOR });
    expect(await screen.findByText("Sessions a family says were not held")).toBeTruthy();
    expect(screen.getByText("ZZ Ask an engineer")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Not held: refund the family: ZZ Ask an engineer" }));
    expect(await screen.findByText("Decided: not held. The family is told.")).toBeTruthy();
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/operator/gigs/disputes/b7/decide")?.body).toEqual({ decision: "REFUND" }));
  });
});
