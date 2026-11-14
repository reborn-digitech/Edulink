/**
 * TA-431 (testing analysis of 13 November 2026), the owner's decision of 14 November 2026: the phone's two settings
 * screens offered "a copy by email" of notifications that nothing ever sends. Neither draws the switch now; each still
 * sends the server's email value back unchanged, because the contract requires it and the stored value is left in place.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
// The family helpers mock the router and the safe area; they come before the screens that import them.
import { bodyOf, calls as familyCalls, child, ID, ME_PARENT, renderFamily, press } from "./family-helpers";
import { accountOverviewSchema } from "@edulink/contracts";
import { ToastProvider } from "@/components";
import { Account } from "@/screens/shared/account";
import { ParentSettings } from "@/screens/family/settings";
import { json, mountStaff } from "./staff-harness";

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
const SESSIONS = { sessions: [{ id: "s-here", device: "ZZ Phone", createdAt: "2026-09-01T00:00:00.000Z", lastSeenAt: "2026-09-10T00:00:00.000Z", current: true }] };

describe("TA-431: no email-copy switch on the phone", () => {
  it("TA-431: the account's preferences draw no email switch and save the stored email value as it was", async () => {
    const { calls } = await mountStaff(
      <ToastProvider>
        <Account />
      </ToastProvider>,
      "TEACHER",
      { "GET /api/v1/account": () => json(OVERVIEW), "GET /api/v1/me/sessions": () => json(SESSIONS), "POST /api/v1/account/prefs": () => json({ ok: true }) },
    );
    await fireEvent.press(await screen.findByRole("tab", { name: "Preferences" }));
    expect(screen.getByRole("switch", { name: "Push notifications" })).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "Email" })).toBeNull();
    expect(screen.queryByText(/copy by email/i)).toBeNull();
    await fireEvent.press(screen.getByRole("switch", { name: "WhatsApp" }));
    await fireEvent.press(screen.getByRole("button", { name: "Save notification settings" }));
    expect(await screen.findByText("Saved")).toBeTruthy();
    expect(calls().filter((c) => c.line === "POST /api/v1/account/prefs").map((c) => c.body).at(-1)).toEqual({ channels: { push: true, email: false, sms: true, whatsapp: false }, quietHours: null });
  });

  it("TA-431: a guardian's settings draw no email switch and save the stored email value as it was", async () => {
    const PATH = "/api/v1/family/settings";
    const SETTINGS = { channels: { push: true, email: true }, quietHours: null, children: [child(ID.child, "ZZ Asha")] };
    const { fetch } = await renderFamily(<ParentSettings />, ME_PARENT, { [PATH]: (init) => (init?.method === "POST" ? { ok: true } : SETTINGS) });
    expect(await screen.findByText("ZZ Asha")).toBeTruthy();
    expect(screen.getByRole("switch", { name: "Push notifications" })).toBeTruthy();
    expect(screen.queryByRole("switch", { name: "Email" })).toBeNull();
    expect(screen.queryByText(/copy by email/i)).toBeNull();
    await fireEvent.press(screen.getByRole("switch", { name: "Push notifications" }));
    await press(screen.getByRole("button", { name: "Save notification settings" }));
    await waitFor(() => expect(familyCalls(fetch, PATH).filter((c) => c.init?.method === "POST")).toHaveLength(1));
    expect(bodyOf(familyCalls(fetch, PATH).find((c) => c.init?.method === "POST")!)).toEqual({ channels: { push: false, email: true, sms: true, whatsapp: true }, quietHours: null });
  });
});
