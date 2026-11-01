import { dictionaryFor, type Dictionary, type Locale } from "@edulink/i18n";
import { API_BASE } from "./api";
import { platformWordsCache } from "./i18n-words-platform";
import { keyStore } from "./storage";

/**
 * HINDI AND MARATHI ON FIRST USE (item 15 of the owner's batch, 1 Nov 2026).
 *
 * A release bundles English whole and, of Hindi and Marathi, only the first
 * screens' sentences (scripts/i18n-subset.cjs, BOOT_SOURCES): the two whole
 * were 1.36 MB of a 7.37 MB bundle. The rest of a language comes from the
 * web's own static file the first time it is chosen — /i18n/<locale>.<hash>.json,
 * the file the web's pages load (apps/web/src/lib/i18n/delivery.ts), brotli
 * or gzip on the wire, about 0.2 MB — and is kept on the phone, so that every
 * later start reads it from the phone and only asks the server whether it has
 * changed (If-None-Match on the words' hash; 304 when it has not).
 *
 * Offline: the copy kept, or, with none, English under the first screens'
 * sentences. Never a key: the fold below only lays a fetched sentence over
 * one the phone already has, and keeps only the keys the phone can ask for.
 */

/** A language's sentences, nested as the dictionary is: only the keys the phone's English has. */
export type Words = Record<string, unknown>;
export type KeptWords = { hash: string | null; words: Words };

export type WordsCache = {
  read(locale: Locale): Promise<KeptWords | null>;
  write(locale: Locale, kept: KeptWords): Promise<void>;
};

export function memoryWordsCache(initial: Partial<Record<Locale, KeptWords>> = {}): WordsCache {
  const map = new Map<Locale, KeptWords>(Object.entries(initial) as [Locale, KeptWords][]);
  return {
    async read(locale) {
      return map.get(locale) ?? null;
    },
    async write(locale, kept) {
      map.set(locale, kept);
    },
  };
}

export const WORDS_KEY_PREFIX = "edulink.words.";

/** The web target's cache, and any platform without a file system: the key store (localStorage on the web). */
export function keyStoreWordsCache(): WordsCache {
  return {
    async read(locale) {
      try {
        const text = await keyStore().get(WORDS_KEY_PREFIX + locale);
        return text ? parseKept(text) : null;
      } catch {
        return null;
      }
    },
    async write(locale, kept) {
      try {
        await keyStore().set(WORDS_KEY_PREFIX + locale, JSON.stringify(kept));
      } catch {
        /* full or private: the words are fetched again next time */
      }
    },
  };
}

/** A kept copy as written by write(); anything else is no copy. */
export function parseKept(text: string): KeptWords | null {
  try {
    const value = JSON.parse(text) as Partial<KeptWords>;
    if (!value || typeof value !== "object" || !value.words || typeof value.words !== "object") return null;
    return { hash: typeof value.hash === "string" ? value.hash : null, words: value.words as Words };
  } catch {
    return null;
  }
}

let cache: WordsCache | null = null;

export function wordsCache(): WordsCache {
  if (!cache) cache = platformWordsCache() ?? keyStoreWordsCache();
  return cache;
}

/** Tests swap the cache; nothing else should. */
export function __setWordsCache(next: WordsCache | null): void {
  cache = next;
}

type WordsResponse = { status: number; headers: { get(name: string): string | null }; json(): Promise<unknown> };
type WordsFetch = (url: string, init: { headers: Record<string, string> }) => Promise<WordsResponse>;

let fetcher: WordsFetch = (url, init) => fetch(url, init);

/** Tests swap the network; nothing else should. */
export function __setWordsFetch(next: WordsFetch | null): void {
  fetcher = next ?? ((url, init) => fetch(url, init));
}

/** Sixteen zeros: a name the route answers with today's words, uncached, when the phone has none. */
export const NO_HASH = "0".repeat(16);

export function wordsUrl(locale: Locale, hash: string | null): string {
  return `${API_BASE}/i18n/${locale}.${hash ?? NO_HASH}.json`;
}

/** The words' hash from the route's ETag (W/"<16 hex>"), or null. */
export function hashFromEtag(etag: string | null): string | null {
  const m = etag ? /"([0-9a-f]{16})"/.exec(etag) : null;
  return m ? m[1] : null;
}

/** The fetched dictionary cut to the keys `base` (the phone's English) has; empty sentences dropped. */
export function pick(base: unknown, fetched: unknown): Words {
  const out: Words = {};
  if (typeof base !== "object" || base === null || typeof fetched !== "object" || fetched === null) return out;
  const b = base as Record<string, unknown>;
  const f = fetched as Record<string, unknown>;
  for (const name of Object.keys(b)) {
    const value = f[name];
    if (typeof b[name] === "string") {
      if (typeof value === "string" && value.length > 0) out[name] = value;
    } else {
      const inner = pick(b[name], value);
      if (Object.keys(inner).length > 0) out[name] = inner;
    }
  }
  return out;
}

/** `base` with each sentence `words` has laid over it: the shape and every key of `base` kept. */
export function overlay(base: Dictionary, words: Words | null): Dictionary {
  if (!words) return base;
  const walk = (b: unknown, w: unknown): unknown => {
    if (typeof b === "string") return typeof w === "string" && w.length > 0 ? w : b;
    const out: Record<string, unknown> = {};
    const over = (typeof w === "object" && w !== null ? w : {}) as Record<string, unknown>;
    for (const [name, value] of Object.entries(b as Record<string, unknown>)) out[name] = walk(value, over[name]);
    return out;
  };
  return walk(base, words) as Dictionary;
}

/**
 * Asks the server for a language's words, naming the copy the phone has.
 * Answers the new copy (already written to the cache) when the server has
 * other words, and null when the copy is current (304) or the server cannot
 * be reached: the caller keeps what it shows.
 */
export async function refreshWords(locale: Locale, kept: KeptWords | null, store: WordsCache = wordsCache()): Promise<KeptWords | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (kept?.hash) headers["If-None-Match"] = `W/"${kept.hash}"`;
    const response = await fetcher(wordsUrl(locale, kept?.hash ?? null), { headers });
    if (response.status === 304 || response.status !== 200) return null;
    const words = pick(dictionaryFor("en"), await response.json());
    if (Object.keys(words).length === 0) return null;
    const fresh = { hash: hashFromEtag(response.headers.get("etag")), words };
    await store.write(locale, fresh);
    return fresh;
  } catch {
    return null;
  }
}
