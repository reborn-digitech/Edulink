import { competitionSourceActionSchema, competitionSourcesSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskSourceAction, deskSources } from "@/lib/competition-crawl-desk";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { deskFailure } from "../../_shared";

/** POST /api/v1/appadmin/competition-crawl/sources/{sourceId} — switch a source off or on, or remove it; answers the sources as they now stand. */
export async function POST(request: Request, { params }: { params: Promise<{ sourceId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { sourceId } = await params;
    const parsed = competitionSourceActionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await deskSourceAction(ctx, sourceId, parsed.data.action);
    return ok(competitionSourcesSchema.parse({ sources: await deskSources(ctx) }));
  } catch (error) {
    return deskFailure(error, "api/v1/appadmin/competition-crawl/sources/[sourceId]");
  }
}
