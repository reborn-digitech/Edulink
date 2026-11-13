import "server-only";
import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { apiFailure } from "../api-v1";
import { getSession, type ActiveContext } from "../session";
import { AccessError } from "../access-error";
import { requireApiSession } from "../api-reads/shared";
import { AssistantUnavailableError, unavailableSentence } from "./service";
import { policyFor } from "./policy";

/**
 * The assistant's own doors' first line (16 Oct 2026): signed in, in a role the assistant is for — every role but
 * the expert and the recruiter, who belong to no school (policy.ts `help`; the catalog's PEOPLE says the same) — and
 * refused 403 otherwise, before the body is read. The expert used to be answered as a person with no school (a 200
 * status saying NO_SCHOOL, an empty list, a 422 for an empty body) where the catalog, the docs and the phone's gate
 * say 403; the API sweep with the feature on found it.
 */
export async function requireAssistantSession(): Promise<ActiveContext> {
  const ctx = await requireApiSession();
  if (!policyFor(ctx.role).help) throw new AccessError("access.wrongRoleForThisAction");
  return ctx;
}

/**
 * The assistant's doors answer every failure through apiFailure, and the one refusal of their own —
 * the assistant cannot be used just now — as the same envelope: MODULE_OFF (403) for the school's
 * switch, FORBIDDEN (403) for the platform's switch, a guardian's opt-out or no school, and
 * RATE_LIMITED (429, with Retry-After) for the person's day and the school's month. GET /api/v1/assistant
 * names the reason as a code; here it is the sentence.
 */
export async function assistantFailure(error: unknown, where: string): Promise<NextResponse> {
  if (!(error instanceof AssistantUnavailableError)) return apiFailure(error, where);
  const ctx = await getSession().catch(() => null);
  const now = new Date();
  // TA-279: the school's own next day or month when the service counted it (ask); else to UTC's, as before.
  const counted = error.vars.retryAfterSeconds;
  const retryAfterSeconds =
    typeof counted === "number" && (error.reason === "DAILY_CAP" || error.reason === "SCHOOL_BUDGET")
      ? counted
      : error.reason === "DAILY_CAP"
        ? Math.max(60, Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime()) / 1000))
        : error.reason === "SCHOOL_BUDGET"
          ? Math.max(60, Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - now.getTime()) / 1000))
          : undefined;
  const code = error.reason === "MODULE_OFF" ? "MODULE_OFF" : error.status === 429 ? "RATE_LIMITED" : "FORBIDDEN";
  const body = apiErrorSchema.parse({ error: unavailableSentence(ctx, error), code, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) });
  return NextResponse.json(body, { status: error.status, headers: { "Cache-Control": "no-store", ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}) } });
}
