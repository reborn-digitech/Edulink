import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { apiFailure } from "@/lib/api-v1";
import { EvalRefusal } from "@/lib/eval-jobs";
import { getT } from "@/lib/i18n/server";

/**
 * The evaluation runs' refusals in the envelope (Vidura pass 3): a second Start while one runs, or a Start while a
 * generation run or a crawl holds the model, is 409 CONFLICT; an unknown run 404; a server that would not start 500 —
 * each in the reader's language. Everything else is apiFailure's.
 */
export async function evalFailure(error: unknown, where: string): Promise<NextResponse> {
  if (error instanceof EvalRefusal) {
    const t = await getT();
    const code = error.status === 409 ? "CONFLICT" : error.status === 404 ? "NOT_FOUND" : "SERVER";
    return NextResponse.json(apiErrorSchema.parse({ error: t(error.errorKey), code }), { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return apiFailure(error, where);
}
