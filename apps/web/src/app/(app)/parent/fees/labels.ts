import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The words for a fee row's states and methods — keys, so the family's page,
 * the receipt and the badges cannot disagree about the language.
 */
export const FEE_METHOD_KEY: Record<string, TranslationKey> = {
  ONLINE: "fees.methodOnline",
  UPI: "fees.methodUpi",
  CASH: "fees.methodCash",
  CHEQUE: "fees.methodCheque",
  BANK: "fees.methodBank",
};

export const FEE_DEMAND_STATUS_KEY: Record<string, TranslationKey> = {
  OPEN: "fees.statusOpen",
  PART: "fees.statusPart",
  PAID: "fees.statusPaid",
  WAIVED: "fees.statusWaived",
  CANCELLED: "fees.statusCancelled",
  CARRIED: "fees.statusCarried",
};

export const FEE_PAYMENT_STATUS_KEY: Record<string, TranslationKey> = {
  INITIATED: "fees.payStatusInitiated",
  CLAIMED: "fees.payStatusClaimed",
  PAID: "fees.payStatusPaid",
  FAILED: "fees.payStatusFailed",
  REVERSED: "fees.payStatusReversed",
  REFUNDED: "fees.payStatusRefunded",
};

export type BadgeTone = "neutral" | "accent" | "ok" | "warn" | "danger" | "info" | "outline";

export function demandTone(status: string, overdue: boolean): BadgeTone {
  if (status === "PAID") return "ok";
  if (status === "OPEN" || status === "PART") return overdue ? "danger" : "warn";
  return "neutral";
}

export function paymentTone(status: string): BadgeTone {
  switch (status) {
    case "PAID":
      return "ok";
    case "CLAIMED":
      return "warn";
    case "FAILED":
    case "REVERSED":
      return "danger";
    case "REFUNDED":
      return "info";
    default:
      return "neutral";
  }
}

/** The payment calendar's words: a row's state and its kind. */
export const FEE_CALENDAR_STATUS_KEY: Record<string, TranslationKey> = {
  UPCOMING: "fees.calStatusUpcoming",
  DUE_SOON: "fees.calStatusDueSoon",
  OVERDUE: "fees.calStatusOverdue",
  PAID: "fees.calStatusPaid",
  PART: "fees.calStatusPart",
  WAIVED: "fees.calStatusWaived",
  CARRIED: "fees.calStatusCarried",
};

export const FEE_CALENDAR_KIND_KEY: Record<string, TranslationKey> = {
  INSTALMENT: "fees.calendarInstalment",
  DUE: "fees.calendarDue",
  REMINDER: "fees.calendarReminder",
};

export function calendarTone(status: string): BadgeTone {
  switch (status) {
    case "PAID":
      return "ok";
    case "OVERDUE":
      return "danger";
    case "DUE_SOON":
    case "PART":
      return "warn";
    case "WAIVED":
    case "CARRIED":
      return "info";
    default:
      return "neutral";
  }
}
