import { talkDetailSchema, talkUpdateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { talkDetail, updateTalk } from "@/lib/placement-talks";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ talkId: string }> };

/** GET /api/v1/placement/talks/{talkId} — One talk with its roster. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(talkDetailSchema.parse(await talkDetail(ctx, p.talkId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/talks/[talkId]");
  }
}

/** POST /api/v1/placement/talks/{talkId} — The TPO edits, moves or cancels a talk not yet held. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = talkUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(talkDetailSchema.parse(await updateTalk(ctx, p.talkId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/talks/[talkId]");
  }
}
