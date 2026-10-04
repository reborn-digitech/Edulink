import { applicationViewSchema, driveApplySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { applyToDrive } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** POST /api/v1/student/placement/drives/{driveId}/apply — Apply to an OPEN drive; applying is the consent. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = driveApplySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(applicationViewSchema.parse(await applyToDrive(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/drives/[driveId]/apply");
  }
}
