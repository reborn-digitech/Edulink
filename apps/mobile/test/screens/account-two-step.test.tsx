import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { Linking } from "react-native";
import { accountOverviewSchema, sessionsListSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Account } from "@/screens/shared/account";
import { gated, json, mountStaff, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const OVERVIEW = accountOverviewSchema.parse({
  name: "ZZ Head",
  preferredName: null,
  email: "head@zz.test",
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
const STATUS = "GET /api/v1/account/totp";
const SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";
const URI = `otpauth://totp/Relay:head%40zz.test?secret=${SECRET}&issuer=Relay&algorithm=SHA1&digits=6&period=30`;
const CODES = ["K7PM-3XQ2", "ABCD-EFGH", "JKLM-NPQR", "STUV-WXYZ", "2345-6789", "AAAA-BBBB", "CCCC-DDDD", "EEEE-FFFF"];
const off = { eligible: true, enabled: false, enabledAt: null, recoveryLeft: 0, available: true };
const on = { eligible: true, enabled: true, enabledAt: "2026-09-01T00:00:00.000Z", recoveryLeft: 8, available: true };

function mount(answers: Answers = {}, role: RoleCode = "ADMIN") {
  return mountStaff(
    <ToastProvider>
      <Account />
    </ToastProvider>,
    role,
    { "GET /api/v1/account": () => json(OVERVIEW), "GET /api/v1/me/sessions": () => json(SESSIONS), [STATUS]: () => json(off), ...answers },
  );
}

describe("two-step sign-in on the account screen", () => {
  beforeEach(() => jest.restoreAllMocks());

  it("is not drawn for somebody the status says may not turn it on", async () => {
    await mount({ [STATUS]: () => json({ ...off, eligible: false }) }, "TEACHER");
    await screen.findAllByText("head@zz.test");
    await waitFor(() => expect(screen.queryByText("Two-step sign-in")).toBeNull());
    expect(screen.queryByRole("button", { name: "Turn on" })).toBeNull();
  });

  it("off: turn on shows the key, the link opens the app, a wrong code is refused on the field, the right one shows eight recovery codes once, and the card is then on", async () => {
    let enabled = false;
    let tries = 0;
    const open = jest.spyOn(Linking, "openURL").mockResolvedValue(true);
    const { calls } = await mount({
      [STATUS]: () => json(enabled ? on : off),
      "POST /api/v1/account/totp/start": () => json({ secret: SECRET, uri: URI, account: "head@zz.test" }),
      "POST /api/v1/account/totp/confirm": () => {
        if (++tries === 1) return json({ error: "Some of this needs another look.", code: "BAD_REQUEST", issues: { code: "ZZ That code is not right." } }, 422);
        enabled = true;
        return json({ recoveryCodes: CODES });
      },
    });
    expect(await screen.findByText("Two-step sign-in is off.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Turn on" }));
    expect(await screen.findByText("GEZD GNBV GY3T QOJQ GEZD GNBV GY3T QOJQ")).toBeTruthy();
    expect(screen.getByText("This phone cannot scan itself: copy the key or the link into the authenticator app.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Open in the authenticator app" }));
    expect(open).toHaveBeenCalledWith(URI);

    const box = screen.getByLabelText("The six-digit code from the app");
    await fireEvent.changeText(box, "000000");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm and turn on" }));
    expect(await screen.findByText("ZZ That code is not right.")).toBeTruthy();
    await fireEvent.changeText(box, "123456");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm and turn on" }));
    expect(await screen.findByText("Your recovery codes")).toBeTruthy();
    for (const code of CODES) expect(screen.getByText(code)).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/account/totp/confirm").map((c) => c.body)).toEqual([{ code: "000000" }, { code: "123456" }]);

    await fireEvent.press(screen.getByRole("button", { name: "I have saved them" }));
    expect(await screen.findByText("8 recovery codes left")).toBeTruthy();
    expect(screen.queryByText("K7PM-3XQ2")).toBeNull();
    expect(screen.getByRole("button", { name: "Turn off" })).toBeTruthy();
  });

  it("on: turning off asks for a code, a wrong one is refused, the right one turns it off", async () => {
    let enabled = true;
    let tries = 0;
    await mount({
      [STATUS]: () => json(enabled ? { ...on, recoveryLeft: 7 } : off),
      "POST /api/v1/account/totp/disable": () => {
        if (++tries === 1) return json({ error: "Some of this needs another look.", code: "BAD_REQUEST", issues: { code: "ZZ That code is not right." } }, 422);
        enabled = false;
        return json({ ok: true });
      },
    });
    expect(await screen.findByText("7 recovery codes left")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Turn off" }));
    const box = await screen.findByLabelText("The six-digit code from the app");
    await fireEvent.changeText(box, "k7pm-3xq2");
    await fireEvent.press(screen.getByRole("button", { name: "Turn off" }));
    expect(await screen.findByText("ZZ That code is not right.")).toBeTruthy();
    await fireEvent.changeText(box, "654321");
    await fireEvent.press(screen.getByRole("button", { name: "Turn off" }));
    expect(await screen.findByText("Two-step sign-in is off.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn on" })).toBeTruthy();
  });

  it("with no sealing key on the server the button is held and the reason shown; a refused start is shown too", async () => {
    await mount({ [STATUS]: () => json({ ...off, available: false }) });
    expect(await screen.findByText("This server has no key to seal the secret with. Whoever runs it sets FEES_SECRET_KEY first.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Turn on" }).props.accessibilityState?.disabled).toBe(true);
  });

  it("a start the server refuses says why, and a slow status shows nothing until it lands", async () => {
    const gate = gated();
    await mount({ [STATUS]: gate.answer, "POST /api/v1/account/totp/start": () => json({ error: "ZZ Two-step sign-in is for the office.", code: "FORBIDDEN" }, 403) });
    await screen.findAllByText("head@zz.test");
    expect(screen.queryByText("Two-step sign-in")).toBeNull();
    gate.open(() => json(off));
    await fireEvent.press(await screen.findByRole("button", { name: "Turn on" }));
    expect(await screen.findByText("ZZ Two-step sign-in is for the office.")).toBeTruthy();
  });
});
