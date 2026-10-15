import { siteEnquiryBodySchema, type SiteLanguage } from "@edulink/contracts";
import { translator } from "@/lib/i18n/dictionary";
import { retryHintKey } from "@/lib/rate-limit";
import { takeSiteEnquiry } from "@/lib/site-enquiry";
import { renderSiteNotice } from "@/lib/site-render";

/**
 * The published website's admission form (website-builder A, 15 Oct 2026): a plain HTML form, no script, posts
 * here on the site's own host (/sites/<slug>/enquiry — the middleware leaves /sites/ alone on a school's own
 * domain, so CSP's form-action 'self' holds there too). The same act as POST /api/v1/public/sites/{slug}/enquiry
 * (src/lib/site-enquiry.ts); the answer is a small page in the site's colour and language — thanks, or what to
 * fix — with a link back to the page the visitor came from.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FORM_LIMIT_BYTES = 16 * 1024;

function page(status: number, html: string, extra: Record<string, string> = {}): Response {
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff", ...extra } });
}

/** Back to the page the form was on when the browser says it was this host, else the site by its slug. */
function backHref(request: Request, slug: string): string {
  const fallback = `/sites/${slug}`;
  const referer = request.headers.get("referer");
  if (!referer) return fallback;
  try {
    const from = new URL(referer);
    const here = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? here.host;
    if (from.host !== host) return fallback;
    return `${from.pathname}${from.search}`;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const declared = Number(request.headers.get("content-length") ?? "0");
  let fields: Record<string, string> = {};
  if (!(Number.isFinite(declared) && declared > FORM_LIMIT_BYTES)) {
    const form = await request.formData().catch(() => null);
    if (form) fields = Object.fromEntries([...form.entries()].filter((e): e is [string, string] => typeof e[1] === "string"));
  }
  const asked: SiteLanguage = fields.lang === "hi" || fields.lang === "mr" ? fields.lang : "en";
  const back = backHref(request, slug);
  const parsed = siteEnquiryBodySchema.safeParse(fields);
  try {
    if (!parsed.success) {
      const t = translator(asked);
      return page(422, renderSiteNotice({ locale: asked, title: t("site.refusedTitle"), body: t("site.refusedBody"), back: { href: back, label: t("site.thanksBack") } }));
    }
    const made = await takeSiteEnquiry(slug, parsed.data);
    const locale = asked;
    const t = translator(locale);
    const colour = made.colour;
    if (made.ok) return page(200, renderSiteNotice({ locale, colour, title: t("site.thanksTitle"), body: t("site.thanksBody", { school: made.schoolName }), back: { href: back, label: t("site.thanksBack") } }));
    if (made.status === 429) {
      const hint = retryHintKey(made.retryAfterSeconds ?? 3600);
      return page(429, renderSiteNotice({ locale, colour, title: t("site.refusedTitle"), body: t("site.busyBody", { when: t(hint.key, hint.vars) }), back: { href: back, label: t("site.thanksBack") } }), { "Retry-After": String(made.retryAfterSeconds ?? 3600) });
    }
    if (made.status === 404) return page(404, renderSiteNotice({ locale, title: t("site.notFoundTitle"), body: t("site.notFoundBody") }));
    return page(422, renderSiteNotice({ locale, colour, title: t("site.refusedTitle"), body: t(made.errorKey), back: { href: back, label: t("site.thanksBack") } }));
  } catch (error) {
    console.error("[sites/enquiry]", error);
    const t = translator(asked);
    return page(500, renderSiteNotice({ locale: asked, title: t("site.refusedTitle"), body: t("site.failedBody"), back: { href: back, label: t("site.thanksBack") } }));
  }
}
