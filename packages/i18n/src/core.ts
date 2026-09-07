/**
 * The translator without the dictionaries.
 *
 * THIS FILE IMPORTS NO LANGUAGE. It exists because the client bundle was
 * carrying all three dictionaries — 1.1 MB raw, 262 KB gzipped — on every
 * page, through one import chain: the provider imported `translator`, which
 * imported `DICTIONARIES`, which imported en, hi and mr. The provider's own
 * comment still said "~12 KB". The dictionaries had grown forty times since.
 *
 * Now the server chooses the language, folds English underneath it once (see
 * `dictionaryFor` in dictionary.ts), and hands the client ONE dictionary as a
 * prop. Everything the client needs to turn that into `t` lives here, and
 * nothing here can reach a dictionary file — so a client component importing
 * from this module cannot pull the other languages back in by accident.
 *
 * `Dictionary` and `TranslationKey` are derived from the English file by TYPE
 * ONLY; a type import is erased at compile time and ships nothing.
 */
import type { en } from "./en";

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

export type TranslationKey = Paths<typeof en>;

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function format(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole,
  );
}

export function lookup(dictionary: Dictionary, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" && node.length > 0 ? node : undefined;
}

/**
 * `t` over one dictionary that already carries its fallbacks. A key the
 * dictionary lacks comes back as the key itself — readable, and visible in a
 * screenshot, which is how such gaps get found.
 */
export function translatorFor(dictionary: Dictionary): Translate {
  return (key, vars) => format(lookup(dictionary, key) ?? key, vars);
}
