import { formatDateKey, isDateKey } from "./dates";

/**
 * A DATE IN A NOTICE, KEPT AS A DATE (campaign B-15's leftover, 5 Oct 2026).
 *
 * A notification's sentence is a key and its variables, said in the
 * recipient's language when it is written and said again in the reader's
 * language of today on the notifications page (notify.ts). The dates in it
 * were not: the leave, cover and absence notices passed a date already
 * formatted in English ("Wednesday, 9 September"), so a Marathi reader read
 * an English date inside a Marathi sentence, and kept reading it after
 * switching language. Now such a variable carries the date key with a marker,
 * `noticeDate("2026-09-09", "long")` → "@date:long:2026-09-09", and every
 * place that says the sentence (`notify`, the notifications page, the phone's
 * list) passes the variables through `localiseVars`, which formats each
 * marked date in that reader's language. A value without the marker is left
 * as it is, so every older row reads as before.
 */

export type NoticeDateStyle = "short" | "long" | "plain";

const STYLES: Record<NoticeDateStyle, Intl.DateTimeFormatOptions> = {
  // As formatDateKey's default: "Wed, 9 Sept".
  short: { weekday: "short", day: "numeric", month: "short" },
  // As the absence notice wrote it: "Wednesday, 9 September".
  long: { weekday: "long", day: "numeric", month: "long" },
  // A date with no weekday: "9 Sept 2026".
  plain: { day: "numeric", month: "short", year: "numeric" },
};

const MARK = /^@date:(short|long|plain):(\d{4}-\d{2}-\d{2})$/;

/** A date variable for a notice: said in each reader's language wherever the notice is said. */
export function noticeDate(dateKey: string, style: NoticeDateStyle = "short"): string {
  return isDateKey(dateKey) ? `@date:${style}:${dateKey}` : dateKey;
}

/** The variables with every marked date formatted for `locale`; anything else untouched. */
export function localiseVars<T extends Record<string, string | number> | undefined>(vars: T, locale: string | undefined): T {
  if (!vars) return vars;
  let out: Record<string, string | number> | null = null;
  for (const [name, value] of Object.entries(vars)) {
    if (typeof value !== "string") continue;
    const m = MARK.exec(value);
    if (!m) continue;
    out ??= { ...vars };
    out[name] = formatDateKey(m[2]!, STYLES[m[1] as NoticeDateStyle], locale);
  }
  return (out ?? vars) as T;
}
