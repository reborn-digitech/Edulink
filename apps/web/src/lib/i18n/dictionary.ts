import { DEFAULT_LOCALE, type Locale } from "./locales";
import { format, lookup, translatorFor, type Dictionary, type Translate, type TranslationKey } from "./core";

export { format, translatorFor, type Dictionary, type Translate, type TranslationKey };

/**
 * The translation engine. Client-safe by construction — no `server-only`, no
 * database, no `next/headers`. It is a lookup and a string replace.
 *
 * WRITTEN RATHER THAN INSTALLED, on the same grounds as `totp.ts`. The usual
 * choice here is next-intl, which is good software and wants a `[locale]`
 * segment in front of every route. This app has 58 routes, an RLS layer that
 * reads the URL nowhere, and a locale that already lives on the user row and
 * already drives Practice. Adding a URL dimension to move a preference we
 * already store would be a large migration to arrive where we started.
 *
 * The cost is real and worth naming: no ICU message format, so no gendered
 * agreement and no plural categories. Every counted string in `en.ts` is written
 * to read correctly at one and at many in all three languages. When one cannot
 * be, that is the day to reach for a library — not before.
 */

/** Same shape as `en`, but every leaf widened from its literal to `string`. */
// The dictionaries and the fold live in @edulink/i18n now, shared with the
// phone; the server-side translator with its English fallback stays here.
export { DICTIONARIES, dictionaryFor } from "@edulink/i18n/dictionaries";
import { DICTIONARIES } from "@edulink/i18n/dictionaries";
export function resolve(
  dictionary: Dictionary,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const value = lookup(dictionary, key) ?? lookup(DICTIONARIES[DEFAULT_LOCALE], key) ?? key;
  return format(value, vars);
}

/** Builds the `t` for one locale. */
export function translator(locale: Locale): Translate {
  const dictionary = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  return (key, vars) => resolve(dictionary, key, vars);
}

