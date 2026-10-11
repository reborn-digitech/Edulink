import { NextResponse } from "next/server";
import { apiErrorSchema, modelServerNameSchema, type ModelServer } from "@edulink/contracts";
import { apiFailure } from "@/lib/api-v1";
import { JobRefusal } from "@/lib/quiz-jobs";
import { AccessError } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";

/**
 * The generation job's refusals in the envelope: a second Start while one runs and stopping a model
 * server under a run are 409 CONFLICT, a server the script did not start is 422, an unknown run 404, a
 * server that would not start 500 — each in the reader's language. Everything else is apiFailure's.
 */
export async function jobFailure(error: unknown, where: string): Promise<NextResponse> {
  if (error instanceof JobRefusal) {
    const t = await getT();
    const code = error.status === 409 ? "CONFLICT" : error.status === 404 ? "NOT_FOUND" : error.status === 422 ? "BAD_REQUEST" : "SERVER";
    return NextResponse.json(apiErrorSchema.parse({ error: t(error.errorKey), code }), { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return apiFailure(error, where);
}

/** The {server} path segment: "chat" or "embed"; anything else names no server (404). */
export function serverParam(raw: string): ModelServer {
  const parsed = modelServerNameSchema.safeParse(raw);
  if (!parsed.success) throw new AccessError("quizJobs.noSuchServer", "NOT_FOUND");
  return parsed.data;
}
