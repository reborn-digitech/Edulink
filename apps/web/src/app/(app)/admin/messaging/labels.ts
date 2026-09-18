import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";
import type { Audience } from "@/lib/messaging";

/**
 * The words for the messaging enumerations — statuses, skip reasons, purposes,
 * channels, events — as KEYS, so a server page and a client form resolve them
 * in the reader's language. Unknown values (a status added later) fall back
 * to the raw code rather than a crash.
 */

export const STATUS_KEY: Record<string, TranslationKey> = {
  QUEUED: "messaging.statusQueued",
  SENT: "messaging.statusSent",
  DELIVERED: "messaging.statusDelivered",
  FAILED: "messaging.statusFailed",
  UNDELIVERED: "messaging.statusUndelivered",
  SKIPPED: "messaging.statusSkipped",
};

export const STATUS_TONE: Record<string, "neutral" | "ok" | "warn" | "danger" | "info"> = {
  QUEUED: "info",
  SENT: "ok",
  DELIVERED: "ok",
  FAILED: "danger",
  UNDELIVERED: "danger",
  SKIPPED: "warn",
};

export const SKIP_KEY: Record<string, TranslationKey> = {
  "no-phone": "messaging.skipNoPhone",
  "opted-out": "messaging.skipOptedOut",
  "channel-off": "messaging.skipChannelOff",
  "event-off": "messaging.skipEventOff",
  "cap-monthly": "messaging.skipCapMonthly",
  "cap-daily": "messaging.skipCapDaily",
  "no-transport": "messaging.skipNoTransport",
  disabled: "messaging.skipDisabled",
};

/** What each caller of deliverToUser names as its purpose. */
export const PURPOSE_KEY: Record<string, TranslationKey> = {
  absence: "messaging.purposeAbsence",
  "fees:dueSoon": "messaging.purposeFeesDueSoon",
  "fees:overdue": "messaging.purposeFeesOverdue",
  "fees:received": "messaging.purposeFeesReceived",
  circular: "messaging.purposeCircular",
  broadcast: "messaging.purposeBroadcast",
  test: "messaging.purposeTest",
};

export const CHANNEL_KEY: Record<string, TranslationKey> = {
  SMS: "messaging.channelSms",
  WHATSAPP: "messaging.channelWhatsapp",
  TEXT: "messaging.channelText",
  PUSH: "messaging.channelPush",
};

export const EVENT_KEY: Record<string, TranslationKey> = {
  absence: "messaging.eventAbsence",
  feeReminders: "messaging.eventFeeReminders",
  feeReceipts: "messaging.eventFeeReceipts",
  circulars: "messaging.eventCirculars",
};

export const TRANSPORT_KEY: Record<string, TranslationKey> = {
  devbox: "messaging.transportDevbox",
  twilio: "messaging.transportTwilio",
  off: "messaging.transportOff",
};

export const BROADCAST_STATUS_KEY: Record<string, TranslationKey> = {
  SENDING: "messaging.broadcastSending",
  DONE: "messaging.broadcastDone",
};

/** A code from one of the tables above in the reader's words, or the code itself when it is new to us. */
export function word(t: Translate, table: Record<string, TranslationKey>, code: string | null | undefined): string {
  if (!code) return "—";
  const key = table[code];
  return key ? t(key) : code;
}

/** Who a notice went to, as a sentence: "Class 3A", "Grade 5", "Every guardian". */
export function audienceLabel(t: Translate, audience: Audience, classes: { id: string; name: string }[] = []): string {
  switch (audience.kind) {
    case "CLASS": {
      const name = classes.find((c) => c.id === audience.classId)?.name;
      return name ? t("messaging.audienceClassNamed", { name }) : t("messaging.audienceClass");
    }
    case "GRADE":
      return t("messaging.audienceGradeNamed", { grade: audience.gradeLevel });
    case "OVERDUE_FEES":
      return t("messaging.audienceOverdue");
    case "PEOPLE":
      return t("messaging.audiencePeople");
    default:
      return t("messaging.audienceAll");
  }
}

export const broadcastHref = (broadcastId: string) => `/admin/messaging/${broadcastId}`;
