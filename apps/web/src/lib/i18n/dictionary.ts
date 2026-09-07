import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import { DEFAULT_LOCALE, type Locale } from "./locales";

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
type Stringify<T> = { [K in keyof T]: T[K] extends string ? string : Stringify<T[K]> };

export type Dictionary = Stringify<typeof en>;

type Join<K, P> = K extends string
  ? P extends string
    ? P extends ""
      ? K
      : `${K}.${P}`
    : never
  : never;

type Paths<T> = T extends string
  ? ""
  : { [K in keyof T & string]: Join<K, Paths<T[K]>> }[keyof T & string];

/** Every dotted key in the dictionary, e.g. `"nav.practice"`. */
export type TranslationKey = Paths<typeof en>;

export const DICTIONARIES: Record<Locale, Dictionary> = { en, hi, mr };

/** Substitutes `{name}` placeholders. An unknown name is left alone, visibly. */
export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" && node.length > 0 ? node : undefined;
}

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

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
