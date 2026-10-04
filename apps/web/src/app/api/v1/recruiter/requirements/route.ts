import { requirementListSchema, requirementSaveSchema, requirementViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myRequirements, postRequirement } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/recruiter/requirements — The company's requirements. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    return ok(requirementListSchema.parse(await myRequirements(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/requirements");
  }
}

/** POST /api/v1/recruiter/requirements — A requirement to one college or several. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const parsed = requirementSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(requirementViewSchema.parse(await postRequirement(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/requirements");
  }
}
