import { committeeMeetingSaveSchema, committeesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addMeeting } from "@/lib/iqac";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/iqac/committees/{committeeId}/meetings — Record a meeting with its minutes: the office any committee's, the IQAC its own cell's. */
export async function POST(request: Request, { params }: { params: Promise<{ committeeId: string }> }) {
  try {
    const ctx = await requireApiRoles("ADMIN", "IQAC");
    const p = await params;
    const parsed = committeeMeetingSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(committeesSchema.parse(await addMeeting(ctx, p.committeeId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/iqac/committees/[committeeId]/meetings");
  }
}
