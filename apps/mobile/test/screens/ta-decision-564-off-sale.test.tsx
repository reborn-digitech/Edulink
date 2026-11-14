import { screen } from "@testing-library/react-native";
import { GetPaidCard } from "@/screens/expert/earnings";
import { PAYOUT, SAVED_PAYEE } from "./gig-fixtures";
import { json, mountStaff } from "./staff-harness";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }), useLocalSearchParams: () => ({}) }));

/**
 * TA-564 (the owner's decision of 14 November 2026): the open free offer binds the sale of an expert's priced times as
 * well as their pricing, and while it lapses the expert's checklist of the four conditions says the times are off sale.
 */
const GET = "GET /api/v1/expert/payout";
const LINE = "Your priced times are off sale: families cannot book them until you offer a free one-to-one again";

describe("TA-564: the expert's checklist says when their priced times are off sale", () => {
  it("TA-564: the line shows while priced times are off sale", async () => {
    await mountStaff(<GetPaidCard />, "EXPERT", { [GET]: () => json(PAYOUT(SAVED_PAYEE, {}, { mentoringOffer: false, pricedOffSale: 2 })) });
    expect(await screen.findByText(LINE)).toBeTruthy();
  });

  it("TA-564: no line while the offer stands", async () => {
    await mountStaff(<GetPaidCard />, "EXPERT", { [GET]: () => json(PAYOUT(SAVED_PAYEE, {}, { mentoringOffer: true, pricedOffSale: 0 })) });
    expect(await screen.findByText(/A free one-to-one offered in the coming 30 days/)).toBeTruthy();
    expect(screen.queryByText(LINE)).toBeNull();
  });

  it("TA-564: no line from a server that does not say", async () => {
    await mountStaff(<GetPaidCard />, "EXPERT", { [GET]: () => json(PAYOUT(SAVED_PAYEE, {}, { mentoringOffer: false })) });
    expect(await screen.findByText(/A free one-to-one offered in the coming 30 days/)).toBeTruthy();
    expect(screen.queryByText(LINE)).toBeNull();
  });
});
