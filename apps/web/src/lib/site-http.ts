import "server-only";
import type { SiteLanguage } from "@edulink/contracts";
import { translator } from "./i18n/dictionary";
import { appUrl, publishedSiteFor, siteHtmlFor } from "./site-publish";
import { finishSiteHtml, renderSiteNotice } from "./site-render";

/**
 * THE WEBSITE'S HTTP ANSWERS (website-builder A, 15 October 2026; website-two, 16 October 2026: every page), one place
 * for the routes that serve a site: /sites/by-host/<host>[/<page>] (the public site on the school's own domain) and
 * /sites/<slug>[/<page>] (the office's and the head's own view of the published version, signed in), so the headers
 * cannot drift between them.
 *
 *   200  the published page for ?lang= (the site's own language otherwise), `Cache-Control: public, max-age=300` on
 *        the school's domain; `private, no-store` and noindex for the signed-in view;
 *   404  not published, the module off, no such page or no such site: a small page with `X-Robots-Tag: noindex` and
 *        no cache.
 *
 * The stored page names where it is read by two markers (site-render.ts `finishSiteHtml`): the pages' base path and
 * the origin search engines are told. No cookie is set on either path; the public one reads no session; the HTML
 * carries no script.
 */

export const SITE_CACHE_CONTROL = "public, max-age=300";

export type SiteWhere = {
  /** The signed-in office's view: private and never indexed. */
  signedIn?: boolean;
  /** The page's path ("" the home page). */
  path?: string;
  /** The path the pages hang from: "" on the school's domain, "/sites/<slug>" for the office's view. */
  base?: string;
  /** The scheme and host the page is read at, for its canonical and Open Graph addresses. */
  origin?: string;
};

/** The published page for a school as a response, or the 404 when there is none. */
export async function siteResponse(schoolId: string | null, lang: string | null, where: SiteWhere = {}): Promise<Response> {
  const site = schoolId ? await publishedSiteFor(schoolId) : null;
  const page = site ? siteHtmlFor(site, lang, where.path ?? "") : null;
  if (!page) return siteNotFoundResponse(lang);
  const caching: Record<string, string> = where.signedIn ? { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } : { "Cache-Control": SITE_CACHE_CONTROL };
  return new Response(finishSiteHtml(page.html, { base: where.base ?? "", origin: where.origin ?? appUrl() }), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", ...caching, "Content-Language": page.language, "X-Content-Type-Options": "nosniff" },
  });
}

/** "There is no published website at this address", in the language asked for, never indexed or cached. */
export function siteNotFoundResponse(lang: string | null): Response {
  const locale: SiteLanguage = lang === "hi" || lang === "mr" ? lang : "en";
  const t = translator(locale);
  return new Response(renderSiteNotice({ locale, title: t("site.notFoundTitle"), body: t("site.notFoundBody") }), {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" },
  });
}

/** A page of a draft (the review link, the editor's preview in a tab): never cached, never indexed. */
export function draftResponse(html: string, where: { base: string; origin: string }): Response {
  return new Response(finishSiteHtml(html, where), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff" },
  });
}
