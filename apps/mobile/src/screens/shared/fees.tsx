import { formatPaise, type Locale, type Translate, type TranslationKey } from "@edulink/i18n";

/**
 * The words for the fees ledger's enumerations — methods, payment states,
 * instalment states — as keys, the web's admin/fees/labels.ts on the phone.
 * An unknown code (a state added later) falls back to the code itself
 * rather than a crash. Every amount is integer paise until it is read.
 */
const METHOD: Record<string, TranslationKey> = { ONLINE: "fees.methodOnline", UPI: "fees.methodUpi", CASH: "fees.methodCash", CHEQUE: "fees.methodCheque", BANK: "fees.methodBank" };
const PAY_STATUS: Record<string, TranslationKey> = {
  INITIATED: "fees.payStatusInitiated",
  CLAIMED: "fees.payStatusClaimed",
  PAID: "fees.payStatusPaid",
  FAILED: "fees.payStatusFailed",
  REVERSED: "fees.payStatusReversed",
  REFUNDED: "fees.payStatusRefunded",
};
const DEMAND_STATUS: Record<string, TranslationKey> = {
  OPEN: "fees.statusOpen",
  PART: "fees.statusPart",
  PAID: "fees.statusPaid",
  WAIVED: "fees.statusWaived",
  CANCELLED: "fees.statusCancelled",
  CARRIED: "fees.statusCarried",
};

export type Tone = "muted" | "ok" | "warn" | "danger" | "accent";
export const PAY_TONE: Record<string, Tone> = { INITIATED: "muted", CLAIMED: "warn", PAID: "ok", FAILED: "danger", REVERSED: "danger", REFUNDED: "accent" };

export function methodLabel(t: Translate, method: string): string {
  const key = METHOD[method];
  return key ? t(key) : method;
}
export function payStatusLabel(t: Translate, status: string): string {
  const key = PAY_STATUS[status];
  return key ? t(key) : status;
}
export function demandStatusLabel(t: Translate, status: string): string {
  const key = DEMAND_STATUS[status];
  return key ? t(key) : status;
}

/** An instalment a family can still pay against. */
export function payable(status: string): boolean {
  return status === "OPEN" || status === "PART";
}

/** Rupees for the reader — one place, so every screen rounds and groups the same way. */
export function money(paise: number, locale: Locale): string {
  return formatPaise(paise, locale);
}

/** A receipt as the web serves it; the phone opens it there, signed in. */
export function receiptPath(receiptId: string): string {
  return `/fees/receipts/${receiptId}`;
}

/** An id a counter payment carries so a retried post is the same payment, not a second one. crypto.randomUUID is not on every phone. */
export function clientId(): string {
  const part = () => Math.random().toString(36).slice(2, 10).padEnd(8, "0");
  return `ph-${Date.now().toString(36)}-${part()}${part()}`;
}
