import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { ToastProvider } from "@/components";
import { StaffMessaging } from "@/screens/staff/messaging";
import { skipLabel } from "@/screens/shared/messaging";
import { json, mountStaff } from "./staff-harness";

/**
 * The one switch that lets a text reach a number nobody proved: shown with
 * its warning, the office's alone, posted on its own; and the skip reason
 * such a number earns while the switch is off has its words.
 */
const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), params: {} as Record<string, string> };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockRouter.params }));

const OVERVIEW = {
  settings: { smsEnabled: true, whatsappEnabled: false, monthlyCap: 500, events: { absence: true, feeReminders: true, feeReceipts: false, circulars: true, incidents: true }, textOfficePhones: false },
  transports: { sms: "devbox", whatsapp: "off", problems: [] },
  month: { sent: 1, delivered: 1, failed: 0, skipped: 1, segments: 1, cap: 500 },
  skippedByReason: { unverifiedNumber: 1 },
  templates: [],
  recent: [],
  recentMessages: [{ id: "m1", userId: null, name: "ZZ Nair", to: "+919800000009", channel: "SMS", status: "SKIPPED", skipReason: "unverifiedNumber", error: null, segments: 0, createdAt: "2026-09-10T05:00:00.000Z", sentAt: null, deliveredAt: null, templateKey: "absence", purpose: "absence" }],
  parentsWithPhone: 1,
  parentsTotal: 2,
  classes: [],
  grades: [],
};
const mount = (role: "ADMIN" | "PRINCIPAL", answers: Record<string, () => Response> = {}) =>
  mountStaff(
    <ToastProvider>
      <StaffMessaging />
    </ToastProvider>,
    role,
    { "GET /api/v1/messaging/overview": () => json(OVERVIEW), "POST /api/v1/messaging/settings": () => json({ ok: true }), ...answers },
  );

describe("texts to the office-entered guardian phone", () => {
  it("the switch shows its warning, starts off, and posts just itself", async () => {
    const { calls } = await mount("ADMIN");
    const label = "Text the guardian phone the office entered when the guardian has no proved number";
    const row = await screen.findByRole("switch", { name: label });
    expect(row).not.toBeChecked();
    expect(screen.getByText(/a wrong number texts a stranger about the child/)).toBeTruthy();
    await fireEvent.press(row);
    await waitFor(() => expect(calls().filter((c) => c.line === "POST /api/v1/messaging/settings").map((c) => c.body)).toEqual([{ textOfficePhones: true }]));
    expect(await screen.findByText("Saved.")).toBeTruthy();
  });

  it("the head sees it but cannot press it, and the skipped text names the unproved number", async () => {
    await mount("PRINCIPAL");
    const row = await screen.findByRole("switch", { name: /Text the guardian phone the office entered/ });
    expect(row).toBeDisabled();
    expect(skipLabel((k) => k, "unverifiedNumber")).toBe("officeBulk.skipUnverifiedNumber");
    expect(await screen.findByText(/number entered by the office, not proved/)).toBeTruthy();
  });
});
