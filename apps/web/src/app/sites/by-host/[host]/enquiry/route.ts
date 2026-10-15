import { siteEnquiry, siteNotFound } from "@/lib/site-host-routes";

/**
 * POST /enquiry on a school website's own host (16 Oct 2026): the published site's admission form, rewritten here by
 * the middleware like every other path on that host; the school is the host's LIVE domain, never a slug. GET and
 * the other methods are the site's 404 (src/lib/site-host-routes.ts).
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ host: string }> }) {
  return siteEnquiry(request, (await params).host);
}

function notHere(request: Request) {
  return siteNotFound(request);
}

export { notHere as GET, notHere as HEAD, notHere as PUT, notHere as PATCH, notHere as DELETE };
