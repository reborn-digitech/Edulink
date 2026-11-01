/**
 * The phone's copy of a fetched language (lib/i18n-words.ts): a file in the
 * app's document directory, one per language. Not the key store: that is the
 * keychain on a phone, made for a token and not for a language's 0.7 MB of
 * sentences. Picked by Metro on iOS and Android only; the web file beside it
 * returns null and the words go to localStorage.
 */
import { File, Paths } from "expo-file-system";
import type { Locale } from "@edulink/i18n";
import { parseKept, type WordsCache } from "./i18n-words";

const file = (locale: Locale) => new File(Paths.document, `edulink-words-${locale}.json`);

export function platformWordsCache(): WordsCache {
  return {
    async read(locale) {
      try {
        const kept = file(locale);
        return kept.exists ? parseKept(await kept.text()) : null;
      } catch {
        return null;
      }
    },
    async write(locale, kept) {
      try {
        file(locale).write(JSON.stringify(kept));
      } catch {
        /* a full disk: the words are fetched again next time */
      }
    },
  };
}
