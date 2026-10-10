import { clinicalDepartmentSaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveClinicalDepartment } from "@/lib/clinical";

/** POST /api/v1/duties/clinical/departments — a ward or department of a site (audited duties.clinical.department). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = clinicalDepartmentSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await saveClinicalDepartment(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/clinical/departments");
  }
}
