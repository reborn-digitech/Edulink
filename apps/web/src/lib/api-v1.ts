import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { apiErrorSchema, sessionResponseSchema as apiSessionSchema, meSchema, type ApiError } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";
import { createApiSession, listContexts, bearerToken } from "@/lib/session";
import { resolveContext } from "@/app/login/actions";
import type { Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { getT } from "@/lib/i18n/server";

/**
 * What every /api/v1 handler shares: one error envelope, one way to read a
 * body, one way to say "invalid".
 *
 * The envelope is the contract in packages/contracts, so the phone parses the
 * same shape the handler writes; `apiErrorSchema.parse` on the way out is the
 * handler checking its own homework. Messages are in the caller's language,
 * as the server actions' are, because a refusal is something a person reads.
 *
 * Every handler is thin: parse, call the same src/lib function the server
 * action calls, answer. Rules — tenancy, duty, quiet hours — stay in the
 * library where the suites already prove them.
 */
export async function apiFailure(error: unknown, where: string): Promise<NextResponse> {
  const t = await getT();
  if (error instanceof AccessError) {
    const status = error.code === "UNAUTHENTICATED" ? 401 : error.code === "NOT_FOUND" ? 404 : 403;
    const code: ApiError["code"] = status === 401 ? "UNAUTHORIZED" : status === 404 ? "NOT_FOUND" : "FORBIDDEN";
    return envelope({ error: t(error.key, error.vars), code }, status);
  }
  console.error(`[${where}] unexpected`, error);
  return envelope({ error: t("common.somethingWrong"), code: "SERVER" }, 500);
}

export async function apiInvalid(result: z.SafeParseError<unknown>): Promise<NextResponse> {
  const t = await getT();
  const issues: Record<string, string> = {};
  for (const issue of result.error.issues) issues[issue.path.join(".") || "_form"] = issue.message;
  return envelope({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues }, 422);
}

export async function readJson(request: Request): Promise<unknown> {
  return request.json().catch(() => null);
}

function envelope(body: ApiError, status: number): NextResponse {
  return NextResponse.json(apiErrorSchema.parse(body), { status, headers: { "Cache-Control": "no-store" } });
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * The tail every sign-in shares once the person is known: the same context
 * resolution the browser gets (last role, last school, or the only one),
 * a Session row handed back as a bearer token, and the audit row that says
 * how they came in.
 */
export async function issueApiSession(
  request: Request,
  userId: string,
  last: { lastRole: string | null; lastSchoolId: string | null },
  via: string,
  device?: string,
): Promise<NextResponse> {
  const context = await resolveContext(userId, last.lastRole, last.lastSchoolId);
  const session = await createApiSession(userId, {
    schoolId: context.schoolId,
    role: context.role,
    userAgent: device?.trim() || request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });
  await audit({ schoolId: context.schoolId, actorUserId: userId, action: "auth.login", meta: { via, role: context.role, api: true } });
  return ok(
    apiSessionSchema.parse({
      token: session.token,
      expiresAt: session.expiresAt.toISOString(),
      sessionId: session.sessionId,
      context: { schoolId: context.schoolId, role: context.role },
    }),
  );
}

/** GET /api/v1/me's body, from a context. */
export async function meBody(ctx: ActiveContext) {
  const found = await listContexts(ctx.user.id);
  const contexts: { schoolId: string | null; schoolName: string | null; role: Role }[] = found.memberships.map((m) => ({
    schoolId: m.schoolId,
    schoolName: m.schoolName,
    role: m.role,
  }));
  // A guardian's context is the same PARENT role whichever child they open;
  // one entry per school the children attend, so the picker has a name.
  const parentSchools = new Set<string>();
  for (const child of found.children) {
    if (parentSchools.has(child.schoolId)) continue;
    parentSchools.add(child.schoolId);
    contexts.push({ schoolId: child.schoolId, schoolName: child.schoolName, role: "PARENT" });
  }
  return meSchema.parse({
    user: {
      id: ctx.user.id,
      name: ctx.user.name,
      preferredName: ctx.user.preferredName,
      email: ctx.user.email,
      avatarKey: ctx.user.avatarKey,
      isMinor: ctx.user.isMinor,
      locale: ctx.user.prefs.locale ?? "en",
      isSuperuser: ctx.user.isSuperuser,
      isAppAdmin: ctx.user.isAppAdmin,
    },
    active: { schoolId: ctx.schoolId, role: ctx.role as Role | null, membershipId: ctx.membershipId },
    contexts,
  });
}

/** The session row behind this request, for logout and device listing. */
export async function currentSessionId(request: Request, ctx: ActiveContext): Promise<string> {
  void bearerToken(request.headers);
  return ctx.sessionId;
}

export { db };
