import { en } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";
import { DEFAULT_LOCALE, type Locale } from "./locales";
import type { Dictionary } from "./core";

export const DICTIONARIES: Record<Locale, Dictionary> = { en, hi, mr };

/**
 * One language with English folded underneath it, built once per language.
 * The web's server hands this to the browser as a prop; the phone builds it
 * in memory when the language changes. Empty strings count as gaps.
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
