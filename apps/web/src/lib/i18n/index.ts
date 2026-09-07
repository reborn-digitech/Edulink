/**
 * The client-safe half of i18n, in one import.
 *
 * `server.ts` is NOT re-exported here on purpose: it imports `server-only`, and
 * a client component reaching for `useT` through a barrel that also pulled in
 * the server resolver would fail the build with an error about a file it never
 * mentioned. Server code imports `@/lib/i18n/server` by name, which makes the
 * boundary something you can see at the import site.
 */

export {
  LOCALES,
  LOCALE_COOKIE,
  DEFAULT_LOCALE,
  normaliseLocale,
  localeMeta,
  type Locale,
} from "./locales";

export {
  DICTIONARIES,
  format,
  translator,
  type Dictionary,
  type Translate,
  type TranslationKey,
} from "./dictionary";

export { I18nProvider, useLocale, useT } from "./provider";
