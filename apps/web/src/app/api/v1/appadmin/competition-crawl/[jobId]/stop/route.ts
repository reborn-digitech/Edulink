import { competitionCrawlJobReadSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskStopCrawl } from "@/lib/competition-crawl-desk";
import { ok } from "@/lib/api-v1";
import { deskFailure } from "../../_shared";

/** POST /api/v1/appadmin/competition-crawl/{jobId}/stop — the runner finishes the page in hand and halts; an ended crawl is left as it is. */
export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { jobId } = await params;
    return ok(competitionCrawlJobReadSchema.parse({ job: await deskStopCrawl(ctx, jobId) }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl/[jobId]/stop");
  }
}
