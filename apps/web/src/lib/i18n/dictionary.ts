import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
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
export const DICTIONARIES: Record<Locale, Dictionary> = { en, hi, mr };

/** Substitutes `{name}` placeholders. An unknown name is left alone, visibly. */
/**
 * One lookup, with its fallbacks: this language, then English, then the key.
 *
 * SEPARATE FROM `translator` SO IT CAN BE TESTED. The fallback path is
 * unreachable while the `Dictionary` annotations hold, and a test that can only
 * reach it by mutating the shared dictionaries proves nothing about either. This
 * takes the dictionary as an argument, so a test can hand it a gutted one.
 *
 * The chain matters. The types already make a missing key a build error, so this
 * should never fire — but "should never fire" is how a blank button gets
 * shipped. A visible English word is a bug someone reports; a blank one is a bug
 * someone silently works around.
 */
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

/**
 * One language with English folded underneath it, built once per language.
 *
 * This is what crosses to the browser: the provider gets THIS as a prop, so a
 * Marathi reader downloads Marathi (with the English that fills any gap) and
 * not Hindi as well. Every string is present, so the client never needs the
 * English file to fall back to. Empty strings count as gaps, the same rule
 * `resolve` applies on the server.
 */
const merged = new Map<Locale, Dictionary>();

function fold(base: unknown, over: unknown): unknown {
  if (typeof base === "string") return typeof over === "string" && over.length > 0 ? over : base;
  const out: Record<string, unknown> = {};
  const b = base as Record<string, unknown>;
  const o = (typeof over === "object" && over !== null ? over : {}) as Record<string, unknown>;
  for (const key of Object.keys(b)) out[key] = fold(b[key], o[key]);
  return out;
}

export function dictionaryFor(locale: Locale): Dictionary {
  const found = merged.get(locale);
  if (found) return found;
  const built = (locale === DEFAULT_LOCALE ? en : fold(en, DICTIONARIES[locale] ?? en)) as Dictionary;
  merged.set(locale, built);
  return built;
}
