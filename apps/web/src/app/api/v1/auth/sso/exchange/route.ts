import { ssoExchangeSchema } from "@edulink/contracts";
import { claimAppExchange } from "@/lib/auth-tokens";
import { db } from "@/lib/db";
import { apiFailure, apiInvalid, issueApiSession, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/auth/sso/exchange — the last step of SSO from the phone.
 *
 * The app opens /api/sso/{provider}/start?client=app in the system browser;
 * the provider comes back to the web callback as always; the callback, seeing
 * the app marker in its state cookie, mints a one-time APP_EXCHANGE token and
 * redirects to the app's deep link with it instead of setting a cookie. The
 * app posts that code here, once, and gets a bearer session. The token lives
 * two minutes, which is the length of a hand-off, not a session.
 *
 * PKCE BINDS THE CODE TO THE APP THAT ASKED. The app sends the challenge of
 * a verifier it keeps at the start (&challenge=), and the verifier here; a
 * code without its verifier is refused and spent. Every refusal is the same
 * 401, so a wrong verifier and a wrong code read no different.
 */
export async function POST(request: Request) {
  try {
    const parsed = ssoExchangeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const claim = await claimAppExchange(parsed.data.code, parsed.data.verifier);
    const t = await getT();
    if (!claim.ok) return NextResponse.json({ error: t("login.noMatch"), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const user = await db.user.findUnique({ where: { id: claim.userId }, select: { id: true, disabledAt: true, lastRole: true, lastSchoolId: true } });
    if (!user || user.disabledAt) return NextResponse.json({ error: t("login.noMatch"), code: "UNAUTHORIZED" }, { status: 401, headers: { "Cache-Control": "no-store" } });
    return issueApiSession(request, user.id, user, "sso", parsed.data.device);
  } catch (error) {
    return apiFailure(error, "api/v1/auth/sso/exchange");
  }
}
