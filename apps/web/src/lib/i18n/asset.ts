import "server-only";
import { createHash } from "node:crypto";
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
