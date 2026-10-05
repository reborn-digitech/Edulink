import { talkAttendanceResultSchema, talkAttendanceSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { markTalkAttendance } from "@/lib/placement-talks";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ talkId: string }> };

/** POST /api/v1/placement/talks/{talkId}/attendance — The TPO marks who came, once the talk has started. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = talkAttendanceSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(talkAttendanceResultSchema.parse(await markTalkAttendance(ctx, p.talkId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/talks/[talkId]/attendance");
  }
}
