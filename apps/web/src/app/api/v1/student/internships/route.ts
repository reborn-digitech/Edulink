import { internshipProposeSchema, internshipViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { proposeInternship } from "@/lib/placement-internships";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/student/internships — Propose an internship. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const parsed = internshipProposeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(internshipViewSchema.parse(await proposeInternship(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/internships");
  }
}
