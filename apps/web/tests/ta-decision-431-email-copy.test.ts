/**
 * TA-431 (testing analysis of 13 November 2026), as the owner's decision of 14 November 2026 builds it: the
 * preferences offered "a copy by email" of notifications, on by default, and nothing ever sent one (notify reads the
 * push switch alone). The switch and its words are gone from the web's account page (and the phone's two settings
 * screens, apps/mobile/test/screens/ta-decision-431-email-switch.test.tsx), the address-confirmed sentence no longer
 * promises school notices by mail in any language, and the four contract fields keep accepting and answering the
 * email value, which nothing reads, so older phones keep saving.
 *
 * Renders and parses only; no database row is made.
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { accountOverviewSchema, accountPrefsSchema, familySettingsSaveSchema, familySettingsSchema } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
vi.mock("@/lib/i18n", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/i18n")>()), useT: () => translator("en") }));
vi.mock("@/components/ui/toast", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/components/ui/toast")>()), useToast: () => ({ toast() {} }) }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {}, push() {} }) }));
vi.mock("@/app/account/actions", () => ({ savePrefs: async () => ({ ok: true, errors: {} }) }));

const { AppearanceForm } = await import("@/app/account/appearance-form");
const { DEFAULT_PREFS } = await import("@/lib/session");

const prefsWords = (dict: object) => (dict as { prefs: Record<string, unknown> }).prefs;
const confirmed = (dict: object) => (dict as { verify: { confirmedBody: string } }).verify.confirmedBody;

describe("TA-431: no switch for an email copy nothing sends", () => {
  it("TA-431: the web's notification form draws push, SMS and WhatsApp and no email switch", () => {
    const html = renderToStaticMarkup(React.createElement(AppearanceForm, { prefs: DEFAULT_PREFS, section: "notifications", phone: null, textsOn: true }));
    expect(html).toContain("Push notifications");
    expect(html).toContain("Text messages (SMS)");
    expect(html).not.toMatch(/copy by email/i);
    expect(html).not.toMatch(/>Email</);
    // Push, SMS, WhatsApp and "Use quiet hours": four boxes, none of them email.
    expect((html.match(/<input[^>]*type="checkbox"/g) ?? []).length).toBe(4);
  });

  it("TA-431: the switch's words are gone from the dictionaries in en, hi and mr", () => {
    for (const dict of [en, hi, mr]) {
      expect(prefsWords(dict)).not.toHaveProperty("email");
      expect(prefsWords(dict)).not.toHaveProperty("emailHint");
      expect(prefsWords(dict)).toHaveProperty("push");
    }
  });

  it("TA-431: the address-confirmed sentence promises no school notices by mail, in en, hi and mr", () => {
    expect(confirmed(en)).not.toMatch(/notice/i);
    expect(confirmed(hi)).not.toContain("सूचना");
    expect(confirmed(mr)).not.toContain("सूचना");
    for (const dict of [en, hi, mr]) expect(confirmed(dict)).toContain("{email}");
    expect(confirmed(hi).trim().endsWith("।")).toBe(true);
    expect(confirmed(mr).trim().endsWith(".")).toBe(true);
  });

  it("TA-431: the four contract fields still take and answer the email value, so an older phone's save is accepted", () => {
    const channels = { push: true, email: false, sms: true, whatsapp: true };
    expect(accountPrefsSchema.safeParse({ channels, quietHours: null }).success).toBe(true);
    expect(familySettingsSaveSchema.safeParse({ channels, quietHours: null }).success).toBe(true);
    expect(familySettingsSchema.safeParse({ channels, quietHours: null, children: [] }).success).toBe(true);
    const prefs = { locale: "en", theme: "system", contrast: "normal", font: "default", motion: "full", channels, quietHours: null };
    const overview = accountOverviewSchema.shape.prefs.safeParse(prefs);
    expect(overview.success).toBe(true);
  });
});
