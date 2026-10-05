import type { Metadata } from "next";

/**
 * Which pages a search engine may index (campaign LOAD-5, 4 Oct 2026).
 *
 * The root layout used to say `index, follow` for every page, so /parent,
 * /teacher, /faculty and /student did too, and only the pages that
 * remembered to opt out (the college desks, /root) said otherwise. Now the
 * default is the other way round: NOTHING is indexed unless its path is one
 * of the public pages below, which a person reads before they have an
 * account. Every signed-in page, a token's landing (an invite, a survey, a
 * magic link) and the utility pages (offline, forgot, verify) are noindex.
 * A page may still set its own `robots`; Next lets it override this.
 */
const INDEXED: RegExp[] = [
  /^\/$/,
  /^\/login$/,
  /^\/register$/,
  /^\/register\/recruiter$/,
  /^\/privacy$/,
  /^\/public\/disclosure\/[^/]+$/,
  // A college's faculty pages, published by each teacher for the college's website (5 Oct 2026).
  /^\/public\/faculty\/[^/]+$/,
  /^\/certificates\/check$/,
];

/** The robots metadata for the path the middleware stamped ("GET /login"); no stamp is not indexed. */
export function robotsFor(stamp: string | null | undefined): NonNullable<Metadata["robots"]> {
  const path = stamp?.split(" ")[1] ?? null;
  const indexed = path !== null && INDEXED.some((pattern) => pattern.test(path));
  return indexed ? { index: true, follow: true } : { index: false, follow: false };
}
