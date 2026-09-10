import { okSchema, operatorSchoolDetailSchema, operatorSchoolUpdateBodySchema } from "@edulink/contracts";
import { AccessError, requireApiOperator } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { updateSchool } from "@/lib/superuser";
import { operatorRefused, operatorSchoolDetail } from "@/lib/api-reads/operator-school";

type Params = { params: Promise<{ schoolId: string }> };

/** GET /api/v1/operator/schools/{schoolId} — one school: its details, its admin invitations, and who has opened it. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const detail = await operatorSchoolDetail(ctx, schoolId);
    if (!detail) throw new AccessError("root.noSuchSchool", "NOT_FOUND");
    return ok(operatorSchoolDetailSchema.parse(detail));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]");
  }
}

/** PATCH /api/v1/operator/schools/{schoolId} — correct a school's details; only the fields sent change. Audited as superuser.school.update. */
export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiOperator();
    const { schoolId } = await params;
    const parsed = operatorSchoolUpdateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await updateSchool(ctx, schoolId, parsed.data);
    if (!result.ok) return operatorRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/schools/[schoolId]");
  }
}
