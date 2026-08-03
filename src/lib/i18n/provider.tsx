"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { translator, type Translate } from "./dictionary";

/**
 * `t` for client components.
 *
 * THE LOCALE CROSSES THE BOUNDARY, NOT THE DICTIONARY. A server component that
 * serialised its resolved strings into props would send whichever slice it
 * happened to know about, and every new string would need threading through
 * another prop. Sending the two-letter code instead means the client builds the
 * same `t` from the same module — the dictionaries are plain constants, so they
 * are in the bundle either way.
 *
 * The cost is that all three languages ship to every browser. That is ~12 KB of
 * UTF-8 today and it buys an instant switch with no round trip. Worth revisiting
 * if this grows past a handful of languages; not worth code-splitting three.
 */

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/**
 * Outside a provider this returns English rather than throwing. A client
 * component rendered somewhere nobody thought to wrap should show a readable
 * page in the wrong language, not a blank one.
 */
export function useT(): Translate {
  const locale = useContext(LocaleContext);
  return useMemo(() => translator(locale), [locale]);
}
