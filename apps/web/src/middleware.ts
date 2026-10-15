import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy, isPage, NONCE_HEADER } from "@/lib/csp";
import { ROUTE_HEADER, routeStamp } from "@/lib/route-header";
// website-builder B (15 Oct 2026): a school website's host is rewritten to its public route (edge-safe, no imports).
import { appHosts, appHostsKnown, isDevelopment, processSiteEnv } from "@/lib/site-env";
import { SITE_CSP, siteRewritePath, type HostEnv } from "@/lib/site-host-match";
// end website-builder B

/**
 * CORS for /api/v1 and for the files it names (/api/files), and only there,
 * and only for origins named in API_CORS_ORIGINS (comma-separated). A
 * picture in a post is fetched with the bearer token, which makes a browser
 * ask first; without the same answer the web target drew every picture as
 * an empty box. The phone needs none of this — a
 * native app has no origin — but the app's web target during development
 * runs on another port, and a browser will not let it call the API without
 * these headers. In development, with nothing configured, Expo's default
 * port is allowed; in production the list is empty unless the operator says
 * otherwise, and a preflight from anywhere else is refused.
 */
function allowedOrigins(): Set<string> {
  const configured = (process.env.API_CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (configured.length > 0) return new Set(configured);
  return new Set(process.env.NODE_ENV === "development" ? ["http://localhost:8081", "http://127.0.0.1:8081"] : []);
}

/**
 * A PAGE: a nonce minted for this one response. It goes on the REQUEST, where
 * Next reads it and puts it on every script it writes, and where the layout
 * reads it for the one script of its own; and the policy naming it goes on
 * the response, replacing the nonce-less one next.config sets everywhere.
 */
function page(request: NextRequest): NextResponse {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const nonce = btoa(String.fromCharCode(...bytes));
  const policy = contentSecurityPolicy({ nonce, dev: process.env.NODE_ENV === "development" });
  const headers = routed(request);
  headers.set(NONCE_HEADER, nonce);
  headers.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

/** The three API doors a browser on another origin may knock on. */
const CORS_PATHS = /^\/api\/(v1\/|attendance$|attendance\/|files\/)/;
/**
 * Doors a browser writes to with the session cookie and no CORS: the push
 * subscription, a practice answer, the logout. They relied on SameSite=Lax
 * alone until the review of 2026-10-01; they take the Origin lock below now,
 * and nothing else — no CORS headers, since no other origin may call them.
 */
const LOCKED_PATHS = /^\/api\/(push$|practice\/|auth\/)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // website-builder B: a school website's host (src/lib/site-host-match.ts) — its pages are the published site.
  const site = siteRewrite(request);
  if (site) return site;
  // The by-host routes answer only through the rewrite above (16 Oct 2026): a site is reached at its school's own
  // domain, never by a path on the app's host.
  if (pathname === "/sites/by-host" || pathname.startsWith("/sites/by-host/")) return new NextResponse(null, { status: 404, headers: { "X-Robots-Tag": "noindex", "Cache-Control": "no-store" } });
  // The office's preview of its published site by slug (/sites/<slug>, signed in) carries the site's policy, not a page's (15 Oct 2026).
  if (pathname.startsWith("/sites/")) {
    const response = NextResponse.next({ request: { headers: routed(request) } });
    response.headers.set("Content-Security-Policy", SITE_CSP);
    return response;
  }
  // end website-builder B
  if (isPage(pathname)) return page(request);
  if (CORS_PATHS.test(pathname)) return cors(request);
  if (LOCKED_PATHS.test(pathname)) return originLock(request) ?? NextResponse.next({ request: { headers: routed(request) } });
  return NextResponse.next({ request: { headers: routed(request) } });
}

/**
 * The request's headers with the route the session's role gate reads
 * (lib/route-header.ts), written here and never taken from the client: a
 * module role (a driver, the library's desk, a warden, an alumnus) reaches
 * only the doors and pages its module names, and the gate needs to know
 * which one this is.
 */
function routed(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  // Decoded and normalised as the router serves it (route-header.ts routePath; campaign S-11).
  headers.set(ROUTE_HEADER, routeStamp(request.method, request.nextUrl.pathname));
  return headers;
}

/**
 * A browser that sends the session cookie AND names another origin is a
 * cross-site form or script: SameSite=Lax already keeps the cookie off
 * cross-site POSTs in every current browser, and this is the second lock
 * for the ones that do not. A native app sends a bearer and no cookie; the
 * web app's own pages send no Origin that differs from the host. Returns
 * the refusal, or null to let the request through.
 */
function originLock(request: NextRequest, allowed = false): NextResponse | null {
  const origin = request.headers.get("origin");
  if (request.method === "GET" || request.method === "HEAD" || origin === null) return null;
  if (!request.cookies.has("edulink_session") && !request.cookies.has("__Host-edulink_session")) return null;
  let originHost: string | null = null;
  try { originHost = new URL(origin).host; } catch { originHost = null; }
  const selfHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (originHost !== selfHost && !allowed) return new NextResponse(null, { status: 403 });
  return null;
}

function cors(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = origin !== null && allowedOrigins().has(origin);
  if (request.method === "OPTIONS") {
    if (!allowed) return new NextResponse(null, { status: 403 });
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Accept-Language, X-Edulink-Replay, X-Edulink-Owner",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
  }
  const refused = originLock(request, allowed);
  if (refused) return refused;
  const response = NextResponse.next({ request: { headers: routed(request) } });
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

// website-builder B (15 Oct 2026)
/**
 * A SCHOOL WEBSITE'S HOST: a school's own LIVE domain (any named host that is not one of APP_HOSTS; none at all in
 * production while APP_HOSTS is unset), and `<slug>.localhost` in development. There is no platform subdomain (16 Oct
 * 2026). Every path but the few a published page loads itself is rewritten to /sites/by-host/<host><path>, query
 * kept, which serves the site, its robots.txt and sitemap.xml and the enquiry form's POST /enquiry, and answers 404
 * to anything else: the sign-in, the app's pages and its API do not exist on a site's host. No database here (the
 * edge): which school the host is, and whether its domain is LIVE, is the route's to decide. The route stamp names
 * the rewritten path, and no nonce is minted, since the site carries no script.
 */
function hostEnv(): HostEnv {
  const env = processSiteEnv();
  return { appHosts: appHosts(env), appHostsKnown: appHostsKnown(env), dev: isDevelopment(env) };
}

function siteRewrite(request: NextRequest): NextResponse | null {
  const target = siteRewritePath(request.headers.get("host"), request.nextUrl.pathname, hostEnv());
  if (!target) return null;
  const url = request.nextUrl.clone();
  url.pathname = target;
  const headers = new Headers(request.headers);
  headers.set(ROUTE_HEADER, routeStamp(request.method, target));
  const response = NextResponse.rewrite(url, { request: { headers } });
  response.headers.set("Content-Security-Policy", SITE_CSP);
  return response;
}
// end website-builder B

// EVERY REQUEST BUT NEXT'S OWN FILES (A3-S-3, 5 Oct 2026). The middleware is
// the only writer of the route stamp the session's gate reads, and it can only
// overwrite what a client sent on a request it sees. It used to skip any path
// ending in an extension and every /api route but the ones below, so a page
// path such as /library/titles/x.ab carried a client's own
// "x-edulink-route: GET /hostel" to the gate and the default-deny page gate
// passed a warden (each page's own requireRole still refused). Now every path
// is stamped: a page gets its nonce (isPage), the CORS doors their headers —
// /api/attendance among them, because the phone posts the same body the web
// form does, so the outbox replay is byte-identical — the cookie doors the
// Origin lock, and everything else, a file from public/ included, the stamp.
export const config = { matcher: ["/((?!_next/).*)"] };
