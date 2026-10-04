import { dictionaryAsset, encodedDictionary, pickDictionaryEncoding, type DictionaryEncoding } from "@/lib/i18n/asset";
import { DICTIONARY_FILE } from "@/lib/i18n/delivery";
import { LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * /i18n/<locale>.<hash>.json — one language's dictionary as a static file
 * (campaign LOAD-4; lib/i18n/delivery.ts). Public: the words are the same for
 * everyone and the login page needs them too; the middleware does not see it
 * (a path with an extension is a file). The current hash is cached for a
 * year and never revalidated; any other hash — a tab still holding an older
 * build's address — gets today's words, uncached.
 *
 * Compressed here, once per process, when the browser accepts brotli or gzip
 * (campaign LOAD-11; asset.ts): `compress: false` leaves compression to the
 * proxy, and this file is the one large body a host without one would
 * otherwise send raw. The weak ETag is the words' hash, the same for every
 * encoding; Vary tells caches the body depends on Accept-Encoding.
 */
export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = DICTIONARY_FILE.exec((await params).file);
  const locale = match && LOCALES.find((l) => l.code === match[1])?.code;
  if (!match || !locale) return new Response(null, { status: 404 });
  const asset = dictionaryAsset(locale as Locale);
  let encoding: DictionaryEncoding = pickDictionaryEncoding(request.headers.get("accept-encoding"));
  let body: string | Uint8Array<ArrayBuffer> = asset.json;
  if (encoding !== "identity") {
    try {
      body = await encodedDictionary(locale as Locale, encoding);
    } catch {
      encoding = "identity"; // zlib failed: the words still go, uncompressed
    }
  }
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": match[2] === asset.hash ? "public, max-age=31536000, immutable" : "no-store",
      vary: "Accept-Encoding",
      etag: `W/"${asset.hash}"`,
      ...(encoding === "identity" ? {} : { "content-encoding": encoding }),
    },
  });
}
