import { seasonPublishSchema, seasonViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { publishSeason } from "@/lib/placement-analytics";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/placement/season — The TPO publishes a batch's table. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO");
    const parsed = seasonPublishSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(seasonViewSchema.parse(await publishSeason(ctx, b.batchYear)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/season");
  }
}
