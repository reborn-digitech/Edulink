import { internshipEvaluateSchema, internshipViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { evaluateInternship } from "@/lib/placement-internships";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ internshipId: string }> };

/** POST /api/v1/placement/internships/{internshipId}/evaluate — The grade, the visit, the viva; the credits last. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "HOD", "FACULTY");
    const p = await params;
    const parsed = internshipEvaluateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(internshipViewSchema.parse(await evaluateInternship(ctx, p.internshipId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/internships/[internshipId]/evaluate");
  }
}
