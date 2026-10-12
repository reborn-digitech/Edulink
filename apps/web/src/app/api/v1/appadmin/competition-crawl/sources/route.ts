import { competitionSourceAddSchema, competitionSourceReadSchema, competitionSourcesSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskAddSource, deskSources } from "@/lib/competition-crawl-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { deskFailure } from "../_shared";

/** GET /api/v1/appadmin/competition-crawl/sources — the organisers' sites the crawler reads, with their last crawl's numbers. */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    return ok(competitionSourcesSchema.parse({ sources: await deskSources(ctx) }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl/sources");
  }
}

/** POST /api/v1/appadmin/competition-crawl/sources — add an organiser's own site: 201; 409 when it is already listed. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = competitionSourceAddSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(competitionSourceReadSchema.parse({ source: await deskAddSource(ctx, parsed.data) }), 201);
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl/sources");
  }
}
