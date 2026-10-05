import { talkRsvpSchema, talkViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { answerTalk } from "@/lib/placement-talks";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ talkId: string }> };

/** POST /api/v1/student/placement/talks/{talkId}/rsvp — Going or not, while the talk is ahead. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = talkRsvpSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(talkViewSchema.parse(await answerTalk(ctx, p.talkId, parsed.data.answer)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/talks/[talkId]/rsvp");
  }
}
