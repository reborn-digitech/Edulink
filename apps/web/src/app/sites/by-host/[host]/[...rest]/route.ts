import { siteNotFound } from "@/lib/site-host-routes";

/**
 * Every other path on a school website's host (website-builder B): 404, noindex. The sign-in, the app's pages and
 * its API are not on a site's host; what a page loads itself (pictures, fonts, Next's files, the enquiry form's
 * /sites/ path) the middleware passes through before it gets here.
 */
export const runtime = "nodejs";

function notHere(request: Request) {
  return siteNotFound(request);
}

export { notHere as GET, notHere as HEAD, notHere as POST, notHere as PUT, notHere as PATCH, notHere as DELETE };
