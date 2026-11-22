import "server-only";
import { formatPaise } from "@edulink/i18n";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import type { Fmt } from "@/lib/terms-sentences";

/** The words, money, days and percents the console's sentences are worded in, in the reader's language. */
export async function consoleFmt(): Promise<Fmt> {
  const t = await getT();
  const locale = await getLocale();
  return {
    t,
    money: (paise) => formatPaise(paise, locale),
    day: (key) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale),
    percent: (bps) => (bps / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 }),
  };
}
