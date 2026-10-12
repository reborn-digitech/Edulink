import { NextResponse } from "next/server";
import { apiErrorSchema } from "@edulink/contracts";
import { apiFailure } from "@/lib/api-v1";
import { CrawlJobRefusal } from "@/lib/competition-crawl-jobs";
import { DeskRefusal } from "@/lib/competition-crawl-desk";
import { getT } from "@/lib/i18n/server";

/**
 * The competitions desk's refusals in the envelope (competitions-crawler, 12 Oct 2026): a second crawl
 * while one runs and a source already listed are 409 CONFLICT, an unknown crawl, source or suggestion
 * 404, a field the desk refuses 422, a model server that would not start 500 — in the reader's language.
 * Everything else is apiFailure's.
 */
export async function deskFailure(error: unknown, where: string): Promise<NextResponse> {
  if (error instanceof CrawlJobRefusal || error instanceof DeskRefusal) {
    const t = await getT();
    const code = error.status === 409 ? "CONFLICT" : error.status === 404 ? "NOT_FOUND" : error.status === 422 ? "BAD_REQUEST" : "SERVER";
    return NextResponse.json(apiErrorSchema.parse({ error: t(error.errorKey), code }), { status: error.status, headers: { "Cache-Control": "no-store" } });
  }
  return apiFailure(error, where);
}
