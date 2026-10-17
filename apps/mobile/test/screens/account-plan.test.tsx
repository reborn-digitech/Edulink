import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { accountOverviewSchema, passOverviewSchema, sessionsListSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Account } from "@/screens/shared/account";
import { json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

/**
 * "Your plan" on the account screen (plans-pay, 17 Oct 2026): the plans held until a day, and a button that opens the
 * web's Plans page in the system browser while there is a pass to buy or to ask a guardian for; nothing is paid in
 * the app. An older server without the door draws no card.
 */
const OVERVIEW = accountOverviewSchema.parse({
  name: "ZZ Teacher",
  preferredName: null,
  email: "teacher@zz.test",
  loginName: null,
  emailConfirmed: true,
  phone: null,
  phoneConfirmed: false,
  avatarKey: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  prefs: { locale: "en", theme: "system", contrast: "normal", font: "default", motion: "full", channels: { push: true, email: false }, quietHours: null },
  showRecord: false,
});
const SESSIONS = sessionsListSchema.parse({ sessions: [] });
const PASS = "GET /api/v1/account/pass";
const offer = (buy: "PAY" | "ASK_GUARDIAN" | "NOT_ASKED") => ({ plan: "TEACHER", holder: { userId: "u1", name: "ZZ Teacher", studentMembershipId: null, self: true }, holdsUntil: null, prices: [{ period: "MONTH", amountPaise: 19900, gstPaise: 3582, totalPaise: 23482 }], buy });

function mount(answers: Answers, role: RoleCode = "TEACHER") {
  return mountStaff(
    <ToastProvider>
      <Account />
    </ToastProvider>,
    role,
    { "GET /api/v1/account": () => json(OVERVIEW), "GET /api/v1/me/sessions": () => json(SESSIONS), ...answers },
  );
}

describe("your plan on the account screen", () => {
  beforeEach(() => jest.restoreAllMocks());

  it("shows the plan held until its last day, and opens the web's Plans page to buy a pass", async () => {
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    await mount({ [PASS]: () => json(passOverviewSchema.parse({ held: [{ plan: "TEACHER", validTo: "2026-11-17T18:30:00.000Z" }], gstPercent: 18, offers: [offer("PAY")] })) });
    expect(await screen.findByText("Your plan")).toBeTruthy();
    expect(screen.getByText(/^Teacher plan, active until /)).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Buy a pass" }));
    expect(open).toHaveBeenCalledWith(expect.stringMatching(/\/account\/plan$/));
    expect(screen.getByText("Payment opens in your browser, on the web.")).toBeTruthy();
  });

  it("says no plan is held, and offers no button when there is nothing to buy", async () => {
    await mount({ [PASS]: () => json(passOverviewSchema.parse({ held: [], gstPercent: 18, offers: [offer("NOT_ASKED")] })) });
    expect(await screen.findByText("You hold no plan.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Buy a pass" })).toBeNull();
  });

  it("draws no card when the server has no such door", async () => {
    await mount({});
    await screen.findAllByText("teacher@zz.test");
    await waitFor(() => expect(screen.queryByText("Your plan")).toBeNull());
  });
});
