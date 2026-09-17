/**
 * Money, for both apps.
 *
 * Amounts are INTEGER PAISE everywhere in the platform — ₹1,250.50 is
 * 125050 — and they become rupees only here, at the edge where a person reads
 * them. Indian digit grouping (12,50,000) comes from the locale, and each
 * language's own locale renders the same number the way that reader expects.
 */
import type { Locale } from "./locales";

const INTL_LOCALE: Record<Locale, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

/** "₹1,250.50" — whole rupees drop the paise ("₹1,250") unless `always` is set. */
export function formatPaise(paise: number, locale: Locale = "en", opts: { always?: boolean } = {}): string {
  const rupees = paise / 100;
  const whole = Number.isInteger(rupees) && !opts.always;
  try {
    return new Intl.NumberFormat(INTL_LOCALE[locale] ?? "en-IN", {
      style: "currency",
      currency: "INR",
      currencyDisplay: "symbol",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: 2,
      // Latin digits in every language: a receipt is read by banks and
      // auditors too, and mixed scripts on one line are harder for everyone.
      numberingSystem: "latn",
    }).format(rupees);
  } catch {
    return `₹${rupees.toFixed(whole ? 0 : 2)}`;
  }
}

/**
 * "1,250.50" or "1250" or "₹ 1,250" → 125050. Null for anything that is not a
 * non-negative amount with at most two decimals, so a form can refuse it.
 */
export function parseRupees(input: string): number | null {
  const cleaned = input.replace(/[₹,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, frac = ""] = cleaned.split(".");
  return Number(whole) * 100 + Number((frac + "00").slice(0, 2));
}

/** 12.5 % as basis points (1250), or null when not a percentage in [0, 100]. */
export function parsePercentBps(input: string): number | null {
  const cleaned = input.replace(/[%\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const bps = Math.round(Number(cleaned) * 100);
  return bps >= 0 && bps <= 10000 ? bps : null;
}

export function formatBps(bps: number): string {
  const pct = bps / 100;
  return `${String(Number(pct.toFixed(2)))} %`;
}
