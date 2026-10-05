import { collegeWorkPublishedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { publishOfferingWork } from "@/lib/college-homework";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ assignmentId: string }> };

/** POST /api/v1/academics/work/{assignmentId}/publish — publish a draft; the offering's registered students are told (R-48). */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    return ok(collegeWorkPublishedSchema.parse(await publishOfferingWork(ctx, p.assignmentId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/work/[assignmentId]/publish");
  }
}
