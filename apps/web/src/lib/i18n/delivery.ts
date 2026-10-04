import type { Locale } from "./locales";

/**
 * HOW THE DICTIONARY REACHES THE BROWSER (campaign LOAD-4, 4 Oct 2026).
 *
 * It used to travel as a prop of the root layout's provider, so every page —
 * a signed-out /login, a 307's body — carried the reader's whole dictionary in
 * its flight payload: 680 KB of English, twice that in Hindi or Marathi, about
 * 240 KB of gzip per document, re-parsed by the server on every render (26 %
 * of a page's CPU in the load wave's profile). Now each language is ONE STATIC
 * FILE whose name carries a hash of its content, /i18n/<locale>.<hash>.json,
 * served with a year-long immutable cache: the browser fetches it once (the
 * root layout preloads it), keeps it for every later page and visit, and the
 * HTML carries only its address. A new dictionary is a new hash, so a deploy
 * is never read through a stale copy.
 *
 * The server still renders with the whole dictionary (it has it); the client
 * hydrates once the file is in. Until then the page shows the server's text,
 * never a raw key — see provider.tsx.
 *
 * This file is shared by the server (the layout, the route) and the client
 * (the provider), so it imports nothing either side would regret.
 */

/** Where the server's renders of client components find the dictionary: a function on globalThis (see asset.ts). */
export const SERVER_DICTIONARY_KEY = Symbol.for("edulink.i18n.server-dictionary");

/** The file names the route answers: a locale, a dot, 16 hex digits of the content's hash, ".json". */
export const DICTIONARY_FILE = /^([a-z]{2})\.([0-9a-f]{16})\.json$/;

export function dictionaryHrefFor(locale: Locale, hash: string): string {
  return `/i18n/${locale}.${hash}.json`;
}
