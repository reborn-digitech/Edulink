import { lectureSheetSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { lectureSheet } from "@/lib/academics-attendance";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ lectureId: string }> };

/** GET /api/v1/academics/lectures/{lectureId} — One lecture's roster with its marks and each student's running percentage. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(lectureSheetSchema.parse(await lectureSheet(ctx, p.lectureId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/lectures/[lectureId]");
  }
}
