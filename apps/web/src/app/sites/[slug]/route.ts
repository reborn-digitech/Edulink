import { schoolIdForSlug } from "@/lib/site-publish";
import { siteNotFoundResponse, siteResponse } from "@/lib/site-http";

/**
 * A school's published website by its slug (website-builder A, 15 Oct 2026): /sites/<slug>, the address that
 * works on the app's own host before any DNS is set up, and the one the site's own links and form keep to. No
 * session is read and no cookie set; the stored HTML for ?lang= (the site's language otherwise) with
 * `Cache-Control: public, max-age=300`, or 404 with noindex while it is not published or the module is off
 * (src/lib/site-http.ts). GET /api/v1/public/sites/{slug} is the same answer under the catalog.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = new URL(request.url).searchParams.get("lang");
  try {
    return await siteResponse(await schoolIdForSlug(slug), lang);
  } catch (error) {
    console.error("[sites/slug]", error);
    return siteNotFoundResponse(lang);
  }
}
