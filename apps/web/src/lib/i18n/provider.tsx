"use client";

import { createContext, use, useContext, useMemo, type Context } from "react";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import { translatorFor, type Dictionary, type Translate } from "./core";
import { SERVER_DICTIONARY_KEY } from "./delivery";

/**
 * `t` for client components.
 *
 * ONE DICTIONARY, ALREADY CHOSEN, AND NOT IN THE PAGE. The root layout
 * resolves the reader's language on the server and passes its locale and the
 * ADDRESS of that language's dictionary — English folded underneath it — as
 * a static file (delivery.ts). The browser fetches the file once and keeps it;
 * it used to arrive as a prop inside every page's payload (campaign LOAD-4).
 * This file imports no language file, so no dictionary is in the client
 * bundle either. (All three once were: 262 KB gzipped, behind a comment that
 * still said 12 KB.)
 *
 * Until the file is in, the provider SUSPENDS: during the first hydration
 * React keeps the server's HTML on screen, so the reader sees the server's
 * words, never a raw key, and the page becomes interactive when the file
 * arrives (preloaded from <head>, usually before the scripts). A failed fetch
 * is retried, never answered with an empty dictionary. On the server the
 * provider reads the dictionary the root layout left on globalThis (asset.ts).
 *
 * Switching language is a server round trip, as it already was: the switcher
 * writes the cookie and the preference and refreshes in a transition, the
 * next render names the other file, and the old words stay until it is in.
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

/**
 * One promise per dictionary address for the life of the tab (three at
 * most), on globalThis for the same reason as the context. The SAME promise
 * object is handed to `use` on every render: once it has settled it carries
 * its value, and `use` returns it synchronously, so a page rendered after
 * the first never suspends again.
 */
type Loading = Promise<Dictionary> & { status: "pending" | "fulfilled"; value?: Dictionary };
const LOADING = Symbol.for("edulink.i18n.loading");
const loading: Map<string, Loading> = ((globalThis as Record<symbol, unknown>)[LOADING] as Map<string, Loading> | undefined) ??
  ((globalThis as Record<symbol, unknown>)[LOADING] = new Map<string, Loading>()) as Map<string, Loading>;

type Fetcher = (href: string) => Promise<{ ok: boolean; json(): Promise<unknown> }>;
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchUntilIn(href: string, fetcher: Fetcher, wait: (ms: number) => Promise<void>): Promise<Dictionary> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetcher(href);
      if (response.ok) return (await response.json()) as Dictionary;
    } catch {
      // Offline, or the server restarting: try again below.
    }
    await wait(Math.min(1000 * 2 ** attempt, 15_000));
  }
}

/**
 * The dictionary at `href`, fetched once per tab. A failure is retried after
 * 1, 2, 4, 8 and then every 15 seconds — never answered with an empty
 * dictionary, which would turn the server's words into raw keys; the page
 * keeps the server's text meanwhile. Exported, with the fetch and the wait
 * as parameters, for the test.
 */
export function loadDictionary(href: string, fetcher: Fetcher = (url) => fetch(url), wait: (ms: number) => Promise<void> = pause): Loading {
  const found = loading.get(href);
  if (found) return found;
  const pending = fetchUntilIn(href, fetcher, wait) as Loading;
  pending.status = "pending";
  // What React itself writes on a promise it tracks; this listener is the first, so `use` reads it settled on the retry.
  void pending.then((dictionary) => {
    pending.status = "fulfilled";
    pending.value = dictionary;
  });
  loading.set(href, pending);
  return pending;
}

/** What the root layout leaves for the server's renders (asset.ts). */
function serverDictionary(locale: Locale): Dictionary {
  const read = (globalThis as Record<symbol, unknown>)[SERVER_DICTIONARY_KEY] as ((locale: Locale) => Dictionary) | undefined;
  if (!read) throw new Error("i18n: the root layout did not register the server dictionary (lib/i18n/asset.ts)");
  return read(locale);
}

export function I18nProvider({
  locale,
  href,
  children,
}: {
  locale: Locale;
  /** The dictionary's static file, /i18n/<locale>.<hash>.json (asset.ts). */
  href: string;
  children: React.ReactNode;
}) {
  // The branch is fixed per environment (the server never has a window), and in the browser `use` is called on every render.
  const dictionary = typeof window === "undefined" ? serverDictionary(locale) : use(loadDictionary(href) as Promise<Dictionary>);
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
