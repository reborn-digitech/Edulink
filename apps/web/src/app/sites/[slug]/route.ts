import { officeSitePage } from "@/lib/site-routes";

/**
 * /sites/<slug> — the school's published website as its own office and head see it (website-builder A, 15 Oct 2026;
 * no longer public since the owner's decision of 16 Oct 2026: a site is public only on the school's own domain,
 * /sites/by-host/<host>). Signed in as the ADMIN or PRINCIPAL of the school with this slug, with the WEBSITE module
 * on: the stored home page for ?lang= (the site's language otherwise), `private, no-store`, noindex; its other pages
 * at /sites/<slug>/<page> (website-two). Anybody else gets the 404 with noindex (src/lib/site-routes.ts).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  return officeSitePage(request, (await params).slug, "");
}
