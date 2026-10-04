import { recruiterDriveSchema, recruiterFeedbackSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recruiterFeedback } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** POST /api/v1/recruiter/drives/{driveId}/feedback — The recruiter's rating and word on the college's preparation. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const p = await params;
    const parsed = recruiterFeedbackSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(recruiterDriveSchema.parse(await recruiterFeedback(ctx, p.driveId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/drives/[driveId]/feedback");
  }
}
