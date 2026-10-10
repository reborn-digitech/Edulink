import "server-only";
import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { apiFailure } from "../api-v1";
import { getSession } from "../session";
import { AssistantUnavailableError, unavailableSentence } from "./service";

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
  const retryAfterSeconds =
    error.reason === "DAILY_CAP"
      ? Math.max(60, Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1) - now.getTime()) / 1000))
      : error.reason === "SCHOOL_BUDGET"
        ? Math.max(60, Math.ceil((Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) - now.getTime()) / 1000))
        : undefined;
  const code = error.reason === "MODULE_OFF" ? "MODULE_OFF" : error.status === 429 ? "RATE_LIMITED" : "FORBIDDEN";
  const body = apiErrorSchema.parse({ error: unavailableSentence(ctx, error), code, ...(retryAfterSeconds ? { retryAfterSeconds } : {}) });
  return NextResponse.json(body, { status: error.status, headers: { "Cache-Control": "no-store", ...(retryAfterSeconds ? { "Retry-After": String(retryAfterSeconds) } : {}) } });
}
