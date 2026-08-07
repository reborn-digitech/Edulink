import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { createSession } from "@/lib/session";
import { resolveContext } from "@/app/login/actions";
import {
  completeSso,
  signInWithSso,
  SSO_COOKIE,
  SSO_PROVIDERS,
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

  const redirectUri = `${origin.replace(/\/$/, "")}/api/sso/${id}/callback`;
  const result = await completeSso(
    id,
    params,
    request.cookies.get(SSO_COOKIE)?.value ?? null,
    redirectUri,
  );
  if (!result.ok) return away(result.reason === "state" ? "state" : "failed");

  const outcome = await signInWithSso(id, result.identity);
  if (!outcome.ok) return away(outcome.reason === "disabled" ? "disabled" : "noaccount");

  const user = await db.user.findUnique({
    where: { id: outcome.userId },
    select: { id: true, lastRole: true, lastSchoolId: true },
  });
  if (!user) return away("noaccount");

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
