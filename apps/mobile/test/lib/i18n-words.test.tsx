import { renderHook, act, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { dictionaryFor, type Dictionary } from "@edulink/i18n";
import { I18nProvider, useLocale, useT } from "@/lib/i18n";
import {
  __setWordsCache,
  __setWordsFetch,
  hashFromEtag,
  keyStoreWordsCache,
  memoryWordsCache,
  NO_HASH,
  overlay,
  parseKept,
  pick,
  refreshWords,
  WORDS_KEY_PREFIX,
  wordsCache,
  wordsUrl,
} from "@/lib/i18n-words";
import { __setKeyStore, memoryStore } from "@/lib/storage";

/**
 * Hindi and Marathi on first use (item 15, 1 Nov 2026): a release bundles
 * the first screens' sentences of the two and fetches the rest from the
 * web's /i18n/<locale>.<hash>.json, keeping the copy on the phone. These hold
 * the promises a reader depends on: the copy kept is what a start shows,
 * offline included; the server is asked with the copy's hash and a 304 keeps
 * it; new words replace it and are kept; and a sentence nobody has is
 * English or the first screens', never a key.
 */
const HASH = "0123456789abcdef";
const NEWER = "fedcba9876543210";

type Call = { url: string; headers: Record<string, string> };
function network(answer: (call: Call) => { status: number; etag?: string; body?: unknown } | Error) {
  const calls: Call[] = [];
  __setWordsFetch(async (url, init) => {
    const call = { url, headers: init.headers };
    calls.push(call);
    const a = answer(call);
    if (a instanceof Error) throw a;
    return { status: a.status, headers: { get: (name: string) => (name.toLowerCase() === "etag" ? (a.etag ?? null) : null) }, json: async () => a.body };
  });
  return calls;
}

const wrapper = ({ children }: { children: ReactNode }) => <I18nProvider>{children}</I18nProvider>;
const useBoth = () => ({ t: useT(), ...useLocale() });

describe("the fetched words, cut and laid", () => {
  it("keeps only the keys the phone's English has, and drops empty sentences", () => {
    const base = { login: { title: "Log in", email: "Email" }, nav: { home: "Home" } };
    const fetched = { login: { title: "लॉग इन", email: "" }, nav: { home: "मुख्य" }, web: { only: "केवल वेब" } };
    expect(pick(base, fetched)).toEqual({ login: { title: "लॉग इन" }, nav: { home: "मुख्य" } });
    expect(pick(base, null)).toEqual({});
    expect(pick(base, { login: "not a tree" })).toEqual({});
  });

  it("lays a sentence over the phone's, keeps every key it has, and with nothing fetched is the phone's own", () => {
    const base = { login: { title: "Log in", email: "Email" } } as unknown as Dictionary;
    expect(overlay(base, { login: { title: "लॉग इन", stray: "x" } })).toEqual({ login: { title: "लॉग इन", email: "Email" } });
    expect(overlay(base, { login: { title: "" } })).toEqual(base);
    expect(overlay(base, null)).toBe(base);
  });

  it("reads the words' hash from the route's ETag", () => {
    expect(hashFromEtag(`W/"${HASH}"`)).toBe(HASH);
    expect(hashFromEtag(`"${HASH}"`)).toBe(HASH);
    expect(hashFromEtag("W/\"short\"")).toBeNull();
    expect(hashFromEtag(null)).toBeNull();
  });

  it("asks for today's words under sixteen zeros with no copy, and under the copy's hash with one", () => {
    expect(wordsUrl("hi", null)).toMatch(new RegExp(`/i18n/hi\\.${NO_HASH}\\.json$`));
    expect(wordsUrl("mr", HASH)).toMatch(new RegExp(`/i18n/mr\\.${HASH}\\.json$`));
  });

  it("reads back only a copy it wrote", () => {
    expect(parseKept(JSON.stringify({ hash: HASH, words: { a: "b" } }))).toEqual({ hash: HASH, words: { a: "b" } });
    expect(parseKept(JSON.stringify({ words: { a: "b" } }))).toEqual({ hash: null, words: { a: "b" } });
    expect(parseKept("{not json")).toBeNull();
    expect(parseKept(JSON.stringify({ hash: HASH }))).toBeNull();
    expect(parseKept("null")).toBeNull();
  });
});

describe("asking the server", () => {
  it("names the copy it has, and keeps it on a 304", async () => {
    const store = memoryWordsCache();
    const calls = network(() => ({ status: 304 }));
    expect(await refreshWords("hi", { hash: HASH, words: { login: { title: "x" } } }, store)).toBeNull();
    expect(calls[0].headers["If-None-Match"]).toBe(`W/"${HASH}"`);
    expect(calls[0].url).toContain(`/i18n/hi.${HASH}.json`);
    expect(await store.read("hi")).toBeNull();
  });

  it("keeps new words with their hash, cut to the phone's keys", async () => {
    const store = memoryWordsCache();
    const calls = network(() => ({ status: 200, etag: `W/"${NEWER}"`, body: { login: { title: "नया" }, gigs: { operatorNavX: "web" } } }));
    const fresh = await refreshWords("mr", null, store);
    expect(calls[0].headers["If-None-Match"]).toBeUndefined();
    expect(calls[0].url).toContain(`/i18n/mr.${NO_HASH}.json`);
    expect(fresh).toEqual({ hash: NEWER, words: { login: { title: "नया" } } });
    expect(await store.read("mr")).toEqual(fresh);
  });

  it("keeps what it has when the server cannot be reached, answers otherwise, or sends nothing it can use", async () => {
    const store = memoryWordsCache();
    network(() => new Error("offline"));
    expect(await refreshWords("hi", null, store)).toBeNull();
    network(() => ({ status: 503 }));
    expect(await refreshWords("hi", null, store)).toBeNull();
    network(() => ({ status: 200, etag: `W/"${NEWER}"`, body: { web: { only: "x" } } }));
    expect(await refreshWords("hi", null, store)).toBeNull();
    expect(await store.read("hi")).toBeNull();
  });
});

describe("the provider", () => {
  afterEach(() => __setKeyStore(null));

  it("shows the copy kept on the phone when the phone is offline", async () => {
    __setKeyStore(memoryStore());
    __setWordsCache(memoryWordsCache({ hi: { hash: HASH, words: { login: { title: "रखी हुई प्रति" } } } }));
    const calls = network(() => new Error("offline"));
    const { result } = await renderHook(useBoth, { wrapper });
    await act(async () => result.current.setLocale("hi"));
    await waitFor(() => expect(result.current.t("login.title")).toBe("रखी हुई प्रति"));
    expect(calls).toHaveLength(1);
    expect(calls[0].headers["If-None-Match"]).toBe(`W/"${HASH}"`);
  });

  it("offline with no copy, shows what the phone carries, never the key", async () => {
    __setKeyStore(memoryStore());
    network(() => new Error("offline"));
    const { result } = await renderHook(useBoth, { wrapper });
    await act(async () => result.current.setLocale("mr"));
    await waitFor(() => expect(result.current.locale).toBe("mr"));
    const carried = (dictionaryFor("mr") as unknown as { login: { title: string } }).login.title;
    expect(result.current.t("login.title")).toBe(carried);
    expect(result.current.t("login.title")).not.toBe("login.title");
  });

  it("lays the server's newer words over the copy and keeps them for the next start", async () => {
    __setKeyStore(memoryStore());
    const store = memoryWordsCache({ hi: { hash: HASH, words: { login: { title: "पुरानी" } } } });
    __setWordsCache(store);
    network(() => ({ status: 200, etag: `W/"${NEWER}"`, body: { login: { title: "नई" } } }));
    const { result } = await renderHook(useBoth, { wrapper });
    await act(async () => result.current.setLocale("hi"));
    await waitFor(() => expect(result.current.t("login.title")).toBe("नई"));
    expect((await store.read("hi"))?.hash).toBe(NEWER);
  });

  it("fetches nothing for English", async () => {
    __setKeyStore(memoryStore());
    const calls = network(() => ({ status: 304 }));
    const { result } = await renderHook(useBoth, { wrapper });
    expect(result.current.t("login.title")).toBe("Log in");
    await act(async () => {});
    expect(calls).toHaveLength(0);
  });
});

describe("the web target's copy", () => {
  afterEach(() => {
    __setKeyStore(null);
    __setWordsCache(null);
  });

  it("is kept in the key store under the language's own name", async () => {
    const keys = memoryStore();
    __setKeyStore(keys);
    const cache = keyStoreWordsCache();
    expect(await cache.read("hi")).toBeNull();
    await cache.write("hi", { hash: HASH, words: { login: { title: "x" } } });
    expect(JSON.parse((await keys.get(`${WORDS_KEY_PREFIX}hi`)) ?? "null")).toEqual({ hash: HASH, words: { login: { title: "x" } } });
    expect(await cache.read("hi")).toEqual({ hash: HASH, words: { login: { title: "x" } } });
  });

  it("reads as no copy, and writes nothing, when the key store fails", async () => {
    __setKeyStore({
      get: async () => {
        throw new Error("blocked");
      },
      set: async () => {
        throw new Error("full");
      },
      remove: async () => {},
    });
    const cache = keyStoreWordsCache();
    expect(await cache.read("mr")).toBeNull();
    await expect(cache.write("mr", { hash: null, words: {} })).resolves.toBeUndefined();
  });

  it("is the cache when the platform has no file system", () => {
    __setWordsCache(null);
    expect(wordsCache()).toBe(wordsCache());
  });
});
