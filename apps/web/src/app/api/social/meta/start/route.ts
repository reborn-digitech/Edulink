import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { sealingAvailable } from "@/lib/secret-box";
import { beginMetaLogin, META_COOKIE_MAX_AGE, META_STATE_COOKIE, metaConfig, metaRedirectUri } from "@/lib/social-meta";

/**
 * "Connect Facebook" (meta-posting, 16 Oct 2026): the school's ADMIN is sent to Facebook Login with a fresh state,
 * kept in a ten-minute cookie with the school and the admin it was minted for, so the callback can refuse an answer
 * that does not come back to the same person. A platform with no Meta app answers 404 (the feature does not
 * half-exist); anyone but a signed-in ADMIN is refused.
 */
export async function GET(request: NextRequest) {
  const cfg = metaConfig();
  if (!cfg) return new NextResponse(null, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
  const session = await getSession();
  if (!session) return NextResponse.redirect(new URL("/login", origin));
  if (session.role !== "ADMIN" || !session.schoolId) return new NextResponse(null, { status: 404 });
  if (!sealingAvailable()) return NextResponse.redirect(new URL("/admin/settings/social?meta=sealing", origin));

  const begun = beginMetaLogin(cfg, metaRedirectUri(origin), { schoolId: session.schoolId, userId: session.user.id });
  const response = NextResponse.redirect(begun.authorizeUrl);
  // Facebook comes back as a top-level GET redirect, which a Lax cookie accompanies.
  response.cookies.set(META_STATE_COOKIE, begun.cookieValue, { httpOnly: true, path: "/api/social", maxAge: META_COOKIE_MAX_AGE, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return response;
}
