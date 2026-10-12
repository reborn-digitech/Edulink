import { competitionCrawlJobReadSchema, competitionCrawlRequestSchema, competitionCrawlStateSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskCrawls, deskStartCrawl } from "@/lib/competition-crawl-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { deskFailure } from "./_shared";

/** GET /api/v1/appadmin/competition-crawl — the crawl in hand (or the last), the latest crawls, the model servers. */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    return ok(competitionCrawlStateSchema.parse(await deskCrawls(ctx)));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl");
  }
}

/** POST /api/v1/appadmin/competition-crawl — start a crawl (one at a time): 201 with the crawl; 409 while another is active. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = competitionCrawlRequestSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(competitionCrawlJobReadSchema.parse({ job: await deskStartCrawl(ctx, parsed.data) }), 201);
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl");
  }
}
