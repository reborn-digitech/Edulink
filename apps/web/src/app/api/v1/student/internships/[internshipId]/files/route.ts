import { internshipFileSchema, internshipViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { attachInternshipFile } from "@/lib/placement-internships";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ internshipId: string }> };

/** POST /api/v1/student/internships/{internshipId}/files — The report or the parent's declaration. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = internshipFileSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(internshipViewSchema.parse(await attachInternshipFile(ctx, p.internshipId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/internships/[internshipId]/files");
  }
}
