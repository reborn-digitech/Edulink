/**
 * The languages Relay speaks.
 *
 * ITS OWN FILE, and deliberately free of `server-only`. Choosing a language is a
 * click, so the switcher is a client component, and a client component that
 * reaches into anything importing `server-only` drags it into the browser bundle
 * and fails the build. Everything here is a plain constant a client may hold.
 *
 * ONE LIST, not two. This file replaces `quiz-languages.ts`, which named the same
 * three languages for Practice alone. Two lists of the same thing drift the
 * moment one is edited — and they were already the same field on the same row:
 * Practice reads `prefs.locale`, which is exactly what the app-wide switcher
 * writes. The switcher on the Practice page and the one in Settings are now the
 * same choice, not two settings that happen to agree.
 */

/**
 * Each language is named IN ITSELF — "हिन्दी", not "Hindi". Someone choosing a
 * language they read should not have to read English first in order to escape
 * it. The English name rides alongside for everyone else.
 */
export const LOCALES = [
  { code: "en", native: "English", english: "English" },
  { code: "hi", native: "हिन्दी", english: "Hindi" },
  { code: "mr", native: "मराठी", english: "Marathi" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

/**
 * Mirrors `prefs.locale` so pages rendered before a session exists — the login
 * page, an invite landing — can still be read in the right language, and so
 * `<html lang>` is right on the first paint rather than after a round trip.
 *
 * NOT httpOnly. It carries no authority: the worst a forged one can do is show
 * you Marathi. The session cookie next to it is httpOnly precisely because it
 * does carry authority.
 */
export const LOCALE_COOKIE = "edulink_locale";

const CODES = new Set<string>(LOCALES.map((l) => l.code));

/**
 * Whatever arrived, reduced to a language we actually have.
 *
 * Anything unrecognised becomes English rather than throwing. This value comes
 * from a cookie anyone can edit and from a stored preference an older build may
 * have written, and neither is worth a 500 — an unknown language means you read
 * English, which is exactly what you got before any of this existed.
 */
export function normaliseLocale(raw: string | null | undefined): Locale {
  const value = (raw ?? "").trim().toLowerCase();
  if (CODES.has(value)) return value as Locale;
  // "hi-IN", "mr-IN", "en-GB" — a region tag is not a different language to us.
  const base = value.split(/[-_]/)[0] ?? "";
  return (CODES.has(base) ? base : DEFAULT_LOCALE) as Locale;
}

export function localeMeta(code: Locale) {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}
