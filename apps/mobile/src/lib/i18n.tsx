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
 *
 * `adoptAccountLocale` (A3-states-16, risks batch 5 Oct 2026): a phone with no
 * choice of its own — a new phone, a fresh install — takes the account's
 * `prefs.locale` once the session knows it, so it agrees with the phone the
 * choice was made on (every choice made in the app is written to the account).
 * A choice made on this phone stays this phone's; nothing is saved by adopting.
 */
type I18n = { locale: Locale; t: Translate; setLocale: (next: Locale) => void; adoptAccountLocale: (account: string) => Promise<void> };

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
      adoptAccountLocale: async (account) => {
        const saved = await keyStore()
          .get(KEYS.locale)
          .catch(() => null);
        if (!saved) setLocaleState(normaliseLocale(account));
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

/** The session's half of A3-states-16: hand it the account's language; no-op outside the provider. */
export function useAdoptAccountLocale(): (account: string) => Promise<void> {
  const ctx = useContext(Ctx);
  return ctx ? ctx.adoptAccountLocale : async () => {};
}
