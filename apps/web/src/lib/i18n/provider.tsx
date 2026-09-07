"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { translatorFor, type Dictionary, type Translate } from "./core";

/**
 * `t` for client components.
 *
 * ONE DICTIONARY CROSSES THE BOUNDARY, ALREADY CHOSEN. The root layout
 * resolves the reader's language on the server and passes that language's
 * dictionary — English folded underneath it — as a prop. The client builds
 * `t` from it and nothing else; this file imports no language file, so the
 * other two never reach the browser. (They used to: all three shipped on
 * every page, 262 KB gzipped, behind a comment that still said 12 KB.)
 *
 * Switching language is a server round trip, as it already was: the switcher
 * writes the cookie and the preference, and the next render carries the other
 * dictionary. Nothing in the app switched language client-side.
 */

type I18n = { locale: Locale; dictionary: Dictionary | null };

const I18nContext = createContext<I18n>({ locale: DEFAULT_LOCALE, dictionary: null });

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: Dictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ locale, dictionary }), [locale, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(I18nContext).locale;
}

/**
 * Outside a provider there is no dictionary, and `t` returns each key as
 * itself rather than throwing: a client component rendered somewhere nobody
 * thought to wrap shows readable key names, not a blank page.
 */
export function useT(): Translate {
  const { dictionary } = useContext(I18nContext);
  return useMemo(() => (dictionary ? translatorFor(dictionary) : (key) => key), [dictionary]);
}
