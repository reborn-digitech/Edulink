"use client";

import { createContext, useContext, useMemo, type Context } from "react";
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

/**
 * ONE CONTEXT OBJECT PER PROCESS, not per module instance. The dev server
 * re-evaluates a module when it recompiles (another file changed, a route
 * compiled for the first time), and a request in flight then had the root
 * layout's provider from one instance of this file and the shell's `useT`
 * from another: the server drew "role.admin" where the client drew the
 * dictionary's sentence, and React threw the page away and rendered it again
 * ("Hydration failed", /admin, /account/leave, the walk of 4 October). Kept on
 * globalThis, both instances read the same context. A production server
 * evaluates the file once, so there it changes nothing.
 */
const KEY = Symbol.for("edulink.i18n.context");
const I18nContext: Context<I18n> = ((globalThis as Record<symbol, unknown>)[KEY] as Context<I18n> | undefined) ??
  ((globalThis as Record<symbol, unknown>)[KEY] = createContext<I18n>({ locale: DEFAULT_LOCALE, dictionary: null })) as Context<I18n>;

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
