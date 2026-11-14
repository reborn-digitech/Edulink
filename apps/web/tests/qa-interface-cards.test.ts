/**
 * QA-61 and QA-62 (QA campaign of 24 October 2026), the client cards:
 *
 *   - QA-61: with texts switched off on the platform, the notification form shows the SMS and WhatsApp boxes as they
 *     are kept but shut, with a line saying texts are not on (it described texts that never go); the expert's Get paid
 *     card links to the earnings page only while that page is there.
 *   - QA-62: the Get paid card says one linked state: Razorpay's ACTIVATED with the papers still to check reads "Not
 *     ready to be paid yet" and "Linked with Razorpay", never "Not linked yet" over "ready to be paid".
 */
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expertPayoutSchema } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
const t = translator("en");
vi.mock("@/lib/i18n", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/i18n")>()), useT: () => translator("en") }));
vi.mock("@/components/ui/toast", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/components/ui/toast")>()), useToast: () => ({ toast() {} }) }));
vi.mock("next/navigation", async (importOriginal) => ({ ...(await importOriginal<typeof import("next/navigation")>()), useRouter: () => ({ refresh() {}, push() {} }) }));
vi.mock("@/app/account/actions", () => ({ savePrefs: async () => ({ ok: true, errors: {} }) }));

const { AppearanceForm } = await import("@/app/account/appearance-form");
const { GetPaidCard } = await import("@/app/(app)/expert/profile/get-paid-card");
const { DEFAULT_PREFS } = await import("@/lib/session");

const escaped = (s: string) => s.replace(/&/g, "&amp;").replace(/'/g, "&#x27;").replace(/"/g, "&quot;");

describe("QA-61: the notification form while texts are off", () => {
  it("keeps the two text boxes as they are, shut, and says texts are not on", () => {
    const off = renderToStaticMarkup(React.createElement(AppearanceForm, { prefs: DEFAULT_PREFS, section: "notifications", phone: "+91 98xxxxxx10", textsOn: false }));
    expect(off).toContain(escaped(t("prefs.sms")));
    expect(off).toContain(escaped(t("qaInterface.textsOff")));
    // The two text boxes are disabled, push and quiet hours are not (the email box is gone, TA-431); the phone line is not drawn under a switch that cannot be used.
    const disabled = (off.match(/<input[^>]*type="checkbox"[^>]*disabled=""[^>]*>/g) ?? []).length;
    expect(disabled).toBe(2);
    expect(off).not.toContain(escaped(t("messaging.phoneOn", { phone: "+91 98xxxxxx10" })));
  });

  it("with texts on, nothing is shut and nothing is said of them being off", () => {
    const on = renderToStaticMarkup(React.createElement(AppearanceForm, { prefs: DEFAULT_PREFS, section: "notifications", phone: null, textsOn: true }));
    expect(on).not.toMatch(/<input[^>]*type="checkbox"[^>]*disabled=""/);
    expect(on).not.toContain(escaped(t("qaInterface.textsOff")));
  });
});

const ROUTE = { status: "NONE", requirements: [], linked: false, needsResend: false, readyToLink: false, locked: false, checkedAt: null, error: null };
const PAYEE = { status: "NONE", payeeName: "ZZ Expert", upiId: null, bankLast4: "1234", ifsc: "ZZBK0000001", panLast4: "567Z", addressLine: "ZZ Road", city: "ZZ Town", postalCode: "411001", phone: "9800000000", gstStateCode: "27", gstin: null, note: null, kycVerified: false, transport: "devbox", route: ROUTE };
const GATE = { paymentsOn: true, kycVerified: false, payoutActive: false, mentoringOffer: false, dutyDone: true, oneToOnesOwed: 0, canCharge: false, seatPriceMinPaise: 5000, seatPriceMaxPaise: 30000, commissionPercent: 15 };
const payout = (payee: Record<string, unknown>, route: Record<string, unknown>) => expertPayoutSchema.parse({ payout: { ...PAYEE, ...payee, route: { ...ROUTE, ...route } }, gate: GATE });

describe("the expert's Get paid card", () => {
  it("links to the earnings page only while it is there (QA-61)", () => {
    const initial = payout({}, {});
    expect(renderToStaticMarkup(React.createElement(GetPaidCard, { initial }))).toContain('href="/expert/earnings"');
    expect(renderToStaticMarkup(React.createElement(GetPaidCard, { initial, earnings: false }))).not.toContain('href="/expert/earnings"');
  });

  it("says one linked state (QA-62)", () => {
    const waiting = renderToStaticMarkup(React.createElement(GetPaidCard, { initial: payout({}, { status: "ACTIVATED", linked: true, locked: true }) }));
    expect(waiting).toContain(t("qaInterface.payoutLinkedNotReady"));
    expect(waiting).toContain(`>${t("qaInterface.routeLinkedOnly")}<`);
    expect(waiting).not.toContain(t("gigs.payoutNONE"));
    expect(waiting).not.toContain(t("gigs.routeStatusACTIVATED"));
    const ready = renderToStaticMarkup(React.createElement(GetPaidCard, { initial: payout({ status: "ACTIVE", kycVerified: true }, { status: "ACTIVATED", linked: true, locked: true }) }));
    expect(ready).toContain(t("gigs.payoutACTIVE"));
    expect(ready).toContain(t("gigs.routeStatusACTIVATED"));
    const none = renderToStaticMarkup(React.createElement(GetPaidCard, { initial: payout({}, {}) }));
    expect(none).toContain(t("gigs.payoutNONE"));
  });
});

describe("QA-63: the texts log names a purpose in words", () => {
  it("reads a purpose by its prefix, links what it names, and never prints the raw value", async () => {
    const { purposeWords } = await import("@/app/(app)/admin/messaging/labels");
    const hi = translator("hi");
    expect(purposeWords(t, "circular:cmuvc2m6e0004abcdefghijkl")).toEqual({ label: t("messaging.purposeCircular"), href: "/bulletin/cmuvc2m6e0004abcdefghijkl" });
    expect(purposeWords(hi, "circular:cmuvc2m6e0004abcdefghijkl").label).toBe(hi("messaging.purposeCircular"));
    expect(purposeWords(t, "circular-remind:cmuvc2m6e0004abcdefghijkl")).toEqual({ label: t("qaInterface.purposeCircularRemind"), href: "/bulletin/cmuvc2m6e0004abcdefghijkl" });
    expect(purposeWords(t, "incident:cmuvc2m6e0004abcdefghijkl")).toEqual({ label: t("qaInterface.purposeIncident"), href: "/incidents/cmuvc2m6e0004abcdefghijkl" });
    expect(purposeWords(t, "fees:overdue")).toEqual({ label: t("messaging.purposeFeesOverdue"), href: null });
    expect(purposeWords(t, "absence")).toEqual({ label: t("messaging.purposeAbsence"), href: null });
    expect(purposeWords(t, "something-new:x")).toEqual({ label: t("qaInterface.purposeOther"), href: null });
    expect(purposeWords(t, null)).toEqual({ label: "—", href: null });
  });
});

describe("QA-64: the guide's quoted screen sentences without placeholders", () => {
  it("fills a quoted sentence's placeholder with the ellipsis a screen fills in, and leaves a path's alone", async () => {
    const { readableQuotes } = await import("@/lib/assistant/readable-quotes");
    expect(readableQuotes('Open /accounts/structures ("Fee structures"): "Fees for {year}" heads the page.')).toBe('Open /accounts/structures ("Fee structures"): "Fees for …" heads the page.');
    expect(readableQuotes("“{year} के लिए शुल्क” दिखता है।")).toBe("“… के लिए शुल्क” दिखता है।");
    expect(readableQuotes('The toast reads "Lent "{title}" to {name}, due back on {due}."')).toBe('The toast reads "Lent "…" to …, due back on …."');
    expect(readableQuotes('Too many are refused with "Try again in {minutes} minutes."')).toBe('Too many are refused with "Try again in … minutes."');
    expect(readableQuotes("Open a class to its staffing page at `/admin/classes/{classId}`.")).toBe("Open a class to its staffing page at `/admin/classes/{classId}`.");
    // Every quoted placeholder of the guide itself is filled.
    const { readFileSync, readdirSync } = await import("node:fs");
    const { join } = await import("node:path");
    const dir = join(process.cwd(), "..", "..", "docs", "guide");
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".md"))) {
      const text = readableQuotes(readFileSync(join(dir, f), "utf8"));
      // Outside backticks, no placeholder is left.
      const left = text.split(/`[^`\n]*`/).flatMap((part) => part.match(/\{[A-Za-z][A-Za-z0-9_]*\}/g) ?? []);
      expect(left, f).toEqual([]);
    }
  });
});
