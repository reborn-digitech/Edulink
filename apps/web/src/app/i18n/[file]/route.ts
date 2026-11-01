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
 *
 * THE PHONE READS IT TOO (item 15 of the owner's batch, 1 Nov 2026): a phone
 * release no longer bundles Hindi and Marathi whole and fetches them here on
 * first use (apps/mobile/src/lib/i18n-words.ts), naming the copy it keeps by
 * If-None-Match; a copy of today's words is answered 304 with no body. The
 * words are public and the same for everyone, so any origin may read them
 * (Access-Control-Allow-Origin *, no credentials): the phone's web target
 * runs on another port, and its If-None-Match makes the browser ask first,
 * answered by OPTIONS below. ETag is exposed so the phone learns the hash.
 */
const PUBLIC_READ = { "access-control-allow-origin": "*", "access-control-expose-headers": "ETag" };

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { ...PUBLIC_READ, "access-control-allow-methods": "GET", "access-control-allow-headers": "If-None-Match, Accept", "access-control-max-age": "600" },
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = DICTIONARY_FILE.exec((await params).file);
  const locale = match && LOCALES.find((l) => l.code === match[1])?.code;
  if (!match || !locale) return new Response(null, { status: 404 });
  const asset = dictionaryAsset(locale as Locale);
  const cacheControl = match[2] === asset.hash ? "public, max-age=31536000, immutable" : "no-store";
  if ((request.headers.get("if-none-match") ?? "").includes(`"${asset.hash}"`)) {
    return new Response(null, { status: 304, headers: { ...PUBLIC_READ, "cache-control": cacheControl, vary: "Accept-Encoding", etag: `W/"${asset.hash}"` } });
  }
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
      ...PUBLIC_READ,
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
      vary: "Accept-Encoding",
      etag: `W/"${asset.hash}"`,
      ...(encoding === "identity" ? {} : { "content-encoding": encoding }),
    },
  });
}
