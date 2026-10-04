import "server-only";
import { createHash } from "node:crypto";
import { promisify } from "node:util";
import * as zlib from "node:zlib";
import { dictionaryFor, type Dictionary } from "./dictionary";
import { dictionaryHrefFor, SERVER_DICTIONARY_KEY } from "./delivery";
import type { Locale } from "./locales";

/**
 * One language's dictionary as the static file the browser caches (see
 * delivery.ts): English folded underneath it exactly as the server renders
 * with, serialised once per process, named by the hash of its bytes.
 */
type Asset = { json: string; hash: string; href: string };
const built = new Map<Locale, Asset>();

export function dictionaryAsset(locale: Locale): Asset {
  const found = built.get(locale);
  if (found) return found;
  const json = JSON.stringify(dictionaryFor(locale));
  const hash = createHash("sha256").update(json).digest("hex").slice(0, 16);
  const asset = { json, hash, href: dictionaryHrefFor(locale, hash) };
  built.set(locale, asset);
  return asset;
}

/**
 * THE FILE PRECOMPRESSED, ONCE PER PROCESS (campaign LOAD-11, 5 Oct 2026).
 * next.config.ts sets `compress: false` because production's proxy compresses
 * (go-live 3.6), so a host without one — a plain `next start`, another
 * platform — sent the 680 KB English file (1.3 MB in Hindi or Marathi) raw on
 * every cold visit. The route now answers a browser that accepts it with
 * brotli (176 KB / 202 KB) or gzip (217 KB / 273 KB), compressed once per
 * language and hash on zlib's thread pool — brotli at its best quality takes
 * about a second for Hindi, which would otherwise stall every request on the
 * main thread — and kept for the life of the process. The name's hash is the
 * hash of the uncompressed words, so the address and the ETag are the same
 * whichever encoding travels; a proxy in front sees Content-Encoding already
 * set and passes the body through.
 */
export type DictionaryEncoding = "br" | "gzip" | "identity";

const brotli = typeof zlib.brotliCompress === "function" ? promisify(zlib.brotliCompress) : null;
const gzip = promisify(zlib.gzip);
const encoded = new Map<string, Promise<Uint8Array<ArrayBuffer>>>();

/** The best encoding `Accept-Encoding` allows: brotli (when this Node has it), then gzip, else identity. */
export function pickDictionaryEncoding(acceptEncoding: string | null): DictionaryEncoding {
  const weights = new Map<string, number>();
  for (const part of (acceptEncoding ?? "").toLowerCase().split(",")) {
    const [name, ...params] = part.split(";").map((p) => p.trim());
    if (!name) continue;
    const q = params.find((p) => p.startsWith("q="));
    const weight = q ? Number(q.slice(2)) : 1;
    weights.set(name, Number.isFinite(weight) ? weight : 0);
  }
  const accepts = (name: string) => (weights.get(name) ?? weights.get("*") ?? 0) > 0;
  if (brotli && accepts("br")) return "br";
  if (accepts("gzip")) return "gzip";
  return "identity";
}

/** The dictionary file's bytes in `encoding`, compressed on first use and cached per language and hash; a failure is not cached. */
export function encodedDictionary(locale: Locale, encoding: Exclude<DictionaryEncoding, "identity">): Promise<Uint8Array<ArrayBuffer>> {
  const asset = dictionaryAsset(locale);
  const key = `${locale}.${asset.hash}.${encoding}`;
  const found = encoded.get(key);
  if (found) return found;
  const bytes = Buffer.from(asset.json, "utf8");
  const work =
    encoding === "br" && brotli
      ? brotli(bytes, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY, [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: bytes.length } })
      : gzip(bytes, { level: zlib.constants.Z_BEST_COMPRESSION });
  const body = work.then(
    (buffer) => new Uint8Array(buffer.buffer as ArrayBuffer, buffer.byteOffset, buffer.byteLength),
    (error: unknown) => {
      encoded.delete(key);
      throw error;
    },
  );
  encoded.set(key, body);
  return body;
}

/**
 * THE SERVER'S RENDER OF A CLIENT COMPONENT needs the dictionary too, and it
 * no longer arrives as a prop. The server-component layer (this file, through
 * the root layout) and the server-side render of client components run in one
 * process, so the layout leaves `dictionaryFor` on globalThis and the provider
 * reads it there when it renders on the server — nothing is serialised, and
 * no dictionary file enters the client bundle (the provider imports none).
 * Called at module load: any page renders the root layout, so it is in place
 * before the first client component is rendered.
 */
export function registerServerDictionary(): void {
  (globalThis as Record<symbol, unknown>)[SERVER_DICTIONARY_KEY] = (locale: Locale): Dictionary => dictionaryFor(locale);
}
registerServerDictionary();
