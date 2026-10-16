import { siteNotFound, sitePage } from "@/lib/site-host-routes";

/**
 * Every other path on a school website's host (website-builder B; website-two, 16 Oct 2026): a GET of one of the
 * site's pages (/about, /admissions, a custom page's own path) is that page; anything else is 404, noindex. The
 * sign-in, the app's pages and its API are not on a site's host; what a page loads itself (pictures, fonts, Next's
 * files) the middleware passes through before it gets here, and the enquiry form's POST /enquiry has its own route.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ host: string; rest: string[] }> }) {
  const { host, rest } = await params;
  return sitePage(request, host, rest);
}

function notHere(request: Request) {
  return siteNotFound(request);
}

export { notHere as HEAD, notHere as POST, notHere as PUT, notHere as PATCH, notHere as DELETE };
