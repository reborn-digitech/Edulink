import "server-only";
import type { SiteLanguage } from "@edulink/contracts";
import { translator } from "./i18n/dictionary";
import { publishedSiteFor, siteHtmlFor } from "./site-publish";
import { renderSiteNotice } from "./site-render";

/**
 * THE PUBLIC WEBSITE'S HTTP ANSWERS (website-builder A, 15 October 2026), one place for both routes that serve a
 * site: /sites/<slug> (A) and /sites/by-host/<host> (B), so the headers cannot drift between them.
 *
 *   200  the published HTML for ?lang= (the site's own language otherwise), `Cache-Control: public, max-age=300`;
 *   404  not published, the module off, or no such site: a small page with `X-Robots-Tag: noindex` and no cache.
 *
 * No cookie is set and no session is read on either path; the HTML carries no script.
 */

export const SITE_CACHE_CONTROL = "public, max-age=300";

/** The published site for a school as a response, or the 404 when there is none. */
export async function siteResponse(schoolId: string | null, lang: string | null): Promise<Response> {
  const site = schoolId ? await publishedSiteFor(schoolId) : null;
  if (!site) return siteNotFoundResponse(lang);
  const { html, language } = siteHtmlFor(site, lang);
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": SITE_CACHE_CONTROL, "Content-Language": language, "X-Content-Type-Options": "nosniff" },
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
