import "server-only";
import { publishedSiteFor, type PublishedSite } from "./site-publish";
import { siteNotFoundResponse, siteResponse } from "./site-http";
import { schoolIdForHost } from "./site-hosts";
import { normaliseHost, SITE_CSP } from "./site-host-match";

/**
 * WHAT A SCHOOL WEBSITE'S HOST ANSWERS (website-builder B, 15 October 2026). The middleware rewrites every request
 * on a site host to /sites/by-host/<host><path> (src/lib/site-host-match.ts); these build the three answers it
 * has — the page, robots.txt and sitemap.xml — and the 404 for everything else. The page and the 404 are the flow
 * builder's own answers (src/lib/site-http.ts, shared with /sites/<slug>, so the two routes' headers cannot
 * drift): the published HTML for ?lang=, public for five minutes, or "no website here", noindex and uncached, when
 * the host is unknown, the domain not LIVE, the site unpublished or the module off. No session is read and no
 * cookie set.
 *
 * THE HOST'S OWN HARDENING, on top: the site carries no script, so its policy forbids every script, plugin and
 * frame, lets the page load only its own pictures (the platform's file route), fonts and inline styles, and posts
 * its one form (the enquiry, to /sites/<slug>/enquiry, which the middleware passes through) to its own host.
 */


const HARDENING: Record<string, string> = {
  "Content-Security-Policy": SITE_CSP,
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

function hardened(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(HARDENING)) headers.set(k, v);
  headers.delete("set-cookie");
  return new Response(response.body, { status: response.status, headers });
}

const langOf = (request: Request) => new URL(request.url).searchParams.get("lang");

/** The 404 every unknown host, unpublished site and other path answers. */
export function siteNotFound(request: Request): Response {
  return hardened(siteNotFoundResponse(langOf(request)));
}

/** The school a site host belongs to (the param is the hostname the middleware put in the path). */
async function schoolOf(hostParam: string): Promise<string | null> {
  let decoded: string;
  try {
    decoded = decodeURIComponent(hostParam);
  } catch {
    return null;
  }
  const n = normaliseHost(decoded);
  return n ? schoolIdForHost(n.hostname) : null;
}

/** The origin the site is reached at, for the absolute URLs robots.txt and the sitemap need. */
export function siteOrigin(request: Request, hostParam: string): string {
  const hostname = normaliseHost(decodeURIComponent(hostParam))?.hostname ?? "";
  const sent = normaliseHost(request.headers.get("host"));
  const host = sent && sent.hostname === hostname ? sent.host : hostname;
  const forwarded = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwarded === "http" || forwarded === "https" ? forwarded : process.env.NODE_ENV === "production" ? "https" : new URL(request.url).protocol.replace(":", "");
  return `${proto}://${host}`;
}

/**
 * The languages a published site offers: its own, and each other one whose page differs from it (publishedSiteFor
 * fills a language the site does not offer with the site's own page).
 */
export function offeredLanguages(site: Pick<PublishedSite, "html" | "language">): string[] {
  const own = site.html[site.language];
  return [site.language, ...(Object.keys(site.html) as (keyof typeof site.html)[]).filter((l) => l !== site.language && site.html[l] !== own)];
}

/** GET / on a site host. */
export async function sitePage(request: Request, host: string): Promise<Response> {
  return hardened(await siteResponse(await schoolOf(host), langOf(request)));
}

/** The published site behind a host, or null. */
async function siteOf(host: string): Promise<PublishedSite | null> {
  const schoolId = await schoolOf(host);
  return schoolId ? publishedSiteFor(schoolId) : null;
}

/** GET /robots.txt on a site host: everything may be read, and here is the sitemap. */
export async function siteRobots(request: Request, host: string): Promise<Response> {
  const site = await siteOf(host);
  if (!site) return siteNotFound(request);
  const origin = siteOrigin(request, host);
  return hardened(new Response(`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } }));
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The sitemap's XML for a published site at an origin: one URL per language it offers, each naming the others. */
export function sitemapXml(site: Pick<PublishedSite, "html" | "language" | "renderedAt">, origin: string): string {
  const languages = offeredLanguages(site);
  const urlFor = (l: string) => (l === site.language ? `${origin}/` : `${origin}/?lang=${l}`);
  const lastmod = site.renderedAt.toISOString().slice(0, 10);
  // An XML element built from its parts (the i18n audit reads a tag written out in a template as page text).
  const element = (name: string, attrs: Record<string, string>) => `<${name} ${Object.entries(attrs).map(([k, v]) => `${k}="${xml(v)}"`).join(" ")}/>`;
  const alternates = languages.length > 1 ? languages.map((l) => `    ${element("xhtml:link", { rel: "alternate", hreflang: l, href: urlFor(l) })}`).join("\n") : "";
  const urls = languages.map((l) => `  <url>\n    <loc>${xml(urlFor(l))}</loc>\n    <lastmod>${lastmod}</lastmod>${alternates ? `\n${alternates}` : ""}\n  </url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`;
}

/** GET /sitemap.xml on a site host. */
export async function siteSitemap(request: Request, host: string): Promise<Response> {
  const site = await siteOf(host);
  if (!site) return siteNotFound(request);
  return hardened(new Response(sitemapXml(site, siteOrigin(request, host)), { status: 200, headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300" } }));
}
