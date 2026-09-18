import type { Translate, TranslationKey } from "@edulink/i18n";
import type { MessagingAudience } from "@edulink/contracts";

/**
 * The words for the messaging ledger's enumerations — a text's channel,
 * state, the reason it was not sent, what it was for, and who a notice
 * was aimed at — as keys, the web's admin/messaging labels on the phone.
 * An unknown code (a state added later) falls back to the code itself
 * rather than a crash.
 */
const CHANNEL: Record<string, TranslationKey> = { SMS: "messaging.channelSms", WHATSAPP: "messaging.channelWhatsapp", PUSH: "messaging.channelPush", TEXT: "messaging.channelText" };
const STATUS: Record<string, TranslationKey> = {
  QUEUED: "messaging.statusQueued",
  SENT: "messaging.statusSent",
  DELIVERED: "messaging.statusDelivered",
  FAILED: "messaging.statusFailed",
  UNDELIVERED: "messaging.statusUndelivered",
  SKIPPED: "messaging.statusSkipped",
};
const SKIP: Record<string, TranslationKey> = {
  "no-phone": "messaging.skipNoPhone",
  "opted-out": "messaging.skipOptedOut",
  "channel-off": "messaging.skipChannelOff",
  "event-off": "messaging.skipEventOff",
  "cap-monthly": "messaging.skipCapMonthly",
  "cap-daily": "messaging.skipCapDaily",
  "no-transport": "messaging.skipNoTransport",
  disabled: "messaging.skipDisabled",
};
/** What the server writes in `purpose` (messaging.ts, fees-reports.ts, attendance-intel.ts) → the office's word for it. */
const PURPOSE: Record<string, TranslationKey> = {
  absence: "messaging.purposeAbsence",
  "fees:dueSoon": "messaging.purposeFeesDueSoon",
  "fees:overdue": "messaging.purposeFeesOverdue",
  "fees:received": "messaging.purposeFeesReceived",
  circular: "messaging.purposeCircular",
  broadcast: "messaging.purposeBroadcast",
  test: "messaging.purposeTest",
};
const TRANSPORT: Record<string, TranslationKey> = { devbox: "messaging.transportDevbox", twilio: "messaging.transportTwilio", off: "messaging.transportOff" };

export type Tone = "muted" | "ok" | "warn" | "danger" | "accent";
export const STATUS_TONE: Record<string, Tone> = { QUEUED: "muted", SENT: "accent", DELIVERED: "ok", FAILED: "danger", UNDELIVERED: "danger", SKIPPED: "warn" };

const word = (t: Translate, map: Record<string, TranslationKey>, code: string): string => (map[code] ? t(map[code]) : code);

export function channelLabel(t: Translate, channel: string): string {
  return word(t, CHANNEL, channel.toUpperCase());
}
export function statusLabel(t: Translate, status: string): string {
  return word(t, STATUS, status.toUpperCase());
}
export function skipLabel(t: Translate, reason: string): string {
  return word(t, SKIP, reason);
}
export function purposeLabel(t: Translate, purpose: string): string {
  return word(t, PURPOSE, purpose);
}
export function transportLabel(t: Translate, state: string): string {
  return word(t, TRANSPORT, state);
}

/** "One class · ZZ 5A" when the class is known, else the audience's own name. */
export function audienceLabel(t: Translate, audience: MessagingAudience, classes: { id: string; name: string }[] = []): string {
  switch (audience.kind) {
    case "ALL_PARENTS":
      return t("messaging.audienceAll");
    case "CLASS": {
      const name = classes.find((c) => c.id === audience.classId)?.name;
      return name ? `${t("messaging.audienceClass")} · ${name}` : t("messaging.audienceClass");
    }
    case "GRADE":
      return `${t("messaging.audienceGrade")} · ${audience.gradeLevel}`;
    case "OVERDUE_FEES":
      return t("messaging.audienceOverdue");
    case "PEOPLE":
      return `${t("messaging.audiencePeople")} · ${audience.userIds.length}`;
  }
}

/** The one line under a text: its channel, its state, and why it stopped there when it did. */
export function messageCaption(t: Translate, m: { to: string; channel: string; status: string; skipReason: string | null; error: string | null }, withNumber = false): string {
  return [withNumber ? m.to : null, channelLabel(t, m.channel), statusLabel(t, m.status), m.skipReason ? skipLabel(t, m.skipReason) : m.error].filter(Boolean).join(" · ");
}
