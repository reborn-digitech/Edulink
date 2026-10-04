import { recruiterDriveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recruiterDrive } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** GET /api/v1/recruiter/drives/{driveId} — One live drive of the company. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const p = await params;
    return ok(recruiterDriveSchema.parse(await recruiterDrive(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/drives/[driveId]");
  }
}
