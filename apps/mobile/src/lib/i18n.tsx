import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocales } from "expo-localization";
import { dictionaryFor, normaliseLocale, translatorFor, type Locale, type Translate } from "@edulink/i18n";
import { KEYS, keyStore } from "./storage";
import { setApiLocale } from "./api";

/**
 * The same three languages and the same dictionaries as the web
 * (@edulink/i18n). The device's language is the default; the account's
 * preference, once known, wins — the same rule the web applies with its
 * cookie and prefs. A choice made in the app is kept on the device so the
 * sign-in screen is already in the right language next time.
 */
type I18n = { locale: Locale; t: Translate; setLocale: (next: Locale) => void };

const Ctx = createContext<I18n | null>(null);

export function deviceLocale(): Locale {
  try {
    return normaliseLocale(getLocales()[0]?.languageCode ?? "en");
  } catch {
    return "en";
  }
}

export function I18nProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(initial ?? deviceLocale());

  useEffect(() => {
    if (initial) return;
    void keyStore()
      .get(KEYS.locale)
      .then((saved) => {
        if (saved) setLocaleState(normaliseLocale(saved));
      });
  }, [initial]);

  useEffect(() => {
    setApiLocale(locale);
  }, [locale]);

  const value = useMemo<I18n>(
    () => ({
      locale,
      t: translatorFor(dictionaryFor(locale)),
      setLocale: (next) => {
        setLocaleState(next);
        void keyStore().set(KEYS.locale, next);
      },
    }),
    [locale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useT(): Translate {
  const ctx = useContext(Ctx);
  return ctx ? ctx.t : ((key) => key) as Translate;
}

export function useLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const ctx = useContext(Ctx);
  return ctx ? { locale: ctx.locale, setLocale: ctx.setLocale } : { locale: "en", setLocale: () => {} };
}
