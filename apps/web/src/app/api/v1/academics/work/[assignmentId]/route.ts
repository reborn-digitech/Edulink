import { collegeWorkGradebookSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { offeringWorkGradebook } from "@/lib/college-homework";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ assignmentId: string }> };

/** GET /api/v1/academics/work/{assignmentId} — one piece of an offering's homework: the registered students, what each handed in, their marks (R-48). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    return ok(collegeWorkGradebookSchema.parse(await offeringWorkGradebook(ctx, p.assignmentId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/work/[assignmentId]");
  }
}
