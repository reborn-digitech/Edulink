import { DEFAULT_DEPRECIATION_BP, type DepreciationMethod } from "@edulink/contracts";

/**
 * Depreciation, worked out on every read and never stored: the asset
 * register, the reports and the auditor's sheet all call this one function,
 * so they cannot disagree. Pure, for the suite.
 *
 * Time is counted in days from the purchase date to the day asked about (or
 * the day the asset was disposed of, after which its value stands still),
 * over a 365-day year. STRAIGHT_LINE takes cost × rate × years, never more
 * than the cost; WDV leaves cost × (1 − rate)^years; NONE keeps the cost. An
 * asset with no purchase date has not begun to depreciate — the register
 * shows its cost until the office gives the date.
 */
export function depreciation(input: { costPaise: number; purchaseDateKey: string | null; method: DepreciationMethod; rateBp: number; asOfKey: string; disposedKey?: string | null }): { accumulatedPaise: number; bookValuePaise: number; years: number } {
  const cost = Math.max(0, input.costPaise);
  const end = input.disposedKey && input.disposedKey < input.asOfKey ? input.disposedKey : input.asOfKey;
  if (!input.purchaseDateKey || input.method === "NONE" || input.purchaseDateKey >= end || input.rateBp <= 0) return { accumulatedPaise: 0, bookValuePaise: cost, years: 0 };
  const days = Math.round((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${input.purchaseDateKey}T00:00:00Z`)) / 86_400_000);
  const years = days / 365;
  const rate = Math.min(input.rateBp, 10_000) / 10_000;
  const accumulated = input.method === "WDV" ? cost - Math.round(cost * Math.pow(1 - rate, years)) : Math.min(cost, Math.round(cost * rate * years));
  return { accumulatedPaise: accumulated, bookValuePaise: cost - accumulated, years };
}

/** The rate an asset takes: its own, else its category's, else the default. */
export function rateFor(assetBp: number | null | undefined, categoryBp: number | null | undefined): number {
  return assetBp ?? categoryBp ?? DEFAULT_DEPRECIATION_BP;
}

/** Signed change a movement makes to the stock at its location, from the kind and the quantity the office typed. */
export function deltaFor(kind: "PURCHASE" | "ISSUE" | "RETURN" | "ADJUST" | "WRITE_OFF", quantity: number): number {
  if (kind === "ISSUE" || kind === "WRITE_OFF") return -Math.abs(quantity);
  if (kind === "ADJUST") return quantity;
  return Math.abs(quantity);
}
