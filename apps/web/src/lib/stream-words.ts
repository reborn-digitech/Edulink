import { presetUnion, type StreamCode, type StreamWord } from "@edulink/contracts";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * THE WORDS THAT DIFFER BY STREAM (5 Oct 2026): an architecture college's
 * lecture is a studio, a pharmacy college's lab a practical, a law college's
 * department a faculty (STREAM_PRESETS[…].vocabulary in packages/contracts).
 * A college page says one of these words through `tv` and gets the college's
 * own; a college of several streams keeps the general word unless every
 * stream agrees (presetUnion). No existing key is renamed: the words are
 * `streams.word.<variant>` (one) and `streams.word.<variant>Many` (several).
 * Client-safe: a page passes the streams it read (`streamsOf` on the server,
 * /api/v1/me's `streams` on the phone).
 */
export function tv(word: StreamWord, streams: readonly StreamCode[], t: Translate, many = false): string {
  const variant = presetUnion(streams).vocabulary[word] ?? word;
  return t(`streams.word.${variant}${many ? "Many" : ""}` as TranslationKey);
}

/** `tv` bound to one college's streams and the reader's language: `const w = wordsFor(streams, t); w("lecture", true)`. */
export function wordsFor(streams: readonly StreamCode[], t: Translate): (word: StreamWord, many?: boolean) => string {
  return (word, many = false) => tv(word, streams, t, many);
}
