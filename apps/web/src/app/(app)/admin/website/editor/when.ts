"use client";

import { useMemo } from "react";
import { useLocale } from "@/lib/i18n";

const INTL: Record<string, string> = { en: "en-IN", hi: "hi-IN", mr: "mr-IN" };

/** A moment said in the reader's language and the school's zone: "16 Oct 2026, 4:05 pm". */
export function useWhen(timeZone: string): (iso: string) => string {
  const locale = useLocale();
  return useMemo(() => {
    const format = new Intl.DateTimeFormat(INTL[locale] ?? "en-IN", { dateStyle: "medium", timeStyle: "short", timeZone, numberingSystem: "latn" });
    return (iso: string) => format.format(new Date(iso));
  }, [locale, timeZone]);
}

/** A day key (YYYY-MM-DD) said as a short date in the reader's language. */
export function useDay(): (dateKey: string) => string {
  const locale = useLocale();
  return useMemo(() => {
    const format = new Intl.DateTimeFormat(INTL[locale] ?? "en-IN", { day: "numeric", month: "short", timeZone: "UTC", numberingSystem: "latn" });
    return (dateKey: string) => {
      const [y, m, d] = dateKey.split("-").map(Number);
      return y && m && d ? format.format(new Date(Date.UTC(y, m - 1, d))) : dateKey;
    };
  }, [locale]);
}
