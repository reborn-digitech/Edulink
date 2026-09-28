import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/session";
import { generateToken, hashToken } from "@/lib/crypto";
import { pkceChallengeSchema } from "@edulink/contracts";
import { writeJson } from "@/lib/json";

const APP_SCHEME = process.env.APP_DEEP_LINK_SCHEME?.trim() || "edulink";
const APP_EXCHANGE_TTL_MS = 2 * 60_000;

/** The app's marker and the challenge it sent at the start; null for a browser's own sign-in. */
function appHandoff(cookieValue: string | undefined): { challenge: string | null } | null {
  try {
    const saved = JSON.parse(cookieValue ?? "") as { c?: string; ch?: unknown };
    if (saved.c !== "app") return null;
    const challenge = pkceChallengeSchema.safeParse(saved.ch);
    return { challenge: challenge.success ? challenge.data : null };
  } catch {
    return null;
  }
}
import { resolveContext } from "@/lib/resolve-context";
import {
  completeSso,
  signInWithSso,
  SSO_COOKIE,
  SSO_PROVIDERS,
  ssoRedirectUri,
  type SsoProviderId,
} from "@/lib/sso";

/**
 * The provider's answer. Mirrors /magic deliberately: a ROUTE HANDLER because
 * signing in writes a cookie; failures redirect to /login with a short reason
 * the form displays beside the password box that still works; success resolves
 * the person's last context and mints the ordinary session — SSO changes how
 * identity is proven, and nothing about what a session is.
 *
 * GET for Google and Microsoft; POST for Apple, whose form_post mode delivers
 * the code as a cross-site form submission.
 */
async function handle(
  request: NextRequest,
  providerParam: string,
  params: { code: string | null; state: string | null; error: string | null },
) {
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
  const away = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/login?sso=${reason}`, origin));
    response.cookies.delete(SSO_COOKIE);
    return response;
  };

  if (!SSO_PROVIDERS.includes(providerParam as SsoProviderId)) {
    return new NextResponse(null, { status: 404 });
  }
  const id = providerParam as SsoProviderId;

  // The person pressed "cancel" at the provider. Not an error — a decision.
  if (params.error) return away("denied");

  const redirectUri = ssoRedirectUri(origin, id);
  const result = await completeSso(
    id,
    params,
    request.cookies.get(SSO_COOKIE)?.value ?? null,
    redirectUri,
  );
  if (!result.ok) return away(result.reason === "state" ? "state" : "failed");

  const outcome = await signInWithSso(id, result.identity);
  if (!outcome.ok) {
    return away(outcome.reason === "disabled" ? "disabled" : outcome.reason === "unverified-email" ? "unverified" : "noaccount");
  }

  const user = await db.user.findUnique({
    where: { id: outcome.userId },
    select: { id: true, lastRole: true, lastSchoolId: true },
  });
  if (!user) return away("noaccount");

  // The phone's hand-off: no browser session, a one-time code on the deep
  // link, and POST /api/v1/auth/sso/exchange turns it into a bearer session.
  // The code is bound to the challenge the app sent at the start: only the
  // holder of the verifier can spend it, so a code read off the deep link by
  // another app is worth nothing. A hand-off with no challenge is refused —
  // the start route refuses one too, and this is the second lock.
  const handoff = appHandoff(request.cookies.get(SSO_COOKIE)?.value);
  if (handoff) {
    if (!handoff.challenge) return away("failed");
    const code = generateToken();
    await db.authToken.create({
      data: { userId: user.id, purpose: "APP_EXCHANGE", tokenHash: hashToken(code), meta: writeJson({ challenge: handoff.challenge }), expiresAt: new Date(Date.now() + APP_EXCHANGE_TTL_MS) },
    });
    const response = NextResponse.redirect(`${APP_SCHEME}://sso?code=${encodeURIComponent(code)}&provider=${id}`);
    response.cookies.delete(SSO_COOKIE);
    return response;
  }

  const context = await resolveContext(user.id, user.lastRole, user.lastSchoolId);
  await createSession(user.id, { schoolId: context.schoolId, role: context.role });
  await audit({
    schoolId: context.schoolId,
    actorUserId: user.id,
    action: "auth.login",
    meta: { via: `sso:${id}`, role: context.role, linked: outcome.linked },
  });

  const response = NextResponse.redirect(new URL(context.redirectTo, origin));
  response.cookies.delete(SSO_COOKIE);
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const search = request.nextUrl.searchParams;
  return handle(request, provider, {
    code: search.get("code"),
    state: search.get("state"),
    error: search.get("error"),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  const form = await request.formData().catch(() => null);
  const field = (name: string) => {
    const value = form?.get(name);
    return typeof value === "string" ? value : null;
  };
  return handle(request, provider, {
    code: field("code"),
    state: field("state"),
    error: field("error"),
  });
}
