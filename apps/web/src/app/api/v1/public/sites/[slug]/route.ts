import { schoolIdForSlug } from "@/lib/site-publish";
import { siteNotFoundResponse, siteResponse } from "@/lib/site-http";

/**
 * GET /api/v1/public/sites/{slug} — a school's published website as HTML (text/html), signed out (website-builder
 * A, 15 Oct 2026): the same answer as /sites/<slug>, ?lang= en, hi or mr, 404 with noindex while unpublished.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = new URL(request.url).searchParams.get("lang");
  try {
    return await siteResponse(await schoolIdForSlug(slug), lang);
  } catch (error) {
    console.error("[api/v1/public/sites]", error);
    return siteNotFoundResponse(lang);
  }
}
