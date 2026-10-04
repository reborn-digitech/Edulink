import { internshipDiarySchema, internshipViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { addDiaryEntry } from "@/lib/placement-internships";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ internshipId: string }> };

/** POST /api/v1/student/internships/{internshipId}/diary — A day in the internship's diary. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = internshipDiarySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(internshipViewSchema.parse(await addDiaryEntry(ctx, p.internshipId, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/internships/[internshipId]/diary");
  }
}
