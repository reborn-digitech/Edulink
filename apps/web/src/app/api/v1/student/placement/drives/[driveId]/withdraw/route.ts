import { applicationViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { withdrawApplication } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

type Params = { params: Promise<{ driveId: string }> };

/** POST /api/v1/student/placement/drives/{driveId}/withdraw — Withdraw an application. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    return ok(applicationViewSchema.parse(await withdrawApplication(ctx, p.driveId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/drives/[driveId]/withdraw");
  }
}
