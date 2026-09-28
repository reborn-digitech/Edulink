import { NextResponse, type NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin");
  const allowed = origin !== null && allowedOrigins().has(origin);
  if (request.method === "OPTIONS") {
    if (!allowed) return new NextResponse(null, { status: 403 });
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Accept-Language, X-Edulink-Replay",
        "Access-Control-Max-Age": "600",
        Vary: "Origin",
      },
    });
  }
  // A browser that sends the session cookie AND names another origin is a
  // cross-site form or script: SameSite=Lax already keeps the cookie off
  // cross-site POSTs in every current browser, and this is the second lock
  // for the ones that do not. A native app sends a bearer and no cookie; the
  // web app's own pages send no Origin that differs from the host.
  if (request.method !== "GET" && request.method !== "HEAD" && origin !== null && request.cookies.has("edulink_session")) {
    let originHost: string | null = null;
    try { originHost = new URL(origin).host; } catch { originHost = null; }
    const selfHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (originHost !== selfHost && !allowed) return new NextResponse(null, { status: 403 });
  }
  const response = NextResponse.next();
  if (allowed) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }
  return response;
}

// /api/attendance as well: the phone posts the same body the web form does,
// on purpose, so the outbox replay is byte-identical to the web's.
export const config = { matcher: ["/api/v1/:path*", "/api/attendance", "/api/files/:path*"] };
