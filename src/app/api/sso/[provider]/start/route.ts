import { NextResponse, type NextRequest } from "next/server";
import { beginSso, ssoRedirectUri, SSO_COOKIE, SSO_COOKIE_MAX_AGE, SSO_PROVIDERS, type SsoProviderId } from "@/lib/sso";

/**
 * Kicks off one provider's sign-in: mint state/nonce/PKCE, park them in a
 * transient cookie, and hand the browser to the provider. A provider whose
 * env vars are absent answers 404 — the feature does not half-exist.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  if (!SSO_PROVIDERS.includes(provider as SsoProviderId)) {
    return new NextResponse(null, { status: 404 });
  }
  const id = provider as SsoProviderId;

  // Must be byte-identical at start and callback, or the code exchange fails —
  // which is why both call the same function. `sso:check` prints what it
  // returns, so what an operator registers is what the app actually sends.
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
  const redirectUri = ssoRedirectUri(origin, id);

  const begun = beginSso(id, redirectUri);
  if (!begun) return new NextResponse(null, { status: 404 });

  const response = NextResponse.redirect(begun.authorizeUrl);
  response.cookies.set(SSO_COOKIE, begun.cookieValue, {
    httpOnly: true,
    path: "/api/sso",
    maxAge: SSO_COOKIE_MAX_AGE,
    // Apple returns the code as a CROSS-SITE POST (form_post), which a Lax
    // cookie would not accompany — so Apple's round trip needs None+Secure.
    // Google and Microsoft come back as top-level GET redirects, where Lax
    // is both sufficient and the safer default.
    sameSite: id === "apple" ? "none" : "lax",
    secure: id === "apple" ? true : process.env.NODE_ENV === "production",
  });
  return response;
}
