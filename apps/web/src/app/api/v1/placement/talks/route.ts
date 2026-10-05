import { talkDetailSchema, talkListSchema, talkSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createTalk, listTalks } from "@/lib/placement-talks";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/placement/talks — The cell's pre-placement talks with their answers and attendance counts. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(talkListSchema.parse(await listTalks(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/talks");
  }
}

/** POST /api/v1/placement/talks — The TPO sets a talk (ahead of now; one talk a drive). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO");
    const parsed = talkSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(talkDetailSchema.parse(await createTalk(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/talks");
  }
}
