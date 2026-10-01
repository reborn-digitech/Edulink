import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { apiErrorSchema, sessionResponseSchema as apiSessionSchema, meSchema, type ApiError } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";
import { createApiSession, listContexts, bearerToken } from "@/lib/session";
import { resolveContext } from "@/lib/resolve-context";
import type { Role } from "@/lib/constants";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { clientAddress, consume } from "@/lib/rate-limit";
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
  if (error instanceof BodyTooLarge) return envelope({ error: t("common.bodyTooLarge"), code: "TOO_LARGE" }, 413);
  console.error(`[${where}] unexpected`, error);
  return envelope({ error: t("common.somethingWrong"), code: "SERVER" }, 500);
}

export async function apiInvalid(result: z.SafeParseError<unknown>): Promise<NextResponse> {
  const t = await getT();
  const issues: Record<string, string> = {};
  for (const issue of result.error.issues) issues[issue.path.join(".") || "_form"] = issue.message;
  return envelope({ error: t("common.checkTheForm"), code: "BAD_REQUEST", issues }, 422);
}

/**
 * The most a JSON body may be. A question with three languages and a worked
 * solution is a few kilobytes; the largest honest bodies are a pasted
 * intake sheet (the contract allows 500,000 characters) and the seal as a
 * PNG in base64 (250 KB of picture is 340 KB of text), so a megabyte. A 3 MB
 * body was once parsed and saved whole (the campaign of 2026-10-01); a body
 * over the cap is refused before it is read, by its declared length and
 * again by what actually arrives.
 */
export const JSON_BODY_LIMIT = 1024 * 1024;
/** A gateway's or a carrier's event is a few kilobytes. */
export const WEBHOOK_BODY_LIMIT = 64 * 1024;

export async function readJson(request: Request, limit = JSON_BODY_LIMIT): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > limit) throw new BodyTooLarge();
  const text = await readBounded(request, limit);
  if (text === null) throw new BodyTooLarge();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Thrown by readJson and caught by apiFailure, which answers 413. */
/**
 * A per-person budget on work the server does for one call — a PDF render
 * takes a core for a second or two, and a loop over the endpoint would take
 * the process. Refused with 429 and Retry-After, counted by the person, so a
 * school's other users keep theirs. Fails open as the limiter does.
 */
export async function budget(bucket: string, limit: number, windowMs: number): Promise<NextResponse | null> {
  const gate = await consume(bucket, limit, windowMs);
  if (gate.allowed) return null;
  const t = await getT();
  return NextResponse.json(
    apiErrorSchema.parse({ error: t("common.tryAgainMoment"), code: "RATE_LIMITED", retryAfterSeconds: gate.retryAfterSeconds }),
    { status: 429, headers: { "Retry-After": String(gate.retryAfterSeconds), "Cache-Control": "no-store" } },
  );
}

/** Renders a person may ask for in an hour: one card or certificate at a time. */
export const PDF_BUDGET = { limit: 120, windowMs: 60 * 60 * 1000 };
/** Class bundles are a page per pupil; a handful an hour is a whole school's worth. */
export const PDF_BUNDLE_BUDGET = { limit: 20, windowMs: 60 * 60 * 1000 };

export class BodyTooLarge extends Error {
  constructor() {
    super("body too large");
  }
}

/** The body as text, or null once it has grown past the limit. */
export async function readBounded(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel().catch(() => {});
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
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
    ip: clientAddress(request.headers),
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
