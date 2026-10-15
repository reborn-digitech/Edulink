import "server-only";
import type { SiteLanguage } from "@edulink/contracts";
import { translator } from "./i18n/dictionary";
import { publishedSiteFor, siteHtmlFor } from "./site-publish";
import { renderSiteNotice } from "./site-render";

/**
 * THE WEBSITE'S HTTP ANSWERS (website-builder A, 15 October 2026), one place for both routes that serve a site:
 * /sites/by-host/<host> (the public site on the school's own domain) and /sites/<slug> (since 16 Oct 2026 the
 * office's and the head's own view of the published version, signed in), so the headers cannot drift between them.
 *
 *   200  the published HTML for ?lang= (the site's own language otherwise), `Cache-Control: public, max-age=300` on
 *        the school's domain; `private, no-store` and noindex for the signed-in view;
 *   404  not published, the module off, or no such site: a small page with `X-Robots-Tag: noindex` and no cache.
 *
 * No cookie is set on either path; the public one reads no session; the HTML carries no script.
 */

export const SITE_CACHE_CONTROL = "public, max-age=300";

/** The published site for a school as a response, or the 404 when there is none. */
export async function siteResponse(schoolId: string | null, lang: string | null, opts: { signedIn?: boolean } = {}): Promise<Response> {
  const site = schoolId ? await publishedSiteFor(schoolId) : null;
  if (!site) return siteNotFoundResponse(lang);
  const { html, language } = siteHtmlFor(site, lang);
  const caching: Record<string, string> = opts.signedIn ? { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } : { "Cache-Control": SITE_CACHE_CONTROL };
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", ...caching, "Content-Language": language, "X-Content-Type-Options": "nosniff" },
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
