import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { accountOverviewSchema, sessionsListSchema, type RoleCode } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Account } from "@/screens/shared/account";
import { gated, json, mountStaff, refused, type Answers } from "./staff-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const OVERVIEW = accountOverviewSchema.parse({
  name: "ZZ Head",
  preferredName: null,
  email: "head@zz.test",
  loginName: null,
  emailConfirmed: true,
  phone: "+919876543210",
  phoneConfirmed: true,
  avatarKey: "preset:fox-sunset",
  createdAt: "2026-01-01T00:00:00.000Z",
  prefs: { locale: "en", theme: "system", contrast: "normal", font: "default", motion: "full", channels: { push: true, email: false }, quietHours: null },
  showRecord: false,
});
const SESSIONS = sessionsListSchema.parse({
  sessions: [
    { id: "s-here", device: "ZZ Phone", createdAt: "2026-09-01T00:00:00.000Z", lastSeenAt: "2026-09-10T00:00:00.000Z", current: true },
    { id: "s-other", device: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36", createdAt: "2026-08-01T00:00:00.000Z", lastSeenAt: "2026-09-02T00:00:00.000Z", current: false },
  ],
});
const ACCOUNT = "GET /api/v1/account";
const DEVICES = "GET /api/v1/me/sessions";
const invalid = (issues: Record<string, string>) => () => json({ error: "Some of this needs another look.", code: "BAD_REQUEST", issues }, 422);

function mount(answers: Answers = {}, role: RoleCode = "TEACHER") {
  return mountStaff(
    <ToastProvider>
      <Account />
    </ToastProvider>,
    role,
    { [ACCOUNT]: () => json(OVERVIEW), [DEVICES]: () => json(SESSIONS), ...answers },
  );
}

describe("the account", () => {
  beforeEach(() => mockRouter.push.mockClear());

  it("loads, then shows who you are and how you sign in, with the door to the avatar picker", async () => {
    const gate = gated();
    await mount({ [ACCOUNT]: gate.answer });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    gate.open(() => json(OVERVIEW));
    expect((await screen.findAllByText("head@zz.test")).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByRole("image", { name: "ZZ Head" })).toBeTruthy();
    expect(screen.getByText("+919876543210")).toBeTruthy();
    expect(screen.getAllByText("confirmed").length).toBeGreaterThanOrEqual(2);
    expect(await screen.findByRole("tab", { name: "Devices (2)" })).toBeTruthy();
    // No NEW-password field anywhere: changing one is the web's reset flow.
    // The current password is asked for once per section, to move where
    // codes go.
    expect(screen.queryByLabelText(/new password/i)).toBeNull();
    expect(screen.getAllByLabelText("Your current password")).toHaveLength(2);
    await fireEvent.press(screen.getByRole("button", { name: "Change my look" }));
    expect(mockRouter.push).toHaveBeenCalledWith("/(app)/avatar");
  });

  it("a pupil who signs in with a login name is told so, never shown it as an email", async () => {
    await mount({ [ACCOUNT]: () => json({ ...OVERVIEW, email: null, loginName: "zz.asha", emailConfirmed: false }) }, "STUDENT");
    expect(await screen.findByText("You sign in with the login name zz.asha.")).toBeTruthy();
    expect(screen.getByText("Login name zz.asha")).toBeTruthy();
  });

  it("email: a code goes to the address, a wrong code is refused on the field, the right one confirms", async () => {
    let tries = 0;
    const { calls } = await mount({
      "POST /api/v1/account/email/code": () => json({ sentTo: "new@zz.test" }),
      "POST /api/v1/account/email/confirm": () => (++tries === 1 ? invalid({ code: "ZZ That code is not right." })() : json({ ok: true })),
    });
    await fireEvent.changeText(await screen.findByLabelText("Email address"), " New@zz.test ");
    expect(screen.getByText("We will email a code to new@zz.test to check it is yours.")).toBeTruthy();
    // The current password is asked for with the address: a session is not proof of the person.
    await fireEvent.changeText(screen.getAllByLabelText("Your current password")[0]!, "Sarathi-Kestrel-2026");
    await fireEvent.press(screen.getByRole("button", { name: "Email me a code" }));
    expect(await screen.findByText("We sent a code to new@zz.test. It expires in 10 minutes.")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/account/email/code")?.body).toEqual({ email: "New@zz.test", password: "Sarathi-Kestrel-2026" });
    await fireEvent.changeText(screen.getByLabelText("The code"), "123456");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("ZZ That code is not right.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Email address confirmed")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/account/email/confirm").map((c) => c.body)).toEqual([{ code: "123456" }, { code: "123456" }]);
  });

  it("mobile: taking the number off asks first; a refused number is said on the field; a code confirms a new one", async () => {
    let sends = 0;
    const { calls } = await mount({
      "DELETE /api/v1/account/mobile": () => json({ ok: true }),
      "POST /api/v1/account/mobile/code": () => (++sends === 1 ? invalid({ phone: "ZZ That is not a mobile number." })() : json({ hint: "3210" })),
      "POST /api/v1/account/mobile/confirm": () => json({ ok: true }),
    });
    await fireEvent.press(await screen.findByRole("button", { name: "Remove: +919876543210" }));
    expect(screen.getByText(/^Take this number off your account\?/)).toBeTruthy();
    expect(calls().some((c) => c.line === "DELETE /api/v1/account/mobile")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Remove" }));
    expect(await screen.findByText("Mobile number removed")).toBeTruthy();
    expect(calls().find((c) => c.line === "DELETE /api/v1/account/mobile")?.body).toEqual({ confirm: true });

    await fireEvent.changeText(screen.getByLabelText("Mobile number"), "12");
    // The second "Your current password" on the screen is the mobile section's; the first is the email's.
    await fireEvent.changeText(screen.getAllByLabelText("Your current password")[1]!, "Sarathi-Kestrel-2026");
    await fireEvent.press(screen.getByRole("button", { name: "Text me a code" }));
    expect(await screen.findByText("ZZ That is not a mobile number.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Mobile number"), "98765 43210");
    await fireEvent.press(screen.getByRole("button", { name: "Text me a code" }));
    expect(await screen.findByText("We sent a code to the number ending 3210. It expires in 10 minutes.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("The code"), "654321");
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Mobile number confirmed")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/account/mobile/code").map((c) => c.body)).toEqual([{ phone: "12", password: "Sarathi-Kestrel-2026" }, { phone: "98765 43210", password: "Sarathi-Kestrel-2026" }]);
    expect(calls().find((c) => c.line === "POST /api/v1/account/mobile/confirm")?.body).toEqual({ code: "654321" });
  });

  it("notifications: the switches and quiet hours are saved; a bad time is caught here, the same start and end on the field", async () => {
    let saves = 0;
    const { calls } = await mount({ "POST /api/v1/account/prefs": () => (++saves === 1 ? invalid({ "quietHours.end": "Start and end cannot be the same time." })() : json({ ok: true })) });
    await fireEvent.press(await screen.findByRole("tab", { name: "Preferences" }));
    const save = () => screen.getByRole("button", { name: "Save notification settings" });
    expect(save()).toBeDisabled();
    await fireEvent.press(screen.getByRole("switch", { name: "Email" }));
    // The school's texts: on unless the guardian says otherwise (the server's copy carries no answer yet).
    expect(screen.getByRole("switch", { name: "Text messages (SMS)" })).toBeChecked();
    await fireEvent.press(screen.getByRole("switch", { name: "WhatsApp" }));
    await fireEvent.press(screen.getByRole("switch", { name: "Use quiet hours" }));
    await fireEvent.changeText(screen.getByLabelText("Until"), "7am");
    await fireEvent.press(save());
    expect(screen.getByText("Use HH:MM.")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/account/prefs")).toBe(false);
    await fireEvent.changeText(screen.getByLabelText("Until"), "21:00");
    await fireEvent.press(save());
    expect(await screen.findByText("Start and end cannot be the same time.")).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText("Until"), "06:30");
    await fireEvent.press(save());
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/account/prefs").map((c) => c.body).at(-1)).toEqual({ channels: { push: true, email: true, sms: true, whatsapp: false }, quietHours: { start: "21:00", end: "06:30" } });
  });

  it("the language chosen here is saved to the account, which the web and Practice read", async () => {
    const { calls } = await mount({ "POST /api/v1/account/locale": () => json({ locale: "hi" }) });
    await fireEvent.press(await screen.findByRole("tab", { name: "Preferences" }));
    expect(calls().some((c) => c.line === "POST /api/v1/account/locale")).toBe(false);
    await fireEvent.press(screen.getByRole("radio", { name: "Hindi" }));
    await waitFor(() => expect(calls().find((c) => c.line === "POST /api/v1/account/locale")?.body).toEqual({ locale: "hi" }));
  });

  it("devices: this one is marked; another is signed out after asking; so is everywhere else", async () => {
    const { calls } = await mount({
      "POST /api/v1/account/devices/sign-out": () => json({ ok: true }),
      "POST /api/v1/account/devices/sign-out-others": () => json({ count: 1 }),
    });
    await fireEvent.press(await screen.findByRole("tab", { name: "Devices (2)" }));
    expect(screen.getByText("ZZ Phone")).toBeTruthy();
    expect(screen.getByText("This device")).toBeTruthy();
    expect(screen.getByText("Chrome on Mac")).toBeTruthy();
    expect(screen.getByText("2 active")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sign out: Chrome on Mac" }));
    expect(screen.getByText("Sign out Chrome on Mac? Whoever has it will need to sign in again.")).toBeTruthy();
    expect(calls().some((c) => c.line === "POST /api/v1/account/devices/sign-out")).toBe(false);
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("Device signed out")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/account/devices/sign-out")?.body).toEqual({ sessionId: "s-other" });
    await fireEvent.press(screen.getByRole("button", { name: "Sign out everywhere else" }));
    expect(screen.getByText("Sign out every other device? You stay signed in on this one.")).toBeTruthy();
    await fireEvent.press(screen.getByRole("button", { name: "Sign out everywhere else" }));
    expect(await screen.findByText("1 device signed out")).toBeTruthy();
    expect(calls().find((c) => c.line === "POST /api/v1/account/devices/sign-out-others")?.body).toEqual({ confirm: true });
  });

  it("a refused device sign-out is said in the server's words", async () => {
    await mount({ "POST /api/v1/account/devices/sign-out": refused("ZZ That device is already signed out.", 404) });
    await fireEvent.press(await screen.findByRole("tab", { name: "Devices (2)" }));
    await fireEvent.press(screen.getByRole("button", { name: "Sign out: Chrome on Mac" }));
    await fireEvent.press(screen.getByRole("button", { name: "Confirm" }));
    expect(await screen.findByText("ZZ That device is already signed out.")).toBeTruthy();
  });

  it("a refusal is an alert with a retry", async () => {
    const { calls } = await mount({ [ACCOUNT]: refused("ZZ Not now.") });
    expect(await screen.findByRole("alert")).toHaveTextContent("ZZ Not now.");
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(calls().filter((c) => c.line === ACCOUNT).length).toBe(2));
  });
});
