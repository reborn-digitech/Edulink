import { courseFileSaveSchema, courseFileSchema, coursePlanResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { courseFile, saveCoursePlan } from "@/lib/academics-coursefile";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** GET /api/v1/academics/offerings/{offeringId}/course-file — An offering's course file: plan by week with outcomes, coverage against the term, resources, review, CO and PO attainment. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD", "ADMIN", "PRINCIPAL", "STUDENT");
    const p = await params;
    return ok(courseFileSchema.parse(await courseFile(ctx, p.offeringId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/course-file");
  }
}

/** POST /api/v1/academics/offerings/{offeringId}/course-file — The teaching plan, replaced whole, with the days taught. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = courseFileSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(coursePlanResultSchema.parse(await saveCoursePlan(ctx, p.offeringId, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/course-file");
  }
}
