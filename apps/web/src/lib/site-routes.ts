import "server-only";
import { SITE_LANGUAGES, type SiteLanguage } from "@edulink/contracts";
import { getSession } from "./session";
import { AccessError } from "./access-error";
import { forSchool } from "./tenant-context";
import { translator } from "./i18n/dictionary";
import { draftConfigFor } from "./site-publish";
import { draftPage, draftPagePaths, logoSwatchFor, previewHtml, publishedPreviewSchool } from "./site-admin";
import { schoolForReviewToken } from "./site-share";
import { draftResponse, siteNotFoundResponse, siteResponse } from "./site-http";
import { appUrl } from "./site-publish";
import { db } from "./db";

/**
 * THE ROUTES THAT SHOW A SITE OFF ITS OWN DOMAIN (website-two, 16 October 2026), one place for the three, so their
 * answers cannot drift: the office's signed-in view of the published version (/sites/<slug>[/<page>]), the review link
 * to the draft (/sites/review/<token>[/<page>]) and the editor's preview in a tab (/admin/website/preview[/<page>]).
 * Each is private and never indexed; each refusal is the site's own 404; the links between pages stay under the
 * route's own path (the stored page's base marker, site-render.ts `finishSiteHtml`).
 */

const PATH = /^[a-z0-9-]{0,40}$/;
const langOf = (request: Request): string | null => new URL(request.url).searchParams.get("lang");
const languageOf = (raw: string | null, fallback: SiteLanguage): SiteLanguage => ((SITE_LANGUAGES as readonly string[]).includes(raw ?? "") ? (raw as SiteLanguage) : fallback);

/** /sites/<slug>[/<page>]: the published version for the office and the head of that school. */
export async function officeSitePage(request: Request, slug: string, path: string): Promise<Response> {
  const lang = langOf(request);
  try {
    const ctx = await getSession();
    const schoolId = ctx ? await publishedPreviewSchool(ctx, slug) : null;
    if (!schoolId || !PATH.test(path)) return siteNotFoundResponse(lang);
    return await siteResponse(schoolId, lang, { signedIn: true, path, base: `/sites/${slug}` });
  } catch (error) {
    console.error("[sites/slug]", error);
    return siteNotFoundResponse(lang);
  }
}

/**
 * /sites/review/<token>[/<page>]: the draft as it stands, signed out, while the link is open (site-share.ts), with a
 * line across the top saying it is a draft; pictures carry the token so the file route opens them for this reader.
 */
export async function reviewSitePage(request: Request, token: string, path: string): Promise<Response> {
  const lang = langOf(request);
  try {
    const schoolId = PATH.test(path) ? await schoolForReviewToken(token) : null;
    if (!schoolId) return siteNotFoundResponse(lang);
    return await forSchool(schoolId, async () => {
      const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { logoPath: true } });
      const { config } = await draftConfigFor(schoolId, await logoSwatchFor(school.logoPath));
      if (path && !(await draftPagePaths(schoolId, config)).includes(path)) return siteNotFoundResponse(lang);
      const language = languageOf(lang, config.language);
      const html = await draftPage(schoolId, config, language, path, { fileQuery: `review=${encodeURIComponent(token)}`, draftNote: translator(language)("siteWeb.reviewNote") });
      return draftResponse(html, { base: `/sites/review/${token}`, origin: appUrl() });
    });
  } catch (error) {
    console.error("[sites/review]", error);
    return siteNotFoundResponse(lang);
  }
}

/**
 * /admin/website/preview[/<page>]: the saved draft as the page Publish would make, for the office and the head to
 * open in a tab of its own. POST with `{ config, page, lang }` (the editor's live frame) draws a draft not yet saved.
 */
export async function previewSitePage(request: Request, path: string, unsaved?: unknown): Promise<Response> {
  const lang = langOf(request);
  const notHere = () => new Response(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  try {
    const ctx = await getSession();
    if (!ctx || !PATH.test(path)) return notHere();
    const asked = lang === "en" || lang === "hi" || lang === "mr" ? lang : null;
    const note = translator(asked ?? "en")("siteWeb.previewNote");
    const html = await previewHtml(ctx, asked, path, unsaved, { draftNote: note });
    return draftResponse(html, { base: "/admin/website/preview", origin: appUrl() });
  } catch (error) {
    if (!(error instanceof AccessError)) console.error("[admin/website/preview]", error);
    return notHere();
  }
}
