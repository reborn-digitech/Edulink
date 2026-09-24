import { NextResponse } from "next/server";
import { apiErrorSchema, intakeBodySchema, intakeResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { runIntake } from "@/app/(app)/admin/intake/actions";

/**
 * POST /api/v1/admin/people/intake — admit pupils from a pasted CSV. The
 * server re-parses the text, the same as the form: the caller sees what
 * will happen, the server decides what does. First sign-in codes are in
 * the answer and nowhere else. The per-school limit on lists that carry a
 * student code or PEN is a 429 with Retry-After.
 */
export async function POST(request: Request) {
  try {
    await requireApiRole("ADMIN");
    const parsed = intakeBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const state = await runIntake(parsed.data);
    if (state.retryAfterSeconds !== undefined) {
      const retryAfterSeconds = Math.max(1, Math.ceil(state.retryAfterSeconds));
      return NextResponse.json(apiErrorSchema.parse({ error: state.error, code: "RATE_LIMITED", retryAfterSeconds }), {
        status: 429,
        headers: { "Retry-After": String(retryAfterSeconds), "Cache-Control": "no-store" },
      });
    }
    if (!state.ok || !state.result) return apiRefused({ errorKey: state.errorKey, errorVars: state.errorVars, error: state.error });
    return ok(intakeResultSchema.parse({ ...state.result, problems: state.problems }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/intake");
  }
}
