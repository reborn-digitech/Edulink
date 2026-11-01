import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { brotliDecompressSync, gunzipSync } from "node:zlib";
import * as React from "react";
import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh() {} }) }));
vi.mock("@/app/account/actions", () => ({ setLocale: async () => ({ ok: true }) }));

import { dictionaryAsset, encodedDictionary, pickDictionaryEncoding } from "./asset";
import { DICTIONARY_FILE } from "./delivery";
import { dictionaryFor } from "./dictionary";
import { I18nProvider, loadDictionary, useT } from "./provider";
import { LOCALES, type Locale } from "./locales";
import { GET, OPTIONS } from "@/app/i18n/[file]/route";
import { LanguageSwitch } from "@/components/language-switch";

/**
 * The dictionary travels as a cached static file, not inside every page
 * (campaign LOAD-4, 4 Oct 2026): the root layout names /i18n/<locale>.<hash>.json,
 * the browser fetches it once, and the server renders with the dictionary it
 * already has. These hold the four promises that rest on: the file is the
 * server's dictionary exactly (Hindi and Marathi included), the route answers
 * it with a year-long cache only under its current name, the server's render
 * draws words and never keys, and a browser that cannot fetch the file keeps
 * the server's words rather than turning them into keys.
 */
const codes = LOCALES.map((l) => l.code) as Locale[];

// Vitest compiles the app's .tsx with the classic JSX runtime (React.createElement), which Next does not; the components rendered here need `React` in scope.
(globalThis as { React?: typeof React }).React = React;

function Probe() {
  const t = useT();
  return createElement("p", null, t("shell.skipToContent"));
}
const within = (locale: Locale, child: ReactNode) => createElement(I18nProvider, { locale, href: dictionaryAsset(locale).href } as Parameters<typeof I18nProvider>[0], child);

describe("the dictionary file", () => {
  it.each(codes)("%s is the server's dictionary exactly, under a name that is the hash of its bytes", (locale) => {
    const asset = dictionaryAsset(locale);
    expect(JSON.parse(asset.json)).toEqual(dictionaryFor(locale));
    expect(asset.href).toBe(`/i18n/${locale}.${asset.hash}.json`);
    expect(DICTIONARY_FILE.test(asset.href.slice("/i18n/".length))).toBe(true);
  });

  it("names each language differently", () => {
    expect(new Set(codes.map((l) => dictionaryAsset(l).hash)).size).toBe(codes.length);
  });
});

describe("GET /i18n/<file>", () => {
  const get = (file: string) => GET(new Request(`http://localhost/i18n/${file}`), { params: Promise.resolve({ file }) });

  it.each(codes)("answers %s under its current name with a year-long immutable cache", async (locale) => {
    const asset = dictionaryAsset(locale);
    const response = await get(asset.href.slice("/i18n/".length));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(response.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await response.json()).toEqual(dictionaryFor(locale));
  });

  it("answers an older name with today's words, uncached", async () => {
    const response = await get("hi.0000000000000000.json");
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual(dictionaryFor("hi"));
  });

  it("answers the phone's copy of today's words 304 with no body, and other words 200 (item 15)", async () => {
    const asset = dictionaryAsset("mr");
    const ask = (file: string, etag: string) => GET(new Request(`http://localhost/i18n/${file}`, { headers: { "if-none-match": etag } }), { params: Promise.resolve({ file }) });
    const current = await ask(asset.href.slice("/i18n/".length), `W/"${asset.hash}"`);
    expect(current.status).toBe(304);
    expect(current.headers.get("etag")).toBe(`W/"${asset.hash}"`);
    expect(await current.text()).toBe("");
    // The phone with no copy names sixteen zeros; with an older copy, its hash: both get today's words and the hash to keep.
    const older = await ask("mr.0000000000000000.json", 'W/"0123456789abcdef"');
    expect(older.status).toBe(200);
    expect(older.headers.get("etag")).toBe(`W/"${asset.hash}"`);
    expect(await older.json()).toEqual(dictionaryFor("mr"));
  });

  it("lets any origin read the words and learn their hash, and answers the browser's question first (item 15)", async () => {
    const answer = await get(dictionaryAsset("hi").href.slice("/i18n/".length));
    expect(answer.headers.get("access-control-allow-origin")).toBe("*");
    expect(answer.headers.get("access-control-expose-headers")).toBe("ETag");
    expect(answer.headers.get("access-control-allow-credentials")).toBeNull();
    const asked = OPTIONS();
    expect(asked.status).toBe(204);
    expect(asked.headers.get("access-control-allow-origin")).toBe("*");
    expect(asked.headers.get("access-control-allow-headers")).toContain("If-None-Match");
    expect(asked.headers.get("access-control-allow-methods")).toBe("GET");
  });

  it.each(["xx.0000000000000000.json", "en.json", "en.c940f6985c664a36.js", "../en.0000000000000000.json"])("refuses %s", async (file) => {
    expect((await get(file)).status).toBe(404);
  });
});

describe("GET /i18n/<file> precompressed (campaign LOAD-11)", () => {
  // `compress: false` leaves compression to the proxy; this route compresses its one large body itself, once per process.
  const get = (file: string, acceptEncoding?: string) =>
    GET(new Request(`http://localhost/i18n/${file}`, { headers: acceptEncoding === undefined ? {} : { "accept-encoding": acceptEncoding } }), { params: Promise.resolve({ file }) });
  const decode = { identity: (b: Buffer) => b, gzip: gunzipSync, br: brotliDecompressSync } as const;

  it.each(codes)("answers %s in identity, gzip and brotli with the same words, address, ETag and cache", async (locale) => {
    const asset = dictionaryAsset(locale);
    const file = asset.href.slice("/i18n/".length);
    const answers = [
      { encoding: "identity", response: await get(file) },
      { encoding: "gzip", response: await get(file, "gzip, deflate") },
      { encoding: "br", response: await get(file, "gzip, deflate, br, zstd") },
    ] as const;
    // The name's hash is the hash of the uncompressed words, whatever travels.
    expect(createHash("sha256").update(asset.json).digest("hex").slice(0, 16)).toBe(asset.hash);
    for (const { encoding, response } of answers) {
      expect(response.status).toBe(200);
      expect(response.headers.get("content-encoding")).toBe(encoding === "identity" ? null : encoding);
      expect(response.headers.get("vary")).toBe("Accept-Encoding");
      expect(response.headers.get("etag")).toBe(`W/"${asset.hash}"`);
      expect(response.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
      expect(response.headers.get("content-type")).toMatch(/^application\/json/);
      const bytes = Buffer.from(await response.arrayBuffer());
      const words = decode[encoding](bytes).toString("utf8");
      expect(words).toBe(asset.json);
      if (encoding !== "identity") expect(bytes.length).toBeLessThan(Buffer.byteLength(asset.json) / 2);
    }
  });

  it("compresses once per language and encoding, then hands out the same bytes", async () => {
    const first = encodedDictionary("mr", "br");
    expect(encodedDictionary("mr", "br")).toBe(first);
    expect(encodedDictionary("mr", "gzip")).not.toBe(first);
    const again = await get(dictionaryAsset("mr").href.slice("/i18n/".length), "br");
    expect(Buffer.from(await again.arrayBuffer()).equals(Buffer.from(await first))).toBe(true);
  });

  it("compresses an older name too, still uncached", async () => {
    const response = await get("hi.0000000000000000.json", "gzip");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-encoding")).toBe("gzip");
    expect(JSON.parse(gunzipSync(Buffer.from(await response.arrayBuffer())).toString("utf8"))).toEqual(dictionaryFor("hi"));
  });

  it.each([
    [null, "identity"],
    ["", "identity"],
    ["identity", "identity"],
    ["deflate", "identity"],
    ["gzip", "gzip"],
    ["GZIP;q=0.5", "gzip"],
    ["br;q=0, gzip", "gzip"],
    ["gzip;q=0, br;q=0", "identity"],
    ["br", "br"],
    ["gzip, br;q=0.1", "br"],
    ["*", "br"],
    ["br;q=0, *", "gzip"],
    ["*;q=0", "identity"],
    ["gzip;q=bogus", "identity"],
  ] as const)("Accept-Encoding %j picks %s", (header, encoding) => {
    expect(pickDictionaryEncoding(header)).toBe(encoding);
  });
});

describe("the provider on the server", () => {
  it.each(codes)("draws %s words from the dictionary the layout registered, never the key", (locale) => {
    const html = renderToString(within(locale, createElement(Probe)));
    expect(html).toContain(dictionaryFor(locale).shell.skipToContent);
    expect(html).not.toContain("shell.skipToContent");
  });

  it.each(codes)("labels the language switch in %s", (locale) => {
    const html = renderToString(within(locale, createElement(LanguageSwitch, { showLabel: true })));
    const words = dictionaryFor(locale).language;
    expect(html).toContain(words.readIn);
    expect(html).toContain(words.groupLabel);
    expect(html).not.toMatch(/language\.(readIn|groupLabel)/);
    // Each language is offered in its own script, whatever the page is read in.
    for (const l of LOCALES) expect(html).toContain(l.native);
  });

  it("puts no dictionary in the page: the layout passes the file's address, not its words", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toMatch(/<I18nProvider locale=\{locale\} href=\{dictionary\}>/);
    expect(layout).not.toMatch(/dictionaryFor\(/);
    expect(layout).toMatch(/rel="preload" href=\{dictionary\} as="fetch" crossOrigin="anonymous"/);
    // The provider is a client module: no language file may reach the bundle through it.
    const provider = readFileSync("src/lib/i18n/provider.tsx", "utf8");
    expect(provider).not.toMatch(/from "(\.\/|@edulink\/i18n\/)(en|hi|mr|dictionary|dictionaries)"/);
  });
});

describe("the provider in the browser", () => {
  it("fetches a dictionary once and hands every render the same settled promise", async () => {
    const fetcher = vi.fn(async () => ({ ok: true, json: async () => dictionaryFor("mr") }));
    const href = "/i18n/mr.test-once.json";
    const first = loadDictionary(href, fetcher);
    expect(loadDictionary(href, fetcher)).toBe(first);
    expect(await first).toEqual(dictionaryFor("mr"));
    // Settled and marked, so `use` answers without suspending on the next page.
    expect(first.status).toBe("fulfilled");
    expect(first.value).toEqual(dictionaryFor("mr"));
    expect(loadDictionary(href, fetcher)).toBe(first);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("keeps trying when the file cannot be fetched, and never settles on an empty dictionary (the server's words stay)", async () => {
    let calls = 0;
    const fetcher = vi.fn(async () => {
      calls += 1;
      if (calls === 1) throw new TypeError("offline");
      if (calls === 2) return { ok: false, json: async () => ({}) };
      return { ok: true, json: async () => dictionaryFor("hi") };
    });
    const waits: number[] = [];
    const wait = vi.fn(async (ms: number) => void waits.push(ms));
    const loading = loadDictionary("/i18n/hi.test-retry.json", fetcher, wait);
    expect(loading.status).toBe("pending");
    expect(await loading).toEqual(dictionaryFor("hi"));
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(waits).toEqual([1000, 2000]);
  });

  it("stays pending while the file never comes, rather than answering with keys", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("offline");
    });
    let rounds = 0;
    const waits: number[] = [];
    // Each wait lets the loop go round once more; stop it after eight attempts by never resolving the eighth wait.
    const wait = (ms: number) => (++rounds < 8 ? (waits.push(ms), Promise.resolve()) : new Promise<void>(() => {}));
    const loading = loadDictionary("/i18n/en.test-offline.json", fetcher, wait);
    await vi.waitFor(() => expect(rounds).toBe(8));
    expect(loading.status).toBe("pending");
    expect(waits).toEqual([1000, 2000, 4000, 8000, 15_000, 15_000, 15_000]);
  });
});
