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
    heldPaise: 17000,
    releasedThisMonthPaise: 8500,
    refundedThisMonthPaise: 10000,
    failures: [{ paymentId: "sp7", expertName: "ZZ Dr Rao", amountPaise: 8500, action: "RELEASE", lastError: "ZZ gateway unreachable", attempts: 2, since: "2026-10-01T10:00:00.000Z" }],
    payouts: [{ id: "po1", expertName: "ZZ Dr Rao", amountPaise: 8500, transfers: 1, status: "SETTLED", settlementId: "setl_zz1", createdAt: "2026-10-01T09:00:00.000Z" }],
    ...over,
  });
const mount = (overrides: Answers = {}) => mountStaff(<OperatorPayouts />, "ADMIN", { [`GET ${PATH}`]: () => json(VIEW()), ...overrides }, { me: OPERATOR });

describe("paid seats on the operator's console", () => {
  it("reads the switch, the month's money, what waits to be retried and the payouts", async () => {
    await mount();
    expect(await screen.findByRole("switch", { name: "Paid seats are on" })).toBeTruthy();
    expect(screen.getByText("₹45")).toBeTruthy();
    expect(screen.getByText("₹170")).toBeTruthy();
    expect(screen.getByText("ZZ Dr Rao · ₹85 · release · 2 attempt(s)")).toBeTruthy();
    expect(screen.getByText("ZZ gateway unreachable")).toBeTruthy();
    expect(screen.getByText("ZZ Dr Rao · ₹85 for 1 seat(s)")).toBeTruthy();
    expect(screen.getByText(/Settlement setl_zz1/)).toBeTruthy();
  });

  it("turns paid seats off with the body the contract takes, and tries a waiting release again", async () => {
    const { calls } = await mount({ [`POST ${PATH}/switch`]: () => json({ paymentsEnabled: false }), [`POST ${PATH}/sp7/retry`]: () => json({ outcome: "released" }) });
    await fireEvent.press(await screen.findByRole("switch", { name: "Paid seats are on" }));
    await waitFor(() => expect(calls().find((c) => c.line === `POST ${PATH}/switch`)?.body).toEqual({ on: false }));
    expect(await screen.findByText("Saved.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Try again: ZZ Dr Rao" }));
    await waitFor(() => expect(calls().filter((c) => c.line === `POST ${PATH}/sp7/retry`)).toHaveLength(1));
    expect(await screen.findByText("Tried: released")).toBeTruthy();
  });

  it("nothing waiting and no payout are said; a refusal is an alert", async () => {
    await mount({ [`GET ${PATH}`]: () => json(VIEW({ paymentsEnabled: false, failures: [], payouts: [] })) });
    expect(await screen.findByRole("switch", { name: "Paid seats are off" })).toBeTruthy();
    expect(screen.getByText("Nothing is waiting.")).toBeTruthy();
    expect(screen.getByText("No payout yet.")).toBeTruthy();
  });

  it("a list that cannot be read is an alert with a retry", async () => {
    await mount({ [`GET ${PATH}`]: refused("ZZ not now") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ not now");
  });
});
