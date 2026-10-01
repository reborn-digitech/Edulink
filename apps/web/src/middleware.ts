import { NextResponse, type NextRequest } from "next/server";
import { contentSecurityPolicy, isPage, NONCE_HEADER } from "@/lib/csp";

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
  const headers = new Headers(request.headers);
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
  if (isPage(pathname)) return page(request);
  if (CORS_PATHS.test(pathname)) return cors(request);
  if (LOCKED_PATHS.test(pathname)) return originLock(request) ?? NextResponse.next();
  return NextResponse.next();
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
  const response = NextResponse.next();
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

// Every page, for its nonce; of the API, the doors CORS answers at —
// /api/attendance among them, because the phone posts the same body the web
// form does, on purpose, so the outbox replay is byte-identical to the web's —
// and the three cookie doors the Origin lock guards.
// Next's own files and anything with an extension never reach this.
export const config = { matcher: ["/((?!api/|_next/|.*\\.[A-Za-z0-9]{2,12}$).*)", "/api/v1/:path*", "/api/attendance", "/api/files/:path*", "/api/push", "/api/practice/:path*", "/api/auth/:path*"] };
