import { getSession } from "@/lib/session";
import { publishedPreviewSchool } from "@/lib/site-admin";
import { siteNotFoundResponse, siteResponse } from "@/lib/site-http";

/**
 * /sites/<slug> — the school's published website as its own office and head see it (website-builder A, 15 Oct 2026;
 * no longer public since the owner's decision of 16 Oct 2026: a site is public only on the school's own domain,
 * /sites/by-host/<host>). Signed in as the ADMIN or PRINCIPAL of the school with this slug, with the WEBSITE module
 * on: the stored HTML for ?lang= (the site's language otherwise), `private, no-store`, noindex. Anybody else —
 * signed out, another role, another school, the module off, nothing published — gets the 404 with noindex.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lang = new URL(request.url).searchParams.get("lang");
  try {
    const ctx = await getSession();
    const schoolId = ctx ? await publishedPreviewSchool(ctx, slug) : null;
    if (!schoolId) return siteNotFoundResponse(lang);
    return await siteResponse(schoolId, lang, { signedIn: true });
  } catch (error) {
    console.error("[sites/slug]", error);
    return siteNotFoundResponse(lang);
  }
}
