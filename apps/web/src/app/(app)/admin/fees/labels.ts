import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The words for the fees ledger's enumerations — methods, statuses, head
 * kinds — as KEYS, so a server page and a client form resolve them in the
 * reader's language and never carry an English word across the boundary.
 * Unknown values (a status added later) fall back to the raw code rather
 * than a crash.
 */

export const METHOD_KEY: Record<string, TranslationKey> = {
  ONLINE: "fees.methodOnline",
  UPI: "fees.methodUpi",
  CASH: "fees.methodCash",
  CHEQUE: "fees.methodCheque",
  BANK: "fees.methodBank",
};

export const PAY_STATUS_KEY: Record<string, TranslationKey> = {
  INITIATED: "fees.payStatusInitiated",
  CLAIMED: "fees.payStatusClaimed",
  PAID: "fees.payStatusPaid",
  FAILED: "fees.payStatusFailed",
  REVERSED: "fees.payStatusReversed",
  REFUNDED: "fees.payStatusRefunded",
};

export const PAY_STATUS_TONE: Record<string, "neutral" | "ok" | "warn" | "danger" | "info"> = {
  INITIATED: "neutral",
  CLAIMED: "warn",
  PAID: "ok",
  FAILED: "danger",
  REVERSED: "danger",
  REFUNDED: "info",
};

export const DEMAND_STATUS_KEY: Record<string, TranslationKey> = {
  OPEN: "fees.statusOpen",
  PART: "fees.statusPart",
  PAID: "fees.statusPaid",
  WAIVED: "fees.statusWaived",
  CANCELLED: "fees.statusCancelled",
  CARRIED: "fees.statusCarried",
};

export const HEAD_KIND_KEY: Record<string, TranslationKey> = {
  TUITION: "fees.headKindTuition",
  TRANSPORT: "fees.headKindTransport",
  EXAM: "fees.headKindExam",
  ACTIVITY: "fees.headKindActivity",
  OTHER: "fees.headKindOther",
};

export const CONCESSION_KIND_KEY: Record<string, TranslationKey> = {
  PERCENT: "fees.concessionPercent",
  AMOUNT: "fees.concessionAmount",
};

export const MATCH_PROBLEM_KEY: Record<string, TranslationKey> = {
  "no-utr": "fees.matchNoUtr",
  "no-amount": "fees.matchNoAmount",
  "no-claim": "fees.matchNoClaim",
  "amount-differs": "fees.matchAmountDiffers",
};

/** The receipt page the office and the family share. */
export const receiptHref = (receiptId: string) => `/fees/receipts/${receiptId}`;
export const pupilHref = (studentMembershipId: string) => `/admin/fees/pupils/${studentMembershipId}`;
