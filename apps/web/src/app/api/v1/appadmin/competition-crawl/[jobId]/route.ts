import { competitionCrawlJobReadSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskCrawl } from "@/lib/competition-crawl-desk";
import { ok } from "@/lib/api-v1";
import { deskFailure } from "../_shared";

/** GET /api/v1/appadmin/competition-crawl/{jobId} — one crawl: its state, its live line, who started it. */
export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { jobId } = await params;
    return ok(competitionCrawlJobReadSchema.parse({ job: await deskCrawl(ctx, jobId) }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl/[jobId]");
  }
}
