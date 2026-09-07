import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";
import { apiErrorSchema, type ApiError } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
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
