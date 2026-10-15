import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { completeMetaLogin } from "@/lib/social";
import { META_COOKIE_MAX_AGE, META_PICK_COOKIE, META_PICK_COOKIE_PATH, META_STATE_COOKIE, metaConfig, metaRedirectUri, readMetaState } from "@/lib/social-meta";

/**
 * Facebook Login's answer (meta-posting, 16 Oct 2026). The state must match the cookie minted at the start, and that
 * cookie must name the school and the ADMIN this session is; then the code is exchanged for a long-lived user token,
 * the Pages it manages are listed (at least one, or there is nothing to choose), and the token goes, sealed and bound
 * to this school and this admin, into a ten-minute cookie read only by /admin/settings/social, where the admin picks
 * the Page. Every failure lands back on that page with a short reason it words; nothing is stored until the pick.
 */
export async function GET(request: NextRequest) {
  if (!metaConfig()) return new NextResponse(null, { status: 404 });
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
  const clearState = (response: NextResponse) => {
    response.cookies.set(META_STATE_COOKIE, "", { httpOnly: true, path: "/api/social", maxAge: 0 });
    return response;
  };
  // The refusal travels as ?meta=, not ?error=: the form rule (tests/form-answers.test.ts) keeps ?error= to the
  // listed forms, and this is a round trip through Facebook, not a form.
  const away = (reason: string) => clearState(NextResponse.redirect(new URL(`/admin/settings/social?meta=${reason}`, origin)));

  const search = request.nextUrl.searchParams;
  // The admin pressed "cancel" at Facebook. Not an error — a decision.
  if (search.get("error")) return away("denied");

  const session = await getSession();
  if (!session) return clearState(NextResponse.redirect(new URL("/login", origin)));
  if (session.role !== "ADMIN" || !session.schoolId) return away("role");

  const saved = readMetaState(request.cookies.get(META_STATE_COOKIE)?.value);
  const code = search.get("code");
  const state = search.get("state");
  if (!saved || !code || !state || saved.s !== state || saved.school !== session.schoolId || saved.u !== session.user.id) return away("state");

  const outcome = await completeMetaLogin(session, code, metaRedirectUri(origin));
  if (!outcome.ok) return away(outcome.reason);

  const response = clearState(NextResponse.redirect(new URL("/admin/settings/social?pick=1", origin)));
  response.cookies.set(META_PICK_COOKIE, outcome.pickCookie, { httpOnly: true, path: META_PICK_COOKIE_PATH, maxAge: META_COOKIE_MAX_AGE, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  return response;
}
