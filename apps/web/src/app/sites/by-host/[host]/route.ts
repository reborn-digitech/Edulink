import { sitePage } from "@/lib/site-host-routes";

/**
 * A school website on its own host (website-builder B, 15 Oct 2026): the middleware rewrites `/` on a school's
 * LIVE domain (or `<slug>.localhost` in development) here; there is no platform subdomain (16 Oct 2026). No session,
 * no cookie; the published HTML for ?lang=, or 404 noindex (src/lib/site-host-routes.ts).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ host: string }> }) {
  return sitePage(request, (await params).host);
}
