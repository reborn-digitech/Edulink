import { dictionaryAsset } from "@/lib/i18n/asset";
import { DICTIONARY_FILE } from "@/lib/i18n/delivery";
import { LOCALES, type Locale } from "@/lib/i18n/locales";

/**
 * /i18n/<locale>.<hash>.json — one language's dictionary as a static file
 * (campaign LOAD-4; lib/i18n/delivery.ts). Public: the words are the same for
 * everyone and the login page needs them too; the middleware does not see it
 * (a path with an extension is a file). The current hash is cached for a
 * year and never revalidated; any other hash — a tab still holding an older
 * build's address — gets today's words, uncached.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const match = DICTIONARY_FILE.exec((await params).file);
  const locale = match && LOCALES.find((l) => l.code === match[1])?.code;
  if (!match || !locale) return new Response(null, { status: 404 });
  const asset = dictionaryAsset(locale as Locale);
  return new Response(asset.json, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": match[2] === asset.hash ? "public, max-age=31536000, immutable" : "no-store",
    },
  });
}
