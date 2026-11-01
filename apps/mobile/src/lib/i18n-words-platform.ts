import type { WordsCache } from "./i18n-words";

/** The web target and the test runner: no file system; the key store (localStorage) keeps the words. */
export function platformWordsCache(): WordsCache | null {
  return null;
}
