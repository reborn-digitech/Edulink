import { collegeWorkPostSchema, collegeWorkPostedSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { postWorkToInternal } from "@/lib/college-homework";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ assignmentId: string }> };

/** POST /api/v1/academics/work/{assignmentId}/internal — post the work's marks into one of the offering's internal components, through the internal marks' one writer (R-48). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = collegeWorkPostSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(collegeWorkPostedSchema.parse(await postWorkToInternal(ctx, p.assignmentId, parsed.data.componentId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/work/[assignmentId]/internal");
  }
}
