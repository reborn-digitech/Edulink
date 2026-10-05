import { collegeWorkGradesSavedSchema, collegeWorkGradesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveOfferingWorkGrades } from "@/lib/college-homework";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ assignmentId: string }> };

/** POST /api/v1/academics/work/{assignmentId}/grades — marks and comments for an offering's work, as a batch (replay-safe; a first mark tells the student) (R-48). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    const parsed = collegeWorkGradesSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(collegeWorkGradesSavedSchema.parse(await saveOfferingWorkGrades(ctx, p.assignmentId, parsed.data.grades)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/work/[assignmentId]/grades");
  }
}
