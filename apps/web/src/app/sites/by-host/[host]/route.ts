import { sitePage } from "@/lib/site-host-routes";

/**
 * A school website on its own host (website-builder B, 15 Oct 2026): the middleware rewrites `/` on
 * `<slug>.<SITE_DOMAIN>` or a school's LIVE domain here. No session, no cookie; the published HTML for ?lang= with
 * the same rules as /sites/<slug>, or 404 noindex (src/lib/site-host-routes.ts).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ host: string }> }) {
  return sitePage(request, (await params).host);
}
